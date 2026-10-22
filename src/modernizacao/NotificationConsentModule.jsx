import React,{useEffect,useState} from 'react';

export function NotificationConsentModule({supabase,clients=[]}){
 const [rows,setRows]=useState([]);
 const [clientId,setClientId]=useState('');
 const [email,setEmail]=useState(false);
 const [whatsapp,setWhatsapp]=useState(false);
 const [source,setSource]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 async function refresh(){
  const {data,error}=await supabase.from('notification_consents').select('client_id,email_opt_in,whatsapp_opt_in,consent_source,consent_recorded_at').order('updated_at',{ascending:false}).limit(500);
  if(error)setNotice(error.message);else setRows(data||[]);
 }
 useEffect(()=>{refresh();},[]);
 function selectClient(id){
  setClientId(id);
  const row=rows.find(x=>x.client_id===id);
  setEmail(Boolean(row?.email_opt_in));setWhatsapp(Boolean(row?.whatsapp_opt_in));setSource(row?.consent_source||'');
 }
 async function save(e){
  e.preventDefault();
  if((email||whatsapp)&&!source.trim()){setNotice('Registre a origem do consentimento.');return;}
  setBusy(true);setNotice('');
  const payload={client_id:clientId,email_opt_in:email,whatsapp_opt_in:whatsapp,
   consent_source:source.trim()||null,consent_recorded_at:(email||whatsapp)?new Date().toISOString():null,updated_at:new Date().toISOString()};
  const {error}=await supabase.from('notification_consents').upsert(payload,{onConflict:'client_id'});
  setBusy(false);
  if(error)setNotice(error.message);else{setNotice('Preferências registradas. Nenhuma mensagem foi enviada.');await refresh();}
 }
 return <section className="panel">
  <h2>Consentimento para notificações</h2>
  <p className="hint">Registre somente autorização efetivamente concedida pelo cliente. As notificações automáticas continuam desativadas.</p>
  {notice&&<p role="status">{notice}</p>}
  <form className="card" onSubmit={save}>
   <label>Cliente<select required value={clientId} onChange={e=>selectClient(e.target.value)}><option value="">Selecione</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label><input type="checkbox" checked={email} onChange={e=>setEmail(e.target.checked)}/> Autoriza e-mail</label>
   <label><input type="checkbox" checked={whatsapp} onChange={e=>setWhatsapp(e.target.checked)}/> Autoriza WhatsApp</label>
   <label>Origem da autorização<input placeholder="Ex.: formulário assinado" value={source} onChange={e=>setSource(e.target.value)}/></label>
   <button className="primary" disabled={busy}>Salvar preferências</button>
  </form>
  <h3>Registros consultados ({rows.length})</h3>
  <div className="tableWrap"><table><thead><tr><th>Cliente</th><th>E-mail</th><th>WhatsApp</th></tr></thead><tbody>
   {rows.map(r=><tr key={r.client_id}><td>{clients.find(c=>c.id===r.client_id)?.name||'—'}</td><td>{r.email_opt_in?'Sim':'Não'}</td><td>{r.whatsapp_opt_in?'Sim':'Não'}</td></tr>)}
  </tbody></table></div>
 </section>;
}
