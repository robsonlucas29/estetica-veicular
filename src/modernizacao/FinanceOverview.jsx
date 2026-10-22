import React,{useEffect,useMemo,useState} from 'react';

const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today=()=>new Date().toLocaleDateString('en-CA');

export function FinanceOverview({supabase}){
 const [start,setStart]=useState(()=>today().slice(0,7)+'-01');
 const [end,setEnd]=useState(today);
 const [payments,setPayments]=useState([]);
 const [expenses,setExpenses]=useState([]);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 async function load(){
  if(!start||!end||start>end){setError('Informe um período válido.');return;}
  setLoading(true);setError('');
  const [p,e]=await Promise.all([
   supabase.from('payments').select('id,amount,paid_at').gte('paid_at',start+'T00:00:00').lt('paid_at',nextDay(end)+'T00:00:00').limit(10000),
   supabase.from('finance_expenses').select('id,amount,paid_on,status').eq('status','pago').gte('paid_on',start).lte('paid_on',end).limit(10000)
  ]);
  setLoading(false);
  if(p.error||e.error){setError((p.error||e.error).message);return;}
  setPayments(p.data||[]);setExpenses(e.data||[]);
 }
 useEffect(()=>{load();},[]);
 const totals=useMemo(()=>{
  const income=payments.reduce((n,p)=>n+Number(p.amount||0),0);
  const outflow=expenses.reduce((n,e)=>n+Number(e.amount||0),0);
  return {income,outflow,net:income-outflow};
 },[payments,expenses]);
 function exportCsv(){
  const lines=[['Tipo','Data','Valor (R$)'],...payments.map(p=>['Receita',String(p.paid_at||'').slice(0,10),p.amount]),...expenses.map(e=>['Despesa',e.paid_on,e.amount])];
  const csv='\ufeff'+lines.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='fluxo-caixa-'+start+'-'+end+'.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <div className="card">
  <h3>Fluxo de caixa por período</h3>
  <p className="hint">Receitas de pagamentos registrados e despesas marcadas como pagas. Não substitui o fechamento de caixa oficial.</p>
  <div className="inline">
   <label>De <input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
   <label>Até <input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label>
   <button type="button" className="secondary" disabled={loading} onClick={load}>{loading?'Consultando...':'Atualizar'}</button>
   <button type="button" className="secondary" disabled={loading||Boolean(error)} onClick={exportCsv}>Exportar CSV</button>
  </div>
  {error&&<p role="alert">{error}</p>}
  <div className="financeOverviewGrid">
   <div><small>Receitas recebidas</small><strong>{money(totals.income)}</strong></div>
   <div><small>Despesas pagas</small><strong>{money(totals.outflow)}</strong></div>
   <div><small>Saldo do período</small><strong>{money(totals.net)}</strong></div>
  </div>
  <small className="hint">Registros consultados: {payments.length} pagamentos e {expenses.length} despesas. Limite de 10 mil por conjunto.</small>
 </div>;
}

function nextDay(date){
 const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);
}
