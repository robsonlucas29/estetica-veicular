import React,{useState} from 'react';
import {LOYALTY_REWARDS,businessDate} from './business-metrics.js';
import {canRedeem,redeemableAccounts} from './loyalty-rules.js';
import {runtime} from './runtime-environment.js';
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export default function LoyaltyRedemptionForm({supabase,accounts=[],clients=[],vehicles=[],services=[],employees=[],paymentMethods=[],onSaved}){
 const blank={client:'',reward:'',vehicle:'',employees:[],date:businessDate(new Date()),hour:'',minute:'00',status:'agendado',service:'',discount:'',charged:'',method:'',note:'',variant:'engine'};
 const [f,setF]=useState(blank),[group,setGroup]=useState(()=>crypto.randomUUID()),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const eligible=redeemableAccounts(accounts,clients),account=accounts.find(a=>a.client_id===f.client),client=clients.find(c=>c.id===f.client),reward=LOYALTY_REWARDS.find(r=>r.id===f.reward),vehicle=vehicles.find(v=>v.id===f.vehicle),discountReward=f.reward==='major_discount',service=services.find(s=>s.id===f.service);
 const allowed=canRedeem(account,reward,client),availableServices=services.filter(s=>s.active!==false&&!s.loyalty_reward_code&&s.category_id===vehicle?.category_id&&Number(s.price)>0);
 const canSubmit=allowed&&f.vehicle&&f.employees.length&&f.date&&f.hour!==''&&(!discountReward||(service&&Number(f.discount)>0&&Number(f.discount)<=100&&f.charged!==''&&Number(f.charged)>=0&&Number(f.charged)<Number(service.price)&&f.method));
 function changeClient(id){setF({...blank,client:id});setError('');setMessage('');}
 function changeReward(id){setF({...f,reward:id,service:'',discount:'',charged:'',method:''});setError('');}
 function percent(value){const discount=Math.min(100,Math.max(0,Number(value)||0));setF({...f,discount:value,charged:service?(Number(service.price)*(1-discount/100)).toFixed(2):''});}
 function charge(value){const price=Number(service?.price||0);setF({...f,charged:value,discount:price?Number(((1-Number(value)/price)*100).toFixed(4)):''});}
 async function save(e){e.preventDefault();setError('');setMessage('');if(!canSubmit)return setError('Selecione um cliente com saldo suficiente e preencha os campos obrigatórios.');
 if(!window.confirm(`Reservar ${reward.points.toLocaleString('pt-BR')} pontos e ${f.status==='concluido'?'concluir':'agendar'} este benefício?`))return;
 setBusy(true);
 try{
  const {data,error}=await supabase.rpc('create_loyalty_redemption',{p_group:group,p_client:f.client,p_reward:f.reward,p_vehicle:f.vehicle,p_employees:f.employees,p_when:new Date(`${f.date}T${f.hour}:${f.minute}:00-03:00`).toISOString(),p_status:f.status,p_service:discountReward?f.service:null,p_discount:discountReward?Number(f.discount):0,p_charged:discountReward?Number(f.charged):0,p_method:discountReward?f.method:null,p_note:f.note,p_variant:f.variant});
  if(error)throw error;
  let notice=data?.duplicate?'Esse resgate já estava registrado.':f.status==='concluido'?'Resgate concluído e registrado nos históricos.':'Resgate agendado. Os pontos foram reservados e serão devolvidos se houver cancelamento antes da conclusão.';
  if(!runtime.isDevelopment&&data?.orders?.[0]?.id){const result=await supabase.functions.invoke('service-completed-notification',{body:{service_order_id:data.orders[0].id}});if(result.error||result.data?.error)notice+=' O e-mail de aviso não pôde ser enviado; o resgate foi salvo.';}
  setF(blank);setGroup(crypto.randomUUID());setMessage(notice);await onSaved?.();
 }catch(e){setError(e.message||'Não foi possível reservar o benefício.');}finally{setBusy(false);}
 }
 return <><h3>Resgatar e agendar benefício</h3><p>Somente clientes com pontos suficientes podem resgatar. O saldo é conferido novamente no servidor. Um cancelamento antes da conclusão devolve os pontos.</p>
 {!eligible.length&&<p className="devNotice">Nenhum cliente participante possui saldo suficiente para resgate.</p>}
 {error&&<div role="alert" className="devError">{error}</div>}{message&&<div role="status" className="devSuccess">{message}</div>}
 <form onSubmit={save}><div className="redemptionFields">
 <label>Cliente com saldo disponível<select required value={f.client} onChange={e=>changeClient(e.target.value)}><option value="" disabled>Selecione</option>{eligible.map(a=><option key={a.id} value={a.client_id}>{clients.find(c=>c.id===a.client_id)?.name} — {a.points_balance} pontos</option>)}</select></label>
 <label>Benefício<select required value={f.reward} onChange={e=>changeReward(e.target.value)} disabled={!account}><option value="" disabled>Selecione</option>{LOYALTY_REWARDS.map(r=><option key={r.id} value={r.id} disabled={!canRedeem(account,r,client)}>{r.points.toLocaleString('pt-BR')} pontos — {r.label}{!canRedeem(account,r,client)?' (saldo insuficiente)':''}</option>)}</select></label>
 <label>Veículo<select required value={f.vehicle} onChange={e=>setF({...f,vehicle:e.target.value,service:'',discount:'',charged:''})} disabled={!f.client}><option value="" disabled>Selecione</option>{vehicles.filter(v=>v.client_id===f.client).map(v=><option key={v.id} value={v.id}>{v.plate} · {v.brand} {v.model}</option>)}</select></label>
 {f.reward==='engine_underbody'&&<label>Serviço do benefício<select required value={f.variant} onChange={e=>setF({...f,variant:e.target.value})}><option value="engine">Lavagem técnica do motor</option><option value="underbody">Lavagem do Baixo</option></select></label>}
 <fieldset className="redemptionWashers"><legend>Lavador(es) responsável(is) *</legend>{employees.filter(e=>e.active!==false).map(employee=><label key={employee.id}><input type="checkbox" checked={f.employees.includes(employee.id)} onChange={e=>setF({...f,employees:e.target.checked?[...f.employees,employee.id]:f.employees.filter(id=>id!==employee.id)})}/>{employee.name}</label>)}{!employees.some(e=>e.active!==false)&&<small>Cadastre um lavador ativo em Equipe.</small>}</fieldset>
 <label>Data<input type="date" required value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></label>
 <label>Hora (24h)<select required value={f.hour} onChange={e=>setF({...f,hour:e.target.value})}><option value="" disabled>Hora</option>{Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map(h=><option key={h}>{h}</option>)}</select></label>
 <label>Minuto<select value={f.minute} onChange={e=>setF({...f,minute:e.target.value})}>{Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(m=><option key={m}>{m}</option>)}</select></label>
 <label>Status do agendamento<select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="em_atendimento">Em atendimento</option><option value="concluido">Concluído</option></select></label>
 {discountReward?<><label>Serviço com desconto<select required value={f.service} onChange={e=>setF({...f,service:e.target.value,discount:'',charged:String(services.find(s=>s.id===e.target.value)?.price??'')})} disabled={!vehicle}><option value="" disabled>Selecione o serviço</option>{availableServices.map(s=><option key={s.id} value={s.id}>{s.name} — {money(s.price)}</option>)}</select></label>
 <label>Desconto (%)<input type="number" min="0.0001" max="100" step="0.0001" required disabled={!service} value={f.discount} onChange={e=>percent(e.target.value)}/></label>
 <label>Valor cobrado (R$)<input type="number" min="0" step="0.01" max={service?.price} required disabled={!service} value={f.charged} onChange={e=>charge(e.target.value)}/></label>
 <label>Forma de pagamento<select required value={f.method} onChange={e=>setF({...f,method:e.target.value})}><option value="" disabled>Selecione</option>{paymentMethods.filter(p=>p.active!==false&&p.name!=='Fidelidade (resgate)').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></>:reward&&<p className="devNotice">Benefício em serviço: <strong>{reward.id==='engine_underbody'?(f.variant==='engine'?'Lavagem técnica do motor':'Lavagem do Baixo'):reward.label}</strong>. Valor cobrado: R$ 0,00. Não há desconto adicional.</p>}
 <label className="redemptionNote">Observação<textarea maxLength={1000} value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></label>
 </div><button disabled={busy||!canSubmit}>{busy?'Salvando…':f.status==='concluido'?'Resgatar e concluir atendimento':'Resgatar e agendar'}</button></form></>;
}
