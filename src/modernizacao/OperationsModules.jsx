import React,{useEffect,useState} from 'react';

const brl=value=>Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const errText=e=>e?.message||'Não foi possível concluir a operação.';

export function InventoryModule({supabase,canAdmin,profile}){
 const [items,setItems]=useState([]);
 const [moves,setMoves]=useState([]);
 const [name,setName]=useState('');
 const [sku,setSku]=useState('');
 const [selected,setSelected]=useState('');
 const [amount,setAmount]=useState('');
 const [reason,setReason]=useState('');
 const [kind,setKind]=useState('entrada');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 async function refresh(){
  const [a,b]=await Promise.all([
   supabase.from('inventory_items').select('*').order('name'),
   supabase.from('inventory_movements').select('id,item_id,quantity_delta,reason,created_at').order('created_at',{ascending:false}).limit(100)
  ]);
  if(a.error||b.error)setNotice(errText(a.error||b.error));
  else{setItems(a.data||[]);setMoves(b.data||[]);}
 }
 useEffect(()=>{refresh();},[]);
 async function addItem(e){
  e.preventDefault();setBusy(true);setNotice('');
  const {error}=await supabase.from('inventory_items').insert({name:name.trim(),sku:sku.trim()||null});
  setBusy(false);
  if(error){setNotice(errText(error));return;}
  setName('');setSku('');setNotice('Material cadastrado.');await refresh();
 }
 async function move(e){
  e.preventDefault();
  const quantity=Number(amount);
  if(!selected||!Number.isFinite(quantity)||quantity<=0){setNotice('Selecione um material e uma quantidade positiva.');return;}
  setBusy(true);setNotice('');
  const {error}=await supabase.from('inventory_movements').insert({
   item_id:selected,quantity_delta:kind==='entrada'?quantity:-quantity,
   reason:reason.trim(),created_by:profile.id
  });
  setBusy(false);
  if(error){setNotice(errText(error));return;}
  setAmount('');setReason('');setNotice('Movimentação registrada.');await refresh();
 }
 return <section className="panel">
  <h2>Controle de estoque</h2>
  <p className="hint">Materiais e movimentações com histórico e atualização automática de saldo.</p>
  {notice&&<p role="status">{notice}</p>}
  {canAdmin&&<div className="card">
   <h3>Cadastrar material</h3>
   <form onSubmit={addItem} className="inline">
    <input aria-label="Nome do material" placeholder="Nome do material" required value={name} onChange={e=>setName(e.target.value)}/>
    <input aria-label="Código SKU" placeholder="Código SKU (opcional)" value={sku} onChange={e=>setSku(e.target.value)}/>
    <button className="primary" disabled={busy}>Cadastrar</button>
   </form>
  </div>}
  {canAdmin&&<div className="card">
   <h3>Entrada ou saída</h3>
   <form onSubmit={move} className="inline">
    <select aria-label="Material" required value={selected} onChange={e=>setSelected(e.target.value)}>
     <option value="">Selecione o material</option>
     {items.map(i=><option key={i.id} value={i.id}>{i.name} — {i.current_quantity} {i.unit}</option>)}
    </select>
    <select aria-label="Tipo de movimentação" value={kind} onChange={e=>setKind(e.target.value)}>
     <option value="entrada">Entrada</option><option value="saida">Saída</option>
    </select>
    <input aria-label="Quantidade" type="number" min="0.001" step="0.001" required placeholder="Quantidade" value={amount} onChange={e=>setAmount(e.target.value)}/>
    <input aria-label="Motivo" required placeholder="Motivo" value={reason} onChange={e=>setReason(e.target.value)}/>
    <button className="primary" disabled={busy}>Registrar</button>
   </form>
  </div>}
  <h3>Materiais cadastrados</h3>
  <div className="tableWrap"><table><thead><tr><th>Material</th><th>SKU</th><th>Saldo</th><th>Mínimo</th></tr></thead><tbody>
   {items.map(i=><tr key={i.id}><td>{i.name}</td><td>{i.sku||'—'}</td><td>{i.current_quantity} {i.unit}</td><td>{i.min_quantity}</td></tr>)}
   {!items.length&&<tr><td colSpan="4">Nenhum material cadastrado.</td></tr>}
  </tbody></table></div>
  {canAdmin&&<><h3>Últimas movimentações</h3><div className="tableWrap"><table><thead><tr><th>Data</th><th>Material</th><th>Quantidade</th><th>Motivo</th></tr></thead><tbody>
   {moves.map(m=><tr key={m.id}><td>{new Date(m.created_at).toLocaleString('pt-BR')}</td><td>{items.find(i=>i.id===m.item_id)?.name||'—'}</td><td>{m.quantity_delta}</td><td>{m.reason}</td></tr>)}
  </tbody></table></div></>}
 </section>;
}

export function FinanceModule({supabase}){
 const [expenses,setExpenses]=useState([]);
 const [description,setDescription]=useState('');
 const [amount,setAmount]=useState('');
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 async function refresh(){
  const {data,error}=await supabase.from('finance_expenses').select('id,description,amount,incurred_on,status').order('incurred_on',{ascending:false}).limit(200);
  if(error)setNotice(errText(error));else setExpenses(data||[]);
 }
 useEffect(()=>{refresh();},[]);
 async function add(e){
  e.preventDefault();
  const value=Number(amount);
  if(!Number.isFinite(value)||value<=0){setNotice('Informe um valor positivo.');return;}
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setNotice('Sessão expirada.');return;}
  setBusy(true);setNotice('');
  const {error}=await supabase.from('finance_expenses').insert({description:description.trim(),amount:value,incurred_on:date,created_by:user.id});
  setBusy(false);
  if(error){setNotice(errText(error));return;}
  setDescription('');setAmount('');setNotice('Despesa registrada.');await refresh();
 }
 const total=expenses.filter(e=>e.status!=='cancelado').reduce((sum,e)=>sum+Number(e.amount||0),0);
 return <section className="panel">
  <h2>Gestão financeira — despesas</h2>
  <p className="hint">Módulo inicial isolado. Não altera o fechamento de caixa existente.</p>
  {notice&&<p role="status">{notice}</p>}
  <div className="card"><h3>Registrar despesa</h3>
   <form onSubmit={add} className="inline">
    <input aria-label="Descrição da despesa" required placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)}/>
    <input aria-label="Valor em reais" type="number" required min="0.01" step="0.01" placeholder="Valor (R$)" value={amount} onChange={e=>setAmount(e.target.value)}/>
    <input aria-label="Data da despesa" type="date" required value={date} onChange={e=>setDate(e.target.value)}/>
    <button className="primary" disabled={busy}>Salvar despesa</button>
   </form>
  </div>
  <p><strong>Total listado (exceto canceladas): {brl(total)}</strong></p>
  <div className="tableWrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Situação</th></tr></thead><tbody>
   {expenses.map(e=><tr key={e.id}><td>{String(e.incurred_on||'').split('-').reverse().join('/')}</td><td>{e.description}</td><td>{brl(e.amount)}</td><td>{e.status}</td></tr>)}
   {!expenses.length&&<tr><td colSpan="4">Nenhuma despesa registrada.</td></tr>}
  </tbody></table></div>
 </section>;
}
