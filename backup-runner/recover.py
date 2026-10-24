"""Decrypt and validate an archive locally. Does not connect to or overwrite a database."""
import json,sys,tarfile,os,subprocess,tempfile
from pathlib import Path
from backup import BackupError,PROJECT,decrypt,encryption_key,sha256

def unpack(encrypted,destination,key):
    destination=Path(destination)
    if destination.exists():raise BackupError('Recovery destination must not exist')
    with tempfile.TemporaryDirectory(prefix='graucar-dev-recovery-',dir=destination.parent) as tmp:
        work=Path(tmp);archive=work/'backup.tar.gz';decrypt(encrypted,archive,key)
        unpacked=work/'unpacked';unpacked.mkdir()
        with tarfile.open(archive,'r:gz') as tar:
            for member in tar.getmembers():
                target=(unpacked/member.name).resolve()
                if not target.is_relative_to(unpacked.resolve()) or not member.isfile():raise BackupError('Unsafe archive member')
            tar.extractall(unpacked,filter='data')
        manifest=json.loads((unpacked/'manifest.json').read_text())
        if manifest['project']!=PROJECT:raise BackupError('Unexpected backup project')
        if sha256(unpacked/'database.dump')!=manifest['database_sha256']:raise BackupError('Database checksum mismatch')
        for item in manifest['objects']:
            path=(unpacked/item['archive_path']).resolve()
            if not path.is_relative_to(unpacked.resolve()) or sha256(path)!=item['sha256']:raise BackupError('Object checksum mismatch')
        result=subprocess.run(['pg_restore','--list',str(unpacked/'database.dump')],capture_output=True,timeout=120)
        if result.returncode:raise BackupError('Database dump is unreadable')
        unpacked.rename(destination)
        return len(manifest['objects'])

if __name__=='__main__':
    os.umask(0o077)
    try:
        if len(sys.argv)!=3:raise BackupError('Usage: python recover.py encrypted.gcb NEW_PRIVATE_DIRECTORY')
        objects=unpack(sys.argv[1],sys.argv[2],encryption_key())
        print(json.dumps({'archive_verified':True,'objects':objects,'database_modified':False,'full_restore_tested':False}))
    except Exception as e:
        print(str(e) if isinstance(e,BackupError) else 'Recovery inspection failed; no database was modified',file=sys.stderr);sys.exit(1)
