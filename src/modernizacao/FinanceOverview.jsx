import './financeOverview.css';
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
 const [truncated,setTruncated]=useState(false);
 async function allPages(table,fields,filters){
  const pageSize=500,maxRows=20000,rows=[];
  for(let offset=0;offset<maxRows;offset+=pageSize){
   let query=supabase.from(table).select(fields).order('id',{ascending:true}).range(offset,offset+pageSize-1);
   query=filters(query);
   const {data,error}=await query;
   if(error)throw error;
   rows.push(...(data||[]));
   if((data||[]).length<pageSize)return {rows,truncated:false};
  }
  return {rows,truncated:true};
 }
 async function load(){
  if(!start||!end||start>end){setError('Informe um período válido.');return;}
  setLoading(true);setError('');setTruncated(false);
  try{
   const [p,e]=await Promise.all([
    allPages('payments','id,amount,paid_at',q=>q.gte('paid_at',start+'T00:00:00').lt('paid_at',nextDay(end)+'T00:00:00')),
    allPages('finance_expenses','id,amount,paid_on,status',q=>q.eq('status','pago').gte('paid_on',start).lte('paid_on',end))
   ]);
   setPayments(p.rows);setExpenses(e.rows);setTruncated(p.truncated||e.truncated);
  }catch(err){setError(err.message||'Erro ao consultar os dados.');}
  finally{setLoading(false);}
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
   <button type="button" className="secondary" disabled={loading||Boolean(error)||truncated} onClick={exportCsv}>Exportar CSV</button>
  </div>
  {error&&<p role="alert">{error}</p>}
  {truncated&&<p role="alert">Limite de 20 mil registros por conjunto atingido. Reduza o período para obter valores e exportação completos.</p>}
  <div className="financeOverviewGrid">
   <div><small>Receitas recebidas</small><strong>{money(totals.income)}</strong></div>
   <div><small>Despesas pagas</small><strong>{money(totals.outflow)}</strong></div>
   <div><small>Saldo do período</small><strong>{money(totals.net)}</strong></div>
  </div>
  <small className="hint">Registros consultados: {payments.length} pagamentos e {expenses.length} despesas. Consulta paginada até 20 mil registros por conjunto; exportação bloqueada quando incompleta.</small>
 </div>;
}

function nextDay(date){
 const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);
}
