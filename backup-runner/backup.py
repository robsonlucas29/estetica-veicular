"""DEV-only encrypted PostgreSQL + Supabase Storage backup to a private B2 bucket.
No credential, row, object name or connection URL is printed by this program.
"""
import base64, hashlib, json, os, re, secrets, subprocess, sys, tarfile, tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, unquote, quote
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError, URLError
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

PROJECT = 'hgmmabtixqaztuswmivv'
ORIGIN = f'https://{PROJECT}.supabase.co'
PREFIX = f'graucar-dev/{PROJECT}/'
MAGIC = b'GRAUCAR-BACKUP-V1\0'
CHUNK = 1024 * 1024
class BackupError(Exception): pass
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise BackupError('Redirect refused to protect backup credentials')
HTTP = build_opener(NoRedirect())

def required(name):
    value = os.environ.get(name, '').strip()
    if not value: raise BackupError(f'Configuration missing: {name}')
    return value

def pg_environment(url):
    p = urlsplit(url)
    host, user = p.hostname or '', unquote(p.username or '')
    direct = host == f'db.{PROJECT}.supabase.co'
    pool = host.endswith('.pooler.supabase.com') and user.endswith('.' + PROJECT)
    if p.scheme not in ('postgres', 'postgresql') or not (direct or pool):
        raise BackupError('Only the authorized development PostgreSQL project is allowed')
    if unquote(p.path.lstrip('/')) != 'postgres': raise BackupError('Unexpected database')
    if not p.password: raise BackupError('Database password missing')
    env = os.environ.copy()
    for key in list(env):
        if key.startswith('PG'): del env[key]
    env.update(PGHOST=host, PGPORT=str(p.port or 5432), PGUSER=user,
               PGPASSWORD=unquote(p.password), PGDATABASE='postgres', PGSSLMODE='verify-full',
               PGSSLROOTCERT='system', PGCONNECT_TIMEOUT='20')
    return env

def encryption_key():
    try: key = base64.b64decode(required('GRAUCAR_BACKUP_ENCRYPTION_KEY'), validate=True)
    except ValueError: raise BackupError('Invalid backup encryption key') from None
    if len(key) != 32: raise BackupError('Backup encryption key must encode 32 bytes')
    return key

def hash_file(path,algorithm='sha256'):
    h = hashlib.new(algorithm)
    with open(path, 'rb') as f:
        for part in iter(lambda: f.read(CHUNK), b''): h.update(part)
    return h.hexdigest()

def sha256(path): return hash_file(path)

def encrypt(source, target, key):
    nonce = secrets.token_bytes(12)
    cipher = Cipher(algorithms.AES(key), modes.GCM(nonce)).encryptor()
    cipher.authenticate_additional_data(MAGIC)
    with open(source, 'rb') as src, open(target, 'wb') as dst:
        dst.write(MAGIC + nonce)
        for chunk in iter(lambda: src.read(CHUNK), b''): dst.write(cipher.update(chunk))
        dst.write(cipher.finalize()); dst.write(cipher.tag)

def decrypt(source, target, key):
    """Never publishes unauthenticated plaintext to target."""
    source, target = Path(source), Path(target)
    with open(source, 'rb') as src:
        if src.read(len(MAGIC)) != MAGIC: raise BackupError('Unknown backup format')
        nonce = src.read(12)
        if len(nonce) != 12 or source.stat().st_size < len(MAGIC)+28: raise BackupError('Truncated backup')
        src.seek(-16, 2); tag = src.read(16)
        cipher = Cipher(algorithms.AES(key), modes.GCM(nonce, tag)).decryptor()
        cipher.authenticate_additional_data(MAGIC)
        src.seek(len(MAGIC)+12); remaining = source.stat().st_size-len(MAGIC)-28
        staging = target.with_name(target.name+'.partial')
        try:
            with open(staging, 'wb') as dst:
                while remaining:
                    part = src.read(min(CHUNK, remaining))
                    if not part: raise BackupError('Truncated backup')
                    remaining -= len(part); dst.write(cipher.update(part))
                dst.write(cipher.finalize())
            os.replace(staging, target)
        except Exception:
            staging.unlink(missing_ok=True)
            raise BackupError('Backup authentication failed; no recovery output created') from None

def provider_url(url):
    p = urlsplit(url)
    if p.scheme!='https' or p.username or p.password or p.port not in (None,443) or not any((p.hostname or '').endswith(suffix) for suffix in ('.backblazeb2.com','.backblaze.com')):
        raise BackupError('Unexpected B2 API host')
    return url

def request(url, headers=None, body=None, target=None, source=None, max_bytes=600*1024*1024):
    headers = dict(headers or {})
    if body is not None:
        body = json.dumps(body).encode(); headers['Content-Type']='application/json'
    if source:
        headers['Content-Length']=str(Path(source).stat().st_size)
    try:
        from contextlib import nullcontext
        with (open(source,'rb') if source else nullcontext(body)) as data:
            req = Request(url, headers=headers, data=data)
            with HTTP.open(req, timeout=120) as response:
                if target:
                    written=0
                    with open(target,'wb') as out:
                        for part in iter(lambda: response.read(CHUNK), b''):
                            written+=len(part)
                            if written>max_bytes: raise BackupError('Download size limit exceeded')
                            out.write(part)
                    return None
                return json.load(response)
    except HTTPError as e: raise BackupError(f'Remote service rejected backup operation (HTTP {e.code})') from None
    except (URLError, TimeoutError): raise BackupError('Remote service connection failed') from None

def storage_inventory(token):
    headers = {'Authorization':'Bearer '+token, 'apikey':token}
    buckets = request(ORIGIN+'/storage/v1/bucket', headers)
    files=[]
    for bucket in sorted(buckets,key=lambda b:b['id']):
        pending=['']
        while pending:
            prefix=pending.pop();offset=0
            while True:
                page=request(ORIGIN+'/storage/v1/object/list/'+quote(bucket['id'],safe=''),headers,
                             {'prefix':prefix,'limit':500,'offset':offset,'sortBy':{'column':'name','order':'asc'}})
                for item in page:
                    name=(prefix+'/' if prefix else '')+item['name']
                    if item.get('id') is None: pending.append(name)
                    else: files.append({'bucket':bucket['id'],'name':name,'id':item['id'],
                                       'updated_at':item.get('updated_at'),'size':item.get('metadata',{}).get('size')})
                if len(page)<500:break
                offset+=500
    return buckets, sorted(files,key=lambda f:(f['bucket'],f['name']))

def b2_upload_verify(archive, key_id, app_key, bucket_id, bucket_name):
    basic=base64.b64encode((key_id+':'+app_key).encode()).decode()
    auth=request('https://api.backblazeb2.com/b2api/v4/b2_authorize_account',{'Authorization':'Basic '+basic})
    api=auth['apiInfo']['storageApi'];base=provider_url(api['apiUrl']);token=auth['authorizationToken']
    allowed=api.get('allowed',{})
    if {x['id'] for x in allowed.get('buckets') or []}!={bucket_id} or allowed.get('namePrefix')!=PREFIX:
        raise BackupError('Use a key restricted to the dedicated bucket and development prefix')
    caps=set(allowed.get('capabilities') or [])
    if not {'listBuckets','readFiles','writeFiles'}.issubset(caps): raise BackupError('Backup key is missing required capabilities')
    if caps & {'writeKeys','deleteKeys','deleteFiles','writeBuckets','deleteBuckets','bypassGovernance'}:
        raise BackupError('Backup key has unnecessary administrative or deletion permissions')
    h={'Authorization':token}
    bucket_list=request(base+'/b2api/v4/b2_list_buckets',h,{'accountId':auth['accountId'],'bucketId':bucket_id})['buckets']
    if len(bucket_list)!=1 or bucket_list[0]['bucketName']!=bucket_name or bucket_list[0]['bucketType']!='allPrivate':
        raise BackupError('Backup destination must be the configured private bucket')
    rules=bucket_list[0].get('lifecycleRules') or []
    if not any(r.get('fileNamePrefix')==PREFIX and r.get('daysFromUploadingToHiding')==30 and r.get('daysFromHidingToDeleting')==1 for r in rules):
        raise BackupError('Configure the dedicated 30-day retention lifecycle before enabling backups')
    upload=request(base+'/b2api/v4/b2_get_upload_url',h,{'bucketId':bucket_id})
    digest=sha256(archive)
    filename=PREFIX+datetime.now(timezone.utc).strftime('%Y/%m/%d/%Y%m%dT%H%M%SZ-')+secrets.token_hex(6)+'.gcb'
    result=request(provider_url(upload['uploadUrl']),{
        'Authorization':upload['authorizationToken'],'X-Bz-File-Name':quote(filename,safe=''),
        'Content-Type':'application/octet-stream','X-Bz-Content-Sha1':hash_file(archive,'sha1'),
        'X-Bz-Server-Side-Encryption':'AES256','X-Bz-Info-ciphertext-sha256':digest},source=archive)
    # Full download + ciphertext checksum: detects corrupt/incomplete remote backups.
    recovered=Path(archive).with_name('remote-check.gcb')
    request(provider_url(api['downloadUrl'])+'/b2api/v4/b2_download_file_by_id?fileId='+quote(result['fileId'],safe=''),h,target=recovered)
    if sha256(recovered)!=digest: raise BackupError('Remote backup checksum mismatch')
    return recovered

def main():
    os.umask(0o077)
    if os.environ.get('GRAUCAR_BACKUP_ENABLED')!='true': raise BackupError('Backup disabled until credentials and destination are approved')
    destination=[required(name) for name in ['GRAUCAR_B2_KEY_ID','GRAUCAR_B2_APPLICATION_KEY','GRAUCAR_B2_BUCKET_ID','GRAUCAR_B2_BUCKET_NAME']]
    env=pg_environment(required('GRAUCAR_DEV_DATABASE_URL'));key=encryption_key()
    storage_key=required('GRAUCAR_DEV_SERVICE_ROLE_KEY')
    limit=int(os.environ.get('GRAUCAR_BACKUP_MAX_MB','256'))*CHUNK
    with tempfile.TemporaryDirectory(prefix='graucar-dev-backup-') as tmp:
        work=Path(tmp);snapshot=work/'snapshot';snapshot.mkdir();(snapshot/'objects').mkdir()
        started=datetime.now(timezone.utc).isoformat()
        buckets,files=storage_inventory(storage_key)
        total=0
        for i,item in enumerate(files):
            dest=snapshot/'objects'/f'{i:08d}.bin'
            url=ORIGIN+'/storage/v1/object/authenticated/'+quote(item['bucket'],safe='')+'/'+quote(item['name'],safe='/')
            if item['size'] is not None and total+int(item['size'])>limit: raise BackupError('Development backup size limit exceeded')
            request(url,{'Authorization':'Bearer '+storage_key,'apikey':storage_key},target=dest,max_bytes=limit-total)
            total+=dest.stat().st_size
            if total>limit: raise BackupError('Development backup size limit exceeded')
            if item['size'] is not None and int(item['size'])!=dest.stat().st_size: raise BackupError('Storage object changed during download')
            item.update(archive_path='objects/'+dest.name,sha256=sha256(dest))
        dump=snapshot/'database.dump'
        command=['pg_dump','--format=custom','--no-owner','--schema=public','--schema=private','--schema=auth','--schema=storage','--file='+str(dump)]
        done=subprocess.run(command,env=env,capture_output=True,timeout=1800)
        if done.returncode: raise BackupError('PostgreSQL dump failed; inspect runner configuration privately')
        checked=subprocess.run(['pg_restore','--list',str(dump)],env=env,capture_output=True,timeout=120)
        if checked.returncode: raise BackupError('PostgreSQL archive validation failed')
        buckets_after,after=storage_inventory(storage_key)
        before=[{k:v for k,v in f.items() if k not in ('archive_path','sha256')} for f in files]
        if before!=after or buckets!=buckets_after: raise BackupError('Storage changed during backup; retry when uploads are idle')
        manifest={'format':1,'project':PROJECT,'started_at':started,'finished_at':datetime.now(timezone.utc).isoformat(),
                  'database_sha256':sha256(dump),'schemas':['public','private','auth','storage'],
                  'buckets':buckets,'objects':files,'exclusions':['vault secrets','Edge Function secrets','server configuration','extension installation','global role definitions']}
        (snapshot/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf-8')
        archive=work/'snapshot.tar.gz'
        with tarfile.open(archive,'w:gz') as tar:
            for f in sorted(snapshot.rglob('*')):
                if f.is_file():tar.add(f,arcname=f.relative_to(snapshot).as_posix())
        if archive.stat().st_size>limit: raise BackupError('Development backup archive limit exceeded')
        encrypted=work/'backup.gcb';encrypt(archive,encrypted,key)
        remote=b2_upload_verify(encrypted,*destination)
        roundtrip=work/'roundtrip.tar.gz';decrypt(remote,roundtrip,key)
        if sha256(roundtrip)!=sha256(archive):raise BackupError('Recovery checksum mismatch')
        print(json.dumps({'status':'verified','project':PROJECT,'objects':len(files),'encrypted_bytes':encrypted.stat().st_size,
                          'database_archive_readable':True,'remote_download_verified':True,'decryption_verified':True,
                          'full_database_restore_tested':False}))

if __name__=='__main__':
    try:main()
    except Exception as e:
        print(str(e) if isinstance(e,BackupError) else 'Backup failed; details intentionally withheld to protect credentials',file=sys.stderr)
        sys.exit(1)
