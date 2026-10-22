import React,{useEffect,useMemo,useState} from 'react';
import {distinctAppointments,overlappingStaffAppointments} from './agendaRules.js';

const dateKey=value=>{
 if(!value)return '';
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return '';
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
};
const label=(rows,id,field='name')=>rows.find(x=>x.id===id)?.[field]||'—';

export function SmartCalendar({appointments=[],clients=[],vehicles=[],services=[],employees=[],onOpenScheduling}){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [selected,setSelected]=useState(()=>dateKey(new Date()));
 const year=month.getFullYear(),m=month.getMonth();
 const first=new Date(year,m,1).getDay();
 const days=new Date(year,m+1,0).getDate();
 const unique=useMemo(()=>distinctAppointments(appointments),[appointments]);
 const conflicts=useMemo(()=>overlappingStaffAppointments(appointments),[appointments]);
 const byDay=useMemo(()=>{
  const result=new Map();
  for(const a of unique){
   const k=dateKey(a.scheduled_at);
   if(!k)continue;
   result.set(k,[...(result.get(k)||[]),a]);
  }
  return result;
 },[unique]);
 const selectedItems=byDay.get(selected)||[];
 return <section className="panel">
  <div className="inline" style={{justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
   <div><h2>Agenda visual</h2><p className="hint">Visão mensal dos atendimentos ainda não concluídos.</p></div>
   <button className="primary" onClick={onOpenScheduling}>Abrir agendamentos</button>
  </div>
  <div className="inline" style={{justifyContent:'space-between',alignItems:'center'}}>
   <button type="button" className="secondary" onClick={()=>setMonth(new Date(year,m-1,1))}>← Anterior</button>
   <h3>{month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</h3>
   <button type="button" className="secondary" onClick={()=>setMonth(new Date(year,m+1,1))}>Próximo →</button>
  </div>
  {conflicts.length>0&&<div className="card" role="status"><strong>Possíveis conflitos de equipe ({conflicts.length})</strong><p className="hint">Aviso preventivo: duração estimada de 60 minutos por atendimento. Confira antes de reagendar.</p>{conflicts.slice(0,8).map((c,i)=><p key={i}>{new Date(c.first.scheduled_at).toLocaleString('pt-BR')} — {c.employeeIds.map(id=>label(employees,id)).join(', ')} · {label(clients,c.first.client_id)} / {label(clients,c.second.client_id)}</p>)}</div>}
  <div className="smartCalendarGrid" role="grid" aria-label="Calendário mensal">
   {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=><strong key={d} className="smartCalendarWeekday">{d}</strong>)}
   {Array.from({length:first},(_,i)=><span key={'pad'+i}/>)}
   {Array.from({length:days},(_,i)=>{
    const day=i+1,key=dateKey(new Date(year,m,day)),count=(byDay.get(key)||[]).length;
    return <button key={key} type="button" className={'smartCalendarDay '+(selected===key?'smartCalendarSelected':'')} aria-pressed={selected===key} onClick={()=>setSelected(key)}>
     <strong>{day}</strong>{count>0&&<small>{count} atendimento{count!==1?'s':''}</small>}
    </button>;
   })}
  </div>
  <h3>Atendimentos de {selected.split('-').reverse().join('/')}</h3>
  {!selectedItems.length&&<p className="hint">Nenhum agendamento aberto nesta data.</p>}
  <div className="smartCalendarAppointments">
   {selectedItems.map(a=><div key={a.id} className="card">
    <strong>{new Date(a.scheduled_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · {label(clients,a.client_id)}</strong>
    <p>{label(vehicles,a.vehicle_id,'plate')} · {label(services,a.service_id)} · {label(employees,a.employee_id)}</p>
    <small>Situação: {a.status||'agendado'}</small>
   </div>)}
  </div>
 </section>;
}

export function ProductionBoard({appointments=[],orders=[],clients=[],vehicles=[],employees=[],connectionStatus='aguardando'}){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(t);},[]);
 const today=dateKey(now);
 const active=appointments.filter(a=>!['concluido','cancelado'].includes(String(a.status||'').toLowerCase()));
 const groups=new Map();
 for(const a of active){const id=a.appointment_group_id||a.id;if(!groups.has(id))groups.set(id,a);}
 const current=[...groups.values()].filter(a=>dateKey(a.scheduled_at)===today);
 const done=orders.filter(o=>o.status==='concluido'&&dateKey(o.completed_at||o.created_at)===today);
 const columns=[
  ['agendado','Agendados',current.filter(a=>!['confirmado','em_atendimento','em andamento'].includes(a.status))],
  ['confirmado','Confirmados',current.filter(a=>a.status==='confirmado')],
  ['em_atendimento','Em atendimento',current.filter(a=>['em_atendimento','em andamento'].includes(a.status))]
 ];
 return <section className="panel">
  <h2>Painel de produção</h2>
  <p className="hint">Visão do dia {today.split('-').reverse().join('/')} · relógio atualizado a cada 30 segundos. Sincronização: {connectionStatus}. Atualização automática por eventos, com conferência a cada 60 segundos.</p>
  <div className="inline"><div className="card"><strong>{current.length}</strong><p>Atendimentos abertos hoje</p></div><div className="card"><strong>{done.length}</strong><p>Serviços concluídos hoje</p></div></div>
  <div className="smartProductionGrid">{columns.map(([key,title,list])=><div className="card" key={key}><h3>{title} ({list.length})</h3>
   {list.map(a=><div className="smartProductionTicket" key={a.id}>
    <strong>{label(clients,a.client_id)}</strong>
    <p>{label(vehicles,a.vehicle_id,'plate')} · {new Date(a.scheduled_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p>
    <small>{label(employees,a.employee_id)}</small>
   </div>)}
   {!list.length&&<p className="hint">Sem atendimentos.</p>}
  </div>)}</div>
 </section>;
}

export function LoyaltyModule({supabase,clients=[],canAdmin}){
 const [accounts,setAccounts]=useState([]);
 const [clientId,setClientId]=useState('');
 const [points,setPoints]=useState('');
 const [reason,setReason]=useState('');
 const [accountId,setAccountId]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 async function refresh(){
  const {data,error}=await supabase.from('loyalty_accounts').select('id,client_id,points_balance,vip_tier').order('created_at',{ascending:false});
  if(error)setNotice(error.message);else setAccounts(data||[]);
 }
 useEffect(()=>{refresh();},[]);
 async function create(e){
  e.preventDefault();setBusy(true);setNotice('');
  const {error}=await supabase.from('loyalty_accounts').insert({client_id:clientId});
  setBusy(false);
  if(error)setNotice(error.message);else{setClientId('');setNotice('Conta de fidelidade criada.');await refresh();}
 }
 async function record(e){
  e.preventDefault();
  const delta=Number(points);
  if(!Number.isSafeInteger(delta)||delta===0){setNotice('Informe um número inteiro diferente de zero.');return;}
  setBusy(true);setNotice('');
  const {error}=await supabase.from('loyalty_transactions').insert({account_id:accountId,points_delta:delta,reason:reason.trim()});
  setBusy(false);
  if(error)setNotice(error.message);else{setPoints('');setReason('');setNotice('Pontuação registrada.');await refresh();}
 }
 const existing=new Set(accounts.map(a=>a.client_id));
 return <section className="panel">
  <h2>Fidelidade e clientes VIP</h2>
  <p className="hint">Contas e pontos controlados pelo banco. Regras automáticas de pontuação ainda não estão ativadas.</p>
  {notice&&<p role="status">{notice}</p>}
  {canAdmin&&<div className="card"><h3>Criar conta de fidelidade</h3><form className="inline" onSubmit={create}>
   <select aria-label="Cliente" required value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Selecione um cliente</option>
    {clients.filter(c=>!existing.has(c.id)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
   <button className="primary" disabled={busy}>Criar conta</button>
  </form></div>}
  {canAdmin&&<div className="card"><h3>Registrar pontos</h3><form className="inline" onSubmit={record}>
   <select aria-label="Conta de fidelidade" required value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">Selecione a conta</option>
    {accounts.map(a=><option key={a.id} value={a.id}>{label(clients,a.client_id)} ({a.points_balance} pontos)</option>)}</select>
   <input aria-label="Pontos" type="number" step="1" required placeholder="Pontos (+ ou -)" value={points} onChange={e=>setPoints(e.target.value)}/>
   <input aria-label="Motivo" required placeholder="Motivo" value={reason} onChange={e=>setReason(e.target.value)}/>
   <button className="primary" disabled={busy}>Registrar</button>
  </form></div>}
  <div className="tableWrap"><table><thead><tr><th>Cliente</th><th>Pontos</th><th>Categoria VIP</th></tr></thead><tbody>
   {accounts.map(a=><tr key={a.id}><td>{label(clients,a.client_id)}</td><td>{a.points_balance}</td><td>{a.vip_tier}</td></tr>)}
   {!accounts.length&&<tr><td colSpan="3">Nenhuma conta cadastrada.</td></tr>}
  </tbody></table></div>
 </section>;
}
