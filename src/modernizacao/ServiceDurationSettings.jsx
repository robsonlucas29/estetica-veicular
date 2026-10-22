import React,{useState} from 'react';

export function ServiceDurationSettings({supabase,services=[],onUpdated}){
 const [id,setId]=useState('');
 const [minutes,setMinutes]=useState('60');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const selected=services.find(s=>s.id===id);
 function select(value){
  setId(value);
  const s=services.find(item=>item.id===value);
  setMinutes(String(s?.duration_minutes||60));
 }
 async function save(e){
  e.preventDefault();
  const n=Number(minutes);
  if(!id||!Number.isInteger(n)||n<5||n>720){setNotice('Duração deve ser um número inteiro entre 5 e 720 minutos.');return;}
  setBusy(true);setNotice('');
  const {error}=await supabase.from('service_types').update({duration_minutes:n}).eq('id',id);
  setBusy(false);
  if(error){setNotice(error.message);return;}
  setNotice('Duração estimada atualizada. Os alertas foram recalculados.');
  onUpdated?.(id,n);
 }
 return <div className="card">
  <h3>Duração estimada dos serviços</h3>
  <p className="hint">Usada somente nos alertas de conflito da agenda. Não modifica horários nem preços de agendamentos.</p>
  <form className="inline" onSubmit={save}>
   <label>Serviço<select required value={id} onChange={e=>select(e.target.value)}><option value="">Selecione</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>Minutos<input type="number" required min="5" max="720" step="1" value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>
   <button type="submit" className="secondary" disabled={busy||!selected}>Salvar duração</button>
  </form>
  {notice&&<p role="status">{notice}</p>}
 </div>;
}
