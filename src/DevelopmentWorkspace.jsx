import Finance from './FinanceWorkspace.jsx';
import Inventory from './InventoryWorkspace.jsx';
import ManagementAssistant from './ManagementAssistant.jsx';
import React,{useEffect,useState,useCallback} from 'react';
import './development.css';
import {runtime} from './runtime-environment.js';
import LoyaltyRedemptionForm from './LoyaltyRedemptionForm.jsx';
import {sortedLoyaltyAccounts} from './loyalty-rules.js';
import {businessDate,monthReceipts,monthServices,LOYALTY_REWARDS,DEFAULT_LOYALTY_SETTINGS} from './business-metrics.js';
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const day=businessDate;
const date=v=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Belem',hour12:false}):'—';
const today=()=>day(new Date());
export const developmentTabs=['agenda-visual','producao','estoque','financeiro','fidelidade','assistente','integracoes'];
export async function fetchAllRows(db,table,order='created_at',ascending=false){
 const rows=[];for(let offset=0;;offset+=500){const result=await db.from(table).select('*').order(order,{ascending}).order('id').range(offset,offset+499);if(result.error)return result;rows.push(...(result.data||[]));if((result.data||[]).length<500)return {data:rows,error:null};}
}
function useRows(db,table){
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 const refresh=useCallback(async()=>{setBusy(true);const {data,error}=await fetchAllRows(db,table);setError(error?.message||'');if(!error)setRows(data||[]);setBusy(false);},[db,table]);
 useEffect(()=>{let active=true;async function load(){const {data,error}=await fetchAllRows(db,table);if(active){if(!error)setRows(data||[]);setError(error?.message||'');setBusy(false);}}load();const timer=setInterval(load,20000);return()=>{active=false;clearInterval(timer);};},[db,table]);
 return {rows,error,busy,refresh};
}
function Box({title,children}){return <section className="devBox"><h2>{title}</h2>{children}</section>}
function Result({error,message}){return <div role={error?'alert':'status'} className={error?'devError':'devSuccess'}>{error||message}</div>}
function Empty({children='Nenhum registro cadastrado.'}){return <p className="devEmpty">{children}</p>}
function Grid({columns,rows}){return <div className="devTable"><table><thead><tr>{columns.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((x,j)=><td key={j}>{x}</td>)}</tr>)}</tbody></table>{!rows.length&&<Empty/>}</div>}
function Loyalty({supabase,clients=[],profile,vehicles=[],services=[],employees=[],paymentMethods=[],reload}){
 const data=useRows(supabase,'loyalty_overview'),history=useRows(supabase,'loyalty_transactions'),settings=useRows(supabase,'loyalty_settings'),redemptions=useRows(supabase,'loyalty_redemptions');
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[rules,setRules]=useState(DEFAULT_LOYALTY_SETTINGS),[rulesDirty,setRulesDirty]=useState(false),[search,setSearch]=useState('');
 useEffect(()=>{if(settings.rows[0]&&!rulesDirty)setRules(settings.rows[0]);},[settings.rows,rulesDirty]);
 async function configure(e){e.preventDefault();setBusy(true);setError('');setMessage('');
 const {error}=await supabase.from('loyalty_settings').update({points_per_real:Number(rules.points_per_real),vip_window_days:Number(rules.vip_window_days),silver_visits:Number(rules.silver_visits),gold_visits:Number(rules.gold_visits),diamond_visits:Number(rules.diamond_visits),updated_at:new Date().toISOString()}).eq('id',1).select('id').single();
 setBusy(false);setError(error?.message||'');if(!error){setRulesDirty(false);setMessage('Parâmetros salvos. A nova taxa vale para novos serviços; créditos anteriores mantêm a taxa original.');settings.refresh();data.refresh();}}
 const name=id=>clients.find(c=>c.id===id)?.name||'Cliente';
 const activeRules=settings.rows[0]||DEFAULT_LOYALTY_SETTINGS;
 const tier={regular:'Regular',prata:'Prata',ouro:'Ouro',diamante:'Diamante'};
 return <><Box title="Fidelidade e clientes VIP"><p>Os clientes com participação ativada no cadastro entram no programa. Cada serviço concluído credita pontos pelo valor final cobrado, já com o desconto. Serviços gratuitos não geram pontos. Créditos anteriores já foram apurados pelo histórico, sem duplicação.</p>
 <div className="devMetrics"><div>Regra de pontuação<strong>{activeRules.points_per_real} ponto(s) / R$ 1</strong></div><div>Janela VIP<strong>{activeRules.vip_window_days} dias</strong></div><div>Atendimentos para VIP<strong>Prata {activeRules.silver_visits} · Ouro {activeRules.gold_visits} · Diamante {activeRules.diamond_visits}</strong></div></div>
 <p className="hint">Um atendimento com vários serviços conta como uma visita. O resgate de pontos não reduz a categoria VIP. Frações de pontos são arredondadas para baixo por serviço. Estornos após resgates aparecem como ajuste pendente, compensado nos próximos créditos.</p>
 <Result error={error||data.error||history.error||settings.error} message={message}/>
 {profile?.role==='administrador'&&<details className="loyaltyRules"><summary>Configurar pontos e categorias VIP</summary><form onSubmit={configure} className="devInlineForm">
 <label>Pontos por R$ 1<input type="number" min="0.01" max="100" step="0.01" required value={rules.points_per_real} onChange={e=>{setRulesDirty(true);setRules({...rules,points_per_real:e.target.value})}}/></label>
 <label>Período de recorrência (dias)<input type="number" min="30" max="365" required value={rules.vip_window_days} onChange={e=>{setRulesDirty(true);setRules({...rules,vip_window_days:e.target.value})}}/></label>
 <label>Prata: atendimentos<input type="number" min="1" max="998" required value={rules.silver_visits} onChange={e=>{setRulesDirty(true);setRules({...rules,silver_visits:e.target.value})}}/></label>
 <label>Ouro: atendimentos<input type="number" min={Number(rules.silver_visits)+1} max="999" required value={rules.gold_visits} onChange={e=>{setRulesDirty(true);setRules({...rules,gold_visits:e.target.value})}}/></label>
 <label>Diamante: atendimentos<input type="number" min={Number(rules.gold_visits)+1} max="1000" required value={rules.diamond_visits} onChange={e=>{setRulesDirty(true);setRules({...rules,diamond_visits:e.target.value})}}/></label><button disabled={busy}>Salvar parâmetros</button></form></details>}
 <label>Pesquisar cliente<input placeholder="Nome do cliente" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <Grid columns={['Cliente','Pontos disponíveis','Ajuste pendente','Atendimentos no período','Categoria VIP']} rows={sortedLoyaltyAccounts(data.rows,clients).filter(x=>name(x.client_id).toLowerCase().includes(search.toLowerCase())).map(x=>[name(x.client_id),Number(x.points_balance).toLocaleString('pt-BR'),Number(x.points_debt||0).toLocaleString('pt-BR'),x.visits_in_window,tier[x.vip_tier]||'Regular'])}/></Box>
 <Box title="Tabela de benefícios"><Grid columns={['Pontos necessários','Benefício']} rows={[...LOYALTY_REWARDS].sort((a,b)=>b.points-a.points).map(r=>[r.id==='major_discount'?'Acima de 2.450 pontos (a partir de 2.451)':r.points.toLocaleString('pt-BR')+' pontos',<span>{r.label}{r.note&&<small className="rewardNote">{r.note}. Valor do desconto combinado com o cliente antes do resgate.</small>}</span>])}/>
 <LoyaltyRedemptionForm supabase={supabase} accounts={data.rows} clients={clients} vehicles={vehicles} services={services} employees={employees} paymentMethods={paymentMethods} onSaved={async()=>{data.refresh();history.refresh();redemptions.refresh();if(reload)await reload();}}/></Box>
 <Box title="Histórico de resgates"><Grid columns={['Data','Cliente','Benefício','Pontos','Situação']} rows={redemptions.rows.map(r=>[date(r.created_at),name(r.client_id),r.benefit_label,r.points_cost,({reserved:'Agendado — pontos reservados',completed:'Concluído — no histórico de serviços',canceled:'Cancelado — pontos devolvidos'})[r.status]])}/></Box><Box title="Histórico de pontos"><Grid columns={['Data','Cliente','Pontos','Origem','Motivo']} rows={history.rows.filter(x=>data.rows.some(a=>a.id===x.account_id)).map(x=>[date(x.created_at),name(data.rows.find(a=>a.id===x.account_id)?.client_id),x.points_delta,x.source_kind==='service'?'Serviço automático':x.source_kind==='redemption'?'Resgate':'Registro anterior',x.reason])}/></Box></>;
}
function Integrations({supabase,clients=[],setClients}){
 const [status,setStatus]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[clientId,setClientId]=useState(''),[email,setEmail]=useState(true),[whatsapp,setWhatsapp]=useState(true),[busy,setBusy]=useState(false),[preferences,setPreferences]=useState(clients);
 const outbox=useRows(supabase,'notification_outbox');
 useEffect(()=>{setPreferences(clients)},[clients]);
 useEffect(()=>{let live=true;supabase.functions.invoke(runtime.functions.gateway,{body:{action:'status'}}).then(({data,error})=>{if(live){setStatus(data);setError(error?.message||data?.error||'')}});return()=>{live=false}},[supabase]);
 function choose(id){setClientId(id);const client=preferences.find(x=>x.id===id);setEmail(client?.email_opt_in!==false);setWhatsapp(client?.whatsapp_opt_in!==false);setError('');setMessage('');}
 async function consent(e){e.preventDefault();setBusy(true);setError('');setMessage('');const {error}=await supabase.from('clients').update({email_opt_in:email,whatsapp_opt_in:whatsapp}).eq('id',clientId).select('id').single();setBusy(false);setError(error?.message||'');if(!error){setPreferences(rows=>rows.map(c=>c.id===clientId?{...c,email_opt_in:email,whatsapp_opt_in:whatsapp}:c));if(setClients)setClients(rows=>rows.map(c=>c.id===clientId?{...c,email_opt_in:email,whatsapp_opt_in:whatsapp}:c));setMessage('Preferências atualizadas no cadastro e nas integrações.');}}
 return <Box title="Integrações e atendimento"><p className="devNotice">{runtime.isDevelopment?'Envios reais estão bloqueados no desenvolvimento.':'Avisos de conclusão por e-mail ativos. WhatsApp ainda indisponível.'}</p><Result error={error||outbox.error} message={message}/>{status&&<div className="devMetrics">{Object.entries(status.providers||{}).map(([k,v])=><div key={k}>{k==='meta'?'WhatsApp':k.toUpperCase()}<strong>{v.configured?'Configurado':'Pendente'}</strong></div>)}<div>Envio real<strong>{status.messaging_live_enabled?'E-mail ativo':'Desativado'}</strong></div></div>}
 <h3>Alterar preferências do cliente</h3><p>E-mail e WhatsApp começam autorizados por padrão. Selecione o cliente para consultar ou alterar sua preferência. A opção de WhatsApp não ativa a integração pendente.</p>
 <form className="devInlineForm" onSubmit={consent}><label>Cliente<select required value={clientId} onChange={e=>choose(e.target.value)}><option value="" disabled>Selecione</option>{preferences.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label><input type="checkbox" checked={email} onChange={e=>setEmail(e.target.checked)}/> Autoriza e-mail</label><label><input type="checkbox" checked={whatsapp} onChange={e=>setWhatsapp(e.target.checked)}/> Autoriza WhatsApp</label><button disabled={busy||!clientId}>Salvar alterações</button></form>
 <Grid columns={['Cliente','E-mail','WhatsApp']} rows={preferences.map(c=>[c.name,c.email_opt_in!==false?'Autorizado':'Não autorizado',c.whatsapp_opt_in!==false?'Autorizado':'Não autorizado'])}/>
 <h3>Fila de notificações</h3><Grid columns={['Data','Canal','Situação','Tentativas']} rows={outbox.rows.map(x=>[date(x.created_at),x.channel,x.status,x.attempts])}/></Box>;
}
function Operations({supabase,clients=[],vehicles=[],services=[],employees=[],visual,canWrite,setAppointments}){
 const data=useRows(supabase,'appointments');const [selected,setSelected]=useState(today()),[search,setSearch]=useState(''),[moving,setMoving]=useState(null),[moveTime,setMoveTime]=useState(''),[moveError,setMoveError]=useState(''),[saving,setSaving]=useState(false);
 useEffect(()=>{if(!data.busy&&!data.error&&setAppointments)setAppointments(data.rows)},[data.rows,data.busy,data.error,setAppointments]);
 async function move(e){e.preventDefault();setSaving(true);const {data:changed,error}=await supabase.rpc(runtime.rpc.reschedule,{p_group:moving.appointment_group_id||moving.id,p_when:new Date(moveTime+'-03:00').toISOString()});setSaving(false);setMoveError(error?.message||'');if(!error){if(setAppointments)setAppointments(current=>[...(changed||[]),...current.filter(a=>!(changed||[]).some(x=>x.id===a.id))]);setMoving(null);data.refresh();}}
 const grouped=Object.values(data.rows.filter(x=>x.scheduled_at&&day(x.scheduled_at)===selected&&!['concluido','concluído','cancelado'].includes(x.status)).reduce((a,x)=>{const id=x.appointment_group_id||x.id;a[id]=a[id]||{...x,rows:[]};a[id].rows.push(x);return a},{}));
 const label=a=>{const v=vehicles.find(v=>v.id===a.vehicle_id),c=clients.find(c=>c.id===(a.client_id||v?.client_id));return `${c?.name||'Cliente'} · ${v?.plate||''}`};
 const rows=grouped.filter(x=>label(x).toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at));
 return <Box title={visual?'Agenda visual':'Painel de produção'}><p>Atualização automática a cada 20 segundos. Os registros são agrupados por atendimento.</p><Result error={moveError||data.error}/>{moving&&<form onSubmit={move}><h3>Alterar horário · {label(moving)}</h3><label>Novo dia e horário<input type="datetime-local" required value={moveTime} onChange={e=>setMoveTime(e.target.value)}/></label><button disabled={saving}>Confirmar horário</button> <button type="button" onClick={()=>setMoving(null)}>Cancelar alteração</button></form>}<div className="devInlineForm"><label>Dia<input type="date" value={selected} onChange={e=>setSelected(e.target.value)}/></label><label>Pesquisar cliente ou placa<input value={search} onChange={e=>setSearch(e.target.value)}/></label><button onClick={data.refresh}>Atualizar</button></div><div className="devBoard">{(visual?['horarios']:['agendado','confirmado','em_atendimento','outros']).map(state=><div key={state}><h3>{state==='horarios'?'Atendimentos':state.replaceAll('_',' ')}</h3>{rows.filter(a=>state==='horarios'||(state==='outros'?!['agendado','confirmado','em_atendimento'].includes(a.status):a.status===state)).map(a=><article key={a.id} draggable={Boolean(visual&&canWrite)} onDragStart={e=>e.dataTransfer.setData("text/plain",a.appointment_group_id||a.id)}><strong>{new Date(a.scheduled_at).toLocaleTimeString('pt-BR',{timeZone:'America/Belem',hour:'2-digit',minute:'2-digit',hour12:false})} · {label(a)}</strong><p>{a.rows.map(r=>services.find(s=>s.id===r.service_id)?.name||'Serviço').join(', ')}</p><small>{a.status} · {a.rows.map(r=>(r.employee_ids||[r.employee_id]).map(id=>employees.find(e=>e.id===id)?.name).filter(Boolean).join(', ')).filter(Boolean).join(' / ')||'Sem responsável'}</small>{visual&&canWrite&&<p><button onClick={()=>{setMoving(a);setMoveError('');setMoveTime(day(a.scheduled_at)+'T'+new Date(a.scheduled_at).toLocaleTimeString('en-GB',{timeZone:'America/Belem',hour:'2-digit',minute:'2-digit'}));}}>Alterar horário</button></p>}</article>)}</div>)}</div>{!rows.length&&<Empty>Nenhum atendimento neste dia.</Empty>}{visual&&canWrite&&<div className="devDropSlots">{Array.from({length:13},(_,i)=>i+7).map(h=><div key={h} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const a=rows.find(x=>(x.appointment_group_id||x.id)===e.dataTransfer.getData('text/plain'));if(a){setMoving(a);setMoveTime(selected+'T'+String(h).padStart(2,'0')+':00');setMoveError('');}}}>Soltar às {h}:00</div>)}</div>}<p className="hint">Use Agendamentos para cadastrar, editar e concluir os serviços.</p></Box>;
}
export default function DevelopmentWorkspace({tab,...props}){
 if(tab==='assistente')return <ManagementAssistant {...props}/>;
 if(tab==='integracoes')return <Integrations {...props}/>;
 if(tab==='estoque')return <Inventory {...props}/>;
 if(tab==='financeiro')return <Finance {...props}/>;
 if(tab==='fidelidade')return <Loyalty {...props}/>;
 return <Operations {...props} visual={tab==='agenda-visual'}/>;
}
export function InstallApp(){const [prompt,setPrompt]=useState(null);useEffect(()=>{const on=e=>{e.preventDefault();setPrompt(e)};window.addEventListener('beforeinstallprompt',on);return()=>window.removeEventListener('beforeinstallprompt',on)},[]);return prompt?<button type="button" className="secondary" onClick={async()=>{await prompt.prompt();setPrompt(null)}}>Instalar aplicativo</button>:null;}
