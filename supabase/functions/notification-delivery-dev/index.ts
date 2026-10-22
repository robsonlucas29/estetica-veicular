import {createClient} from 'npm:@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'content-type':'application/json','cache-control':'no-store'}});
const env=k=>Deno.env.get(k)||'';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply({error:'Método não permitido'},405);
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return reply({error:'Autenticação necessária'},401);
 const url=env('SUPABASE_URL'),anon=env('SUPABASE_ANON_KEY');
 if(!url||!anon)return reply({error:'Configuração indisponível'},503);
 const userDb=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await userDb.auth.getUser();
 if(authError||!user)return reply({error:'Sessão inválida'},401);
 const {data:profile}=await userDb.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(!['administrador','gerente'].includes(profile?.role))return reply({error:'Sem permissão'},403);
 let body={};try{body=await req.json();}catch{return reply({error:'JSON inválido'},400);}
 const id=String(body.id||'');
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id))return reply({error:'Identificador inválido'},400);
 if(!['preview','send'].includes(body.action))return reply({error:'Ação inválida'},400);
 const {data:entry,error:entryError}=await userDb.from('notification_outbox').select('id,channel,recipient,template_name,payload,status,attempts').eq('id',id).maybeSingle();
 if(entryError||!entry)return reply({error:'Notificação não encontrada'},404);
 if(entry.status!=='pending')return reply({error:'Notificação não está pendente'},409);
 const clientId=String(entry.payload?.client_id||'');
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(clientId))return reply({error:'Cliente inválido na fila'},422);
 const {data:consent}=await userDb.from('notification_consents').select('email_opt_in,whatsapp_opt_in').eq('client_id',clientId).maybeSingle();
 if(!consent||(entry.channel==='email'&&!consent.email_opt_in)||(entry.channel==='whatsapp'&&!consent.whatsapp_opt_in))return reply({error:'Consentimento ausente ou revogado'},409);
 const configured=entry.channel==='email'?Boolean(env('RESEND_API_KEY')&&env('RESEND_FROM_EMAIL')):Boolean(env('META_WHATSAPP_TOKEN')&&env('META_PHONE_NUMBER_ID')&&env('META_TEMPLATE_NAME'));
 if(body.action==='preview')return reply({channel:entry.channel,recipient_masked:entry.recipient.replace(/.(?=.{4})/g,'*'),template_name:entry.template_name,configured,consent:true,live_enabled:env('ENABLE_LIVE_NOTIFICATIONS_DEV')==='true',will_send:false});
 if(env('ENABLE_LIVE_NOTIFICATIONS_DEV')!=='true')return reply({error:'Envios reais desativados no desenvolvimento. Ative explicitamente ENABLE_LIVE_NOTIFICATIONS_DEV=true após homologação.'},403);
 if(!configured)return reply({error:'Credenciais do provedor não configuradas'},503);
 const serviceKey=env('SUPABASE_SERVICE_ROLE_KEY');
 if(!serviceKey)return reply({error:'Credencial de servidor indisponível'},503);
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 // Claim atomico: evita envios concorrentes e usa status existente sem nova tabela.
 const {data:claimed,error:claimError}=await admin.from('notification_outbox').update({status:'processing',attempts:entry.attempts+1}).eq('id',id).eq('status','pending').select('id').maybeSingle();
 if(claimError||!claimed)return reply({error:'Notificação já processada ou indisponível'},409);
 // Revalida consentimento apos reservar a notificacao e antes da chamada externa.
 const {data:currentConsent}=await admin.from('notification_consents').select('email_opt_in,whatsapp_opt_in').eq('client_id',clientId).maybeSingle();
 if(!currentConsent||(entry.channel==='email'&&!currentConsent.email_opt_in)||(entry.channel==='whatsapp'&&!currentConsent.whatsapp_opt_in)){
  await admin.from('notification_outbox').update({status:'canceled',last_error:'Consentimento revogado antes do envio'}).eq('id',id).eq('status','processing');
  return reply({error:'Consentimento revogado antes do envio'},409);
 }
 try{
  let response;
  if(entry.channel==='email'){
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.recipient))throw Error('Destinatário de email inválido');
   response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env('RESEND_API_KEY'),'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:env('RESEND_FROM_EMAIL'),to:[entry.recipient],subject:'Garagem Grau Car 096 — Atualização de serviço',html:'<p>Olá! Há uma atualização sobre seu atendimento na Garagem Grau Car 096.</p><p>'+escapeHtml(String(entry.payload?.message||'Consulte nossa equipe para detalhes.').slice(0,800))+'</p>'})});
  }else{
   if(!/^\+?[0-9]{10,15}$/.test(entry.recipient))throw Error('Número de WhatsApp inválido');
   response=await fetch('https://graph.facebook.com/'+encodeURIComponent(env('META_GRAPH_VERSION')||'v22.0')+'/'+encodeURIComponent(env('META_PHONE_NUMBER_ID'))+'/messages',{method:'POST',headers:{Authorization:'Bearer '+env('META_WHATSAPP_TOKEN'),'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:entry.recipient.replace(/^\+/,''),type:'template',template:{name:env('META_TEMPLATE_NAME'),language:{code:env('META_TEMPLATE_LANGUAGE')||'pt_BR'}}})});
  }
  if(!response.ok)throw Error('Provedor recusou a requisição (HTTP '+response.status+')');
  await admin.from('notification_outbox').update({status:'sent',sent_at:new Date().toISOString(),last_error:null}).eq('id',id).eq('status','processing');
  return reply({sent:true,channel:entry.channel});
 }catch(e){
  await admin.from('notification_outbox').update({status:'failed',last_error:String(e.message||'Falha').slice(0,200)}).eq('id',id).eq('status','processing');
  return reply({error:'Falha no envio',details:String(e.message||'Erro').slice(0,100)},502);
 }
});