import React,{useMemo,useState} from 'react';

// CRM consultivo: utiliza apenas o histórico já carregado, sem novas tabelas
// e sem disparos automáticos de mensagens.
export default function ClientRecoveryPanel({clients=[],vehicles=[],orders=[]}){
 const [filter,setFilter]=useState('oportunidades');
 const [search,setSearch]=useState('');
 const rows=useMemo(()=>{
  const ownerByVehicle=new Map(vehicles.map(v=>[v.id,v.client_id]));
  const latest=new Map();
  for(const order of orders){
   if(order.status!=='concluido')continue;
   const clientId=ownerByVehicle.get(order.vehicle_id);
   const date=new Date(order.completed_at||order.created_at||'');
   if(!clientId||Number.isNaN(date.getTime()))continue;
   if(!latest.has(clientId)||latest.get(clientId)<date)latest.set(clientId,date);
  }
  const now=new Date();
  return clients.map(c=>{
   const last=latest.get(c.id);
   const days=last?Math.max(0,Math.floor((now-last)/86400000)):null;
   const status=days===null?'sem_historico':days>=120?'inativo':days>=60?'em_risco':'ativo';
   return {...c,days,status,last};
  }).sort((a,b)=>(b.days??-1)-(a.days??-1));
 },[clients,vehicles,orders]);
 const totals={em_risco:rows.filter(r=>r.status==='em_risco').length,inativo:rows.filter(r=>r.status==='inativo').length,sem_historico:rows.filter(r=>r.status==='sem_historico').length};
 const visible=rows.filter(c=>{
  const matches=filter==='todos'||(filter==='oportunidades'?['em_risco','inativo'].includes(c.status):c.status===filter);
  const q=search.trim().toLocaleLowerCase('pt-BR');
  return matches&&(!q||[c.name,c.phone].some(x=>String(x||'').toLocaleLowerCase('pt-BR').includes(q)));
 }).slice(0,30);
 function contact(c){
  if(c.whatsapp_opt_in===false)return;
  const digits=String(c.phone||'').replace(/\D/g,'');
  if(![10,11].includes(digits.length))return;
  const message=`Olá, ${String(c.name||'').split(' ')[0]}! Tudo bem? Aqui é da Garagem Grau Car 096. Estamos à disposição para cuidar do seu veículo. Se quiser, podemos verificar os horários disponíveis.`;
  window.open(`https://wa.me/55${digits}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
 }
 return <section className="recoveryPanel" aria-label="Oportunidades de retorno de clientes">
  <div className="recoveryHead">
   <div><h3>Relacionamento e retorno de clientes</h3><p>Identifique oportunidades com base no último serviço concluído. Nenhuma mensagem é enviada automaticamente.</p></div>
   <div className="recoveryTotals"><span><b>{totals.em_risco}</b> em risco</span><span><b>{totals.inativo}</b> inativos</span><span><b>{totals.sem_historico}</b> sem histórico</span></div>
  </div>
  <div className="recoveryFilters" role="group" aria-label="Filtrar clientes por situação">
   {[
    ['oportunidades','Oportunidades'],['em_risco','60–119 dias'],['inativo','120+ dias'],['sem_historico','Sem histórico'],['todos','Todos']
   ].map(([id,label])=><button key={id} type="button" className={filter===id?'selected':''} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}
  </div>
  <input className="recoverySearch" aria-label="Pesquisar clientes para retorno" placeholder="Pesquisar nome ou telefone" value={search} onChange={e=>setSearch(e.target.value)}/>
  <div className="recoveryList">
   {visible.length===0?<p className="hint">Nenhum cliente nessa situação.</p>:visible.map(c=>{
    const phone=String(c.phone||'').replace(/\D/g,'');
    const allowed=c.whatsapp_opt_in!==false&&[10,11].includes(phone.length);
    return <div className="recoveryRow" key={c.id}>
     <div><strong>{c.name}</strong><small>{c.days===null?'Ainda sem serviço concluído':`Último atendimento há ${c.days} dias · ${c.last.toLocaleDateString('pt-BR')}`}</small></div>
     <div className="recoveryRowActions"><span className={`recoveryStatus ${c.status}`}>{c.status==='em_risco'?'Em risco':c.status==='inativo'?'Inativo':c.status==='ativo'?'Ativo':'Sem histórico'}</span>
      {allowed?<button type="button" onClick={()=>contact(c)}>Abrir WhatsApp</button>:<small title="Contato indisponível ou sem autorização para WhatsApp">WhatsApp indisponível</small>}
     </div>
    </div>;
   })}
  </div>
  <p className="recoveryFoot">Critério inicial: em risco após 60 dias, inativo após 120 dias. Contato sempre manual e condicionado à autorização do cliente.</p>
 </section>;
}
