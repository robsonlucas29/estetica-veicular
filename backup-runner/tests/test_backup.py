import importlib.util,os,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('backup',Path(__file__).resolve().parents[1]/'backup.py')
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
class BackupTests(unittest.TestCase):
 def test_roundtrip_and_tamper_detection(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);key=os.urandom(32);original=os.urandom(2*1024*1024+17)
   (p/'source').write_bytes(original);b.encrypt(p/'source',p/'encrypted',key)
   self.assertNotEqual((p/'encrypted').read_bytes(),original)
   b.decrypt(p/'encrypted',p/'recovered',key);self.assertEqual((p/'recovered').read_bytes(),original)
   data=bytearray((p/'encrypted').read_bytes());data[100]^=1;(p/'encrypted').write_bytes(data)
   with self.assertRaises(b.BackupError):b.decrypt(p/'encrypted',p/'bad',key)
   self.assertFalse((p/'bad').exists());self.assertFalse((p/'bad.partial').exists())
 def test_wrong_key_does_not_create_output(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);(p/'source').write_bytes(b'database rows');b.encrypt(p/'source',p/'encrypted',os.urandom(32))
   with self.assertRaises(b.BackupError):b.decrypt(p/'encrypted',p/'bad',os.urandom(32))
   self.assertFalse((p/'bad').exists())
 def test_production_and_lookalike_hosts_refused(self):
  for url in ['postgres://postgres:fake@db.production.supabase.co/postgres','postgres://postgres:fake@db.hgmmabtixqaztuswmivv.supabase.co.evil.test/postgres','postgres://postgres.production:fake@aws-0-us-east-1.pooler.supabase.com/postgres']:
   with self.assertRaises(b.BackupError):b.pg_environment(url)
 def test_project_bound_connection_uses_verified_tls(self):
  env=b.pg_environment('postgres://postgres.hgmmabtixqaztuswmivv:fake@aws-0-us-east-1.pooler.supabase.com:5432/postgres')
  self.assertEqual(env['PGSSLMODE'],'verify-full');self.assertEqual(env['PGPASSWORD'],'fake')
 def test_untrusted_b2_destination_refused(self):
  for url in ['http://api.backblazeb2.com','https://api.backblazeb2.com.evil.test','https://api.backblazeb2.com:8443','https://key@api.backblazeb2.com']:
   with self.assertRaises(b.BackupError):b.provider_url(url)
 def test_invalid_headers_do_not_decrypt(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);(p/'bad').write_bytes(b'invalid')
   with self.assertRaises(b.BackupError):b.decrypt(p/'bad',p/'output',os.urandom(32))
if __name__=='__main__':unittest.main()

from unittest.mock import patch
class B2ProtocolTests(unittest.TestCase):
 def run_mock(self,public=False,wrong_hash=False,broad=False):
  with tempfile.TemporaryDirectory() as t:
   archive=Path(t)/'backup.gcb';archive.write_bytes(b'encrypted fixture');calls=[]
   def remote(url,headers=None,body=None,target=None,source=None,**kwargs):
    calls.append(url)
    if url.endswith('b2_authorize_account'):
     return {'accountId':'account','authorizationToken':'fake-token','apiInfo':{'storageApi':{'apiUrl':'https://api001.backblazeb2.com','downloadUrl':'https://f001.backblazeb2.com','allowed':{'buckets':None if broad else [{'id':'bucket'}],'namePrefix':b.PREFIX,'capabilities':['listBuckets','readFiles','writeFiles']}}}}
    if url.endswith('b2_list_buckets'):return {'buckets':[{'bucketName':'private-dev','bucketType':'allPublic' if public else 'allPrivate','lifecycleRules':[{'fileNamePrefix':b.PREFIX,'daysFromUploadingToHiding':30,'daysFromHidingToDeleting':1}]}]}
    if url.endswith('b2_get_upload_url'):return {'uploadUrl':'https://pod-001.backblaze.com/b2api/v4/b2_upload_file/path','authorizationToken':'fake-upload'}
    if 'b2_upload_file' in url:
     self.assertEqual(headers['X-Bz-Server-Side-Encryption'],'AES256');self.assertEqual(Path(source).read_bytes(),b'encrypted fixture');return {'fileId':'file'}
    if 'b2_download_file_by_id' in url:Path(target).write_bytes(b'corrupt' if wrong_hash else b'encrypted fixture');return None
    raise AssertionError('Unexpected endpoint')
   with patch.object(b,'request',side_effect=remote):return b.b2_upload_verify(archive,'fake','fake','bucket','private-dev')
 def test_private_bucket_upload_and_download(self):self.run_mock()
 def test_public_bucket_refused(self):
  with self.assertRaises(b.BackupError):self.run_mock(public=True)
 def test_remote_corruption_detected(self):
  with self.assertRaises(b.BackupError):self.run_mock(wrong_hash=True)
 def test_unrestricted_account_key_refused(self):
  with self.assertRaises(b.BackupError):self.run_mock(broad=True)
