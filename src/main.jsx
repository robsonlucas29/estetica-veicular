import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient} from '@supabase/supabase-js';
import {
 Car,Users,Wrench,ClipboardList,ShieldCheck,LogOut,Plus,Camera,Trash2,Edit3,
 CalendarDays,Wallet,UserRoundCog,FileDown,MessageCircle,Eye,X,CheckCircle2,
 Clock3,CreditCard,Percent,Image as ImageIcon,Save,Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoGraucar from './assets/grau-car-logo.jpeg';
import './styles.css';

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=(url&&key)?createClient(url,key):null;
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dt=v=>v?new Date(v).toLocaleString('pt-BR'):'-';
const dateOnly=v=>v?new Date(v+'T12:00:00').toLocaleDateString('pt-BR'):'-';
const finalPrice=s=>Number(s?.price||0)*(1-Number(s?.discount_percent||0)/100);
const safePhone=p=>String(p||'').replace(/\D/g,'');
const maskDateBR=value=>{
 const n=String(value||'').replace(/\D/g,'').slice(0,8);
 if(n.length<=2)return n;
 if(n.length<=4)return `${n.slice(0,2)}/${n.slice(2)}`;
 return `${n.slice(0,2)}/${n.slice(2,4)}/${n.slice(4)}`;
};
const brDateToIso=value=>{
 if(!/^\d{2}\/\d{2}\/\d{4}$/.test(String(value||'')))return '';
 const [d,m,y]=value.split('/').map(Number);
 const test=new Date(y,m-1,d);
 if(test.getFullYear()!==y||test.getMonth()!==m-1||test.getDate()!==d)return '';
 return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
};

function App(){
 const [session,setSession]=useState(undefined),[profile,setProfile]=useState(undefined),[tab,setTab]=useState('dashboard');
 const [clients,setClients]=useState([]),[vehicles,setVehicles]=useState([]),[services,setServices]=useState([]),[vehicleCategories,setVehicleCategories]=useState([]),[orders,setOrders]=useState([]),[images,setImages]=useState([]),[logs,setLogs]=useState([]);
 const [appointments,setAppointments]=useState([]),[employees,setEmployees]=useState([]),[paymentMethods,setPaymentMethods]=useState([]),[payments,setPayments]=useState([]),[cashClosings,setCashClosings]=useState([]),[profiles,setProfiles]=useState([]);
 const [login,setLogin]=useState({email:'',password:''}),[error,setError]=useState(''),[loadingData,setLoadingData]=useState(false),[profileError,setProfileError]=useState('');
 const configured=Boolean(supabase);

 useEffect(()=>{
  if(!configured){setSession(null);return;}
  let mounted=true;
  supabase.auth.getSession().then(({data,error})=>{
   if(!mounted)return;
   if(error){setError(error.message);setSession(null);return;}
   setSession(data.session||null);
  });
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
   if(mounted)setSession(nextSession||null);
  });
  return()=>{mounted=false;subscription.unsubscribe();};
 },[configured]);

 useEffect(()=>{
  if(session?.user&&configured)loadAll();
  if(session===null){setProfile(undefined);setProfileError('');}
 },[session?.user?.id,configured]);

 async function loadAll(){
  if(!supabase||!session?.user)return;
  setLoadingData(true);setProfileError('');
  try{
   const {data:p,error:pErr}=await supabase.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
   if(pErr)throw pErr;
   if(!p){
    setProfile(null);
    setProfileError('Sua conta existe no Authentication, mas não possui um perfil no sistema. Execute novamente o schema.sql no Supabase ou corrija o cadastro em public.profiles.');
    return;
   }
   setProfile(p);
   const q=await Promise.all([
    supabase.from('clients').select('*').order('created_at',{ascending:false}),supabase.from('vehicles').select('*').order('created_at',{ascending:false}),supabase.from('service_types').select('*').order('name'),supabase.from('vehicle_categories').select('*').order('name'),
    supabase.from('service_orders').select('*').order('created_at',{ascending:false}),supabase.from('service_images').select('*').order('created_at',{ascending:false}),supabase.from('audit_logs_view').select('*').order('created_at',{ascending:false}).limit(250),
    supabase.from('appointments').select('*').order('scheduled_at'),supabase.from('employees').select('*').order('name'),supabase.from('payment_methods').select('*').order('name'),supabase.from('payments').select('*').order('paid_at',{ascending:false}),
    supabase.from('cash_closings').select('*').order('closed_at',{ascending:false}),supabase.from('profiles').select('*').order('full_name')
   ]);
   const firstError=q.find(x=>x.error)?.error;if(firstError)throw firstError;
   setClients(q[0].data||[]);setVehicles(q[1].data||[]);setServices(q[2].data||[]);setVehicleCategories(q[3].data||[]);setOrders(q[4].data||[]);setImages(q[5].data||[]);setLogs(q[6].data||[]);
   setAppointments(q[7].data||[]);setEmployees(q[8].data||[]);setPaymentMethods(q[9].data||[]);setPayments(q[10].data||[]);setCashClosings(q[11].data||[]);setProfiles(q[12].data||[]);
  }catch(e){setProfileError(e.message||'Não foi possível carregar os dados do sistema.');}
  finally{setLoadingData(false);}
 }

 async function signIn(e){
  e.preventDefault();setError('');
  if(!supabase)return;
  if(!login.email.trim()||!login.password){setError('Informe e-mail e senha.');return;}
  const {error}=await supabase.auth.signInWithPassword({email:login.email.trim(),password:login.password});
  if(error)setError(error.message==='Invalid login credentials'?'E-mail ou senha inválidos.':error.message);
 }
 async function signOut(){if(supabase)await supabase.auth.signOut();setSession(null);setProfile(undefined);setTab('dashboard');}
 async function addLog(action,entity_type='',entity_id=null){if(!supabase||!session?.user)return;await supabase.from('audit_logs').insert({user_id:session.user.id,action,entity_type,entity_id});}
 async function insert(table,payload,setter,label){const {data,error}=await supabase.from(table).insert(payload).select().single();if(error){alert(error.message);return null}setter(x=>[data,...x]);await addLog(label,table,data.id);return data}
 async function update(table,id,payload,setter,label){const {data,error}=await supabase.from(table).update(payload).eq('id',id).select().single();if(error){alert(error.message);return false}setter(x=>x.map(r=>r.id===id?data:r));await addLog(label,table,id);return true}
 async function remove(table,id,setter,label){if(!confirm('Tem certeza que deseja excluir este registro? Esta ação não poderá ser desfeita.'))return false;const {error}=await supabase.from(table).delete().eq('id',id);if(error){alert(error.message);return false}setter(x=>x.filter(r=>r.id!==id));await addLog(label,table,id);return true}
 async function uploadImages(orderId,files){if(!files?.length)return;
  for(const file of files){const path=`${orderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const up=await supabase.storage.from('service-images').upload(path,file);if(up.error){alert(up.error.message);continue}const {data:{publicUrl}}=supabase.storage.from('service-images').getPublicUrl(path);const {data}=await supabase.from('service_images').insert({service_order_id:orderId,image_url:publicUrl,file_name:file.name}).select().single();if(data)setImages(x=>[data,...x])}
 }

 if(!configured)return <ConfigError/>;
 if(session===undefined)return <Splash message="Verificando sessão..."/>;
 if(!session)return <Login login={login} setLogin={setLogin} signIn={signIn} error={error}/>;
 if(profile===undefined&&loadingData)return <Splash message="Carregando seu perfil..."/>;
 if(profileError||profile===null)return <AccessError message={profileError} signOut={signOut} reload={loadAll}/>;
 if(!profile)return <Splash message="Carregando sistema..."/>;

 const role=profile.role,canSuperAdmin=role==='administrador',canAdmin=['administrador','gerente'].includes(role),canWrite=['administrador','gerente','administrativo'].includes(role),canDeleteHistory=role==='administrador';
 const common={clients,vehicles,services,vehicleCategories,orders,images,appointments,employees,paymentMethods,payments,cashClosings,profiles,canWrite,canAdmin,canSuperAdmin,canDeleteHistory,demo:false,profile,supabase,insert,update,remove,addLog,uploadImages,reload:loadAll};
 return <div className="app"><Sidebar tab={tab} setTab={setTab} role={role} signOut={signOut}/><main><header><div><h1>A Casa do Grau Máximo</h1><p>{profile.full_name||session.user.email} · <b>{role}</b></p></div></header>
  {tab==='dashboard'&&<Dashboard {...common}/>} {tab==='clientes'&&<Clients {...common} setClients={setClients}/>} {tab==='veiculos'&&<Vehicles {...common} setVehicles={setVehicles} setVehicleCategories={setVehicleCategories}/>} {tab==='servicos'&&canAdmin&&<Services {...common} setServices={setServices}/>} {tab==='historico'&&<History {...common} setOrders={setOrders} setPayments={setPayments}/>} {tab==='agendamentos'&&<Appointments {...common} setAppointments={setAppointments} setOrders={setOrders}/>} {tab==='equipe'&&canAdmin&&<Employees {...common} setEmployees={setEmployees}/>} {tab==='caixa'&&canAdmin&&<Cash {...common} setPayments={setPayments} setCashClosings={setCashClosings} setPaymentMethods={setPaymentMethods}/>} {tab==='relatorios'&&canAdmin&&<Reports {...common}/>} {tab==='usuarios'&&canAdmin&&<UsersPanel {...common} setProfiles={setProfiles}/>} {tab==='auditoria'&&canAdmin&&<Audit logs={logs}/>} 
 </main></div>
}

function Splash({message}){return <div className="login"><div className="splashCard"><div className="brand"><Car size={34}/><span>Garagem GRAU CAR 096</span></div><div className="spinner"/><p>{message}</p></div></div>}
function ConfigError(){return <div className="login"><div className="configCard"><div className="brand"><Car size={34}/><span>Garagem GRAU CAR 096</span></div><h2>Configuração do Supabase necessária</h2><p>O sistema não encontrou <b>VITE_SUPABASE_URL</b> e/ou <b>VITE_SUPABASE_ANON_KEY</b>.</p><p>Confira o arquivo <code>.env</code> na pasta principal do projeto e reinicie o comando <code>npm run dev</code>.</p><div className="error">Por segurança, o painel não abre sem autenticação.</div></div></div>}
function AccessError({message,signOut,reload}){return <div className="login"><div className="configCard"><div className="brand"><ShieldCheck size={34}/><span>Conta não liberada</span></div><h2>Não foi possível carregar seu perfil</h2><p>{message}</p><div className="inline"><button className="primary" onClick={reload}>Tentar novamente</button><button className="secondary" onClick={signOut}>Sair</button></div></div></div>}

function Login({login,setLogin,signIn,error}){return <div className="login"><form onSubmit={signIn}><div className="brand"><Car size={34}/><span>Garagem GRAU CAR 096</span></div><h2>Acesso ao sistema</h2><p className="loginIntro">Entre com seu usuário autorizado.</p><input type="email" autoComplete="username" required placeholder="E-mail" value={login.email} onChange={e=>setLogin({...login,email:e.target.value})}/><input type="password" autoComplete="current-password" required placeholder="Senha" value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/>{error&&<div className="error">{error}</div>}<button type="submit">Entrar</button><small>O acesso é obrigatório. Usuários e permissões são controlados pelo gerente.</small></form></div>}
function Sidebar({tab,setTab,role,signOut}){const all=[['dashboard',ClipboardList,'Dashboard'],['clientes',Users,'Clientes'],['veiculos',Car,'Veículos'],['servicos',Wrench,'Serviços'],['historico',ClipboardList,'Histórico'],['agendamentos',CalendarDays,'Agendamentos'],['equipe',UserRoundCog,'Equipe'],['caixa',Wallet,'Caixa'],['relatorios',FileDown,'Relatórios'],['usuarios',ShieldCheck,'Usuários'],['auditoria',ShieldCheck,'Auditoria']];const managerOnly=new Set(['servicos','equipe','caixa','relatorios','usuarios','auditoria']);const items=all.filter(([id])=>['administrador','gerente'].includes(role)||!managerOnly.has(id));return <aside><div className="logo">
  <img src={logoGraucar} alt="Grau Car Garagem" className="grauCarLogo" />
</div><nav>{items.map(([id,I,l])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}><I size={19}/>{l}</button>)}</nav><div className="asideBottom"><span>Perfil: {role}</span><button onClick={signOut}><LogOut size={18}/>Sair</button></div></aside>}

function Panel({title,action,children}){return <div className="panel"><div className="panelHead"><h3>{title}</h3>{action||null}</div>{children}</div>}
function Table({headers=[],children}){return <div className="tableWrap"><table><thead><tr>{headers.map((h,i)=><th key={`${h}-${i}`}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>}
function Actions({onView,onEdit,onDelete}){return <div className="actions">{onView&&<button type="button" title="Visualizar" onClick={onView}><Eye size={16}/></button>}{onEdit&&<button type="button" title="Editar" onClick={onEdit}><Edit3 size={16}/></button>}{onDelete&&<button type="button" className="danger" title="Excluir" onClick={onDelete}><Trash2 size={16}/></button>}</div>}
function Modal({title,onClose,children}){return <div className="modalBack" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}><div className="modal"><div className="modalHead"><h3>{title}</h3><button type="button" title="Fechar" onClick={onClose}><X size={18}/></button></div>{children}</div></div>}
function FormGrid({f,setF,fields=[]}){return <div className="formGrid">{fields.map(([key,placeholder,type='text'])=><input key={key} type={type} placeholder={placeholder} value={f?.[key]??''} onChange={e=>setF({...f,[key]:e.target.value})}/>)}</div>}

function Dashboard({clients,vehicles,services,orders,appointments,payments}){const today=new Date().toISOString().slice(0,10);const todayOrders=orders.filter(o=>String(o.created_at).slice(0,10)===today);const revenue=payments.reduce((s,p)=>s+Number(p.amount||0),0);return <section><div className="cards"><Card t="Clientes" v={clients.length}/><Card t="Veículos" v={vehicles.length}/><Card t="Agendamentos" v={appointments.filter(a=>a.status!=='concluido').length}/><Card t="Serviços hoje" v={todayOrders.length}/><Card t="Faturamento registrado" v={money(revenue)}/></div><Panel title="Próximos agendamentos"><Table headers={['Data/Hora','Cliente','Veículo','Serviço','Status']}>{appointments.filter(a=>a.status!=='concluido').slice(0,8).map(a=><tr key={a.id}><td>{dt(a.scheduled_at)}</td><td>{clients.find(c=>c.id===a.client_id)?.name||'-'}</td><td>{vehicles.find(v=>v.id===a.vehicle_id)?.plate||'-'}</td><td>{services.find(s=>s.id===a.service_id)?.name||'-'}</td><td><Status value={a.status}/></td></tr>)}</Table></Panel></section>}
function Card({t,v}){return <div className="card"><span>{t}</span><strong>{v}</strong></div>}
function Status({value}){return <span className={`status ${value}`}>{String(value||'-').replaceAll('_',' ')}</span>}

function Clients({clients,vehicles,orders,services,employees,canWrite,insert,update,remove,setClients}){const empty={name:'',phone:'',email:'',document:''};const [f,setF]=useState(empty),[edit,setEdit]=useState(null),[search,setSearch]=useState(''),[detail,setDetail]=useState(null);async function save(){if(!f.name)return alert('Informe o nome do cliente.');if(edit)await update('clients',edit,{...f},setClients,'Editou cliente');else await insert('clients',f,setClients,'Cadastrou cliente');setF(empty);setEdit(null)}const q=search.trim().toLowerCase();const filtered=clients.filter(c=>!q||[c.name,c.phone,c.email,c.document].some(x=>String(x||'').toLowerCase().includes(q)));const client=clients.find(c=>c.id===detail);const clientVehicles=vehicles.filter(v=>v.client_id===detail);const history=orders.filter(o=>clientVehicles.some(v=>v.id===o.vehicle_id)).sort((a,b)=>new Date(b.completed_at||b.created_at)-new Date(a.completed_at||a.created_at));return <section><Panel title="Clientes" action={canWrite&&<button className="primary" onClick={save}><Save size={17}/>{edit?'Salvar edição':'Cadastrar'}</button>}><FormGrid f={f} setF={setF} fields={[["name","Nome completo"],["phone","Telefone"],["email","E-mail"],["document","CPF/CNPJ"]]}/>{edit&&<button className="linkBtn" onClick={()=>{setEdit(null);setF(empty)}}>Cancelar edição</button>}<SearchBox value={search} onChange={setSearch} placeholder="Pesquisar cliente por nome, telefone, e-mail ou documento"/><Table headers={['Nome','Telefone','E-mail','Documento','Ações']}>{filtered.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.phone||'-'}</td><td>{r.email||'-'}</td><td>{r.document||'-'}</td><td><Actions onView={()=>setDetail(r.id)} onEdit={canWrite?()=>{setEdit(r.id);setF({name:r.name||'',phone:r.phone||'',email:r.email||'',document:r.document||''})}:null} onDelete={canWrite?()=>remove('clients',r.id,setClients,'Excluiu cliente'):null}/></td></tr>)}</Table></Panel>{client&&<Modal title={`Cliente: ${client.name}`} onClose={()=>setDetail(null)}><div className="detailGrid"><div><b>Telefone</b><span>{client.phone||'-'}</span></div><div><b>E-mail</b><span>{client.email||'-'}</span></div><div><b>Documento</b><span>{client.document||'-'}</span></div><div><b>Veículos</b><span>{clientVehicles.map(v=>v.plate).join(', ')||'-'}</span></div></div><h4>Histórico de serviços solicitados</h4>{history.length===0?<p className="hint">Nenhum serviço registrado para este cliente.</p>:<Table headers={['Data','Veículo','Serviço','Funcionário','Valor','Status']}>{history.map(o=>{const v=vehicles.find(x=>x.id===o.vehicle_id),sv=services.find(x=>x.id===o.service_id),e=employees.find(x=>x.id===o.employee_id);return <tr key={o.id}><td>{dt(o.completed_at||o.created_at)}</td><td>{v?.plate||'-'} · {v?.brand||''} {v?.model||''}</td><td>{sv?.name||'-'}</td><td>{e?.name||o.performed_by||'-'}</td><td>{money(o.charged_amount||finalPrice(sv))}</td><td><Status value={o.status}/></td></tr>})}</Table>}</Modal>}</section>}

function SearchBox({value,onChange,placeholder}){return <div className="searchBox"><Search size={18}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>{value&&<button type="button" onClick={()=>onChange('')}><X size={16}/></button>}</div>}

function Vehicles({vehicles,clients,orders,services,vehicleCategories,images,canWrite,canAdmin,insert,update,remove,setVehicles,setVehicleCategories}){
 const empty={client_id:'',category_id:'',plate:'',brand:'',model:'',color:'',year:''};
 const [f,setF]=useState(empty),[edit,setEdit]=useState(null),[detail,setDetail]=useState(null),[search,setSearch]=useState(''),[categoryName,setCategoryName]=useState('');

 async function save(){
  if(!f.client_id||!f.plate||!f.category_id)return alert('Informe cliente, placa e categoria do veículo.');
  if(edit)await update('vehicles',edit,f,setVehicles,'Editou veículo');
  else await insert('vehicles',f,setVehicles,'Cadastrou veículo');
  setF(empty);setEdit(null);
 }

 async function addCategory(){
  const name=categoryName.trim().toUpperCase();
  if(!name)return alert('Informe o nome da categoria.');
  if(vehicleCategories.some(c=>String(c.name).toLowerCase()===name.toLowerCase()))return alert('Essa categoria já está cadastrada.');
  const row=await insert('vehicle_categories',{name},setVehicleCategories,'Cadastrou categoria de veículo');
  if(row)setCategoryName('');
 }

 const q=search.trim().toLowerCase();
 const filtered=vehicles.filter(v=>{
  const c=clients.find(x=>x.id===v.client_id),cat=vehicleCategories.find(x=>x.id===v.category_id);
  return !q||[v.plate,v.brand,v.model,v.color,v.year,c?.name,cat?.name].some(x=>String(x||'').toLowerCase().includes(q));
 });
 const vehicle=vehicles.find(v=>v.id===detail);

 return <section>
  {canAdmin&&<Panel title="Categorias de veículos" action={<button className="primary" onClick={addCategory}><Plus size={17}/>Cadastrar categoria</button>}>
   <div className="categoryCreate"><input placeholder="Ex.: SUV, PICKUP, RET, SEDAN, MOTO..." value={categoryName} onChange={e=>setCategoryName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCategory()}}}/></div>
   {vehicleCategories.length===0?<p className="hint">Cadastre pelo menos uma categoria antes de cadastrar veículos e serviços.</p>:<div className="categoryChips">{vehicleCategories.map(cat=><span key={cat.id}>{cat.name}<button type="button" title="Excluir categoria" onClick={()=>remove('vehicle_categories',cat.id,setVehicleCategories,'Excluiu categoria de veículo')}><X size={14}/></button></span>)}</div>}
   <p className="hint">Uma categoria vinculada a veículos ou serviços não poderá ser excluída até que esses vínculos sejam alterados.</p>
  </Panel>}

  <Panel title="Veículos" action={canWrite&&<button className="primary" onClick={save}><Save size={17}/>{edit?'Salvar edição':'Cadastrar'}</button>}>
   <div className="formGrid">
    <select value={f.client_id} onChange={e=>setF({...f,client_id:e.target.value})}><option value="">Cliente</option>{clients.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select>
    <select value={f.category_id} onChange={e=>setF({...f,category_id:e.target.value})}><option value="">Categoria do veículo</option>{vehicleCategories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select>
    {['plate','brand','model','color','year'].map(k=><input key={k} placeholder={{plate:'Placa',brand:'Marca',model:'Modelo',color:'Cor',year:'Ano'}[k]} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>)}
   </div>
   {edit&&<button className="linkBtn" onClick={()=>{setEdit(null);setF(empty)}}>Cancelar edição</button>}
   <SearchBox value={search} onChange={setSearch} placeholder="Pesquisar por placa, marca, modelo, categoria, ano ou cliente"/>
   <Table headers={['Placa','Marca/Modelo','Categoria','Cor','Ano','Cliente','Ações']}>{filtered.map(r=><tr key={r.id}><td><b>{r.plate}</b></td><td>{r.brand} {r.model}</td><td><b>{vehicleCategories.find(c=>c.id===r.category_id)?.name||'Sem categoria'}</b></td><td>{r.color||'-'}</td><td>{r.year||'-'}</td><td>{clients.find(c=>c.id===r.client_id)?.name||'-'}</td><td><Actions onView={()=>setDetail(r.id)} onEdit={canWrite?()=>{setEdit(r.id);setF({client_id:r.client_id||'',category_id:r.category_id||'',plate:r.plate||'',brand:r.brand||'',model:r.model||'',color:r.color||'',year:r.year||''})}:null} onDelete={canWrite?()=>remove('vehicles',r.id,setVehicles,'Excluiu veículo'):null}/></td></tr>)}</Table>
  </Panel>
  {vehicle&&<VehicleDetail vehicle={vehicle} category={vehicleCategories.find(c=>c.id===vehicle.category_id)} client={clients.find(c=>c.id===vehicle.client_id)} orders={orders.filter(o=>o.vehicle_id===vehicle.id)} services={services} images={images} onClose={()=>setDetail(null)}/>}
 </section>
}
function VehicleDetail({vehicle,category,client,orders,services,images,onClose}){return <Modal title={`Veículo ${vehicle.plate}`} onClose={onClose}><div className="detailGrid"><div><b>Cliente</b><span>{client?.name||'-'}</span></div><div><b>Veículo</b><span>{vehicle.brand} {vehicle.model}</span></div><div><b>Categoria</b><span>{category?.name||'Sem categoria'}</span></div><div><b>Cor/Ano</b><span>{vehicle.color||'-'} · {vehicle.year||'-'}</span></div></div><h4>Histórico de serviços</h4>{orders.length===0?<p className="hint">Nenhum serviço registrado.</p>:orders.map(o=>{const pics=images.filter(i=>i.service_order_id===o.id);return <div className="serviceDetail" key={o.id}><div><b>{services.find(s=>s.id===o.service_id)?.name||'Serviço'}</b><span>{dt(o.completed_at||o.created_at)} · {o.performed_by||'-'}</span><p>{o.notes||'Sem observações.'}</p></div>{pics.length>0&&<div className="gallery">{pics.map(i=><a key={i.id} href={i.image_url} target="_blank"><img src={i.image_url}/></a>)}</div>}</div>})}</Modal>}

function Services({services,vehicleCategories,canAdmin,insert,update,remove,setServices}){
 const empty={name:'',category_id:'',price:'',discount_percent:'0',description:''};
 const [f,setF]=useState(empty),[edit,setEdit]=useState(null);

 async function save(){
  if(!f.name||!f.category_id||f.price==='')return alert('Informe nome, categoria do veículo e preço.');
  const p={...f,price:Number(f.price),discount_percent:Number(f.discount_percent||0)};
  if(edit)await update('service_types',edit,p,setServices,'Editou tipo de serviço');
  else await insert('service_types',p,setServices,'Cadastrou tipo de serviço');
  setF(empty);setEdit(null);
 }

 return <section><Panel title="Tipos de serviços" action={canAdmin&&<button className="primary" onClick={save}><Save size={17}/>{edit?'Salvar edição':'Cadastrar'}</button>}>
  <div className="formGrid">
   <input placeholder="Nome do serviço" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
   <select value={f.category_id} onChange={e=>setF({...f,category_id:e.target.value})}><option value="">Categoria do veículo</option>{vehicleCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
   <input type="number" min="0" step="0.01" placeholder="Preço (R$)" value={f.price} onChange={e=>setF({...f,price:e.target.value})}/>
   <input type="number" min="0" max="100" step="1" placeholder="Desconto (%)" value={f.discount_percent} onChange={e=>setF({...f,discount_percent:e.target.value})}/>
   <input placeholder="Descrição" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
  </div>
  {edit&&<button className="linkBtn" onClick={()=>{setEdit(null);setF(empty)}}>Cancelar edição</button>}
  {vehicleCategories.length===0&&<p className="hint">Cadastre primeiro uma categoria na aba Veículos.</p>}
  <Table headers={['Serviço','Categoria','Preço','Desconto','Preço final','Ações']}>{services.map(r=><tr key={r.id}><td>{r.name}</td><td><b>{vehicleCategories.find(c=>c.id===r.category_id)?.name||'Sem categoria'}</b></td><td>{money(r.price)}</td><td>{r.discount_percent||0}%</td><td><b>{money(finalPrice(r))}</b></td><td>{canAdmin&&<Actions onEdit={()=>{setEdit(r.id);setF({name:r.name||'',category_id:r.category_id||'',price:r.price||'',discount_percent:r.discount_percent||0,description:r.description||''})}} onDelete={()=>remove('service_types',r.id,setServices,'Excluiu tipo de serviço')}/>}</td></tr>)}</Table>
 </Panel></section>
}

function History({orders,vehicles,services,vehicleCategories,clients,employees,paymentMethods,images,canWrite,canDeleteHistory,profile,insert,update,remove,uploadImages,setOrders,setPayments}){
  const empty={vehicle_id:'',service_id:'',service_ids:[],employee_id:'',notes:'',status:'concluido',discount_percent:'',charged_amount:'',payment_method_id:'',files:null};
  const [f,setF]=useState(empty),[search,setSearch]=useState(''),[dateFilter,setDateFilter]=useState(''),[formKey,setFormKey]=useState(0);
  const selectedVehicle=vehicles.find(v=>v.id===f.vehicle_id);
  const availableServices=selectedVehicle?.category_id?services.filter(s=>s.category_id===selectedVehicle.category_id):[];

  function clearForm(){setF({...empty});setFormKey(k=>k+1)}

  async function notifyCompletion(rows,total){
    if(!rows?.length)return;
    const first=rows[0],v=vehicles.find(x=>x.id===first.vehicle_id),c=clients.find(x=>x.id===v?.client_id);
    if(!c?.email)return;
    const doneServices=rows.map(r=>({name:services.find(s=>s.id===r.service_id)?.name||'Serviço',price:Number(r.charged_amount||0)}));
    try{
      const {data,error}=await supabase.functions.invoke('service-completed-notification',{body:{clientName:c.name,clientEmail:c.email,clientPhone:safePhone(c.phone),vehicle:`${v?.brand||''} ${v?.model||''} - ${v?.plate||''}`,services:doneServices,total:Number(total||0)}});
      if(error)console.warn('Erro ao enviar e-mail:',error.message);
      else if(data?.error)console.warn('Erro ao enviar e-mail:',data.error);
      else console.log('E-mail de conclusão enviado com sucesso.');
    }catch(e){console.warn('Notificação automática não configurada:',e.message)}
  }

  async function save(){
    if(!f.vehicle_id||!f.service_ids?.length)return alert('Selecione o veículo e pelo menos um serviço.');
    const atendimentoId=crypto.randomUUID();
    const selectedServices=services.filter(s=>f.service_ids.includes(s.id));
    const subtotal=selectedServices.reduce((total,s)=>total+Number(finalPrice(s)||0),0);
    const total=Number(f.charged_amount!==''?f.charged_amount:subtotal);
    const ratio=subtotal>0?total/subtotal:1;
    const rows=[];
    for(const sv of selectedServices){
      const serviceAmount=Number((Number(finalPrice(sv)||0)*ratio).toFixed(2));
      const row=await insert('service_orders',{vehicle_id:f.vehicle_id,service_id:sv.id,atendimento_id:atendimentoId,employee_id:f.employee_id||null,performed_by:profile?.full_name,status:f.status,notes:f.notes,charged_amount:serviceAmount,completed_at:f.status==='concluido'?new Date().toISOString():null},setOrders,'Registrou serviço');
      if(row)rows.push(row);
    }
    if(!rows.length)return;
    if(f.payment_method_id&&f.status==='concluido')await insert('payments',{service_order_id:rows[0].id,payment_method_id:f.payment_method_id,amount:total,paid_at:new Date().toISOString()},setPayments,'Registrou pagamento');
    for(const serviceRow of rows)await uploadImages(serviceRow.id,f.files);
    if(f.status==='concluido')await notifyCompletion(rows,total);
    clearForm();
  }

  function whatsapp(group){
    const first=group.rows[0],v=vehicles.find(x=>x.id===first.vehicle_id),c=clients.find(x=>x.id===v?.client_id),phone=safePhone(c?.phone);
    if(!phone)return alert('Cliente sem telefone cadastrado.');
    const names=group.rows.map(o=>services.find(s=>s.id===o.service_id)?.name).filter(Boolean).join(', ');
    const msg=encodeURIComponent(`Olá, ${c?.name||''}! Seu veículo ${v?.brand||''} ${v?.model||''} (${v?.plate||''}) concluiu ${group.rows.length>1?'os serviços':'o serviço'}: ${names}. Já pode ser retirado. Obrigado!`);
    window.open(`https://wa.me/55${phone}?text=${msg}`,'_blank');
  }

  async function changeHistoryStatus(group,newStatus){
    const currentStatuses=[...new Set(group.rows.map(o=>o.status))];
    const alreadyCompleted=currentStatuses.every(status=>status==='concluido');

    if(alreadyCompleted){
      alert('Este serviço já foi concluído e não pode ter o status alterado.');
      return;
    }

    if(!currentStatuses.every(status=>status==='em_andamento')){
      alert('Somente serviços que estão Em andamento podem ser alterados para Concluído.');
      return;
    }

    if(newStatus!=='concluido')return;

    const confirmed=confirm('Confirmar alteração do status de Em andamento para Concluído? Após concluir, o status não poderá mais ser alterado e as notificações serão enviadas ao cliente.');
    if(!confirmed)return;

    const completedAt=new Date().toISOString();
    const updatedRows=[];
    for(const row of group.rows){
      const ok=await update('service_orders',row.id,{status:'concluido',completed_at:row.completed_at||completedAt},setOrders,'Concluiu serviço pelo histórico');
      if(!ok)return;
      updatedRows.push({...row,status:'concluido',completed_at:row.completed_at||completedAt});
    }

    const total=updatedRows.reduce((sum,o)=>sum+Number(o.charged_amount||0),0);
    await notifyCompletion(updatedRows,total);
  }

  async function deleteHistoryGroup(group){
    if(!canDeleteHistory)return;
    if(!confirm('Tem certeza que deseja excluir este serviço do histórico? Esta ação não poderá ser desfeita.'))return;
    const ids=group.rows.map(r=>r.id);
    const {error:imgError}=await supabase.from('service_images').delete().in('service_order_id',ids);
    if(imgError){alert(imgError.message);return;}
    const {error:payError}=await supabase.from('payments').delete().in('service_order_id',ids);
    if(payError){alert(payError.message);return;}
    const {error}=await supabase.from('service_orders').delete().in('id',ids);
    if(error){alert(error.message);return;}
    const idSet=new Set(ids);
    setOrders(current=>current.filter(r=>!idSet.has(r.id)));
    setPayments(current=>current.filter(r=>!idSet.has(r.service_order_id)));
  }

  const historyGroups=Object.values(orders.reduce((acc,o)=>{
    const key=o.atendimento_id||o.id;
    if(!acc[key])acc[key]={key,rows:[],created_at:o.completed_at||o.created_at};
    acc[key].rows.push(o);
    const d=o.completed_at||o.created_at;if(new Date(d)>new Date(acc[key].created_at))acc[key].created_at=d;
    return acc;
  },{})).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  const q=search.trim().toLowerCase();
  const filteredHistory=historyGroups.filter(g=>{
    const first=g.rows[0],v=vehicles.find(x=>x.id===first.vehicle_id),c=clients.find(x=>x.id===v?.client_id);
    const serviceNames=g.rows.map(o=>services.find(s=>s.id===o.service_id)?.name||'').join(' ');
    const employeeNames=g.rows.map(o=>employees.find(e=>e.id===o.employee_id)?.name||o.performed_by||'').join(' ');
    const haystack=`${c?.name||''} ${v?.plate||''} ${v?.brand||''} ${v?.model||''} ${serviceNames} ${employeeNames}`.toLowerCase();
    const filterIso=brDateToIso(dateFilter);return (!q||haystack.includes(q))&&(!dateFilter||!filterIso||String(g.created_at).slice(0,10)===filterIso);
  });

  return <section>
    <Panel title="Registrar serviço realizado" action={canWrite&&<button className="primary" onClick={save}><Plus size={17}/>Registrar</button>}>
      <div className="formGrid">
        <select value={f.vehicle_id} onChange={e=>setF({...f,vehicle_id:e.target.value,service_id:'',service_ids:[],discount_percent:'',charged_amount:''})}><option value="">Veículo</option>{vehicles.map(v=>{const cat=vehicleCategories.find(c=>c.id===v.category_id);return <option key={v.id} value={v.id}>{v.plate} · {v.brand} {v.model}{cat?` · ${cat.name}`:' · SEM CATEGORIA'}</option>})}</select>
        <div className="multi-services" key={formKey}><details className="services-dropdown"><summary>{f.service_ids.length?`${f.service_ids.length} serviço(s) selecionado(s)`:'Tipos de serviço'}</summary><div className="services-dropdown-list">{availableServices.map(s=>{const selected=f.service_ids.includes(s.id);return <label key={s.id} className="service-check"><input type="checkbox" checked={selected} onChange={e=>{const ids=e.target.checked?[...f.service_ids,s.id]:f.service_ids.filter(id=>id!==s.id);const subtotal=ids.reduce((sum,id)=>sum+Number(finalPrice(services.find(x=>x.id===id))||0),0);setF({...f,service_ids:ids,service_id:ids[0]||'',discount_percent:'',charged_amount:Number(subtotal.toFixed(2))})}}/><span>{s.name} - {money(finalPrice(s))}</span></label>})}</div></details></div>
        {f.vehicle_id&&!selectedVehicle?.category_id&&<div className="fieldHint">Este veículo ainda não possui categoria.</div>}
        {f.vehicle_id&&selectedVehicle?.category_id&&availableServices.length===0&&<div className="fieldHint">Nenhum serviço cadastrado para {vehicleCategories.find(c=>c.id===selectedVehicle.category_id)?.name||'esta categoria'}.</div>}
        <select value={f.employee_id} onChange={e=>setF({...f,employee_id:e.target.value})}><option value="">Funcionário responsável</option>{employees.filter(e=>e.active!==false).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>
        <select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option value="em_andamento">Em andamento</option><option value="concluido">Concluído</option></select>
        <input type="number" min="0" max="100" step="1" placeholder="Desconto (%)" value={f.discount_percent} onChange={e=>{const desconto=Math.min(100,Math.max(0,Number(e.target.value)||0));const subtotal=f.service_ids.reduce((sum,id)=>sum+Number(finalPrice(services.find(s=>s.id===id))||0),0);setF({...f,discount_percent:e.target.value,charged_amount:Number((subtotal*(1-desconto/100)).toFixed(2))})}}/>
        <input type="number" min="0" step="0.01" placeholder="Valor cobrado" value={f.charged_amount} onChange={e=>setF({...f,charged_amount:e.target.value})}/>
        <select value={f.payment_method_id} onChange={e=>setF({...f,payment_method_id:e.target.value})}><option value="">Forma de pagamento</option>{paymentMethods.filter(p=>p.active!==false).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input placeholder="Observações" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
        <input key={`files-${formKey}`} type="file" multiple accept="image/*" onChange={e=>setF({...f,files:e.target.files})}/>
      </div>
    </Panel>

    <Panel title="Pesquisar histórico de serviços">
      <div className="filterGrid historyFilters"><SearchBox value={search} onChange={setSearch} placeholder="Cliente, placa, veículo, serviço ou funcionário"/><input className="historyDateFilter" type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={dateFilter} onChange={e=>setDateFilter(maskDateBR(e.target.value))}/><button className="secondary historyClearBtn" onClick={()=>{setSearch('');setDateFilter('')}}><X size={16}/>Limpar</button></div>
    </Panel>

    <Panel title="Histórico de serviços realizados">
      {filteredHistory.length===0?<p className="hint">Nenhum serviço encontrado.</p>:<Table headers={['Data/Hora','Cliente','Veículo','Serviços','Funcionário','Valor','Status','Ações']}>{filteredHistory.map(g=>{const first=g.rows[0],v=vehicles.find(x=>x.id===first.vehicle_id),c=clients.find(x=>x.id===v?.client_id),total=g.rows.reduce((sum,o)=>sum+Number(o.charged_amount||0),0),employeeNames=[...new Set(g.rows.map(o=>employees.find(e=>e.id===o.employee_id)?.name||o.performed_by||'-'))].join(', '),statuses=[...new Set(g.rows.map(o=>o.status))];return <tr key={g.key}><td>{dt(g.created_at)}</td><td>{c?.name||'-'}</td><td>{v?.plate||'-'} · {v?.brand||''} {v?.model||''}</td><td><div className="serviceTags">{g.rows.map(o=><span key={o.id}>{services.find(s=>s.id===o.service_id)?.name||'-'}</span>)}</div></td><td>{employeeNames}</td><td><b>{money(total)}</b></td><td>{canWrite&&statuses.length===1&&statuses[0]==='em_andamento'?<select value="em_andamento" onChange={e=>changeHistoryStatus(g,e.target.value)}><option value="em_andamento">Em andamento</option><option value="concluido">Concluído</option></select>:statuses.map(st=><Status key={st} value={st}/>)}</td><td><div className="actions">{g.rows.some(o=>o.status==='concluido')&&<button type="button" className="secondary" title="Enviar WhatsApp" onClick={()=>whatsapp(g)}><MessageCircle size={16}/></button>}{canDeleteHistory&&<button type="button" className="danger" title="Excluir do histórico" onClick={()=>deleteHistoryGroup(g)}><Trash2 size={16}/></button>}</div></td></tr>})}</Table>}
    </Panel>
  </section>
}

function Appointments({appointments,clients,vehicles,services,vehicleCategories,canWrite,profile,insert,setAppointments,setOrders}){
  const empty={client_id:'',vehicle_id:'',service_ids:[],scheduled_at:'',scheduled_date:'',scheduled_time:'',notes:'',status:'agendado'};
  const [f,setF]=useState(empty),[edit,setEdit]=useState(null),[filters,setFilters]=useState({date:'',client:'',vehicle:'',service:''}),[formKey,setFormKey]=useState(0);
  const available=vehicles.filter(v=>!f.client_id||v.client_id===f.client_id);
  const selectedVehicle=vehicles.find(v=>v.id===f.vehicle_id);
  const availableServices=selectedVehicle?.category_id?services.filter(s=>s.category_id===selectedVehicle.category_id):[];

  async function notifyAppointmentCompletion(serviceIds,total){
    const v=vehicles.find(x=>x.id===f.vehicle_id),c=clients.find(x=>x.id===f.client_id);
    if(!c?.email)return;
    const doneServices=serviceIds.map(id=>{const s=services.find(x=>x.id===id);return {name:s?.name||'Serviço',price:Number(finalPrice(s)||0)}});
    try{
      const {data,error}=await supabase.functions.invoke('service-completed-notification',{body:{clientName:c.name,clientEmail:c.email,clientPhone:safePhone(c.phone),vehicle:`${v?.brand||''} ${v?.model||''} - ${v?.plate||''}`,services:doneServices,total:Number(total||0)}});
      if(error)console.warn('Erro ao enviar e-mail do agendamento:',error.message);
      else if(data?.error)console.warn('Erro ao enviar e-mail do agendamento:',data.error);
      else console.log('E-mail do agendamento concluído enviado com sucesso.');
    }catch(e){console.warn('Notificação automática do agendamento não configurada:',e.message)}
  }

  async function moveCompletedAppointmentToHistory(serviceIds){
    const atendimentoId=crypto.randomUUID();
    const rows=[];
    for(const service_id of serviceIds){
      const service=services.find(s=>s.id===service_id);
      const row=await insert('service_orders',{vehicle_id:f.vehicle_id,service_id,atendimento_id:atendimentoId,employee_id:null,performed_by:profile?.full_name,status:'concluido',notes:f.notes,charged_amount:Number(finalPrice(service)||0),completed_at:new Date().toISOString()},setOrders,'Concluiu agendamento e enviou ao histórico');
      if(row)rows.push(row);
    }
    return rows;
  }

  async function save(){
    if(!f.client_id||!f.vehicle_id||!f.service_ids.length||!f.scheduled_date||!f.scheduled_time)return alert('Preencha cliente, veículo, pelo menos um serviço, data e hora.');
    if(!/^\d{2}\/\d{2}\/\d{4}$/.test(f.scheduled_date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.scheduled_time))return alert('Use data DD/MM/AAAA e hora HH:MM.');
    const [dia,mes,ano]=f.scheduled_date.split('/');
    const localDate=new Date(Number(ano),Number(mes)-1,Number(dia),Number(f.scheduled_time.slice(0,2)),Number(f.scheduled_time.slice(3,5)));
    if(Number.isNaN(localDate.getTime())||localDate.getDate()!==Number(dia)||localDate.getMonth()!==Number(mes)-1||localDate.getFullYear()!==Number(ano))return alert('Data ou horário inválido.');
    const when=localDate.toISOString();
    if(f.status==='concluido'&&!confirm('Confirmar este agendamento como Concluído? Ele sairá da agenda, será enviado ao Histórico e as notificações serão disparadas ao cliente.'))return;
    let shouldNotify=f.status==='concluido';
    if(edit){
      const ids=String(edit).split('|');
      const oldRows=appointments.filter(a=>ids.includes(String(a.id)));
      if(oldRows.some(a=>a.status==='concluido'))shouldNotify=false;
      for(const id of ids)if(!await removeAppointmentNoConfirm(id))return;
    }
    for(const service_id of f.service_ids){const row=await insert('appointments',{client_id:f.client_id,vehicle_id:f.vehicle_id,service_id,scheduled_at:when,notes:f.notes,status:f.status},setAppointments,edit?'Editou agendamento':'Criou agendamento');if(!row)return}
    if(shouldNotify){
      const historyRows=await moveCompletedAppointmentToHistory(f.service_ids);
      if(historyRows.length){const total=historyRows.reduce((sum,r)=>sum+Number(r.charged_amount||0),0);await notifyAppointmentCompletion(f.service_ids,total)}
    }
    setF({...empty});setEdit(null);setFormKey(k=>k+1);
  }

  async function removeAppointmentNoConfirm(id){const {error}=await supabase.from('appointments').delete().eq('id',id);if(error){alert(error.message);return false}setAppointments(x=>x.filter(r=>r.id!==id));return true}
  const groups=Object.values(appointments.filter(a=>a.status!=='concluido').reduce((acc,a)=>{const key=[a.client_id,a.vehicle_id,a.scheduled_at,a.notes||'',a.status].join('|');if(!acc[key])acc[key]={...a,ids:[],service_ids:[]};acc[key].ids.push(a.id);acc[key].service_ids.push(a.service_id);return acc},{}));
  const filtered=groups.filter(a=>{const c=clients.find(x=>x.id===a.client_id),v=vehicles.find(x=>x.id===a.vehicle_id),serviceNames=a.service_ids.map(id=>services.find(s=>s.id===id)?.name||'').join(' ');const filterIso=brDateToIso(filters.date);return (!filters.date||!filterIso||String(a.scheduled_at).slice(0,10)===filterIso)&&(!filters.client||String(c?.name||'').toLowerCase().includes(filters.client.toLowerCase()))&&(!filters.vehicle||`${v?.plate||''} ${v?.brand||''} ${v?.model||''}`.toLowerCase().includes(filters.vehicle.toLowerCase()))&&(!filters.service||serviceNames.toLowerCase().includes(filters.service.toLowerCase()))});
  async function deleteGroup(a){if(!confirm('Tem certeza que deseja excluir este agendamento?'))return;for(const id of a.ids)await removeAppointmentNoConfirm(id)}
  function editGroup(a){const d=new Date(a.scheduled_at);setEdit(a.ids.join('|'));setF({client_id:a.client_id,vehicle_id:a.vehicle_id,service_ids:[...a.service_ids],scheduled_at:a.scheduled_at,scheduled_date:d.toLocaleDateString('pt-BR'),scheduled_time:d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false}),notes:a.notes||'',status:a.status});setFormKey(k=>k+1)}

  return <section>
    <Panel title="Agendamento de lavagens" action={canWrite&&<button className="primary" onClick={save}><CalendarDays size={17}/>{edit?'Salvar':'Agendar'}</button>}>
      <div className="formGrid"><select value={f.client_id} onChange={e=>setF({...f,client_id:e.target.value,vehicle_id:'',service_ids:[]})}><option value="">Cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={f.vehicle_id} onChange={e=>setF({...f,vehicle_id:e.target.value,service_ids:[]})}><option value="">Veículo</option>{available.map(v=>{const cat=vehicleCategories.find(c=>c.id===v.category_id);return <option key={v.id} value={v.id}>{v.plate} · {v.brand} {v.model}{cat?` · ${cat.name}`:' · SEM CATEGORIA'}</option>})}</select><div className="multi-services" key={formKey}><details className="services-dropdown"><summary>{f.service_ids.length?`${f.service_ids.length} serviço(s) selecionado(s)`:'Serviços'}</summary><div className="services-dropdown-list">{availableServices.map(s=><label key={s.id} className="service-check"><input type="checkbox" checked={f.service_ids.includes(s.id)} onChange={e=>setF({...f,service_ids:e.target.checked?[...f.service_ids,s.id]:f.service_ids.filter(id=>id!==s.id)})}/><span>{s.name} - {money(finalPrice(s))}</span></label>)}</div></details></div><div className="appointment-datetime"><input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={f.scheduled_date} onChange={e=>{let v=e.target.value.replace(/\D/g,'').slice(0,8);if(v.length>4)v=v.slice(0,2)+'/'+v.slice(2,4)+'/'+v.slice(4);else if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);setF({...f,scheduled_date:v})}}/><input type="text" inputMode="numeric" placeholder="HH:MM" maxLength={5} value={f.scheduled_time} onChange={e=>{let v=e.target.value.replace(/\D/g,'').slice(0,4);if(v.length>2)v=v.slice(0,2)+':'+v.slice(2);setF({...f,scheduled_time:v})}} onBlur={e=>{if(e.target.value&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.target.value)){alert('Informe um horário válido no formato 24 horas. Exemplo: 15:30');setF({...f,scheduled_time:''})}}}/></div><select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option value="agendado">Agendado</option><option value="confirmado">Confirmado</option><option value="em_atendimento">Em atendimento</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select><input placeholder="Observações" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></div>
      {edit&&<button className="linkBtn" onClick={()=>{setEdit(null);setF({...empty});setFormKey(k=>k+1)}}>Cancelar edição</button>}
    </Panel>
    <Panel title="Pesquisar agenda"><div className="filterGrid"><input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={filters.date} onChange={e=>setFilters({...filters,date:maskDateBR(e.target.value)})}/><input placeholder="Cliente" value={filters.client} onChange={e=>setFilters({...filters,client:e.target.value})}/><input placeholder="Veículo / placa" value={filters.vehicle} onChange={e=>setFilters({...filters,vehicle:e.target.value})}/><input placeholder="Serviço" value={filters.service} onChange={e=>setFilters({...filters,service:e.target.value})}/><button className="secondary" onClick={()=>setFilters({date:'',client:'',vehicle:'',service:''})}><X size={16}/>Limpar</button></div></Panel>
    <Panel title="Agenda"><Table headers={['Data/Hora','Cliente','Veículo','Serviços','Status','Observação','Ações']}>{filtered.map(a=>{const v=vehicles.find(x=>x.id===a.vehicle_id);return <tr key={a.ids.join('-')}><td>{dt(a.scheduled_at)}</td><td>{clients.find(c=>c.id===a.client_id)?.name||'-'}</td><td>{v?.plate||'-'}</td><td><div className="serviceTags">{a.service_ids.map(id=><span key={id}>{services.find(s=>s.id===id)?.name||'-'}</span>)}</div></td><td><Status value={a.status}/></td><td>{a.notes||'-'}</td><td>{canWrite&&<Actions onEdit={()=>editGroup(a)} onDelete={()=>deleteGroup(a)}/>}</td></tr>})}</Table></Panel>
  </section>
}

function Employees({employees,orders,vehicles,clients,services,canAdmin,insert,update,remove,setEmployees}){const empty={name:'',phone:'',position:'',commission_percent:'0',active:true};const [f,setF]=useState(empty),[edit,setEdit]=useState(null),[search,setSearch]=useState(''),[detail,setDetail]=useState(null);async function save(){if(!f.name)return alert('Informe o nome.');const p={...f,commission_percent:Number(f.commission_percent||0)};if(edit)await update('employees',edit,p,setEmployees,'Editou funcionário');else await insert('employees',p,setEmployees,'Cadastrou funcionário');setF(empty);setEdit(null)}const q=search.trim().toLowerCase();const filtered=employees.filter(e=>!q||[e.name,e.phone,e.position].some(x=>String(x||'').toLowerCase().includes(q)));const employee=employees.find(e=>e.id===detail);const history=orders.filter(o=>o.employee_id===detail).sort((a,b)=>new Date(b.completed_at||b.created_at)-new Date(a.completed_at||a.created_at));return <section><Panel title="Equipe e comissões" action={canAdmin&&<button className="primary" onClick={save}><Save size={17}/>{edit?'Salvar':'Cadastrar'}</button>}><div className="formGrid"><input placeholder="Nome" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input placeholder="Telefone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/><input placeholder="Função" value={f.position} onChange={e=>setF({...f,position:e.target.value})}/><input type="number" placeholder="Comissão (%)" value={f.commission_percent} onChange={e=>setF({...f,commission_percent:e.target.value})}/></div><SearchBox value={search} onChange={setSearch} placeholder="Pesquisar funcionário por nome, função ou telefone"/><Table headers={['Nome','Função','Telefone','Comissão','Total gerado','Comissão estimada','Ações']}>{filtered.map(e=>{const eo=orders.filter(o=>o.employee_id===e.id&&o.status==='concluido'),total=eo.reduce((s,o)=>s+Number(o.charged_amount||0),0);return <tr key={e.id}><td>{e.name}</td><td>{e.position||'-'}</td><td>{e.phone||'-'}</td><td>{e.commission_percent||0}%</td><td>{money(total)}</td><td><b>{money(total*Number(e.commission_percent||0)/100)}</b></td><td><Actions onView={()=>setDetail(e.id)} onEdit={canAdmin?()=>{setEdit(e.id);setF({name:e.name||'',phone:e.phone||'',position:e.position||'',commission_percent:e.commission_percent||0,active:e.active!==false})}:null} onDelete={canAdmin?()=>remove('employees',e.id,setEmployees,'Excluiu funcionário'):null}/></td></tr>})}</Table></Panel>{employee&&<Modal title={`Funcionário: ${employee.name}`} onClose={()=>setDetail(null)}><div className="detailGrid"><div><b>Função</b><span>{employee.position||'-'}</span></div><div><b>Telefone</b><span>{employee.phone||'-'}</span></div><div><b>Comissão</b><span>{employee.commission_percent||0}%</span></div><div><b>Serviços realizados</b><span>{history.length}</span></div></div><h4>Histórico de serviços realizados</h4>{history.length===0?<p className="hint">Nenhum serviço registrado.</p>:<Table headers={['Data','Cliente','Veículo','Serviço','Valor','Status']}>{history.map(o=>{const v=vehicles.find(x=>x.id===o.vehicle_id),c=clients.find(x=>x.id===v?.client_id),sv=services.find(x=>x.id===o.service_id);return <tr key={o.id}><td>{dt(o.completed_at||o.created_at)}</td><td>{c?.name||'-'}</td><td>{v?.plate||'-'}</td><td>{sv?.name||'-'}</td><td>{money(o.charged_amount||finalPrice(sv))}</td><td><Status value={o.status}/></td></tr>})}</Table>}</Modal>}</section>}

function Cash({payments,paymentMethods,orders,cashClosings,canAdmin,insert,remove,setCashClosings,setPaymentMethods}){const [day,setDay]=useState(new Date().toISOString().slice(0,10)),[methodName,setMethodName]=useState('');const daily=payments.filter(p=>String(p.paid_at).slice(0,10)===day);const total=daily.reduce((s,p)=>s+Number(p.amount||0),0);const byMethod=paymentMethods.map(m=>({name:m.name,total:daily.filter(p=>p.payment_method_id===m.id).reduce((s,p)=>s+Number(p.amount||0),0)})).filter(x=>x.total>0);async function close(){if(!canAdmin)return;const existing=cashClosings.find(c=>c.closing_date===day);if(existing)return alert('Esse dia já possui fechamento registrado.');await insert('cash_closings',{closing_date:day,total_amount:total,details:byMethod,closed_at:new Date().toISOString()},setCashClosings,'Realizou fechamento de caixa')}
 async function addMethod(){if(!methodName.trim())return;await insert('payment_methods',{name:methodName.trim(),active:true},setPaymentMethods,'Cadastrou forma de pagamento');setMethodName('')}
 return <section>{canAdmin&&<Panel title="Formas de pagamento" action={<button className="primary" onClick={addMethod}><Plus size={17}/>Adicionar</button>}><div className="formGrid two"><input placeholder="Ex.: PIX, Dinheiro, Cartão" value={methodName} onChange={e=>setMethodName(e.target.value)}/></div><div className="methodChips">{paymentMethods.map(m=><span key={m.id}>{m.name}<button onClick={()=>remove('payment_methods',m.id,setPaymentMethods,'Excluiu forma de pagamento')}><X size={14}/></button></span>)}</div></Panel>}<Panel title="Fechamento de caixa" action={<div className="inline"><input className="dateInput" type="date" value={day} onChange={e=>setDay(e.target.value)}/>{canAdmin&&<button className="primary" onClick={close}><Wallet size={17}/>Fechar caixa</button>}</div>}><div className="cashSummary"><div><span>Total do dia</span><strong>{money(total)}</strong></div>{byMethod.map(x=><div key={x.name}><span>{x.name}</span><strong>{money(x.total)}</strong></div>)}</div><Table headers={['Data/Hora','Forma','Valor','Ordem']}>{daily.map(p=><tr key={p.id}><td>{dt(p.paid_at)}</td><td>{paymentMethods.find(m=>m.id===p.payment_method_id)?.name||'-'}</td><td>{money(p.amount)}</td><td>{orders.find(o=>o.id===p.service_order_id)?.id?.slice(0,8)||'-'}</td></tr>)}</Table></Panel><Panel title="Fechamentos anteriores"><Table headers={['Data','Fechado em','Total']}>{cashClosings.map(c=><tr key={c.id}><td>{dateOnly(c.closing_date)}</td><td>{dt(c.closed_at)}</td><td><b>{money(c.total_amount)}</b></td></tr>)}</Table></Panel></section>}

function Reports({clients,vehicles,services,orders,employees,payments,paymentMethods}){const [from,setFrom]=useState(''),[to,setTo]=useState('');const filtered=orders.filter(o=>(!from||String(o.created_at).slice(0,10)>=from)&&(!to||String(o.created_at).slice(0,10)<=to));const rows=filtered.map(o=>{const v=vehicles.find(v=>v.id===o.vehicle_id),c=clients.find(c=>c.id===v?.client_id),s=services.find(s=>s.id===o.service_id),e=employees.find(e=>e.id===o.employee_id);return {Data:dt(o.completed_at||o.created_at),Cliente:c?.name||'',Placa:v?.plate||'',Veiculo:`${v?.brand||''} ${v?.model||''}`.trim(),Servico:s?.name||'',Funcionario:e?.name||o.performed_by||'',Valor:Number(o.charged_amount||finalPrice(s)),Status:o.status||''}});function pdf(){const doc=new jsPDF({orientation:'landscape'});doc.setFontSize(18);doc.text('Relatório de Serviços - Garagem GRAU CAR 096',14,16);doc.setFontSize(10);doc.text(`Período: ${from||'início'} a ${to||'hoje'} | Total: ${money(rows.reduce((s,r)=>s+r.Valor,0))}`,14,23);autoTable(doc,{startY:28,head:[['Data','Cliente','Placa','Veículo','Serviço','Funcionário','Valor','Status']],body:rows.map(r=>[r.Data,r.Cliente,r.Placa,r.Veiculo,r.Servico,r.Funcionario,money(r.Valor),r.Status])});doc.save('relatorio-servicos.pdf')}function excel(){const wb=XLSX.utils.book_new();const ws=XLSX.utils.json_to_sheet(rows);XLSX.utils.book_append_sheet(wb,ws,'Serviços');const payRows=payments.map(p=>({Data:dt(p.paid_at),Forma:paymentMethods.find(m=>m.id===p.payment_method_id)?.name||'',Valor:Number(p.amount||0)}));XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(payRows),'Pagamentos');XLSX.writeFile(wb,'relatorio-estetica-veicular.xlsx')}
 return <section><Panel title="Relatórios PDF e Excel" action={<div className="reportBtns"><button className="secondary" onClick={pdf}><FileDown size={17}/>PDF</button><button className="primary" onClick={excel}><FileDown size={17}/>Excel</button></div>}><div className="formGrid two"><label>De<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Até<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div><div className="cashSummary"><div><span>Serviços no período</span><strong>{rows.length}</strong></div><div><span>Total de serviços</span><strong>{money(rows.reduce((s,r)=>s+r.Valor,0))}</strong></div></div><Table headers={['Data','Cliente','Placa','Serviço','Funcionário','Valor']}>{rows.map((r,i)=><tr key={i}><td>{r.Data}</td><td>{r.Cliente}</td><td>{r.Placa}</td><td>{r.Servico}</td><td>{r.Funcionario}</td><td>{money(r.Valor)}</td></tr>)}</Table></Panel></section>}

function UsersPanel({profiles,canAdmin,canSuperAdmin,profile,supabase,addLog,setProfiles}){
 const empty={full_name:'',email:'',password:'',role:'visualizador'};
 const [f,setF]=useState(empty),[busy,setBusy]=useState(false);
 const allowedRoles=canSuperAdmin?['administrador','gerente','administrativo','visualizador']:['administrativo','visualizador'];
 async function create(){
  if(!canAdmin)return;
  if(!allowedRoles.includes(f.role))return alert('Você não possui permissão para criar este perfil.');
  if(!f.full_name||!f.email||f.password.length<6)return alert('Informe nome, e-mail e uma senha com pelo menos 6 caracteres.');
  setBusy(true);
  try{
   const {data,error}=await supabase.functions.invoke('create-user',{body:{...f,email:f.email.trim().toLowerCase()}});
   if(error)throw error;if(data?.error)throw new Error(data.error);
   setProfiles(x=>[...x,data.user]);await addLog(`Criou usuário ${f.email}`,'profiles',data.user.id);setF(empty);alert('Usuário criado com sucesso.');
  }catch(e){alert((e.message||'Não foi possível criar o usuário.')+'\n\nConfirme se a Edge Function create-user aceita o perfil selecionado.')}finally{setBusy(false)}
 }
 async function changeRole(p,newRole){
  if(!canSuperAdmin)return;
  if(p.id===profile?.id)return alert('Para segurança, altere o seu próprio perfil diretamente no Supabase.');
  const {data,error}=await supabase.from('profiles').update({role:newRole}).eq('id',p.id).select().single();
  if(error){alert(error.message);return;}
  setProfiles(x=>x.map(r=>r.id===p.id?data:r));await addLog(`Alterou perfil de ${p.email||p.full_name} para ${newRole}`,'profiles',p.id);
 }
 return <section><Panel title="Usuários do sistema" action={canAdmin&&<button className="primary" disabled={busy} onClick={create}><Plus size={17}/>{busy?'Criando...':'Criar usuário'}</button>}>
  <div className="formGrid"><input placeholder="Nome completo" value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/><input type="email" placeholder="E-mail" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/><input type="password" placeholder="Senha inicial" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/><select value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{allowedRoles.map(r=><option key={r} value={r}>{r==='administrador'?'Administrador':r==='gerente'?'Gerente':r==='administrativo'?'Administrativo':'Visualizador'}</option>)}</select></div>
  <Table headers={['Nome','E-mail','Perfil']}>{profiles.map(p=><tr key={p.id}><td>{p.full_name}</td><td>{p.email||'-'}</td><td>{canSuperAdmin&&p.id!==profile?.id?<select value={p.role} onChange={e=>changeRole(p,e.target.value)}><option value="administrador">Administrador</option><option value="gerente">Gerente</option><option value="administrativo">Administrativo</option><option value="visualizador">Visualizador</option></select>:<Status value={p.role}/>}</td></tr>)}</Table>
  <div className="roleGrid"><div><b>Administrador</b><p>Perfil acima do gerente. Acesso total e controle dos perfis dos gerentes.</p></div><div><b>Gerente</b><p>Acesso operacional completo e pode excluir registros do histórico, mas não controla administradores ou gerentes.</p></div><div><b>Administrativo</b><p>Clientes, veículos, agendamentos e execução dos serviços.</p></div><div><b>Visualizador</b><p>Acesso para consulta, sem alterações.</p></div></div>
 </Panel></section>
}
function Audit({logs}){return <section><Panel title="Histórico de ações"><Table headers={['Data/Hora','Usuário','Ação','Tipo']}>{logs.map(l=><tr key={l.id}><td>{dt(l.created_at)}</td><td>{l.user_name||'-'}</td><td>{l.action}</td><td>{l.entity_type||'-'}</td></tr>)}</Table></Panel></section>}

createRoot(document.getElementById('root')).render(<App/>);
