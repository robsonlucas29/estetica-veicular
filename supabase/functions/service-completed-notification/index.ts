import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const env=k=>Deno.env.get(k)||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
Deno.serve(async req=>{
 if(env('SUPABASE_URL')!=='https://upurwxqorziaakucrstm.supabase.co')return reply({error:'Ambiente inválido'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Método inválido'},405);
 const authorization=req.headers.get('authorization')||'';
 if(!authorization.startsWith('Bearer '))return reply({error:'Autenticação necessária'},401);
 const db=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)return reply({error:'Sessão inválida'},401);
 const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(!['administrador','gerente','administrativo'].includes(profile?.role))return reply({error:'Sem permissão'},403);
 let body;try{body=await req.json()}catch{return reply({error:'JSON inválido'},400)}
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(body.service_order_id||''))return reply({error:'Atendimento obrigatório'},400);
 const {data:order}=await db.from('service_orders').select('*').eq('id',body.service_order_id).maybeSingle();
 if(!order||order.status!=='concluido')return reply({error:'Atendimento concluído não encontrado'},404);
 // Only newly created completions; never bulk resend old history.
 if(Date.now()-new Date(order.created_at).getTime()>3600000)return reply({error:'Aviso automático disponível apenas na conclusão recente'},409);
 const {data:vehicle}=await db.from('vehicles').select('id,client_id,brand,model,plate').eq('id',order.vehicle_id).maybeSingle();
 const {data:client}=await db.from('clients').select('id,name,email').eq('id',vehicle?.client_id||'').maybeSingle();
 if(!client?.email)return reply({sent:false,skipped:true,reason:'Cliente sem e-mail cadastrado'});
 const {data:consent}=await db.from('notification_consents').select('email_opt_in').eq('client_id',client.id).maybeSingle();
 if(consent?.email_opt_in===false)return reply({sent:false,skipped:true,reason:'Cliente recusou e-mail'});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email))return reply({error:'E-mail inválido'},422);
 let query=db.from('service_orders').select('id,service_id,charged_amount,status,vehicle_id');
 query=order.atendimento_id?query.eq('atendimento_id',order.atendimento_id):query.eq('id',order.id);
 const {data:rows,error:rowsError}=await query;
 if(rowsError||!rows?.length||rows.some(r=>r.status!=='concluido'||r.vehicle_id!==vehicle.id))return reply({error:'Atendimento inconsistente'},409);
 const {data:services}=await db.from('service_types').select('id,name').in('id',rows.map(r=>r.service_id));
 const key='service-completed-email-'+(order.atendimento_id||order.id);
 const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false}});
 const {data:entry,error:claimError}=await admin.from('notification_outbox').insert({event_key:key,channel:'email',recipient:client.email,template_name:'service_completed',payload:{client_id:client.id,service_order_id:order.id},status:'processing',attempts:1}).select('id').single();
 if(claimError)return reply({sent:false,duplicate:claimError.code==='23505',error:claimError.code==='23505'?null:'Não foi possível registrar o envio'},claimError.code==='23505'?200:503);
 try{
  if(!env('RESEND_API_KEY')||!env('RESEND_FROM_EMAIL'))throw Error('Configuração indisponível');
  const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const html='<div style="font-family:Arial;max-width:600px;margin:auto"><h2>Garagem Grau Car 096 — Seu veículo está pronto!</h2><p>Olá, '+esc(client.name)+'!</p><p>Concluímos os serviços do veículo '+esc([vehicle.brand,vehicle.model,vehicle.plate].join(' '))+'.</p><ul>'+rows.map(r=>'<li>'+esc(services?.find(s=>s.id===r.service_id)?.name||'Serviço')+' — '+money(r.charged_amount)+'</li>').join('')+'</ul><p><strong>Total: '+money(rows.reduce((n,r)=>n+Number(r.charged_amount||0),0))+'</strong></p><p>Seu veículo já pode ser retirado. Obrigado pela preferência!</p></div>';
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env('RESEND_API_KEY'),'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({from:env('RESEND_FROM_EMAIL'),to:[client.email],subject:'Seu veículo está pronto! — Garagem Grau Car 096',html}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Provedor HTTP '+response.status);
  const {error:saveError}=await admin.from('notification_outbox').update({status:'sent',sent_at:new Date().toISOString(),last_error:null}).eq('id',entry.id);
  if(saveError)return reply({sent:true,record_pending:true,whatsapp_sent:false});
  return reply({sent:true,channel:'email',whatsapp_sent:false});
 }catch{
  await admin.from('notification_outbox').update({status:'failed',last_error:'Falha ao enviar e-mail; revisar antes de repetir'}).eq('id',entry.id);
  return reply({sent:false,error:'Não foi possível enviar o e-mail. O atendimento permanece concluído.'},502);
 }
});
