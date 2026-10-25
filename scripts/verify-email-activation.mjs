import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const root=new URL('../supabase/functions/',import.meta.url);
const src=(await readFile(new URL('service-completed-notification/index.ts',root),'utf8')).replace(/^import .*\n/,'');
const id='11111111-1111-4111-8111-111111111111';
let role='administrador',consent=null,created=new Date().toISOString(),claimError=null,calls=0,handler;
const env={SUPABASE_URL:'https://upurwxqorziaakucrstm.supabase.co',SUPABASE_ANON_KEY:'test',SUPABASE_SERVICE_ROLE_KEY:'test',RESEND_API_KEY:'test',RESEND_FROM_EMAIL:'test@example.invalid'};
const dataFor=t=>t==='profiles'?{role}:t==='service_orders'?{id,atendimento_id:null,vehicle_id:id,status:'concluido',created_at:created}:t==='vehicles'?{id,client_id:id,plate:'TEST'}:t==='clients'?{id,name:'<test>',email:'delivered@resend.dev'}:t==='notification_consents'?consent:t==='notification_outbox'?{id}:null;
function query(t){let obj={select:()=>obj,eq:()=>obj,in:()=>obj,update:()=>obj,insert:()=>obj,maybeSingle:async()=>({data:dataFor(t)}),single:async()=>({data:dataFor(t),error:claimError}),then:(ok)=>Promise.resolve(t==='service_orders'?{data:[{id,vehicle_id:id,service_id:id,status:'concluido',charged_amount:10}]}:t==='service_types'?{data:[{id,name:'Synthetic'}]}:{error:null}).then(ok)};return obj}
new Function('Deno','createClient','fetch',src)({env:{get:k=>env[k]},serve:h=>handler=h},()=>({auth:{getUser:async()=>({data:{user:{id}}})},from:query}),async(u,o)=>{calls++;const body=JSON.parse(o.body);assert.deepEqual(body.to,['delivered@resend.dev']);assert(!body.html.includes('<test>'));return new Response('{}',{status:200})});
const request=()=>new Request('https://test.invalid',{method:'POST',headers:{authorization:'Bearer synthetic'},body:JSON.stringify({service_order_id:id,clientEmail:'attacker@example.invalid'})});
assert.equal((await handler(request())).status,200);assert.equal(calls,1);
role='visualizador';assert.equal((await handler(request())).status,403);assert.equal(calls,1);role='administrador';
consent={email_opt_in:false};assert.equal((await (await handler(request())).json()).skipped,true);assert.equal(calls,1);consent=null;
created='2020-01-01';assert.equal((await handler(request())).status,409);assert.equal(calls,1);created=new Date().toISOString();
claimError={code:'23505'};assert.equal((await (await handler(request())).json()).duplicate,true);assert.equal(calls,1);
env.SUPABASE_URL='https://hgmmabtixqaztuswmivv.supabase.co';assert.equal((await handler(request())).status,403);assert.equal(calls,1);
console.log('PASS: server-owned recipient, HTML escape, authorization, opt-out, old history, deduplication, DEV guard; no actual sends');
