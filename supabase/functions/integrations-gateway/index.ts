import {createClient} from 'npm:@supabase/supabase-js@2.57.0';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'content-type':'application/json','cache-control':'no-store'}});
const env=(key)=>Deno.env.get(key)||'';
Deno.serve(async(req)=>{
 if(Deno.env.get('SUPABASE_URL')!=='https://upurwxqorziaakucrstm.supabase.co')return new Response(null,{status:403});
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply({error:'Método não permitido'},405);
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return reply({error:'Autenticação necessária'},401);
 const url=env('SUPABASE_URL'),anon=env('SUPABASE_ANON_KEY');
 if(!url||!anon)return reply({error:'Supabase indisponível'},503);
 const db=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return reply({error:'Sessão inválida'},401);
 const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(!['administrador','gerente'].includes(profile?.role))return reply({error:'Acesso restrito à gestão'},403);
 let body={};try{body=await req.json();}catch{return reply({error:'JSON inválido'},400);}
 if(body.action==='status')return reply({providers:{meta:{configured:Boolean(env('META_WHATSAPP_TOKEN')&&env('META_PHONE_NUMBER_ID')&&env('META_TEMPLATE_NAME'))},resend:{configured:Boolean(env('RESEND_API_KEY')&&env('RESEND_FROM_EMAIL'))},openai:{configured:Boolean(env('OPENAI_API_KEY'))}},messaging_live_enabled:true,email_live_enabled:true,whatsapp_live_enabled:false,environment:'production',secrets_exposed:false});
 if(body.action!=='ask')return reply({error:'Ação inválida'},400);
 const question=String(body.question||'').trim();
 if(question.length<4||question.length>1200)return reply({error:'Pergunta deve conter entre 4 e 1200 caracteres'},400);
 if(!env('OPENAI_API_KEY'))return reply({error:'OpenAI ainda não configurada. Cadastre OPENAI_API_KEY nos segredos da função.'},503);
 const system='Você é assistente da gestão de uma estética veicular no Brasil. Responda em português, de forma objetiva. Não alegue acesso a clientes, veículos, pagamentos, agenda, sistemas ou ferramentas; nenhum dado do banco é enviado a você. Não execute ações. Para decisões financeiras, jurídicas ou técnicas, indique limitações e a necessidade de verificação.';
 try{
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),20000);
  let response;
  try{response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:ctrl.signal,headers:{'Authorization':'Bearer '+env('OPENAI_API_KEY'),'Content-Type':'application/json'},body:JSON.stringify({model:env('OPENAI_MODEL')||'gpt-4.1-mini',instructions:system,input:question,max_output_tokens:450,store:false})});}
  finally{clearTimeout(timeout);}
  if(!response.ok){
   let providerError={};try{providerError=await response.json();}catch{}
   const code=String(providerError.error?.code||providerError.error?.type||'');
   if(['credit_balance_exhausted','insufficient_quota','billing_hard_limit_reached'].includes(code))return reply({error:'A conta da API OpenAI está sem créditos ou atingiu o limite de uso. O administrador precisa verificar a cobrança da API.',code:'OPENAI_BILLING_REQUIRED',provider_status:response.status},503);
   if(response.status===429)return reply({error:'Limite temporário da IA atingido. Tente novamente em instantes.',code:'OPENAI_RATE_LIMIT',provider_status:429},429);
   return reply({error:'Provedor de IA indisponível',provider_status:response.status},502);
  }
  const result=await response.json();
  const answer=(result.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n').trim();
  return reply({answer:answer||'Não foi possível obter uma resposta.',model:result.model||null,disclaimer:'Respostas geradas por IA podem conter erros. Nenhum dado privado foi consultado.'});
 }catch{return reply({error:'Tempo limite ou falha de conexão com a IA'},504);}
});