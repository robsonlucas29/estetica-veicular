import React,{useState} from 'react';

export function IntegrationsCenter({supabase}){
 const [status,setStatus]=useState(null);
 const [question,setQuestion]=useState('');
 const [answer,setAnswer]=useState('');
 const [items,setItems]=useState([]);
 const [clients,setClients]=useState([]);
 const [clientId,setClientId]=useState('');
 const [channel,setChannel]=useState('email');
 const [message,setMessage]=useState('Seu atendimento possui uma atualização. Consulte nossa equipe para detalhes.');
 const [preview,setPreview]=useState(null);
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 async function check(){
  setBusy(true);setNotice('');
  const [r,q,c]=await Promise.all([
   supabase.functions.invoke('integrations-gateway-dev',{body:{action:'status'}}),
   supabase.from('notification_outbox').select('id,channel,recipient,template_name,status,created_at').order('created_at',{ascending:false}).limit(30),
   supabase.from('clients').select('id,name').order('name',{ascending:true}).limit(500)
  ]);
  setBusy(false);
  if(r.error)setNotice('Gateway: '+r.error.message);else setStatus(r.data);
  if(q.error)setNotice(prev=>prev+' Fila: '+q.error.message);else setItems(q.data||[]);
  if(!c.error)setClients(c.data||[]);
 }
 async function ask(e){
  e.preventDefault();setBusy(true);setNotice('');setAnswer('');
  const {data,error}=await supabase.functions.invoke('integrations-gateway-dev',{body:{action:'ask',question}});
  setBusy(false);
  if(error||data?.error)setNotice(data?.error||error?.message||'Falha na IA');else setAnswer(data?.answer||'Sem resposta.');
 }
 async function inspect(id){
  setBusy(true);setPreview(null);setNotice('');
  const {data,error}=await supabase.functions.invoke('notification-delivery-dev',{body:{action:'preview',id}});
  setBusy(false);
  if(error||data?.error)setNotice(data?.error||error?.message||'Falha na prévia');else setPreview(data);
 }
 async function queue(e){
  e.preventDefault();setBusy(true);setNotice('');
  const {data,error}=await supabase.functions.invoke('notification-delivery-dev',{body:{action:'queue',client_id:clientId,channel,message}});
  setBusy(false);
  if(error||data?.error){setNotice(data?.error||error?.message||'Falha ao enfileirar');return;}
  setNotice('Notificação de teste enfileirada sem envio.');await check();
 }
 return <section className="panel">
  <h2>Integrações — ambiente de desenvolvimento</h2>
  <p className="hint">Meta WhatsApp Cloud API, Resend e OpenAI. Nenhuma mensagem é disparada por esta tela. A consulta de status não expõe chaves.</p>
  <button type="button" className="secondary" disabled={busy} onClick={check}>{busy?'Consultando...':'Verificar provedores e fila'}</button>
  {notice&&<p role="alert">{notice}</p>}
  {status&&<div className="card"><h3>Conexões</h3>
   <p>WhatsApp Meta: <strong>{status.providers?.meta?.configured?'Credenciais cadastradas':'Credenciais pendentes'}</strong></p>
   <p>E-mail Resend: <strong>{status.providers?.resend?.configured?'Credenciais cadastradas':'Credenciais pendentes'}</strong></p>
   <p>IA OpenAI: <strong>{status.providers?.openai?.configured?'Credenciais cadastradas':'Credenciais pendentes'}</strong></p>
   <p>Envio real: <strong>{status.messaging_live_enabled?'Habilitado no servidor':'Desativado no servidor'}</strong></p>
   <small>Credenciais cadastradas não garantem que o provedor tenha autorizado domínio, telefone ou template.</small>
  </div>}
  <div className="card"><h3>Assistente IA — perguntas gerais</h3>
   <p className="hint">Não inclua nomes, placas, telefones, dados financeiros ou outros dados pessoais. A pergunta será transmitida à OpenAI somente se a chave estiver configurada.</p>
   <form onSubmit={ask}><textarea rows="3" minLength="4" maxLength="1200" required value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ex.: Como melhorar a organização dos serviços da garagem?"/><button className="secondary" disabled={busy||question.trim().length<4}>Perguntar à IA</button></form>
   {answer&&<div role="status" style={{whiteSpace:'pre-wrap'}}>{answer}</div>}
  </div>
  <div className="card"><h3>Preparar notificação — sem envio</h3>
   <p className="hint">Somente clientes com consentimento registrado. Este formulário cria um registro pendente na fila; não envia mensagem.</p>
   <form className="inline" onSubmit={queue}>
    <label>Cliente<select required value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Selecione</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Canal<select value={channel} onChange={e=>setChannel(e.target.value)}><option value="email">E-mail</option><option value="whatsapp">WhatsApp</option></select></label>
    <label>Mensagem<input maxLength="800" value={message} onChange={e=>setMessage(e.target.value)}/></label>
    <button type="submit" className="secondary" disabled={busy||!clientId}>Adicionar à fila (não enviar)</button>
   </form>
  </div>
  <div className="card"><h3>Fila de notificações — últimas 30</h3>
   {!items.length&&<p className="hint">Consulte para listar notificações.</p>}
   <div className="tableWrap"><table><thead><tr><th>Canal</th><th>Destino</th><th>Situação</th><th>Prévia</th></tr></thead><tbody>
   {items.map(x=><tr key={x.id}><td>{x.channel}</td><td>{x.recipient.replace(/.(?=.{4})/g,'*')}</td><td>{x.status}</td><td><button type="button" className="secondary" disabled={busy||x.status!=='pending'} onClick={()=>inspect(x.id)}>Conferir</button></td></tr>)}
   </tbody></table></div>
   {preview&&<p role="status">Canal: {preview.channel}. Consentimento: {preview.consent?'confirmado':'não confirmado'}. Provedor: {preview.configured?'configurado':'pendente'}. Envio real: {preview.live_enabled?'habilitado':'desativado'}. Nenhuma mensagem foi enviada.</p>}
  </div>
 </section>;
}
