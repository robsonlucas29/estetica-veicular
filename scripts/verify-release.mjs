import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFile,unlink,readFile} from 'node:fs/promises';
const temp=new URL('../.verify-release.mjs',import.meta.url);
const jwt=(ref,role='anon')=>'e30.'+Buffer.from(JSON.stringify({ref,role})).toString('base64url')+'.TEST_ONLY_NOT_VALID';
try{
 const result=await build({entryPoints:['src/runtime-environment.js'],bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env':JSON.stringify({MODE:'development'})}});
 await writeFile(temp,result.outputFiles[0].text);
 const {resolveEnvironment}=await import(temp.href);
 const prod={MODE:'production',VITE_SUPABASE_URL:'https://upurwxqorziaakucrstm.supabase.co',VITE_SUPABASE_ANON_KEY:jwt('upurwxqorziaakucrstm')};
 assert.equal(resolveEnvironment(prod).isDevelopment,false);
 assert.equal(resolveEnvironment(prod).rpc.save,'save_appointment_group');
 assert.equal(resolveEnvironment({MODE:'development'}).rpc.save,'save_appointment_group_dev');
 assert.throws(()=>resolveEnvironment({...prod,VITE_APP_ENV:'development'}));
 assert.throws(()=>resolveEnvironment({...prod,VITE_SUPABASE_URL:'https://hgmmabtixqaztuswmivv.supabase.co'}));
 assert.throws(()=>resolveEnvironment({...prod,VITE_SUPABASE_ANON_KEY:jwt('hgmmabtixqaztuswmivv')}));
 assert.throws(()=>resolveEnvironment({...prod,VITE_SUPABASE_ANON_KEY:jwt('upurwxqorziaakucrstm','service_role')}));
 console.log('PASS: separação de banco, chave anon, funções e RPCs por ambiente; credenciais privilegiadas rejeitadas');
 // Execute the actual disabled handlers. Any attempted fetch fails this test.
 for(const name of ['job-application','service-completed-notification','notification-delivery']){
  const source=await readFile(new URL('../supabase/functions/'+name+'/index.ts',import.meta.url),'utf8');let handler;
  new Function('Deno','fetch',source)({serve:h=>{handler=h}},()=>{throw Error('Envio externo proibido')});
  const response=await handler(new Request('https://example.invalid',{method:'POST',body:'{}'}));
  const body=await response.json();assert.equal(body.sent,false);assert.equal(body.disabled,true);
  console.log('PASS: '+name+' bloqueado sem chamada externa');
 }
}finally{await unlink(temp).catch(()=>{})}
