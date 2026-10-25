import {createClient} from 'npm:@supabase/supabase-js@2';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json','cache-control':'no-store'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return respond({error:'Metodo nao permitido'},405);
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return respond({error:'Autenticacao necessaria'},401);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url||!key)return respond({error:'Configuracao indisponivel'},503);
 const db=createClient(url,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:userError}=await db.auth.getUser();
 if(userError||!user)return respond({error:'Sessao invalida'},401);
 const {data:profile,error:profileError}=await db.from('profiles').select('role').eq('id',user.id).single();
 if(profileError||!['administrador','gerente'].includes(profile?.role))return respond({error:'Sem permissao'},403);
 try{
  const [{data:stock,error:stockError},{data:expenses,error:expensesError},{data:appointments,error:appointmentsError}]=await Promise.all([
   db.from('inventory_items').select('name,current_quantity,min_quantity,unit').eq('active',true).limit(1000),
   db.from('finance_expenses').select('description,amount,due_on,status').eq('status','pendente').limit(1000),
   db.from('appointments').select('id,appointment_group_id,scheduled_at,status').limit(1000)
  ]);
  if(stockError||expensesError||appointmentsError)return respond({error:'Consulta indisponivel'},502);
  const now=new Date();
  const localDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Belem',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const low=(stock||[]).filter(i=>Number(i.current_quantity)<=Number(i.min_quantity));
  const overdue=(expenses||[]).filter(e=>e.due_on&&e.due_on<localDate);
  const today=new Set((appointments||[]).filter(a=>!['concluido','concluído','cancelado','cancelada'].includes(String(a.status).toLowerCase())&&new Intl.DateTimeFormat('en-CA',{timeZone:'America/Belem',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(a.scheduled_at))===localDate).map(a=>a.appointment_group_id||a.id));
  return respond({generated_at:now.toISOString(),mode:'deterministic_no_external_ai',summary:{low_stock:low.length,overdue_expenses:overdue.length,appointments_today:today.size},recommendations:[low.length?'Repor materiais abaixo do minimo.':null,overdue.length?'Revisar despesas vencidas.':null,today.size?'Conferir equipe para os atendimentos do dia.':null].filter(Boolean),limits:'Maximo de 1000 linhas por conjunto. Dados financeiros somente para gestao.'});
 }catch(_){return respond({error:'Falha ao gerar resumo'},500);}
});