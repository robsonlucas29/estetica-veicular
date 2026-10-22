import React,{useEffect,useMemo,useState} from 'react';

/** Central de alertas deterministica. Nao e um modelo de IA. */
export function OperationalAlerts({supabase,appointments=[],orders=[],clients=[]}){
 const [stock,setStock]=useState([]);
 const [expenses,setExpenses]=useState([]);
 const [notice,setNotice]=useState('');
 const [serverSummary,setServerSummary]=useState(null);
 const [serverBusy,setServerBusy]=useState(false);
 const [updated,setUpdated]=useState(null);
 async function refresh(){
  const [i,e]=await Promise.all([
   supabase.from('inventory_items').select('id,name,current_quantity,min_quantity,unit').eq('active',true).limit(1000),
   supabase.from('finance_expenses').select('id,description,amount,due_on,status').eq('status','pendente').limit(1000)
  ]);
  if(i.error||e.error){setNotice((i.error||e.error).message);return;}
  setStock(i.data||[]);setExpenses(e.data||[]);setUpdated(new Date());setNotice('');
 }
 async function serverInsights(){
  setServerBusy(true);setNotice('');
  const {data,error}=await supabase.functions.invoke('operational-insights-dev',{body:{}});
  setServerBusy(false);
  if(error){setNotice('Não foi possível gerar o resumo protegido: '+error.message);return;}
  setServerSummary(data);
 }
 useEffect(()=>{refresh();},[]);
 const alerts=useMemo(()=>{
  const result=[];
  for(const item of stock.filter(i=>Number(i.current_quantity)<=Number(i.min_quantity))){
   result.push({key:'s'+item.id,level:'attention',text:'Estoque baixo: '+item.name+' — '+item.current_quantity+' '+item.unit+' (mínimo '+item.min_quantity+')'});
  }
  const now=new Date().toLocaleDateString('en-CA');
  for(const expense of expenses.filter(e=>e.due_on&&e.due_on<now)){
   result.push({key:'e'+expense.id,level:'attention',text:'Despesa vencida: '+expense.description+' — R$ '+Number(expense.amount).toFixed(2)});
  }
  const today=new Date().toLocaleDateString('en-CA');
  const groups=new Map();
  for(const a of appointments){
   if(['concluido','concluído','cancelado'].includes(String(a.status||'').toLowerCase()))continue;
   if(String(a.scheduled_at||'').slice(0,10)!==today)continue;
   const k=a.appointment_group_id||a.id;if(!groups.has(k))groups.set(k,a);
  }
  if(groups.size)result.push({key:'appointments',level:'info',text:groups.size+' atendimento(s) agendado(s) para hoje.'});
  return result;
 },[stock,expenses,appointments]);
 return <section className="panel">
  <h2>Central de alertas operacionais</h2>
  <p className="hint">Indicadores baseados em regras verificáveis, sem envio de dados a provedores de inteligência artificial. As informações financeiras são restritas à gestão.</p>
  <div className="inline"><button type="button" className="secondary" onClick={refresh}>Atualizar alertas</button><button type="button" className="secondary" disabled={serverBusy} onClick={serverInsights}>{serverBusy?"Consultando...":"Resumo seguro do servidor"}</button></div>
  {serverSummary&&<div className="card" role="status"><h3>Resumo operacional do servidor</h3><p>Estoque baixo: {serverSummary.summary?.low_stock??"—"} · Despesas vencidas: {serverSummary.summary?.overdue_expenses??"—"} · Atendimentos de hoje: {serverSummary.summary?.appointments_today??"—"}</p>{(serverSummary.recommendations||[]).map((t,i)=><p key={i}>{t}</p>)}<small>Regras determinísticas, sem uso de modelo de IA externo.</small></div>}
  {notice&&<p role="alert">{notice}</p>}
  {updated&&<p className="hint">Última consulta: {updated.toLocaleString('pt-BR')}</p>}
  {!alerts.length&&<div className="card"><p>Nenhum alerta encontrado nos dados consultados.</p></div>}
  {alerts.map(a=><div className="card" role="status" key={a.key}><strong>{a.level==='attention'?'Atenção':'Informação'}</strong><p>{a.text}</p></div>)}
  <small className="hint">Consultas limitadas a 1.000 registros por tabela. Esta tela não altera cadastros, caixa ou agendamentos.</small>
 </section>;
}
