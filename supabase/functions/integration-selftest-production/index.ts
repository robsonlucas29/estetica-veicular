// Private CI diagnostic: fixed synthetic inputs only; no configurable recipients or private data.
const env=(name:string)=>Deno.env.get(name)||'';
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function authorizedService(header:string){
if(!header.startsWith('Bearer '))return 'CI_MISSING';
const token=header.slice(7);
try{
 const claims=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
 if(claims.role!=='service_role')return 'CI_ROLE';
 if(claims.ref!=='upurwxqorziaakucrstm')return 'CI_PROJECT';
 // PostgREST verifies the signature/expiry. Payload decoding alone is never authorization.
 const checked=await fetch(env('SUPABASE_URL')+'/rest/v1/profiles?select=id&limit=0',{headers:{apikey:token,Authorization:header},signal:AbortSignal.timeout(10000)});
 await checked.body?.cancel();return checked.ok?'OK':'CI_SIGNATURE_OR_REST_'+checked.status;
}catch{return 'CI_TOKEN_FORMAT_OR_NETWORK';}
}
Deno.serve(async req=>{
 if(env('SUPABASE_URL')!=='https://upurwxqorziaakucrstm.supabase.co')return reply({error:'Production only'},403);
 if(req.method!=='POST')return reply({error:'POST required'},405);
 const checked=await authorizedService(req.headers.get('authorization')||'');
 if(checked!=='OK')return reply({error:'Private CI authorization required',authentication_check:checked},401);
 if(env('ENABLE_LIVE_NOTIFICATIONS_PRODUCTION')==='true')return reply({error:'Disable live notifications before testing'},409);
 let body;try{body=await req.json();}catch{return reply({error:'Invalid JSON'},400);}
 if(!['verify','verify_resend','verify_openai'].includes(body.action))return reply({error:'Unsupported action'},400);
 const testEmail=body.action!=='verify_openai',testAI=body.action!=='verify_resend';
 if((testEmail&&(!env('RESEND_API_KEY')||!env('RESEND_FROM_EMAIL')))||(testAI&&!env('OPENAI_API_KEY')))return reply({error:'Provider configuration incomplete'},503);
 try{
  let emailAccepted=false,emailStatus=null,aiPassed=false,aiStatus=null;
  if(testEmail){const email=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+env('RESEND_API_KEY'),'content-type':'application/json','Idempotency-Key':'graucar-production-selftest-'+new Date().toISOString().slice(0,10)},body:JSON.stringify({from:env('RESEND_FROM_EMAIL'),to:['delivered@resend.dev'],subject:'Garagem Grau Car PRODUCAO — simulador de homologacao',text:'Mensagem sintetica de homologacao. Nenhum dado de cliente. Destino exclusivo do simulador Resend.'})});
  const emailResult=await email.json();
  emailAccepted=email.ok&&Boolean(emailResult.id);emailStatus=email.status;}
  if(testAI){const ai=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+env('OPENAI_API_KEY'),'content-type':'application/json'},body:JSON.stringify({model:env('OPENAI_MODEL')||'gpt-4.1-mini',input:'Responda somente: teste aprovado',max_output_tokens:32,store:false})});
  const aiResult=await ai.json();const aiText=(aiResult.output||[]).flatMap((x:any)=>x.content||[]).filter((x:any)=>x.type==='output_text').map((x:any)=>x.text).join(' ').toLowerCase();
  aiPassed=ai.ok&&aiText.includes('teste aprovado');aiStatus=ai.status;}
  const passed=(!testEmail||emailAccepted)&&(!testAI||aiPassed);
  return reply({passed,environment:'production',messaging_live_enabled:false,real_recipient_delivery_tested:false,resend_simulator:{tested:testEmail,accepted:emailAccepted,http_status:emailStatus},openai:{tested:testAI,passed:aiPassed,http_status:aiStatus},private_data_sent:false},passed?200:502);
 }catch{return reply({error:'Provider test timeout or connection failure'},504);}
});
