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

const money=v=>Number(v||0).toLocaleString('pt-BR',{
 style:'currency',
 currency:'BRL'
});

const dt=v=>v?new Date(v).toLocaleString('pt-BR'):'-';

const dateOnly=v=>v
 ?new Date(v+'T12:00:00').toLocaleDateString('pt-BR')
 :'-';

const finalPrice=s=>
 Number(s?.price||0)*(1-Number(s?.discount_percent||0)/100);

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

 if(
  test.getFullYear()!==y||
  test.getMonth()!==m-1||
  test.getDate()!==d
 )return '';

 return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
};


/* =========================================================
   SITE PÚBLICO
========================================================= */

function PublicSite(){
 const whatsapp='https://wa.me/5596984361638';
 const facebook='https://www.facebook.com/share/1L1YkAsB4C/?mibextid=wwXIfr';
 const instagram='https://www.instagram.com/graucar096?stkn=MWg2MzMxeGVqOW44OQ==';

 const [menuOpen,setMenuOpen]=useState(false);
 const [highContrast,setHighContrast]=useState(false);

 const goTo=id=>{
  setMenuOpen(false);

  setTimeout(()=>{
   document.getElementById(id)?.scrollIntoView({
    behavior:'smooth'
   });
  },0);
 };

 return <div className={`publicSite${highContrast?' highContrast':''}`}>

  <style>{`
   .publicTopActions{
    display:flex;
    align-items:center;
    gap:10px;
    position:relative;
   }

   .publicMenuButton,.contrastButton{
    border:1px solid rgba(255,255,255,.18);
    background:transparent;
    color:inherit;
    border-radius:10px;
    padding:10px 14px;
    font-weight:800;
    cursor:pointer;
   }

   .publicMenu{
    position:absolute;
    right:0;
    top:52px;
    z-index:50;
    min-width:250px;
    padding:10px;
    background:#111827;
    border:1px solid rgba(255,255,255,.16);
    border-radius:14px;
    box-shadow:0 18px 45px rgba(0,0,0,.35);
   }

   .publicMenu a,.publicMenu button{
    display:block;
    width:100%;
    text-align:left;
    padding:11px 12px;
    border:0;
    background:transparent;
    color:#fff;
    text-decoration:none;
    border-radius:9px;
    cursor:pointer;
    font:inherit;
   }

   .publicMenu a:hover,.publicMenu button:hover{
    background:rgba(255,255,255,.1);
   }

   .partnerBox,.careerBox{
    border:1px solid rgba(255,255,255,.14);
    border-radius:18px;
    padding:22px;
   }

   .highContrast{
    background:#000!important;
    color:#fff!important;
   }

   .highContrast .publicHeader,
   .highContrast .publicHero,
   .highContrast .publicContact,
   .highContrast article,
   .highContrast .publicContactCard,
   .highContrast .partnerBox,
   .highContrast .careerBox{
    background:#000!important;
    color:#fff!important;
    border-color:#fff!important;
   }

   .highContrast a{
    color:#fff!important;
   }

   .highContrast .publicPrimary,
   .highContrast .publicSecondary,
   .highContrast .publicSystemLink,
   .highContrast button{
    background:#fff!important;
    color:#000!important;
    border-color:#fff!important;
   }

   .publicPrimary,
   .publicSecondary,
   .publicSystemLink,
   .publicMenu a{
    text-decoration:none!important;
   }

   @media(max-width:720px){
    .publicHeader{gap:12px;}
    .publicTopActions{gap:6px;}
    .publicMenuButton,.contrastButton{
     padding:9px 10px;
    }
   }
  `}</style>

  <header className="publicHeader">

   <div className="publicBrand">
    <img src={logoGraucar} alt="Garagem Grau Car"/>

    <div>
     <b>GARAGEM GRAU CAR</b>
     <span>A Casa do Grau Máximo</span>
    </div>
   </div>

   <div className="publicTopActions">

    <button
     type="button"
     className="contrastButton"
     onClick={()=>setHighContrast(v=>!v)}
     aria-pressed={highContrast}
    >
     ◐ Contraste
    </button>

    <button
     type="button"
     className="publicMenuButton"
     onClick={()=>setMenuOpen(v=>!v)}
     aria-expanded={menuOpen}
    >
     Menu ☰
    </button>

    {menuOpen&&
     <div className="publicMenu">
      <a href="/sistema">
       Acesso ao sistema
      </a>

      <a
       href="/oportunidades"
       target="_blank"
       rel="noreferrer"
      >
       Faça parte do nosso time
      </a>

      <a href="/privacidade">
       Política de Privacidade
      </a>

      <button
       type="button"
       onClick={()=>goTo('parceiros')}
      >
       Empresas Parceiras
      </button>
     </div>
    }

   </div>

  </header>

  <main className="publicMain">

   <section className="publicHero">

    <div className="publicHeroText">

     <span className="publicEyebrow">
      CUIDADO AUTOMOTIVO EM MACAPÁ - AP
     </span>

     <h1>
      Seu veículo tratado com atenção em cada detalhe.
     </h1>

     <p>
      A Garagem Grau Car oferece serviços de cuidado e estética
      automotiva, com atendimento organizado e acompanhamento
      dos serviços realizados.
     </p>

     <div className="publicHeroActions">

      <a
       className="publicPrimary"
       href={whatsapp}
       target="_blank"
       rel="noreferrer"
      >
       <MessageCircle size={19}/>
       Falar pelo WhatsApp
      </a>

      <a
       className="publicSecondary"
       href="tel:+5596984361638"
      >
       Ligar agora
      </a>

     </div>

    </div>

    <div className="publicHeroLogo">
     <img
      src={logoGraucar}
      alt="Logo Garagem Grau Car"
     />
    </div>

   </section>


   <section className="publicSection" id="sobre">

    <div className="publicSectionTitle">
     <span>SOBRE NÓS</span>
     <h2>Garagem Grau Car</h2>
    </div>

    <div className="publicAboutGrid">

     <article>
      <Car size={26}/>
      <h3>Cuidado automotivo</h3>
      <p>
       Serviços voltados à conservação, limpeza e apresentação
       do seu veículo.
      </p>
     </article>

     <article>
      <CalendarDays size={26}/>
      <h3>Atendimento organizado</h3>
      <p>
       Agendamentos e acompanhamento dos serviços para facilitar
       o atendimento ao cliente.
      </p>
     </article>

     <article>
      <ShieldCheck size={26}/>
      <h3>Relacionamento com o cliente</h3>
      <p>
       Comunicação direta para informações sobre o atendimento
       e a conclusão dos serviços.
      </p>
     </article>

    </div>

   </section>


   <section style={{padding:'0 0 48px'}}>

    <div style={{
     display:'flex',
     justifyContent:'space-between',
     alignItems:'end',
     gap:18,
     flexWrap:'wrap',
     marginBottom:18
    }}>

     <div>
      <span className="publicEyebrow">
       LOCALIZAÇÃO
      </span>

      <h2 style={{margin:'8px 0'}}>
       Onde estamos
      </h2>

      <p style={{margin:0}}>
       Avenida Coaracy Nunes, 907 B - Centro, Macapá - AP
      </p>
     </div>

     <a
      className="publicPrimary"
      href="https://www.google.com/maps/dir/?api=1&destination=Avenida+Coaracy+Nunes,+907+B,+Centro,+Macapa,+AP"
      target="_blank"
      rel="noreferrer"
      style={{textDecoration:'none'}}
     >
      📍 Como chegar
     </a>

    </div>

    <div style={{
     overflow:'hidden',
     borderRadius:18,
     border:'2px solid #ef4444',
     minHeight:420,
     boxShadow:'0 0 0 4px rgba(239,68,68,.12), 0 18px 45px rgba(0,0,0,.28)'
    }}>

     <iframe
      title="Localização Garagem Grau Car"
      src="https://www.google.com/maps?q=Garagem+Grau+Car,+Avenida+Coaracy+Nunes,+907+B,+Centro,+Macapa,+AP&z=19&output=embed"
      width="100%"
      height="420"
      style={{border:0,display:'block'}}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
     />

    </div>

   </section>


   <section style={{padding:'0 0 52px'}}>

    <div style={{marginBottom:18}}>
     <span className="publicEyebrow">
      REDES SOCIAIS
     </span>

     <h2 style={{margin:'8px 0'}}>
      Acompanhe a Grau Car
     </h2>

     <p style={{margin:0}}>
      Siga nossos perfis oficiais no Facebook e Instagram.
     </p>
    </div>

    <div style={{
     display:'flex',
     gap:14,
     flexWrap:'wrap'
    }}>

     <a
      href={facebook}
      target="_blank"
      rel="noreferrer"
      aria-label="Facebook da Garagem Grau Car"
      style={{
       textDecoration:'none',
       display:'inline-flex',
       alignItems:'center',
       gap:10,
       padding:'12px 18px',
       borderRadius:12,
       border:'1px solid rgba(255,255,255,.16)',
       color:'inherit',
       fontWeight:700
      }}
     >
      <span
       aria-hidden="true"
       style={{
        display:'grid',
        placeItems:'center',
        width:30,
        height:30,
        borderRadius:'50%',
        border:'1px solid currentColor',
        fontSize:20,
        fontFamily:'Arial',
        fontWeight:900
       }}
      >
       f
      </span>
      Facebook
     </a>

     <a
      href={instagram}
      target="_blank"
      rel="noreferrer"
      aria-label="Instagram da Garagem Grau Car"
      style={{
       textDecoration:'none',
       display:'inline-flex',
       alignItems:'center',
       gap:10,
       padding:'12px 18px',
       borderRadius:12,
       border:'1px solid rgba(255,255,255,.16)',
       color:'inherit',
       fontWeight:700
      }}
     >

      <svg
       aria-hidden="true"
       width="30"
       height="30"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       strokeWidth="1.8"
      >
       <rect x="3" y="3" width="18" height="18" rx="5"/>
       <circle cx="12" cy="12" r="4"/>
       <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>

      Instagram
     </a>

    </div>

   </section>


   <section
    id="parceiros"
    style={{padding:'0 0 48px'}}
   >

    <div style={{marginBottom:18}}>
     <span className="publicEyebrow">
      PARCERIAS
     </span>

     <h2 style={{margin:'8px 0'}}>
      Empresas Parceiras
     </h2>
    </div>

    <div className="partnerBox">
     <p style={{margin:0}}>
      Espaço reservado para apresentar as empresas parceiras
      da Garagem Grau Car.
     </p>
    </div>

   </section>

  </main>

  <div vw="true" className="enabled">
   <div vw-access-button="true" className="active"></div>
   <div vw-plugin-wrapper="true">
    <div className="vw-plugin-top-wrapper"></div>
   </div>
  </div>

  <footer className="publicFooter">

   <div>
    <b>Garagem Grau Car</b>
    <span>Macapá - AP</span>
   </div>

   <div>
    <a href="/privacidade">
     Política de Privacidade
    </a>

    <span>
     © {new Date().getFullYear()} Garagem Grau Car
    </span>
   </div>

  </footer>

 </div>
}


/* =========================================================
   OPORTUNIDADES
========================================================= */

function CareerPage(){
 const [highContrast,setHighContrast]=useState(false);

 const [application,setApplication]=useState({
  name:'',
  phone:'',
  email:'',
  area:'',
  experience:'',
  message:''
 });

 const [resume,setResume]=useState(null);
 const [sending,setSending]=useState(false);
 const [applicationStatus,setApplicationStatus]=useState('');

 async function submitApplication(e){
  e.preventDefault();

  const form=e.currentTarget;

  if(!resume){
   setApplicationStatus(
    'Anexe seu currículo em PDF ou documento.'
   );
   return;
  }

  if(resume.size>5*1024*1024){
   setApplicationStatus(
    'O currículo deve ter no máximo 5 MB.'
   );
   return;
  }

  if(!supabase){
   setApplicationStatus(
    'O envio está temporariamente indisponível.'
   );
   return;
  }

  setSending(true);
  setApplicationStatus('');

  try{

   const resumeBase64=await new Promise(
    (resolve,reject)=>{
     const reader=new FileReader();

     reader.onload=()=>resolve(
      String(reader.result).split(',')[1]||''
     );

     reader.onerror=reject;
     reader.readAsDataURL(resume);
    }
   );

   const {error}=await supabase.functions.invoke(
    'job-application',
    {
     body:{
      ...application,
      resumeName:resume.name,
      resumeType:resume.type||'application/octet-stream',
      resumeBase64
     }
    }
   );

   if(error)throw error;

   setApplicationStatus(
    'Candidatura enviada por e-mail. Abrimos o WhatsApp para você confirmar o contato com a Grau Car.'
   );

   const msg=
    `Olá! Enviei uma candidatura pelo site da Garagem Grau Car.%0A%0A`+
    `Nome: ${encodeURIComponent(application.name)}%0A`+
    `Área de interesse: ${encodeURIComponent(application.area)}%0A`+
    `Telefone: ${encodeURIComponent(application.phone)}%0A`+
    `E-mail: ${encodeURIComponent(application.email)}`;

   window.open(
    `https://wa.me/5596984361638?text=${msg}`,
    '_blank',
    'noopener,noreferrer'
   );

   setApplication({
    name:'',
    phone:'',
    email:'',
    area:'',
    experience:'',
    message:''
   });

   setResume(null);
   form.reset();

  }catch(err){

   setApplicationStatus(
    `Não foi possível enviar a candidatura: ${
     err?.message||'tente novamente.'
    }`
   );

  }finally{
   setSending(false);
  }
 }

 return <div className={`publicSite${highContrast?' highContrast':''}`}>

  <style>{`
   .careerPageMain{
    max-width:980px;
    margin:0 auto;
    padding:52px 24px 72px;
   }

   .careerBox{
    border:1px solid rgba(255,255,255,.14);
    border-radius:18px;
    padding:22px;
   }

   .careerForm{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:12px;
   }

   .careerForm input,
   .careerForm textarea{
    width:100%;
    box-sizing:border-box;
    padding:12px;
    border-radius:10px;
    border:1px solid rgba(255,255,255,.18);
    background:rgba(255,255,255,.06);
    color:inherit;
   }

   .careerForm textarea,
   .careerForm .full{
    grid-column:1/-1;
   }

   .contrastButton{
    border:1px solid rgba(255,255,255,.18);
    background:transparent;
    color:inherit;
    border-radius:10px;
    padding:10px 14px;
    font-weight:800;
    cursor:pointer;
   }

   .careerHeaderActions{
    display:flex;
    align-items:center;
    gap:10px;
   }

   .highContrast{
    background:#000!important;
    color:#fff!important;
   }

   .highContrast .publicHeader,
   .highContrast .careerBox{
    background:#000!important;
    color:#fff!important;
    border-color:#fff!important;
   }

   .highContrast .publicPrimary,
   .highContrast .publicSecondary,
   .highContrast .publicSystemLink,
   .highContrast button{
    background:#fff!important;
    color:#000!important;
    border-color:#fff!important;
   }

   .highContrast input,
   .highContrast textarea{
    background:#000!important;
    color:#fff!important;
    border-color:#fff!important;
   }

   @media(max-width:720px){
    .careerForm{
     grid-template-columns:1fr;
    }

    .careerForm>*{
     grid-column:1!important;
    }
   }
  `}</style>

  <header className="publicHeader">

   <div className="publicBrand">
    <img src={logoGraucar} alt="Garagem Grau Car"/>

    <div>
     <b>GARAGEM GRAU CAR</b>
     <span>A Casa do Grau Máximo</span>
    </div>
   </div>

   <div className="careerHeaderActions">

    <button
     type="button"
     className="contrastButton"
     onClick={()=>setHighContrast(v=>!v)}
    >
     ◐ Contraste
    </button>

    <a
     className="publicSystemLink"
     href="/"
    >
     Voltar ao site
    </a>

   </div>

  </header>

  <main className="careerPageMain">

   <div style={{marginBottom:24}}>

    <span className="publicEyebrow">
     OPORTUNIDADES
    </span>

    <h1 style={{margin:'8px 0'}}>
     Faça parte do nosso time
    </h1>

    <p>
     Preencha seus dados e anexe seu currículo para enviar
     sua candidatura à Garagem Grau Car.
    </p>

   </div>

   <div className="careerBox">

    <form
     className="careerForm"
     onSubmit={submitApplication}
    >

     <input
      required
      placeholder="Nome completo"
      value={application.name}
      onChange={e=>setApplication({
       ...application,
       name:e.target.value
      })}
     />

     <input
      required
      placeholder="Telefone / WhatsApp"
      value={application.phone}
      onChange={e=>setApplication({
       ...application,
       phone:e.target.value
      })}
     />

     <input
      required
      type="email"
      placeholder="E-mail"
      value={application.email}
      onChange={e=>setApplication({
       ...application,
       email:e.target.value
      })}
     />

     <input
      required
      placeholder="Área ou vaga de interesse"
      value={application.area}
      onChange={e=>setApplication({
       ...application,
       area:e.target.value
      })}
     />

     <textarea
      rows="4"
      placeholder="Experiência profissional / principais qualificações"
      value={application.experience}
      onChange={e=>setApplication({
       ...application,
       experience:e.target.value
      })}
     />

     <textarea
      rows="3"
      placeholder="Mensagem adicional (opcional)"
      value={application.message}
      onChange={e=>setApplication({
       ...application,
       message:e.target.value
      })}
     />

     <label className="full">
      <b>Currículo</b>

      <input
       required
       type="file"
       accept=".pdf,.doc,.docx"
       onChange={e=>
        setResume(e.target.files?.[0]||null)
       }
      />

      <small>
       PDF, DOC ou DOCX — até 5 MB.
      </small>
     </label>

     <button
      className="publicPrimary full"
      type="submit"
      disabled={sending}
     >
      {sending?'Enviando...':'Enviar candidatura'}
     </button>

     {applicationStatus&&
      <div className="full" role="status">
       {applicationStatus}
      </div>
     }

    </form>

   </div>

  </main>

  <footer className="publicFooter">
   <div>
    <b>Garagem Grau Car</b>
    <span>Macapá - AP</span>
   </div>

   <div>
    <a href="/privacidade">
     Política de Privacidade
    </a>

    <span>
     © {new Date().getFullYear()} Garagem Grau Car
    </span>
   </div>
  </footer>

 </div>
}


/* =========================================================
   PRIVACIDADE
========================================================= */

function PrivacyPage(){
 return <div className="publicSite">

  <header className="publicHeader">

   <div className="publicBrand">
    <img src={logoGraucar} alt="Garagem Grau Car"/>

    <div>
     <b>GARAGEM GRAU CAR</b>
     <span>A Casa do Grau Máximo</span>
    </div>
   </div>

   <a
    className="publicSystemLink"
    href="/"
   >
    Voltar ao site
   </a>

  </header>

  <main className="privacyMain">

   <span className="publicEyebrow">
    POLÍTICA DE PRIVACIDADE
   </span>

   <h1>
    Privacidade e proteção de dados
   </h1>

   <p>
    Esta página informa, de forma geral, como a Garagem Grau Car
    trata dados fornecidos por clientes durante o atendimento.
   </p>

   <h2>Dados utilizados</h2>

   <p>
    Podem ser utilizados dados de contato, informações do veículo,
    dados de agendamento e registros relacionados aos serviços
    solicitados ou realizados.
   </p>

   <h2>Finalidade</h2>

   <p>
    Os dados são utilizados para organizar atendimentos, manter
    registros dos serviços, entrar em contato com o cliente e enviar
    comunicações relacionadas ao atendimento.
   </p>

   <h2>Compartilhamento e segurança</h2>

   <p>
    Os dados devem ser tratados somente para as finalidades
    necessárias à operação do atendimento e às integrações utilizadas
    para prestar o serviço, com medidas razoáveis de segurança.
   </p>

   <h2>Contato</h2>

   <p>
    Para assuntos relacionados à privacidade ou aos seus dados,
    entre em contato com a Garagem Grau Car pelo telefone/WhatsApp{' '}

    <a
     href="https://wa.me/5596984361638"
     target="_blank"
     rel="noreferrer"
    >
     (96) 98436-1638
    </a>.
   </p>

  </main>

  <footer className="publicFooter">

   <div>
    <b>Garagem Grau Car</b>
    <span>Macapá - AP</span>
   </div>

   <div>
    <a href="/">
     Página institucional
    </a>

    <span>
     © {new Date().getFullYear()} Garagem Grau Car
    </span>
   </div>

  </footer>

 </div>
}


/* =========================================================
   ROTAS
========================================================= */

function Root(){

 useEffect(()=>{

  const init=()=>{
   if(window.VLibras&&!window.__grauCarVLibras){
    new window.VLibras.Widget(
     'https://vlibras.gov.br/app'
    );

    window.__grauCarVLibras=true;
   }
  };

  const existing=
   document.querySelector(
    'script[data-vlibras-widget]'
   );

  if(existing){
   init();

   existing.addEventListener(
    'load',
    init,
    {once:true}
   );

   return;
  }

  const script=document.createElement('script');

  script.src=
   'https://vlibras.gov.br/app/vlibras-plugin.js';

  script.async=true;

  script.setAttribute(
   'data-vlibras-widget',
   'true'
  );

  script.onload=init;

  document.body.appendChild(script);

 },[]);

 const path=
  window.location.pathname.replace(/\/+$/,'')||'/';

 if(path==='/'||path==='/empresa'){
  return <PublicSite/>;
 }

 if(path==='/privacidade'){
  return <PrivacyPage/>;
 }

 if(path==='/oportunidades'){
  return <CareerPage/>;
 }

 if(path==='/sistema'){
  return <App/>;
 }

 return <PublicSite/>;
}


/* =========================================================
   SISTEMA
========================================================= */

function App(){

 const [session,setSession]=useState(undefined);
 const [profile,setProfile]=useState(undefined);
 const [tab,setTab]=useState('dashboard');

 const [clients,setClients]=useState([]);
 const [vehicles,setVehicles]=useState([]);
 const [services,setServices]=useState([]);
 const [vehicleCategories,setVehicleCategories]=useState([]);
 const [orders,setOrders]=useState([]);
 const [images,setImages]=useState([]);
 const [logs,setLogs]=useState([]);

 const [appointments,setAppointments]=useState([]);
 const [appointmentFiles,setAppointmentFiles]=useState([]);
 const [employees,setEmployees]=useState([]);
 const [paymentMethods,setPaymentMethods]=useState([]);
 const [payments,setPayments]=useState([]);
 const [cashClosings,setCashClosings]=useState([]);
 const [profiles,setProfiles]=useState([]);

 const [login,setLogin]=useState({
  email:'',
  password:''
 });

 const [error,setError]=useState('');
 const [loadingData,setLoadingData]=useState(false);
 const [profileError,setProfileError]=useState('');

 // NOVO: contraste dentro do sistema
 const [systemContrast,setSystemContrast]=useState(false);

 // NOVO: alteração da própria senha
 const [passwordModal,setPasswordModal]=useState(false);
 const [newPassword,setNewPassword]=useState('');
 const [confirmPassword,setConfirmPassword]=useState('');
 const [changingPassword,setChangingPassword]=useState(false);

 const configured=Boolean(supabase);


 /* ---------------------------------------------------------
    SESSÃO
 --------------------------------------------------------- */

 useEffect(()=>{

  if(!configured){
   setSession(null);
   return;
  }

  let mounted=true;

  supabase.auth.getSession().then(
   ({data,error})=>{

    if(!mounted)return;

    if(error){
     setError(error.message);
     setSession(null);
     return;
    }

    setSession(data.session||null);

   }
  );

  const {
   data:{subscription}
  }=supabase.auth.onAuthStateChange(
   (_event,nextSession)=>{

    if(mounted){
     setSession(nextSession||null);
    }

   }
  );

  return()=>{
   mounted=false;
   subscription.unsubscribe();
  };

 },[configured]);


 useEffect(()=>{

  if(session?.user&&configured){
   loadAll();
  }

  if(session===null){
   setProfile(undefined);
   setProfileError('');
  }

 },[session?.user?.id,configured]);


 /* ---------------------------------------------------------
    NOVO: LOGOUT APÓS 10 MINUTOS SEM ATIVIDADE
 --------------------------------------------------------- */

 useEffect(()=>{

  if(!session?.user||!configured)return;

  let timer;

  const logoutByInactivity=async()=>{

   try{
    await supabase.auth.signOut();
   }catch(e){
    console.warn(
     'Erro ao encerrar sessão por inatividade:',
     e
    );
   }

   setSession(null);
   setProfile(undefined);
   setTab('dashboard');

   alert(
    'Sua sessão foi encerrada após 10 minutos sem atividade.'
   );
  };

  const resetTimer=()=>{

   clearTimeout(timer);

   timer=setTimeout(
    logoutByInactivity,
    10*60*1000
   );

  };

  const events=[
   'mousedown',
   'keydown',
   'touchstart',
   'scroll'
  ];

  events.forEach(event=>{
   window.addEventListener(event,resetTimer);
  });

  resetTimer();

  return()=>{

   clearTimeout(timer);

   events.forEach(event=>{
    window.removeEventListener(event,resetTimer);
   });

  };

 },[session?.user?.id,configured]);


 /* ---------------------------------------------------------
    CARREGAR DADOS
 --------------------------------------------------------- */

 async function loadAll(){

  if(!supabase||!session?.user)return;

  setLoadingData(true);
  setProfileError('');

  try{

   const {
    data:p,
    error:pErr
   }=await supabase
    .from('profiles')
    .select('*')
    .eq('id',session.user.id)
    .maybeSingle();

   if(pErr)throw pErr;

   if(!p){

    setProfile(null);

    setProfileError(
     'Sua conta existe no Authentication, mas não possui um perfil no sistema. Corrija o cadastro em public.profiles.'
    );

    return;
   }

   setProfile(p);

   const q=await Promise.all([

    supabase
     .from('clients')
     .select('*')
     .order('created_at',{ascending:false}),

    supabase
     .from('vehicles')
     .select('*')
     .order('created_at',{ascending:false}),

    supabase
     .from('service_types')
     .select('*')
     .order('name'),

    supabase
     .from('vehicle_categories')
     .select('*')
     .order('name'),

    supabase
     .from('service_orders')
     .select('*')
     .order('created_at',{ascending:false}),

    supabase
     .from('service_images')
     .select('*')
     .order('created_at',{ascending:false}),

    // ALTERADO: removido limite de 250 para o relatório da auditoria
    supabase
     .from('audit_logs_view')
     .select('*')
     .order('created_at',{ascending:false}),

    supabase
     .from('appointments')
     .select('*')
     .order('scheduled_at'),

    supabase
     .from('employees')
     .select('*')
     .order('name'),

    supabase
     .from('payment_methods')
     .select('*')
     .order('name'),

    supabase
     .from('payments')
     .select('*')
     .order('paid_at',{ascending:false}),

    supabase
     .from('cash_closings')
     .select('*')
     .order('closed_at',{ascending:false}),

    supabase
     .from('profiles')
     .select('*')
     .order('full_name'),

    supabase
     .from('appointment_files')
     .select('*')
     .order('created_at',{ascending:false})

   ]);

   const firstError=
    q.find(x=>x.error)?.error;

   if(firstError)throw firstError;

   setClients(q[0].data||[]);
   setVehicles(q[1].data||[]);
   setServices(q[2].data||[]);
   setVehicleCategories(q[3].data||[]);
   setOrders(q[4].data||[]);
   setImages(q[5].data||[]);
   setLogs(q[6].data||[]);
   setAppointments(q[7].data||[]);
   setEmployees(q[8].data||[]);
   setPaymentMethods(q[9].data||[]);
   setPayments(q[10].data||[]);
   setCashClosings(q[11].data||[]);
   setProfiles(q[12].data||[]);
   setAppointmentFiles(q[13].data||[]);

  }catch(e){

   setProfileError(
    e.message||
    'Não foi possível carregar os dados do sistema.'
   );

  }finally{

   setLoadingData(false);

  }
 }


 /* ---------------------------------------------------------
    LOGIN / LOGOUT
 --------------------------------------------------------- */

 async function signIn(e){

  e.preventDefault();

  setError('');

  if(!supabase)return;

  if(!login.email.trim()||!login.password){

   setError('Informe e-mail e senha.');
   return;

  }

  const {error}=await supabase.auth.signInWithPassword({
   email:login.email.trim(),
   password:login.password
  });

  if(error){

   setError(
    error.message==='Invalid login credentials'
     ?'E-mail ou senha inválidos.'
     :error.message
   );

  }
 }


 async function signOut(){

  if(supabase){
   await supabase.auth.signOut();
  }

  setSession(null);
  setProfile(undefined);
  setTab('dashboard');

 }


 /* ---------------------------------------------------------
    NOVO: ALTERAR MINHA SENHA
 --------------------------------------------------------- */

 async function changeOwnPassword(){

  if(newPassword.length<6){

   alert(
    'A nova senha deve possuir pelo menos 6 caracteres.'
   );

   return;
  }

  if(newPassword!==confirmPassword){

   alert(
    'A confirmação da senha não corresponde à nova senha.'
   );

   return;
  }

  setChangingPassword(true);

  try{

   const {error}=await supabase.auth.updateUser({
    password:newPassword
   });

   if(error)throw error;

   await addLog(
    'Alterou a própria senha',
    'profiles',
    session?.user?.id||null
   );

   setNewPassword('');
   setConfirmPassword('');
   setPasswordModal(false);

   alert('Senha alterada com sucesso.');

  }catch(e){

   alert(
    e.message||
    'Não foi possível alterar a senha.'
   );

  }finally{

   setChangingPassword(false);

  }
 }


 /* ---------------------------------------------------------
    FUNÇÕES GERAIS
 --------------------------------------------------------- */

 async function addLog(
  action,
  entity_type='',
  entity_id=null
 ){

  if(!supabase||!session?.user)return;

  await supabase
   .from('audit_logs')
   .insert({
    user_id:session.user.id,
    action,
    entity_type,
    entity_id
   });

 }


 async function insert(
  table,
  payload,
  setter,
  label
 ){

  const {data,error}=await supabase
   .from(table)
   .insert(payload)
   .select()
   .single();

  if(error){
   alert(error.message);
   return null;
  }

  setter(x=>[data,...x]);

  await addLog(
   label,
   table,
   data.id
  );

  return data;
 }


 async function update(
  table,
  id,
  payload,
  setter,
  label
 ){

  const {data,error}=await supabase
   .from(table)
   .update(payload)
   .eq('id',id)
   .select()
   .single();

  if(error){
   alert(error.message);
   return false;
  }

  setter(x=>
   x.map(r=>r.id===id?data:r)
  );

  await addLog(
   label,
   table,
   id
  );

  return true;
 }


 async function remove(
  table,
  id,
  setter,
  label
 ){

  if(
   !confirm(
    'Tem certeza que deseja excluir este registro? Esta ação não poderá ser desfeita.'
   )
  )return false;

  const {error}=await supabase
   .from(table)
   .delete()
   .eq('id',id);

  if(error){
   alert(error.message);
   return false;
  }

  setter(x=>
   x.filter(r=>r.id!==id)
  );

  await addLog(
   label,
   table,
   id
  );

  return true;
 }


 async function uploadImages(
  orderId,
  files
 ){

  if(!files?.length)return;

  for(const file of files){

   const path=
    `${orderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;

   const up=await supabase
    .storage
    .from('service-images')
    .upload(path,file);

   if(up.error){
    alert(up.error.message);
    continue;
   }

   const {
    data:{publicUrl}
   }=supabase
    .storage
    .from('service-images')
    .getPublicUrl(path);

   const {data}=await supabase
    .from('service_images')
    .insert({
     service_order_id:orderId,
     image_url:publicUrl,
     file_name:file.name
    })
    .select()
    .single();

   if(data){
    setImages(x=>[data,...x]);
   }
  }
 }


 async function uploadAppointmentFiles(
  groupId,
  files
 ){

  if(!files?.length||!groupId)return;

  for(const file of files){

   const safeName=
    file.name.replace(
     /[^a-zA-Z0-9._-]/g,
     '_'
    );

   const path=
    `appointments/${groupId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

   const up=await supabase
    .storage
    .from('service-images')
    .upload(path,file);

   if(up.error){
    alert(up.error.message);
    continue;
   }

   const {
    data:{publicUrl}
   }=supabase
    .storage
    .from('service-images')
    .getPublicUrl(path);

   const {data,error}=await supabase
    .from('appointment_files')
    .insert({
     appointment_group_id:groupId,
     file_url:publicUrl,
     file_name:file.name,
     file_type:file.type||null,
     storage_path:path
    })
    .select()
    .single();

   if(error){
    alert(error.message);
    continue;
   }

   if(data){
    setAppointmentFiles(x=>[data,...x]);
   }
  }
 }


 /* ---------------------------------------------------------
    TELAS DE CARREGAMENTO
 --------------------------------------------------------- */

 if(!configured){
  return <ConfigError/>;
 }

 if(session===undefined){
  return <Splash message="Verificando sessão..."/>;
 }

 if(!session){
  return <Login
   login={login}
   setLogin={setLogin}
   signIn={signIn}
   error={error}
  />;
 }

 if(profile===undefined&&loadingData){
  return <Splash message="Carregando seu perfil..."/>;
 }

 if(profileError||profile===null){
  return <AccessError
   message={profileError}
   signOut={signOut}
   reload={loadAll}
  />;
 }

 if(!profile){
  return <Splash message="Carregando sistema..."/>;
 }


 /* ---------------------------------------------------------
    PERMISSÕES
 --------------------------------------------------------- */

 const role=profile.role;

 const canSuperAdmin=
  role==='administrador';

 const canAdmin=
  ['administrador','gerente'].includes(role);

 const canWrite=
  ['administrador','gerente','administrativo'].includes(role);

 const canDeleteHistory=
  ['administrador','gerente'].includes(role);


 const common={
  clients,
  vehicles,
  services,
  vehicleCategories,
  orders,
  images,
  appointments,
  appointmentFiles,
  employees,
  paymentMethods,
  payments,
  cashClosings,
  profiles,
  canWrite,
  canAdmin,
  canSuperAdmin,
  canDeleteHistory,
  demo:false,
  profile,
  supabase,
  insert,
  update,
  remove,
  addLog,
  uploadImages,
  uploadAppointmentFiles,
  reload:loadAll
 };


 return <div
  className="app"
  style={
   systemContrast
    ?{
      background:'#000',
      color:'#fff'
     }
    :undefined
  }
 >

  {systemContrast&&
   <style>{`
    .app,
    .app main,
    .app header,
    .app aside,
    .app section,
    .app .panel,
    .app .card,
    .app .modal,
    .app .modalBack{
     background:#000!important;
     color:#fff!important;
    }

    .app input,
    .app select,
    .app textarea{
     background:#000!important;
     color:#fff!important;
     border-color:#fff!important;
    }

    .app table,
    .app th,
    .app td{
     background:#000!important;
     color:#fff!important;
     border-color:#fff!important;
    }

    .app button{
     border-color:#fff!important;
    }

    .app .primary,
    .app nav button.active{
     background:#fff!important;
     color:#000!important;
    }

    .app .secondary,
    .app .actions button{
     background:#000!important;
     color:#fff!important;
     border:1px solid #fff!important;
    }

    .app a{
     color:#fff!important;
    }

    .app .hint{
     color:#fff!important;
    }
   `}</style>
  }


  <Sidebar
   tab={tab}
   setTab={setTab}
   role={role}
   signOut={signOut}
  />


  <main>

   <header>

    <div>
     <h1>A Casa do Grau Máximo</h1>

     <p>
      {profile.full_name||session.user.email}
      {' · '}
      <b>{role}</b>
     </p>
    </div>


    <div
     className="inline"
     style={{
      marginLeft:'auto',
      flexWrap:'wrap'
     }}
    >

     <button
      type="button"
      className="secondary"
      onClick={()=>setSystemContrast(v=>!v)}
     >
      ◐ Contraste
     </button>

     <button
      type="button"
      className="secondary"
      onClick={()=>setPasswordModal(true)}
     >
      <ShieldCheck size={17}/>
      Alterar minha senha
     </button>

    </div>

   </header>


   {tab==='dashboard'&&
    <Dashboard {...common}/>
   }

   {tab==='clientes'&&
    <Clients
     {...common}
     setClients={setClients}
    />
   }

   {tab==='veiculos'&&
    <Vehicles
     {...common}
     setVehicles={setVehicles}
     setVehicleCategories={setVehicleCategories}
    />
   }

   {tab==='servicos'&&canAdmin&&
    <Services
     {...common}
     setServices={setServices}
    />
   }

   {tab==='historico'&&
    <History
     {...common}
     setOrders={setOrders}
     setPayments={setPayments}
     setImages={setImages}
    />
   }

   {tab==='agendamentos'&&
    <Appointments
     {...common}
     setAppointments={setAppointments}
     setAppointmentFiles={setAppointmentFiles}
     setOrders={setOrders}
     setPayments={setPayments}
     setImages={setImages}
    />
   }

   {tab==='equipe'&&canAdmin&&
    <Employees
     {...common}
     setEmployees={setEmployees}
    />
   }

   {tab==='caixa'&&canAdmin&&
    <Cash
     {...common}
     setPayments={setPayments}
     setCashClosings={setCashClosings}
     setPaymentMethods={setPaymentMethods}
    />
   }

   {tab==='relatorios'&&canAdmin&&
    <Reports {...common}/>
   }

   {tab==='usuarios'&&canAdmin&&
    <UsersPanel
     {...common}
     setProfiles={setProfiles}
    />
   }

   {tab==='auditoria'&&canAdmin&&
    <Audit logs={logs}/>
   }


   {passwordModal&&
    <Modal
     title="Alterar minha senha"
     onClose={()=>{
      if(changingPassword)return;

      setPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
     }}
    >

     <div className="formGrid">

      <input
       type="password"
       autoComplete="new-password"
       placeholder="Nova senha"
       value={newPassword}
       onChange={e=>
        setNewPassword(e.target.value)
       }
      />

      <input
       type="password"
       autoComplete="new-password"
       placeholder="Confirmar nova senha"
       value={confirmPassword}
       onChange={e=>
        setConfirmPassword(e.target.value)
       }
      />

     </div>

     <p className="hint">
      A senha deve possuir pelo menos 6 caracteres.
     </p>

     <div className="inline">

      <button
       type="button"
       className="primary"
       disabled={changingPassword}
       onClick={changeOwnPassword}
      >
       <Save size={17}/>
       {changingPassword
        ?'Alterando...'
        :'Alterar senha'
       }
      </button>

      <button
       type="button"
       className="secondary"
       disabled={changingPassword}
       onClick={()=>{
        setPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
       }}
      >
       Cancelar
      </button>

     </div>

    </Modal>
   }

  </main>

 </div>
}


/* =========================================================
   COMPONENTES DE LOGIN
========================================================= */

function Splash({message}){
 return <div className="login">
  <div className="splashCard">

   <div className="brand">
    <Car size={34}/>
    <span>Garagem GRAU CAR 096</span>
   </div>

   <div className="spinner"/>

   <p>{message}</p>

  </div>
 </div>
}


function ConfigError(){
 return <div className="login">

  <div className="configCard">

   <div className="brand">
    <Car size={34}/>
    <span>Garagem GRAU CAR 096</span>
   </div>

   <h2>
    Configuração do Supabase necessária
   </h2>

   <p>
    O sistema não encontrou <b>VITE_SUPABASE_URL</b>
    {' '}e/ou{' '}
    <b>VITE_SUPABASE_ANON_KEY</b>.
   </p>

   <p>
    Confira o arquivo <code>.env</code> na pasta principal
    do projeto e reinicie o comando <code>npm run dev</code>.
   </p>

   <div className="error">
    Por segurança, o painel não abre sem autenticação.
   </div>

  </div>

 </div>
}


function AccessError({
 message,
 signOut,
 reload
}){
 return <div className="login">

  <div className="configCard">

   <div className="brand">
    <ShieldCheck size={34}/>
    <span>Conta não liberada</span>
   </div>

   <h2>
    Não foi possível carregar seu perfil
   </h2>

   <p>{message}</p>

   <div className="inline">

    <button
     className="primary"
     onClick={reload}
    >
     Tentar novamente
    </button>

    <button
     className="secondary"
     onClick={signOut}
    >
     Sair
    </button>

   </div>

  </div>

 </div>
}


function Login({
 login,
 setLogin,
 signIn,
 error
}){
 return <div className="login">

  <form onSubmit={signIn}>

   <div className="brand">
    <Car size={34}/>
    <span>Garagem GRAU CAR 096</span>
   </div>

   <h2>Acesso ao sistema</h2>

   <p className="loginIntro">
    Entre com seu usuário autorizado.
   </p>

   <input
    type="email"
    autoComplete="username"
    required
    placeholder="Usuário"
    value={login.email}
    onChange={e=>
     setLogin({
      ...login,
      email:e.target.value
     })
    }
   />

   <input
    type="password"
    autoComplete="current-password"
    required
    placeholder="Senha"
    value={login.password}
    onChange={e=>
     setLogin({
      ...login,
      password:e.target.value
     })
    }
   />

   {error&&
    <div className="error">
     {error}
    </div>
   }

   <button type="submit">
    Entrar
   </button>

   <button
    type="button"
    className="secondary"
    style={{
     width:'100%',
     justifyContent:'center',
     textAlign:'center'
    }}
    onClick={()=>{
     window.location.href='/';
    }}
   >
    Voltar ao site
   </button>

   <small>
    O acesso é obrigatório. Usuários e permissões são
    controlados pelo sistema.
   </small>

  </form>

 </div>
}


function Sidebar({
 tab,
 setTab,
 role,
 signOut
}){

 const all=[
  ['dashboard',ClipboardList,'Dashboard'],
  ['clientes',Users,'Clientes'],
  ['veiculos',Car,'Veículos'],
  ['servicos',Wrench,'Serviços'],
  ['historico',ClipboardList,'Histórico'],
  ['agendamentos',CalendarDays,'Agendamentos'],
  ['equipe',UserRoundCog,'Equipe'],
  ['caixa',Wallet,'Caixa'],
  ['relatorios',FileDown,'Relatórios'],
  ['usuarios',ShieldCheck,'Usuários'],
  ['auditoria',ShieldCheck,'Auditoria']
 ];

 const managerOnly=new Set([
  'servicos',
  'equipe',
  'caixa',
  'relatorios',
  'usuarios',
  'auditoria'
 ]);

 const items=all.filter(
  ([id])=>
   ['administrador','gerente'].includes(role)||
   !managerOnly.has(id)
 );

 return <aside>

  <div className="logo">
   <img
    src={logoGraucar}
    alt="Grau Car Garagem"
    className="grauCarLogo"
   />
  </div>

  <nav>

   {items.map(([id,I,l])=>
    <button
     className={tab===id?'active':''}
     onClick={()=>setTab(id)}
     key={id}
    >
     <I size={19}/>
     {l}
    </button>
   )}

  </nav>

  <div className="asideBottom">

   <span>
    Perfil: {role}
   </span>

   <button
    type="button"
    onClick={()=>{
     window.location.href='/';
    }}
   >
    <Car size={18}/>
    Voltar ao site
   </button>

   <button onClick={signOut}>
    <LogOut size={18}/>
    Sair
   </button>

  </div>

 </aside>
}


/* =========================================================
   COMPONENTES GERAIS
========================================================= */

function Panel({
 title,
 action,
 children
}){
 return <div className="panel">

  <div className="panelHead">
   <h3>{title}</h3>
   {action||null}
  </div>

  {children}

 </div>
}


function Table({
 headers=[],
 children
}){
 return <div className="tableWrap">

  <table>

   <thead>
    <tr>
     {headers.map((h,i)=>
      <th key={`${h}-${i}`}>
       {h}
      </th>
     )}
    </tr>
   </thead>

   <tbody>
    {children}
   </tbody>

  </table>

 </div>
}


function Actions({
 onView,
 onEdit,
 onDelete
}){
 return <div className="actions">

  {onView&&
   <button
    type="button"
    title="Visualizar"
    onClick={onView}
   >
    <Eye size={16}/>
   </button>
  }

  {onEdit&&
   <button
    type="button"
    title="Editar"
    onClick={onEdit}
   >
    <Edit3 size={16}/>
   </button>
  }

  {onDelete&&
   <button
    type="button"
    className="danger"
    title="Excluir"
    onClick={onDelete}
   >
    <Trash2 size={16}/>
   </button>
  }

 </div>
}


function Modal({
 title,
 onClose,
 children
}){
 return <div
  className="modalBack"
  onMouseDown={e=>{
   if(e.target===e.currentTarget){
    onClose?.();
   }
  }}
 >

  <div className="modal">

   <div className="modalHead">
    <h3>{title}</h3>

    <button
     type="button"
     title="Fechar"
     onClick={onClose}
    >
     <X size={18}/>
    </button>
   </div>

   {children}

  </div>

 </div>
}


function FormGrid({
 f,
 setF,
 fields=[]
}){
 return <div className="formGrid">

  {fields.map(
   ([key,placeholder,type='text'])=>
    <input
     key={key}
     type={type}
     placeholder={placeholder}
     value={f?.[key]??''}
     onChange={e=>
      setF({
       ...f,
       [key]:e.target.value
      })
     }
    />
  )}

 </div>
}


function SearchBox({
 value,
 onChange,
 placeholder
}){
 return <div className="searchBox">

  <Search size={18}/>

  <input
   value={value}
   onChange={e=>onChange(e.target.value)}
   placeholder={placeholder}
  />

  {value&&
   <button
    type="button"
    onClick={()=>onChange('')}
   >
    <X size={16}/>
   </button>
  }

 </div>
}


function Card({t,v}){
 return <div className="card">
  <span>{t}</span>
  <strong>{v}</strong>
 </div>
}


function Status({value}){
 return <span className={`status ${value}`}>
  {String(value||'-').replaceAll('_',' ')}
 </span>
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
 clients,
 vehicles,
 services,
 orders,
 appointments
}){

 const today=
  new Date().toISOString().slice(0,10);

 const completedOrders=
  orders.filter(o=>o.status==='concluido');

 const todayOrders=
  completedOrders.filter(
   o=>
    String(
     o.completed_at||o.created_at
    ).slice(0,10)===today
  );

 const revenue=
  completedOrders.reduce(
   (s,o)=>
    s+
    Number(
     o.charged_amount||
     finalPrice(
      services.find(
       x=>x.id===o.service_id
      )
     )||
     0
    ),
   0
  );

 return <section>

  <div className="cards">

   <Card
    t="Clientes"
    v={clients.length}
   />

   <Card
    t="Veículos"
    v={vehicles.length}
   />

   <Card
    t="Agendamentos"
    v={
     appointments.filter(
      a=>a.status!=='concluido'
     ).length
    }
   />

   <Card
    t="Serviços hoje"
    v={todayOrders.length}
   />

   <Card
    t="Faturamento registrado"
    v={money(revenue)}
   />

  </div>


  <Panel title="Próximos agendamentos">

   <Table
    headers={[
     'Data/Hora',
     'Cliente',
     'Veículo',
     'Serviço',
     'Status'
    ]}
   >

    {appointments
     .filter(
      a=>a.status!=='concluido'
     )
     .slice(0,8)
     .map(a=>
      <tr key={a.id}>

       <td>
        {dt(a.scheduled_at)}
       </td>

       <td>
        {
         clients.find(
          c=>c.id===a.client_id
         )?.name||'-'
        }
       </td>

       <td>
        {
         vehicles.find(
          v=>v.id===a.vehicle_id
         )?.plate||'-'
        }
       </td>

       <td>
        {
         services.find(
          s=>s.id===a.service_id
         )?.name||'-'
        }
       </td>

       <td>
        <Status value={a.status}/>
       </td>

      </tr>
     )
    }

   </Table>

  </Panel>

 </section>
}
/* =========================================================
   CLIENTES
========================================================= */

function Clients({
 clients,
 vehicles,
 orders,
 services,
 employees,
 canWrite,
 insert,
 update,
 remove,
 setClients
}){

 const empty={
  name:'',
  phone:'',
  email:'',
  document:''
 };

 const [f,setF]=useState(empty);
 const [edit,setEdit]=useState(null);
 const [search,setSearch]=useState('');
 const [detail,setDetail]=useState(null);

 function closeEdit(){
  setEdit(null);
  setF(empty);
 }

 async function save(){

  if(!f.name){
   return alert('Informe o nome do cliente.');
  }

  if(edit){
   await update(
    'clients',
    edit,
    {...f},
    setClients,
    'Editou cliente'
   );
  }else{
   await insert(
    'clients',
    f,
    setClients,
    'Cadastrou cliente'
   );
  }

  setF(empty);
  setEdit(null);
 }

 const q=search.trim().toLowerCase();

 const filtered=clients.filter(c=>
  !q||
  [c.name,c.phone,c.email,c.document]
   .some(x=>
    String(x||'').toLowerCase().includes(q)
   )
 );

 const client=
  clients.find(c=>c.id===detail);

 const clientVehicles=
  vehicles.filter(v=>v.client_id===detail);

 const history=orders
  .filter(o=>
   clientVehicles.some(
    v=>v.id===o.vehicle_id
   )
  )
  .sort(
   (a,b)=>
    new Date(b.completed_at||b.created_at)-
    new Date(a.completed_at||a.created_at)
  );

 return <section>

  <Panel
   title="Clientes"
   action={
    canWrite&&!edit&&
    <button
     className="primary"
     onClick={save}
    >
     <Save size={17}/>
     Cadastrar
    </button>
   }
  >

   {!edit&&
    <FormGrid
     f={f}
     setF={setF}
     fields={[
      ['name','Nome completo'],
      ['phone','Telefone'],
      ['email','E-mail'],
      ['document','CPF/CNPJ']
     ]}
    />
   }

   <SearchBox
    value={search}
    onChange={setSearch}
    placeholder="Pesquisar cliente por nome, telefone, e-mail ou documento"
   />

   <Table
    headers={[
     'Nome',
     'Telefone',
     'E-mail',
     'Documento',
     'Ações'
    ]}
   >

    {filtered.map(r=>
     <tr key={r.id}>

      <td>{r.name}</td>
      <td>{r.phone||'-'}</td>
      <td>{r.email||'-'}</td>
      <td>{r.document||'-'}</td>

      <td>
       <Actions
        onView={()=>setDetail(r.id)}

        onEdit={
         canWrite
          ?()=>{
            setEdit(r.id);

            setF({
             name:r.name||'',
             phone:r.phone||'',
             email:r.email||'',
             document:r.document||''
            });
           }
          :null
        }

        onDelete={
         canWrite
          ?()=>remove(
            'clients',
            r.id,
            setClients,
            'Excluiu cliente'
           )
          :null
        }
       />
      </td>

     </tr>
    )}

   </Table>

  </Panel>


  {edit&&
   <Modal
    title="Editar cliente"
    onClose={closeEdit}
   >

    <FormGrid
     f={f}
     setF={setF}
     fields={[
      ['name','Nome completo'],
      ['phone','Telefone'],
      ['email','E-mail'],
      ['document','CPF/CNPJ']
     ]}
    />

    <div className="inline">

     <button
      className="primary"
      onClick={save}
     >
      <Save size={17}/>
      Salvar alterações
     </button>

     <button
      className="secondary"
      onClick={closeEdit}
     >
      Cancelar
     </button>

    </div>

   </Modal>
  }


  {client&&
   <Modal
    title={`Cliente: ${client.name}`}
    onClose={()=>setDetail(null)}
   >

    <div className="detailGrid">

     <div>
      <b>Telefone</b>
      <span>{client.phone||'-'}</span>
     </div>

     <div>
      <b>E-mail</b>
      <span>{client.email||'-'}</span>
     </div>

     <div>
      <b>Documento</b>
      <span>{client.document||'-'}</span>
     </div>

     <div>
      <b>Veículos</b>
      <span>
       {clientVehicles
        .map(v=>v.plate)
        .join(', ')||'-'
       }
      </span>
     </div>

    </div>

    <h4>
     Histórico de serviços solicitados
    </h4>

    {history.length===0
     ?<p className="hint">
       Nenhum serviço registrado para este cliente.
      </p>

     :<Table
       headers={[
        'Data',
        'Veículo',
        'Serviço',
        'Funcionário',
        'Valor',
        'Status'
       ]}
      >

       {history.map(o=>{

        const v=
         vehicles.find(
          x=>x.id===o.vehicle_id
         );

        const sv=
         services.find(
          x=>x.id===o.service_id
         );

        const e=
         employees.find(
          x=>x.id===o.employee_id
         );

        return <tr key={o.id}>

         <td>
          {dt(
           o.completed_at||
           o.created_at
          )}
         </td>

         <td>
          {v?.plate||'-'} · {v?.brand||''} {v?.model||''}
         </td>

         <td>
          {sv?.name||'-'}
         </td>

         <td>
          {e?.name||o.performed_by||'-'}
         </td>

         <td>
          {money(
           o.charged_amount||
           finalPrice(sv)
          )}
         </td>

         <td>
          <Status value={o.status}/>
         </td>

        </tr>;
       })}

      </Table>
    }

   </Modal>
  }

 </section>;
}


/* =========================================================
   VEÍCULOS
========================================================= */

function Vehicles({
 vehicles,
 clients,
 orders,
 services,
 vehicleCategories,
 images,
 canWrite,
 canAdmin,
 insert,
 update,
 remove,
 setVehicles,
 setVehicleCategories
}){

 const empty={
  client_id:'',
  category_id:'',
  plate:'',
  brand:'',
  model:'',
  color:'',
  year:''
 };

 const [f,setF]=useState(empty);
 const [edit,setEdit]=useState(null);
 const [detail,setDetail]=useState(null);
 const [search,setSearch]=useState('');
 const [categoryName,setCategoryName]=useState('');

 function closeEdit(){
  setEdit(null);
  setF(empty);
 }

 async function save(){

  if(
   !f.client_id||
   !f.plate||
   !f.category_id
  ){
   return alert(
    'Informe cliente, placa e categoria do veículo.'
   );
  }

  if(edit){

   await update(
    'vehicles',
    edit,
    f,
    setVehicles,
    'Editou veículo'
   );

  }else{

   await insert(
    'vehicles',
    f,
    setVehicles,
    'Cadastrou veículo'
   );

  }

  setF(empty);
  setEdit(null);
 }


 async function addCategory(){

  const name=
   categoryName.trim().toUpperCase();

  if(!name){
   return alert(
    'Informe o nome da categoria.'
   );
  }

  if(
   vehicleCategories.some(
    c=>
     String(c.name)
      .toLowerCase()===
     name.toLowerCase()
   )
  ){
   return alert(
    'Essa categoria já está cadastrada.'
   );
  }

  const row=await insert(
   'vehicle_categories',
   {name},
   setVehicleCategories,
   'Cadastrou categoria de veículo'
  );

  if(row){
   setCategoryName('');
  }
 }


 const q=
  search.trim().toLowerCase();

 const filtered=
  vehicles.filter(v=>{

   const c=
    clients.find(
     x=>x.id===v.client_id
    );

   const cat=
    vehicleCategories.find(
     x=>x.id===v.category_id
    );

   return !q||
    [
     v.plate,
     v.brand,
     v.model,
     v.color,
     v.year,
     c?.name,
     cat?.name
    ].some(
     x=>
      String(x||'')
       .toLowerCase()
       .includes(q)
    );

  });


 const vehicle=
  vehicles.find(v=>v.id===detail);


 const vehicleFields=
  <div className="formGrid">

   <select
    value={f.client_id}
    onChange={e=>
     setF({
      ...f,
      client_id:e.target.value
     })
    }
   >
    <option value="">
     Cliente
    </option>

    {clients.map(c=>
     <option
      value={c.id}
      key={c.id}
     >
      {c.name}
     </option>
    )}
   </select>


   <select
    value={f.category_id}
    onChange={e=>
     setF({
      ...f,
      category_id:e.target.value
     })
    }
   >
    <option value="">
     Categoria do veículo
    </option>

    {vehicleCategories.map(c=>
     <option
      value={c.id}
      key={c.id}
     >
      {c.name}
     </option>
    )}
   </select>


   {[
    'plate',
    'brand',
    'model',
    'color',
    'year'
   ].map(k=>
    <input
     key={k}
     placeholder={{
      plate:'Placa',
      brand:'Marca',
      model:'Modelo',
      color:'Cor',
      year:'Ano'
     }[k]}
     value={f[k]}
     onChange={e=>
      setF({
       ...f,
       [k]:e.target.value
      })
     }
    />
   )}

  </div>;


 return <section>

  {canAdmin&&
   <Panel
    title="Categorias de veículos"
    action={
     <button
      className="primary"
      onClick={addCategory}
     >
      <Plus size={17}/>
      Cadastrar categoria
     </button>
    }
   >

    <div className="categoryCreate">

     <input
      placeholder="Ex.: SUV, PICKUP, RET, SEDAN, MOTO..."
      value={categoryName}
      onChange={e=>
       setCategoryName(e.target.value)
      }
      onKeyDown={e=>{
       if(e.key==='Enter'){
        e.preventDefault();
        addCategory();
       }
      }}
     />

    </div>


    {vehicleCategories.length===0
     ?<p className="hint">
       Cadastre pelo menos uma categoria antes de cadastrar veículos e serviços.
      </p>

     :<div className="categoryChips">

       {vehicleCategories.map(cat=>
        <span key={cat.id}>

         {cat.name}

         <button
          type="button"
          title="Excluir categoria"
          onClick={()=>
           remove(
            'vehicle_categories',
            cat.id,
            setVehicleCategories,
            'Excluiu categoria de veículo'
           )
          }
         >
          <X size={14}/>
         </button>

        </span>
       )}

      </div>
    }

    <p className="hint">
     Uma categoria vinculada a veículos ou serviços não poderá ser excluída até que esses vínculos sejam alterados.
    </p>

   </Panel>
  }


  <Panel
   title="Veículos"
   action={
    canWrite&&!edit&&
    <button
     className="primary"
     onClick={save}
    >
     <Save size={17}/>
     Cadastrar
    </button>
   }
  >

   {!edit&&vehicleFields}

   <SearchBox
    value={search}
    onChange={setSearch}
    placeholder="Pesquisar por placa, marca, modelo, categoria, ano ou cliente"
   />

   <Table
    headers={[
     'Placa',
     'Marca/Modelo',
     'Categoria',
     'Cor',
     'Ano',
     'Cliente',
     'Ações'
    ]}
   >

    {filtered.map(r=>
     <tr key={r.id}>

      <td>
       <b>{r.plate}</b>
      </td>

      <td>
       {r.brand} {r.model}
      </td>

      <td>
       <b>
        {
         vehicleCategories.find(
          c=>c.id===r.category_id
         )?.name||'Sem categoria'
        }
       </b>
      </td>

      <td>{r.color||'-'}</td>

      <td>{r.year||'-'}</td>

      <td>
       {
        clients.find(
         c=>c.id===r.client_id
        )?.name||'-'
       }
      </td>

      <td>
       <Actions
        onView={()=>setDetail(r.id)}

        onEdit={
         canWrite
          ?()=>{
            setEdit(r.id);

            setF({
             client_id:r.client_id||'',
             category_id:r.category_id||'',
             plate:r.plate||'',
             brand:r.brand||'',
             model:r.model||'',
             color:r.color||'',
             year:r.year||''
            });
           }
          :null
        }

        onDelete={
         canWrite
          ?()=>remove(
            'vehicles',
            r.id,
            setVehicles,
            'Excluiu veículo'
           )
          :null
        }
       />
      </td>

     </tr>
    )}

   </Table>

  </Panel>


  {edit&&
   <Modal
    title="Editar veículo"
    onClose={closeEdit}
   >

    {vehicleFields}

    <div className="inline">

     <button
      className="primary"
      onClick={save}
     >
      <Save size={17}/>
      Salvar alterações
     </button>

     <button
      className="secondary"
      onClick={closeEdit}
     >
      Cancelar
     </button>

    </div>

   </Modal>
  }


  {vehicle&&
   <VehicleDetail
    vehicle={vehicle}
    category={
     vehicleCategories.find(
      c=>c.id===vehicle.category_id
     )
    }
    client={
     clients.find(
      c=>c.id===vehicle.client_id
     )
    }
    orders={
     orders.filter(
      o=>o.vehicle_id===vehicle.id
     )
    }
    services={services}
    images={images}
    onClose={()=>setDetail(null)}
   />
  }

 </section>;
}


function VehicleDetail({
 vehicle,
 category,
 client,
 orders,
 services,
 images,
 onClose
}){

 return <Modal
  title={`Veículo ${vehicle.plate}`}
  onClose={onClose}
 >

  <div className="detailGrid">

   <div>
    <b>Cliente</b>
    <span>{client?.name||'-'}</span>
   </div>

   <div>
    <b>Veículo</b>
    <span>
     {vehicle.brand} {vehicle.model}
    </span>
   </div>

   <div>
    <b>Categoria</b>
    <span>
     {category?.name||'Sem categoria'}
    </span>
   </div>

   <div>
    <b>Cor/Ano</b>
    <span>
     {vehicle.color||'-'} · {vehicle.year||'-'}
    </span>
   </div>

  </div>

  <h4>Histórico de serviços</h4>

  {orders.length===0
   ?<p className="hint">
     Nenhum serviço registrado.
    </p>

   :orders.map(o=>{

    const pics=
     images.filter(
      i=>i.service_order_id===o.id
     );

    return <div
     className="serviceDetail"
     key={o.id}
    >

     <div>

      <b>
       {
        services.find(
         s=>s.id===o.service_id
        )?.name||'Serviço'
       }
      </b>

      <span>
       {dt(o.completed_at||o.created_at)}
       {' · '}
       {o.performed_by||'-'}
      </span>

      <p>
       {o.notes||'Sem observações.'}
      </p>

     </div>

     {pics.length>0&&
      <div className="gallery">

       {pics.map(i=>{

        const isImage=
         /\.(png|jpe?g|gif|webp|bmp|svg)$/i
          .test(i.file_name||'');

        return <a
         key={i.id}
         href={i.image_url}
         target="_blank"
         rel="noreferrer"
        >

         {isImage
          ?<img
            src={i.image_url}
            alt={i.file_name||'Imagem do serviço'}
           />

          :<span className="fileLink">
            {i.file_name||'Abrir arquivo'}
           </span>
         }

        </a>;
       })}

      </div>
     }

    </div>;
   })
  }

 </Modal>;
}


/* =========================================================
   SERVIÇOS
========================================================= */

function Services({
 services,
 vehicleCategories,
 canAdmin,
 insert,
 update,
 remove,
 setServices
}){

 const empty={
  name:'',
  category_id:'',
  price:'',
  discount_percent:'0',
  description:''
 };

 const [f,setF]=useState(empty);
 const [edit,setEdit]=useState(null);

 function closeEdit(){
  setEdit(null);
  setF(empty);
 }

 async function save(){

  if(
   !f.name||
   !f.category_id||
   f.price===''
  ){
   return alert(
    'Informe nome, categoria do veículo e preço.'
   );
  }

  const p={
   ...f,
   price:Number(f.price),
   discount_percent:
    Number(f.discount_percent||0)
  };

  if(edit){

   await update(
    'service_types',
    edit,
    p,
    setServices,
    'Editou tipo de serviço'
   );

  }else{

   await insert(
    'service_types',
    p,
    setServices,
    'Cadastrou tipo de serviço'
   );

  }

  setF(empty);
  setEdit(null);
 }


 const serviceFields=
  <div className="formGrid">

   <input
    placeholder="Nome do serviço"
    value={f.name}
    onChange={e=>
     setF({
      ...f,
      name:e.target.value
     })
    }
   />

   <select
    value={f.category_id}
    onChange={e=>
     setF({
      ...f,
      category_id:e.target.value
     })
    }
   >
    <option value="">
     Categoria do veículo
    </option>

    {vehicleCategories.map(c=>
     <option
      key={c.id}
      value={c.id}
     >
      {c.name}
     </option>
    )}
   </select>

   <input
    type="number"
    min="0"
    step="0.01"
    placeholder="Preço (R$)"
    value={f.price}
    onChange={e=>
     setF({
      ...f,
      price:e.target.value
     })
    }
   />

   <input
    type="number"
    min="0"
    max="100"
    step="1"
    placeholder="Desconto (%)"
    value={f.discount_percent}
    onChange={e=>
     setF({
      ...f,
      discount_percent:e.target.value
     })
    }
   />

   <input
    placeholder="Descrição"
    value={f.description}
    onChange={e=>
     setF({
      ...f,
      description:e.target.value
     })
    }
   />

  </div>;


 return <section>

  <Panel
   title="Tipos de serviços"
   action={
    canAdmin&&!edit&&
    <button
     className="primary"
     onClick={save}
    >
     <Save size={17}/>
     Cadastrar
    </button>
   }
  >

   {!edit&&serviceFields}

   {vehicleCategories.length===0&&
    <p className="hint">
     Cadastre primeiro uma categoria na aba Veículos.
    </p>
   }

   <Table
    headers={[
     'Serviço',
     'Categoria',
     'Preço',
     'Desconto',
     'Preço final',
     'Ações'
    ]}
   >

    {services.map(r=>
     <tr key={r.id}>

      <td>{r.name}</td>

      <td>
       <b>
        {
         vehicleCategories.find(
          c=>c.id===r.category_id
         )?.name||'Sem categoria'
        }
       </b>
      </td>

      <td>{money(r.price)}</td>

      <td>
       {r.discount_percent||0}%
      </td>

      <td>
       <b>{money(finalPrice(r))}</b>
      </td>

      <td>
       {canAdmin&&
        <Actions
         onEdit={()=>{
          setEdit(r.id);

          setF({
           name:r.name||'',
           category_id:r.category_id||'',
           price:r.price||'',
           discount_percent:
            r.discount_percent||0,
           description:r.description||''
          });
         }}

         onDelete={()=>
          remove(
           'service_types',
           r.id,
           setServices,
           'Excluiu tipo de serviço'
          )
         }
        />
       }
      </td>

     </tr>
    )}

   </Table>

  </Panel>


  {edit&&
   <Modal
    title="Editar serviço"
    onClose={closeEdit}
   >

    {serviceFields}

    <div className="inline">

     <button
      className="primary"
      onClick={save}
     >
      <Save size={17}/>
      Salvar alterações
     </button>

     <button
      className="secondary"
      onClick={closeEdit}
     >
      Cancelar
     </button>

    </div>

   </Modal>
  }

 </section>;
}


/* =========================================================
   HISTÓRICO
========================================================= */

function History({
 orders,
 vehicles,
 services,
 clients,
 employees,
 images,
 canDeleteHistory,
 setOrders,
 setPayments,
 setImages,
 addLog
}){

 const [search,setSearch]=useState('');
 const [dateFilter,setDateFilter]=useState('');


 async function deleteHistoryGroup(group){

  if(!canDeleteHistory)return;

  if(
   !confirm(
    'Tem certeza que deseja excluir este atendimento do histórico? Esta ação não poderá ser desfeita.'
   )
  )return;

  const ids=
   group.rows.map(r=>r.id);


  const {error:imgError}=
   await supabase
    .from('service_images')
    .delete()
    .in('service_order_id',ids);

  if(imgError){
   alert(imgError.message);
   return;
  }


  const {error:payError}=
   await supabase
    .from('payments')
    .delete()
    .in('service_order_id',ids);

  if(payError){
   alert(payError.message);
   return;
  }


  const {error}=
   await supabase
    .from('service_orders')
    .delete()
    .in('id',ids);

  if(error){
   alert(error.message);
   return;
  }


  const idSet=new Set(ids);

  // Isso também atualiza automaticamente o
  // histórico exibido dentro do cadastro do cliente.
  setOrders(current=>
   current.filter(
    r=>!idSet.has(r.id)
   )
  );

  setPayments(current=>
   current.filter(
    r=>!idSet.has(r.service_order_id)
   )
  );

  setImages(current=>
   current.filter(
    r=>!idSet.has(r.service_order_id)
   )
  );


  if(addLog){
   await addLog(
    'Excluiu atendimento do histórico',
    'service_orders',
    ids[0]||null
   );
  }
 }


 const historyGroups=
  Object.values(
   orders
    .filter(o=>o.status==='concluido')
    .reduce((acc,o)=>{

     const key=
      o.atendimento_id||o.id;

     if(!acc[key]){
      acc[key]={
       key,
       rows:[],
       created_at:
        o.completed_at||
        o.created_at
      };
     }

     acc[key].rows.push(o);

     const d=
      o.completed_at||
      o.created_at;

     if(
      new Date(d)>
      new Date(acc[key].created_at)
     ){
      acc[key].created_at=d;
     }

     return acc;

    },{})
  )
  .sort(
   (a,b)=>
    new Date(b.created_at)-
    new Date(a.created_at)
  );


 const q=
  search.trim().toLowerCase();


 const filteredHistory=
  historyGroups.filter(g=>{

   const first=g.rows[0];

   const v=
    vehicles.find(
     x=>x.id===first.vehicle_id
    );

   const c=
    clients.find(
     x=>x.id===v?.client_id
    );

   const serviceNames=
    g.rows.map(
     o=>
      services.find(
       s=>s.id===o.service_id
      )?.name||''
    ).join(' ');

   const employeeNames=
    g.rows.map(
     o=>
      employees.find(
       e=>e.id===o.employee_id
      )?.name||
      o.performed_by||
      ''
    ).join(' ');

   const haystack=
    `${c?.name||''} ${v?.plate||''} ${v?.brand||''} ${v?.model||''} ${serviceNames} ${employeeNames}`
     .toLowerCase();

   const filterIso=
    brDateToIso(dateFilter);

   return (
    !q||
    haystack.includes(q)
   )&&(
    !dateFilter||
    !filterIso||
    String(g.created_at)
     .slice(0,10)===filterIso
   );

  });


 const headers=[
  'Data/Hora',
  'Cliente',
  'Veículo',
  'Serviços',
  'Funcionário',
  'Valor',
  'Arquivos'
 ];

 if(canDeleteHistory){
  headers.push('Ações');
 }


 return <section>

  <Panel title="Pesquisar histórico de serviços realizados">

   <div className="filterGrid historyFilters">

    <SearchBox
     value={search}
     onChange={setSearch}
     placeholder="Cliente, placa, veículo, serviço ou funcionário"
    />

    <input
     className="historyDateFilter"
     type="text"
     inputMode="numeric"
     placeholder="DD/MM/AAAA"
     maxLength={10}
     value={dateFilter}
     onChange={e=>
      setDateFilter(
       maskDateBR(e.target.value)
      )
     }
    />

    <button
     className="secondary historyClearBtn"
     onClick={()=>{
      setSearch('');
      setDateFilter('');
     }}
    >
     <X size={16}/>
     Limpar
    </button>

   </div>

  </Panel>


  <Panel title="Histórico de serviços realizados">

   {filteredHistory.length===0
    ?<p className="hint">
      Nenhum serviço realizado encontrado.
     </p>

    :<Table headers={headers}>

      {filteredHistory.map(g=>{

       const first=g.rows[0];

       const v=
        vehicles.find(
         x=>x.id===first.vehicle_id
        );

       const c=
        clients.find(
         x=>x.id===v?.client_id
        );

       const total=
        g.rows.reduce(
         (sum,o)=>
          sum+
          Number(o.charged_amount||0),
         0
        );

       const employeeNames=[
        ...new Set(
         g.rows.map(
          o=>
           employees.find(
            e=>e.id===o.employee_id
           )?.name||
           o.performed_by||
           '-'
         )
        )
       ].join(', ');

       const ids=
        new Set(
         g.rows.map(r=>r.id)
        );

       const files=
        images.filter(
         i=>ids.has(i.service_order_id)
        );

       return <tr key={g.key}>

        <td>{dt(g.created_at)}</td>

        <td>{c?.name||'-'}</td>

        <td>
         {v?.plate||'-'} · {v?.brand||''} {v?.model||''}
        </td>

        <td>
         <div className="serviceTags">
          {g.rows.map(o=>
           <span key={o.id}>
            {
             services.find(
              s=>s.id===o.service_id
             )?.name||'-'
            }
           </span>
          )}
         </div>
        </td>

        <td>{employeeNames}</td>

        <td>
         <b>{money(total)}</b>
        </td>

        <td>
         {files.length
          ?<div className="serviceTags">

            {files.map(file=>
             <a
              key={file.id}
              href={file.image_url}
              target="_blank"
              rel="noreferrer"
             >
              {file.file_name||'Abrir arquivo'}
             </a>
            )}

           </div>

          :'-'
         }
        </td>

        {canDeleteHistory&&
         <td>
          <button
           className="danger"
           title="Excluir do histórico"
           onClick={()=>
            deleteHistoryGroup(g)
           }
          >
           <Trash2 size={16}/>
           Excluir
          </button>
         </td>
        }

       </tr>;
      })}

     </Table>
   }

  </Panel>

 </section>;
}


/* =========================================================
   AGENDAMENTOS
========================================================= */

function Appointments({
 appointments,
 appointmentFiles,
 clients,
 vehicles,
 services,
 vehicleCategories,
 employees,
 paymentMethods,
 canWrite,
 profile,
 insert,
 uploadImages,
 uploadAppointmentFiles,
 setAppointments,
 setAppointmentFiles,
 setOrders,
 setPayments,
 setImages
}){

 const empty={
  client_id:'',
  vehicle_id:'',
  service_ids:[],
  scheduled_at:'',
  scheduled_date:'',
  scheduled_time:'',
  employee_id:'',
  notes:'',
  status:'agendado',
  discount_percent:'',
  charged_amount:'',
  payment_method_id:'',
  files:null,
  appointment_group_id:''
 };


 const [f,setF]=useState(empty);

 const [edit,setEdit]=useState(null);

 const [filters,setFilters]=useState({
  date:'',
  client:'',
  vehicle:'',
  service:'',
  employee:''
 });

 const [formKey,setFormKey]=useState(0);


 const available=
  vehicles.filter(
   v=>
    !f.client_id||
    v.client_id===f.client_id
  );


 const selectedVehicle=
  vehicles.find(
   v=>v.id===f.vehicle_id
  );


 const availableServices=
  selectedVehicle?.category_id
   ?services.filter(
     s=>
      s.category_id===
      selectedVehicle.category_id
    )
   :[];


 const currentFiles=
  edit&&f.appointment_group_id
   ?appointmentFiles.filter(
     x=>
      x.appointment_group_id===
      f.appointment_group_id
    )
   :[];


 function serviceSubtotal(
  ids=f.service_ids
 ){
  return ids.reduce(
   (sum,id)=>
    sum+
    Number(
     finalPrice(
      services.find(
       s=>s.id===id
      )
     )||0
    ),
   0
  );
 }


 function totalWithDiscount(
  ids=f.service_ids,
  discount=f.discount_percent
 ){

  return Number(
   (
    serviceSubtotal(ids)*
    (
     1-
     Math.min(
      100,
      Math.max(
       0,
       Number(discount)||0
      )
     )/100
    )
   ).toFixed(2)
  );
 }


 function clearForm(){

  setF({...empty});
  setEdit(null);
  setFormKey(k=>k+1);

 }


 async function notifyAppointmentCompletion(
  rows,
  total
 ){

  if(!rows?.length)return;

  const v=
   vehicles.find(
    x=>x.id===rows[0].vehicle_id
   );

  const c=
   clients.find(
    x=>x.id===v?.client_id
   );

  if(!c?.email&&!c?.phone)return;


  const doneServices=
   rows.map(r=>({
    name:
     services.find(
      s=>s.id===r.service_id
     )?.name||'Serviço',

    price:
     Number(r.charged_amount||0)
   }));


  try{

   const {data,error}=
    await supabase.functions.invoke(
     'service-completed-notification',
     {
      body:{
       clientName:c?.name,
       clientEmail:c?.email||'',
       clientPhone:
        safePhone(c?.phone),

       vehicle:
        `${v?.brand||''} ${v?.model||''} - ${v?.plate||''}`,

       services:doneServices,

       total:Number(total||0)
      }
     }
    );

   if(error){
    console.warn(
     'Erro ao enviar notificação do agendamento:',
     error.message
    );
   }else if(data?.error){
    console.warn(
     'Erro ao enviar notificação do agendamento:',
     data.error
    );
   }

  }catch(e){

   console.warn(
    'Notificação automática do agendamento não configurada:',
    e.message
   );

  }
 }


 async function removeAppointmentRows(ids){

  if(!ids?.length)return true;

  const {error}=
   await supabase
    .from('appointments')
    .delete()
    .in('id',ids);

  if(error){
   alert(error.message);
   return false;
  }

  const idSet=new Set(ids);

  setAppointments(x=>
   x.filter(
    r=>!idSet.has(r.id)
   )
  );

  return true;
 }


 async function deleteAppointmentFile(file){

  if(
   !confirm(
    `Excluir o arquivo ${file.file_name||''}?`
   )
  )return;


  if(file.storage_path){

   const {error:storageError}=
    await supabase
     .storage
     .from('service-images')
     .remove([file.storage_path]);

   if(storageError){
    alert(storageError.message);
    return;
   }
  }


  const {error}=
   await supabase
    .from('appointment_files')
    .delete()
    .eq('id',file.id);

  if(error){
   alert(error.message);
   return;
  }


  setAppointmentFiles(x=>
   x.filter(
    r=>r.id!==file.id
   )
  );
 }


 async function moveStoredFilesToHistory(
  groupId,
  orderId
 ){

  if(!groupId||!orderId)return;


  const stored=
   appointmentFiles.filter(
    x=>
     x.appointment_group_id===
     groupId
   );


  for(const file of stored){

   const {data,error}=
    await supabase
     .from('service_images')
     .insert({
      service_order_id:orderId,
      image_url:file.file_url,
      file_name:file.file_name
     })
     .select()
     .single();

   if(error){
    alert(error.message);
    continue;
   }

   if(data){
    setImages(x=>[data,...x]);
   }
  }


  if(stored.length){

   const {error}=
    await supabase
     .from('appointment_files')
     .delete()
     .eq(
      'appointment_group_id',
      groupId
     );

   if(!error){

    setAppointmentFiles(x=>
     x.filter(
      r=>
       r.appointment_group_id!==
       groupId
     )
    );

   }
  }
 }


 async function completeAppointment(
  groupId,
  oldIds=[]
 ){

  const selectedServices=
   services.filter(
    s=>
     f.service_ids.includes(s.id)
   );


  const subtotal=
   selectedServices.reduce(
    (sum,s)=>
     sum+
     Number(finalPrice(s)||0),
    0
   );


  const total=
   Number(
    f.charged_amount!==''
     ?f.charged_amount
     :totalWithDiscount()
   );


  const ratio=
   subtotal>0
    ?total/subtotal
    :1;


  const atendimentoId=
   crypto.randomUUID();

  const rows=[];


  for(const sv of selectedServices){

   const serviceAmount=
    Number(
     (
      Number(finalPrice(sv)||0)*
      ratio
     ).toFixed(2)
    );


   const row=
    await insert(
     'service_orders',
     {
      vehicle_id:f.vehicle_id,
      service_id:sv.id,
      atendimento_id:atendimentoId,
      employee_id:f.employee_id,
      performed_by:profile?.full_name,
      status:'concluido',
      notes:f.notes,
      charged_amount:serviceAmount,
      completed_at:
       new Date().toISOString()
     },
     setOrders,
     'Concluiu agendamento e enviou ao histórico'
    );


   if(!row)return false;

   rows.push(row);
  }


  if(!rows.length){
   return false;
  }


  await insert(
   'payments',
   {
    service_order_id:rows[0].id,
    payment_method_id:
     f.payment_method_id,
    amount:total,
    paid_at:
     new Date().toISOString()
   },
   setPayments,
   'Registrou pagamento do agendamento'
  );


  await moveStoredFilesToHistory(
   groupId,
   rows[0].id
  );


  await uploadImages(
   rows[0].id,
   f.files
  );


  if(
   oldIds.length&&
   !await removeAppointmentRows(oldIds)
  ){
   return false;
  }


  await notifyAppointmentCompletion(
   rows,
   total
  );

  return true;
 }


 async function save(){

  // NOVO: campos obrigatórios
  if(
   !f.client_id||
   !f.vehicle_id||
   !f.service_ids.length||
   !f.employee_id||
   !f.scheduled_date||
   !f.scheduled_time||
   f.charged_amount===''||
   !f.payment_method_id
  ){

   return alert(
    'Preencha todos os campos obrigatórios: cliente, veículo, serviço, funcionário responsável, data, hora, valor cobrado e forma de pagamento.'
   );

  }


  if(
   Number(f.charged_amount)<0
  ){
   return alert(
    'Informe um valor cobrado válido.'
   );
  }


  if(
   !/^\d{2}\/\d{2}\/\d{4}$/
    .test(f.scheduled_date)||
   !/^([01]\d|2[0-3]):[0-5]\d$/
    .test(f.scheduled_time)
  ){

   return alert(
    'Use data DD/MM/AAAA e hora HH:MM.'
   );

  }


  const [dia,mes,ano]=
   f.scheduled_date.split('/');


  const localDate=
   new Date(
    Number(ano),
    Number(mes)-1,
    Number(dia),
    Number(
     f.scheduled_time.slice(0,2)
    ),
    Number(
     f.scheduled_time.slice(3,5)
    )
   );


  if(
   Number.isNaN(localDate.getTime())||
   localDate.getDate()!==Number(dia)||
   localDate.getMonth()!==Number(mes)-1||
   localDate.getFullYear()!==Number(ano)
  ){

   return alert(
    'Data ou horário inválido.'
   );

  }


  const when=
   localDate.toISOString();


  const oldIds=
   edit
    ?String(edit).split('|')
    :[];


  const groupId=
   f.appointment_group_id||
   crypto.randomUUID();


  if(f.status==='concluido'){

   if(
    !confirm(
     'Confirmar este agendamento como Concluído? Ele sairá da agenda, será enviado ao Histórico, o pagamento será registrado e a notificação disponível será disparada ao cliente.'
    )
   )return;


   const ok=
    await completeAppointment(
     groupId,
     oldIds
    );


   if(ok){
    clearForm();
   }

   return;
  }


  const selectedServices=
   services.filter(
    s=>
     f.service_ids.includes(s.id)
   );


  const subtotal=
   selectedServices.reduce(
    (sum,s)=>
     sum+
     Number(finalPrice(s)||0),
    0
   );


  const total=
   Number(f.charged_amount);


  const ratio=
   subtotal>0
    ?total/subtotal
    :1;


  if(
   oldIds.length&&
   !await removeAppointmentRows(oldIds)
  ){
   return;
  }


  for(const sv of selectedServices){

   const serviceAmount=
    Number(
     (
      Number(finalPrice(sv)||0)*
      ratio
     ).toFixed(2)
    );


   const row=
    await insert(
     'appointments',
     {
      appointment_group_id:groupId,
      client_id:f.client_id,
      vehicle_id:f.vehicle_id,
      service_id:sv.id,
      employee_id:f.employee_id,
      scheduled_at:when,
      notes:f.notes,
      status:f.status,
      discount_percent:
       Number(f.discount_percent||0),
      charged_amount:serviceAmount,
      payment_method_id:
       f.payment_method_id
     },
     setAppointments,
     edit
      ?'Editou agendamento'
      :'Criou agendamento'
    );


   if(!row)return;
  }


  await uploadAppointmentFiles(
   groupId,
   f.files
  );


  clearForm();
 }


 const groups=
  Object.values(
   appointments
    .filter(
     a=>a.status!=='concluido'
    )
    .reduce((acc,a)=>{

     const key=
      a.appointment_group_id||
      [
       a.client_id,
       a.vehicle_id,
       a.scheduled_at,
       a.notes||'',
       a.status
      ].join('|');


     if(!acc[key]){

      acc[key]={
       ...a,
       key,
       appointment_group_id:
        a.appointment_group_id||'',
       ids:[],
       service_ids:[]
      };

     }


     acc[key].ids.push(a.id);

     acc[key].service_ids.push(
      a.service_id
     );

     return acc;

    },{})
  );


 const filtered=
  groups.filter(a=>{

   const c=
    clients.find(
     x=>x.id===a.client_id
    );

   const v=
    vehicles.find(
     x=>x.id===a.vehicle_id
    );

   const serviceNames=
    a.service_ids.map(
     id=>
      services.find(
       s=>s.id===id
      )?.name||''
    ).join(' ');

   const employeeName=
    employees.find(
     e=>e.id===a.employee_id
    )?.name||'';

   const filterIso=
    brDateToIso(filters.date);


   return (
    !filters.date||
    !filterIso||
    String(a.scheduled_at)
     .slice(0,10)===filterIso
   )&&(
    !filters.client||
    String(c?.name||'')
     .toLowerCase()
     .includes(
      filters.client.toLowerCase()
     )
   )&&(
    !filters.vehicle||
    `${v?.plate||''} ${v?.brand||''} ${v?.model||''}`
     .toLowerCase()
     .includes(
      filters.vehicle.toLowerCase()
     )
   )&&(
    !filters.service||
    serviceNames
     .toLowerCase()
     .includes(
      filters.service.toLowerCase()
     )
   )&&(
    !filters.employee||
    employeeName
     .toLowerCase()
     .includes(
      filters.employee.toLowerCase()
     )
   );

  });


 async function deleteGroup(a){

  if(
   !confirm(
    'Tem certeza que deseja excluir este agendamento?'
   )
  )return;


  const groupId=
   a.appointment_group_id;


  if(groupId){

   const files=
    appointmentFiles.filter(
     x=>
      x.appointment_group_id===
      groupId
    );


   const paths=
    files
     .map(x=>x.storage_path)
     .filter(Boolean);


   if(paths.length){

    const {error:storageError}=
     await supabase
      .storage
      .from('service-images')
      .remove(paths);

    if(storageError){
     alert(storageError.message);
     return;
    }
   }


   const {error:fileError}=
    await supabase
     .from('appointment_files')
     .delete()
     .eq(
      'appointment_group_id',
      groupId
     );


   if(fileError){
    alert(fileError.message);
    return;
   }


   setAppointmentFiles(x=>
    x.filter(
     r=>
      r.appointment_group_id!==
      groupId
    )
   );
  }


  await removeAppointmentRows(
   a.ids
  );
 }


 function editGroup(a){

  const d=
   new Date(a.scheduled_at);


  const total=
   a.ids.reduce(
    (sum,id)=>
     sum+
     Number(
      appointments.find(
       x=>x.id===id
      )?.charged_amount||0
     ),
    0
   );


  setEdit(
   a.ids.join('|')
  );


  setF({
   client_id:a.client_id,
   vehicle_id:a.vehicle_id,
   service_ids:[...a.service_ids],
   scheduled_at:a.scheduled_at,
   scheduled_date:
    d.toLocaleDateString('pt-BR'),
   scheduled_time:
    d.toLocaleTimeString(
     'pt-BR',
     {
      hour:'2-digit',
      minute:'2-digit',
      hour12:false
     }
    ),
   employee_id:a.employee_id||'',
   notes:a.notes||'',
   status:a.status,
   discount_percent:
    a.discount_percent??'',
   charged_amount:
    total||'',
   payment_method_id:
    a.payment_method_id||'',
   files:null,
   appointment_group_id:
    a.appointment_group_id||''
  });


  setFormKey(k=>k+1);
 }


 function appointmentFields(){

  return <div className="formGrid">

   <select
    value={f.client_id}
    onChange={e=>
     setF({
      ...f,
      client_id:e.target.value,
      vehicle_id:'',
      service_ids:[],
      discount_percent:'',
      charged_amount:''
     })
    }
   >

    <option value="">
     Cliente *
    </option>

    {clients.map(c=>
     <option
      key={c.id}
      value={c.id}
     >
      {c.name}
     </option>
    )}

   </select>


   <select
    value={f.vehicle_id}
    onChange={e=>
     setF({
      ...f,
      vehicle_id:e.target.value,
      service_ids:[],
      discount_percent:'',
      charged_amount:''
     })
    }
   >

    <option value="">
     Veículo *
    </option>

    {available.map(v=>{

     const cat=
      vehicleCategories.find(
       c=>c.id===v.category_id
      );

     return <option
      key={v.id}
      value={v.id}
     >
      {v.plate} · {v.brand} {v.model}
      {cat
       ?` · ${cat.name}`
       :' · SEM CATEGORIA'
      }
     </option>;
    })}

   </select>


   <div
    className="multi-services"
    key={formKey}
   >

    <details className="services-dropdown">

     <summary>
      {f.service_ids.length
       ?`${f.service_ids.length} serviço(s) selecionado(s) *`
       :'Serviços *'
      }
     </summary>

     <div className="services-dropdown-list">

      {availableServices.map(s=>{

       const selected=
        f.service_ids.includes(s.id);

       return <label
        key={s.id}
        className="service-check"
       >

        <input
         type="checkbox"
         checked={selected}
         onChange={e=>{

          const ids=
           e.target.checked
            ?[...f.service_ids,s.id]
            :f.service_ids.filter(
              id=>id!==s.id
             );

          setF({
           ...f,
           service_ids:ids,
           discount_percent:'',
           charged_amount:
            totalWithDiscount(
             ids,
             ''
            )
          });

         }}
        />

        <span>
         {s.name} - {money(finalPrice(s))}
        </span>

       </label>;
      })}

     </div>

    </details>

   </div>


   {f.vehicle_id&&!selectedVehicle?.category_id&&
    <div className="fieldHint">
     Este veículo ainda não possui categoria.
    </div>
   }


   {f.vehicle_id&&
    selectedVehicle?.category_id&&
    availableServices.length===0&&
    <div className="fieldHint">
     Nenhum serviço cadastrado para{' '}
     {
      vehicleCategories.find(
       c=>
        c.id===
        selectedVehicle.category_id
      )?.name||
      'esta categoria'
     }.
    </div>
   }


   <select
    value={f.employee_id}
    onChange={e=>
     setF({
      ...f,
      employee_id:e.target.value
     })
    }
   >

    <option value="">
     Funcionário responsável *
    </option>

    {employees
     .filter(e=>e.active!==false)
     .map(e=>
      <option
       key={e.id}
       value={e.id}
      >
       {e.name}
      </option>
     )
    }

   </select>


   <div className="appointment-datetime">

    <input
     type="text"
     inputMode="numeric"
     placeholder="DD/MM/AAAA *"
     maxLength={10}
     value={f.scheduled_date}
     onChange={e=>
      setF({
       ...f,
       scheduled_date:
        maskDateBR(e.target.value)
      })
     }
    />

    <input
     type="text"
     inputMode="numeric"
     placeholder="HH:MM *"
     maxLength={5}
     value={f.scheduled_time}
     onChange={e=>{

      let v=
       e.target.value
        .replace(/\D/g,'')
        .slice(0,4);

      if(v.length>2){
       v=
        v.slice(0,2)+
        ':'+
        v.slice(2);
      }

      setF({
       ...f,
       scheduled_time:v
      });

     }}
     onBlur={e=>{

      if(
       e.target.value&&
       !/^([01]\d|2[0-3]):[0-5]\d$/
        .test(e.target.value)
      ){

       alert(
        'Informe um horário válido no formato 24 horas. Exemplo: 15:30'
       );

       setF({
        ...f,
        scheduled_time:''
       });
      }

     }}
    />

   </div>


   <select
    value={f.status}
    onChange={e=>
     setF({
      ...f,
      status:e.target.value
     })
    }
   >

    <option value="agendado">
     Agendado
    </option>

    <option value="confirmado">
     Confirmado
    </option>

    <option value="em_atendimento">
     Em atendimento
    </option>

    <option value="concluido">
     Concluído
    </option>

    <option value="cancelado">
     Cancelado
    </option>

   </select>


   <input
    type="number"
    min="0"
    max="100"
    step="1"
    placeholder="Desconto (%)"
    value={f.discount_percent}
    onChange={e=>{

     const desconto=
      Math.min(
       100,
       Math.max(
        0,
        Number(e.target.value)||0
       )
      );

     setF({
      ...f,
      discount_percent:e.target.value,
      charged_amount:
       totalWithDiscount(
        f.service_ids,
        desconto
       )
     });

    }}
   />


   <input
    type="number"
    min="0"
    step="0.01"
    placeholder="Valor cobrado *"
    value={f.charged_amount}
    onChange={e=>
     setF({
      ...f,
      charged_amount:e.target.value
     })
    }
   />


   <select
    value={f.payment_method_id}
    onChange={e=>
     setF({
      ...f,
      payment_method_id:e.target.value
     })
    }
   >

    <option value="">
     Forma de pagamento *
    </option>

    {paymentMethods
     .filter(p=>p.active!==false)
     .map(p=>
      <option
       key={p.id}
       value={p.id}
      >
       {p.name}
      </option>
     )
    }

   </select>


   <input
    placeholder="Observações"
    value={f.notes}
    onChange={e=>
     setF({
      ...f,
      notes:e.target.value
     })
    }
   />


   <input
    key={`appointment-files-${formKey}`}
    type="file"
    multiple
    onChange={e=>
     setF({
      ...f,
      files:e.target.files
     })
    }
   />

   <div className="fieldHint">
    * Campos obrigatórios
   </div>

  </div>;
 }


 return <section>

  <Panel
   title="Agendamento e execução de serviços"
   action={
    canWrite&&!edit&&
    <button
     className="primary"
     onClick={save}
    >
     <CalendarDays size={17}/>
     Agendar
    </button>
   }
  >

   {!edit&&appointmentFields()}

  </Panel>


  {edit&&
   <Modal
    title="Editar agendamento"
    onClose={clearForm}
   >

    {appointmentFields()}


    {currentFiles.length>0&&
     <div className="serviceTags">

      {currentFiles.map(file=>
       <span key={file.id}>

        <a
         href={file.file_url}
         target="_blank"
         rel="noreferrer"
        >
         {file.file_name}
        </a>

        {canWrite&&
         <button
          type="button"
          title="Excluir arquivo"
          onClick={()=>
           deleteAppointmentFile(file)
          }
         >
          <X size={13}/>
         </button>
        }

       </span>
      )}

     </div>
    }


    <div className="inline">

     <button
      className="primary"
      onClick={save}
     >
      <Save size={17}/>
      Salvar alterações
     </button>

     <button
      className="secondary"
      onClick={clearForm}
     >
      Cancelar
     </button>

    </div>

   </Modal>
  }


  <Panel title="Pesquisar agenda">

   <div className="filterGrid">

    <input
     type="text"
     inputMode="numeric"
     placeholder="DD/MM/AAAA"
     maxLength={10}
     value={filters.date}
     onChange={e=>
      setFilters({
       ...filters,
       date:maskDateBR(e.target.value)
      })
     }
    />

    <input
     placeholder="Cliente"
     value={filters.client}
     onChange={e=>
      setFilters({
       ...filters,
       client:e.target.value
      })
     }
    />

    <input
     placeholder="Veículo / placa"
     value={filters.vehicle}
     onChange={e=>
      setFilters({
       ...filters,
       vehicle:e.target.value
      })
     }
    />

    <input
     placeholder="Serviço"
     value={filters.service}
     onChange={e=>
      setFilters({
       ...filters,
       service:e.target.value
      })
     }
    />

    <input
     placeholder="Funcionário"
     value={filters.employee}
     onChange={e=>
      setFilters({
       ...filters,
       employee:e.target.value
      })
     }
    />

    <button
     className="secondary"
     onClick={()=>
      setFilters({
       date:'',
       client:'',
       vehicle:'',
       service:'',
       employee:''
      })
     }
    >
     <X size={16}/>
     Limpar
    </button>

   </div>

  </Panel>


  <Panel title="Agenda">

   <Table
    headers={[
     'Data/Hora',
     'Cliente',
     'Veículo',
     'Serviços',
     'Funcionário',
     'Valor',
     'Status',
     'Arquivos',
     'Observação',
     'Ações'
    ]}
   >

    {filtered.map(a=>{

     const v=
      vehicles.find(
       x=>x.id===a.vehicle_id
      );

     const employee=
      employees.find(
       e=>e.id===a.employee_id
      );

     const total=
      a.ids.reduce(
       (sum,id)=>
        sum+
        Number(
         appointments.find(
          x=>x.id===id
         )?.charged_amount||0
        ),
       0
      );

     const files=
      a.appointment_group_id
       ?appointmentFiles.filter(
         x=>
          x.appointment_group_id===
          a.appointment_group_id
        )
       :[];


     return <tr key={a.ids.join('-')}>

      <td>
       {dt(a.scheduled_at)}
      </td>

      <td>
       {
        clients.find(
         c=>c.id===a.client_id
        )?.name||'-'
       }
      </td>

      <td>
       {v?.plate||'-'}
      </td>

      <td>
       <div className="serviceTags">

        {a.service_ids.map(id=>
         <span key={id}>
          {
           services.find(
            s=>s.id===id
           )?.name||'-'
          }
         </span>
        )}

       </div>
      </td>

      <td>
       {employee?.name||'-'}
      </td>

      <td>
       <b>{money(total)}</b>
      </td>

      <td>
       <Status value={a.status}/>
      </td>

      <td>
       {files.length
        ?<div className="serviceTags">

          {files.map(file=>
           <a
            key={file.id}
            href={file.file_url}
            target="_blank"
            rel="noreferrer"
           >
            {file.file_name}
           </a>
          )}

         </div>

        :'-'
       }
      </td>

      <td>
       {a.notes||'-'}
      </td>

      <td>
       {canWrite&&
        <Actions
         onEdit={()=>editGroup(a)}
         onDelete={()=>deleteGroup(a)}
        />
       }
      </td>

     </tr>;
    })}

   </Table>

  </Panel>

 </section>;
}
/* =========================================================
   EQUIPE
========================================================= */

function Employees({
 employees,
 orders,
 vehicles,
 clients,
 services,
 canAdmin,
 insert,
 update,
 remove,
 setEmployees
}){

 const empty={
  name:'',
  phone:'',
  position:'',
  commission_percent:'0',
  active:true
 };

 const [f,setF]=useState(empty);
 const [edit,setEdit]=useState(null);
 const [search,setSearch]=useState('');
 const [detail,setDetail]=useState(null);

 function closeEdit(){
  setEdit(null);
  setF(empty);
 }

 async function save(){

  if(!f.name){
   return alert('Informe o nome.');
  }

  const p={
   ...f,
   commission_percent:
    Number(f.commission_percent||0)
  };

  if(edit){

   await update(
    'employees',
    edit,
    p,
    setEmployees,
    'Editou funcionário'
   );

  }else{

   await insert(
    'employees',
    p,
    setEmployees,
    'Cadastrou funcionário'
   );

  }

  setF(empty);
  setEdit(null);
 }


 const q=
  search.trim().toLowerCase();

 const filtered=
  employees.filter(e=>
   !q||
   [e.name,e.phone,e.position]
    .some(x=>
     String(x||'')
      .toLowerCase()
      .includes(q)
    )
  );


 const employee=
  employees.find(
   e=>e.id===detail
  );


 const history=
  orders
   .filter(
    o=>o.employee_id===detail
   )
   .sort(
    (a,b)=>
     new Date(b.completed_at||b.created_at)-
     new Date(a.completed_at||a.created_at)
   );


 const employeeFields=
  <div className="formGrid">

   <input
    placeholder="Nome"
    value={f.name}
    onChange={e=>
     setF({
      ...f,
      name:e.target.value
     })
    }
   />

   <input
    placeholder="Telefone"
    value={f.phone}
    onChange={e=>
     setF({
      ...f,
      phone:e.target.value
     })
    }
   />

   <input
    placeholder="Função"
    value={f.position}
    onChange={e=>
     setF({
      ...f,
      position:e.target.value
     })
    }
   />

   <input
    type="number"
    placeholder="Comissão (%)"
    value={f.commission_percent}
    onChange={e=>
     setF({
      ...f,
      commission_percent:e.target.value
     })
    }
   />

  </div>;


 return <section>

  <Panel
   title="Equipe e comissões"
   action={
    canAdmin&&!edit&&
    <button
     className="primary"
     onClick={save}
    >
     <Save size={17}/>
     Cadastrar
    </button>
   }
  >

   {!edit&&employeeFields}

   <SearchBox
    value={search}
    onChange={setSearch}
    placeholder="Pesquisar funcionário por nome, função ou telefone"
   />

   <Table
    headers={[
     'Nome',
     'Função',
     'Telefone',
     'Comissão',
     'Total gerado',
     'Comissão estimada',
     'Ações'
    ]}
   >

    {filtered.map(e=>{

     const eo=
      orders.filter(
       o=>
        o.employee_id===e.id&&
        o.status==='concluido'
      );

     const total=
      eo.reduce(
       (s,o)=>
        s+Number(o.charged_amount||0),
       0
      );

     return <tr key={e.id}>

      <td>{e.name}</td>
      <td>{e.position||'-'}</td>
      <td>{e.phone||'-'}</td>
      <td>{e.commission_percent||0}%</td>
      <td>{money(total)}</td>

      <td>
       <b>
        {money(
         total*
         Number(e.commission_percent||0)/
         100
        )}
       </b>
      </td>

      <td>
       <Actions
        onView={()=>
         setDetail(e.id)
        }

        onEdit={
         canAdmin
          ?()=>{
            setEdit(e.id);

            setF({
             name:e.name||'',
             phone:e.phone||'',
             position:e.position||'',
             commission_percent:
              e.commission_percent||0,
             active:e.active!==false
            });
           }
          :null
        }

        onDelete={
         canAdmin
          ?()=>remove(
            'employees',
            e.id,
            setEmployees,
            'Excluiu funcionário'
           )
          :null
        }
       />
      </td>

     </tr>;
    })}

   </Table>

  </Panel>


  {edit&&
   <Modal
    title="Editar funcionário"
    onClose={closeEdit}
   >

    {employeeFields}

    <div className="inline">

     <button
      className="primary"
      onClick={save}
     >
      <Save size={17}/>
      Salvar alterações
     </button>

     <button
      className="secondary"
      onClick={closeEdit}
     >
      Cancelar
     </button>

    </div>

   </Modal>
  }


  {employee&&
   <Modal
    title={`Funcionário: ${employee.name}`}
    onClose={()=>setDetail(null)}
   >

    <div className="detailGrid">

     <div>
      <b>Função</b>
      <span>
       {employee.position||'-'}
      </span>
     </div>

     <div>
      <b>Telefone</b>
      <span>
       {employee.phone||'-'}
      </span>
     </div>

     <div>
      <b>Comissão</b>
      <span>
       {employee.commission_percent||0}%
      </span>
     </div>

     <div>
      <b>Serviços realizados</b>
      <span>{history.length}</span>
     </div>

    </div>


    <h4>
     Histórico de serviços realizados
    </h4>


    {history.length===0
     ?<p className="hint">
       Nenhum serviço registrado.
      </p>

     :<Table
       headers={[
        'Data',
        'Cliente',
        'Veículo',
        'Serviço',
        'Valor',
        'Status'
       ]}
      >

       {history.map(o=>{

        const v=
         vehicles.find(
          x=>x.id===o.vehicle_id
         );

        const c=
         clients.find(
          x=>x.id===v?.client_id
         );

        const sv=
         services.find(
          x=>x.id===o.service_id
         );

        return <tr key={o.id}>

         <td>
          {dt(
           o.completed_at||
           o.created_at
          )}
         </td>

         <td>{c?.name||'-'}</td>

         <td>{v?.plate||'-'}</td>

         <td>{sv?.name||'-'}</td>

         <td>
          {money(
           o.charged_amount||
           finalPrice(sv)
          )}
         </td>

         <td>
          <Status value={o.status}/>
         </td>

        </tr>;
       })}

      </Table>
    }

   </Modal>
  }

 </section>;
}


/* =========================================================
   CAIXA
========================================================= */

function Cash({
 payments,
 paymentMethods,
 orders,
 cashClosings,
 canAdmin,
 canSuperAdmin,
 insert,
 remove,
 setCashClosings,
 setPaymentMethods
}){

 const today=
  new Date().toISOString().slice(0,10);

 const [selectedDay,setSelectedDay]=
  useState(today);

const [selectedDayText,setSelectedDayText]=
useState(today.split('-').reverse().join('/'));

 const [selectedMonth,setSelectedMonth]=
  useState(today.slice(0,7));

 const [selectedYear,setSelectedYear]=
  useState(today.slice(0,4));

 const [view,setView]=
  useState('day');

 const [methodName,setMethodName]=
  useState('');


 const completedOrders=
  orders.filter(
   o=>o.status==='concluido'
  );


 const serviceGroups=
  Object.values(
   completedOrders.reduce((acc,o)=>{

    const key=
     o.atendimento_id||o.id;

    if(!acc[key]){
     acc[key]={
      key,
      rows:[]
     };
    }

    acc[key].rows.push(o);

    return acc;

   },{})
  );


 const allEntries=
  serviceGroups
   .map(g=>{

    const ids=
     new Set(
      g.rows.map(o=>o.id)
     );

    const payment=
     payments.find(
      p=>ids.has(p.service_order_id)
     );

    const amount=
     g.rows.reduce(
      (sum,o)=>
       sum+
       Number(o.charged_amount || 0),
      0
     );

    return {
     key:g.key,
     amount,
     payment_method_id:
      payment?.payment_method_id||null,
     paid_at:
      payment?.paid_at||
      g.rows[0]?.completed_at||
      g.rows[0]?.created_at,
     order_id:g.rows[0]?.id
    };

   })
   .filter(e=>e.paid_at);


 const todayEntries=
  allEntries.filter(
   e=>
    String(e.paid_at)
     .slice(0,10)===today
  );


 const monthEntries=
  allEntries.filter(
   e=>
    String(e.paid_at)
     .slice(0,7)===
    today.slice(0,7)
  );


 const todayTotal=
  todayEntries.reduce(
   (s,e)=>
    s+Number(e.amount||0),
   0
  );


 const monthTotal=
  monthEntries.reduce(
   (s,e)=>
    s+Number(e.amount||0),
   0
  );


 const selectedEntries=
  allEntries.filter(e=>{

   const d=
    String(e.paid_at).slice(0,10);

   if(view==='day'){
    return d===selectedDay;
   }

   if(view==='month'){
    return d.slice(0,7)===selectedMonth;
   }

   return d.slice(0,4)===selectedYear;

  });


 const selectedTotal=
  selectedEntries.reduce(
   (s,e)=>
    s+Number(e.amount||0),
   0
  );


 const selectedByMethod=
  paymentMethods
   .map(m=>({
    name:m.name,

    total:
     selectedEntries
      .filter(
       e=>
        e.payment_method_id===m.id
      )
      .reduce(
       (s,e)=>
        s+Number(e.amount||0),
       0
      )
   }))
   .filter(x=>x.total>0);


 const withoutMethod=
  selectedEntries
   .filter(
    e=>!e.payment_method_id
   )
   .reduce(
    (s,e)=>
     s+Number(e.amount||0),
    0
   );


 if(withoutMethod>0){

  selectedByMethod.push({
   name:'Sem forma de pagamento',
   total:withoutMethod
  });

 }


 const dailyBreakdown=
  Object.values(
   selectedEntries.reduce((acc,e)=>{

    const date=
     String(e.paid_at).slice(0,10);

    if(!acc[date]){

     acc[date]={
      date,
      total:0,
      byMethod:{}
     };

    }

    acc[date].total+=
     Number(e.amount||0);


    const method=
     paymentMethods.find(
      m=>
       m.id===
       e.payment_method_id
     )?.name||
     'Sem forma de pagamento';


    acc[date].byMethod[method]=
     (
      acc[date].byMethod[method]||
      0
     )+
     Number(e.amount||0);


    return acc;

   },{})
  )
  .sort(
   (a,b)=>
    b.date.localeCompare(a.date)
  );


 const years=useMemo(()=>{

  const set=
   new Set([
    today.slice(0,4)
   ]);

  allEntries.forEach(
   e=>
    set.add(
     String(e.paid_at).slice(0,4)
    )
  );

  cashClosings.forEach(
   c=>
    set.add(
     String(c.closing_date).slice(0,4)
    )
  );

  return [...set]
   .sort(
    (a,b)=>
     b.localeCompare(a)
   );

 },[
  allEntries,
  cashClosings,
  today
 ]);


 const selectedLabel=
  view==='day'
   ?dateOnly(selectedDay)

   :view==='month'
    ?new Date(
      `${selectedMonth}-01T12:00:00`
     ).toLocaleDateString(
      'pt-BR',
      {
       month:'long',
       year:'numeric'
      }
     )

    :selectedYear;


 async function closeDay(
  day,
  automatic=false
 ){

  if(!canAdmin)return;

  const existing=
   cashClosings.find(
    c=>c.closing_date===day
   );

  if(existing){
   if(!automatic){
    alert(
     'Esse dia já possui fechamento registrado.'
    );
   }
   return;
  }


  const dayEntries=
   allEntries.filter(
    e=>
     String(e.paid_at)
      .slice(0,10)===day
   );


  const dayTotal=
   dayEntries.reduce(
    (s,e)=>
     s+Number(e.amount||0),
    0
   );


  const details=
   paymentMethods
    .map(m=>({
     name:m.name,

     total:
      dayEntries
       .filter(
        e=>
         e.payment_method_id===m.id
       )
       .reduce(
        (s,e)=>
         s+Number(e.amount||0),
        0
       )
    }))
    .filter(x=>x.total>0);


  const noMethod=
   dayEntries
    .filter(
     e=>!e.payment_method_id
    )
    .reduce(
     (s,e)=>
      s+Number(e.amount||0),
     0
    );


  if(noMethod>0){

   details.push({
    name:'Sem forma de pagamento',
    total:noMethod
   });

  }


  await insert(
   'cash_closings',
   {
    closing_date:day,
    total_amount:dayTotal,
    details,
    closed_at:
     new Date().toISOString()
   },
   setCashClosings,
   automatic
    ?'Realizou fechamento automático de caixa'
    :'Realizou fechamento de caixa'
  );

 }


 async function close(){

  await closeDay(
   selectedDay,
   false
  );

 }


 /*
   FECHAMENTO AUTOMÁTICO

   Enquanto o sistema estiver aberto, verifica o relógio
   e realiza o fechamento às 23:59.

   Também verifica dias anteriores quando o Caixa é aberto.
 */
 useEffect(()=>{

  if(!canAdmin)return;


  async function checkAutomaticClosing(){

   const now=new Date();

   const localDate=
    [
     now.getFullYear(),
     String(now.getMonth()+1).padStart(2,'0'),
     String(now.getDate()).padStart(2,'0')
    ].join('-');


   if(
    now.getHours()===23&&
    now.getMinutes()===59
   ){

    await closeDay(
     localDate,
     true
    );

   }

  }


  const timer=
   setInterval(
    checkAutomaticClosing,
    30000
   );


  checkAutomaticClosing();


  return ()=>
   clearInterval(timer);

 },[
  canAdmin,
  cashClosings,
  payments,
  orders,
  paymentMethods
 ]);


 async function deleteClosing(id){

  if(!canSuperAdmin)return;

  await remove(
   'cash_closings',
   id,
   setCashClosings,
   'Excluiu fechamento de caixa'
  );

 }


 async function addMethod(){

  if(!methodName.trim())return;


  await insert(
   'payment_methods',
   {
    name:methodName.trim(),
    active:true
   },
   setPaymentMethods,
   'Cadastrou forma de pagamento'
  );


  setMethodName('');
 }


 return <section>

  <Panel
   title="Resumo do caixa"
   action={
    <div className="inline">
     <span className="hint">
      Consulta: {selectedLabel}
     </span>
    </div>
   }
  >

   <div className="cashSummary">

    <div>
     <span>Hoje</span>
     <strong>
      {money(todayTotal)}
     </strong>
    </div>

    <div>
     <span>Mês atual</span>
     <strong>
      {money(monthTotal)}
     </strong>
    </div>

    <div>
     <span>Período selecionado</span>
     <strong>
      {money(selectedTotal)}
     </strong>
    </div>

   </div>

  </Panel>


  <Panel title="Consultar caixa">

   <div
    className="inline"
    style={{
     marginBottom:12,
     flexWrap:'wrap'
    }}
   >

    <button
     className={
      view==='day'
       ?'primary'
       :'secondary'
     }
     onClick={()=>setView('day')}
    >
     Dia
    </button>

    <button
     className={
      view==='month'
       ?'primary'
       :'secondary'
     }
     onClick={()=>setView('month')}
    >
     Mês
    </button>

    <button
     className={
      view==='year'
       ?'primary'
       :'secondary'
     }
     onClick={()=>setView('year')}
    >
     Ano
    </button>

   </div>


   {view==='day'&&
    <div className="formGrid two">
     <label>
      Dia
      <input
  type="text"
  inputMode="numeric"
  placeholder="dd/mm/aaaa"
  maxLength={10}
  value={selectedDayText}
  onChange={e=>{
    const masked=maskDateBR(e.target.value);

    setSelectedDayText(masked);

    const iso=brDateToIso(masked);

    if(iso){
      setSelectedDay(iso);
    }
  }}
/>
     </label>
    </div>
   }


   {view==='month'&&
    <div className="formGrid two">
     <label>
      Mês
      <input
       type="month"
       value={selectedMonth}
       onChange={e=>
        setSelectedMonth(
         e.target.value
        )
       }
      />
     </label>
    </div>
   }


   {view==='year'&&
    <div className="formGrid two">
     <label>
      Ano
      <select
       value={selectedYear}
       onChange={e=>
        setSelectedYear(
         e.target.value
        )
       }
      >
       {years.map(y=>
        <option
         key={y}
         value={y}
        >
         {y}
        </option>
       )}
      </select>
     </label>
    </div>
   }


   <div className="cashSummary">

    <div>
     <span>Total do período</span>
     <strong>
      {money(selectedTotal)}
     </strong>
    </div>

    {selectedByMethod.map(x=>
     <div key={x.name}>
      <span>{x.name}</span>
      <strong>
       {money(x.total)}
      </strong>
     </div>
    )}

   </div>


   {view!=='day'&&
    <Table
     headers={[
      'Data',
      'Total',
      'Por forma de pagamento'
     ]}
    >

     {dailyBreakdown.map(row=>
      <tr key={row.date}>

       <td>
        {dateOnly(row.date)}
       </td>

       <td>
        <b>
         {money(row.total)}
        </b>
       </td>

       <td>
        <div className="serviceTags">

         {Object.entries(
          row.byMethod
         ).map(
          ([name,value])=>
           <span key={name}>
            {name}: {money(value)}
           </span>
         )}

        </div>
       </td>

      </tr>
     )}


     {dailyBreakdown.length===0&&
      <tr>
       <td colSpan="3">
        Nenhum faturamento encontrado no período.
       </td>
      </tr>
     }

    </Table>
   }


   {view==='day'&&
    <Table
     headers={[
      'Data/Hora',
      'Forma',
      'Valor',
      'Ordem'
     ]}
    >

     {selectedEntries.map(e=>
      <tr key={e.key}>

       <td>{dt(e.paid_at)}</td>

       <td>
        {
         paymentMethods.find(
          m=>
           m.id===
           e.payment_method_id
         )?.name||
         'Sem forma de pagamento'
        }
       </td>

       <td>{money(e.amount)}</td>

       <td>
        {e.order_id?.slice(0,8)||'-'}
       </td>

      </tr>
     )}


     {selectedEntries.length===0&&
      <tr>
       <td colSpan="4">
        Nenhum faturamento encontrado para o dia.
       </td>
      </tr>
     }

    </Table>
   }

  </Panel>


  {canAdmin&&
   <Panel
    title="Formas de pagamento"
    action={
     <button
      className="primary"
      onClick={addMethod}
     >
      <Plus size={17}/>
      Adicionar
     </button>
    }
   >

    <div className="formGrid two">

     <input
      placeholder="Ex.: PIX, Dinheiro, Cartão"
      value={methodName}
      onChange={e=>
       setMethodName(e.target.value)
      }
     />

    </div>


    <div className="methodChips">

     {paymentMethods.map(m=>
      <span key={m.id}>

       {m.name}

       <button
        onClick={()=>
         remove(
          'payment_methods',
          m.id,
          setPaymentMethods,
          'Excluiu forma de pagamento'
         )
        }
       >
        <X size={14}/>
       </button>

      </span>
     )}

    </div>

   </Panel>
  }


  <Panel
   title="Fechamento de caixa"
   action={
    <div className="inline">

     <input
      className="dateInput"
      type="date"
      value={selectedDay}
      onChange={e=>
       setSelectedDay(e.target.value)
      }
     />

     {canAdmin&&
      <button
       className="primary"
       onClick={close}
      >
       <Wallet size={17}/>
       Fechar caixa do dia
      </button>
     }

    </div>
   }
  >

   <p className="hint">
    O fechamento manual continua disponível. O sistema também verifica automaticamente o fechamento às 23:59 enquanto estiver em execução.
   </p>

  </Panel>


  <Panel title="Fechamentos anteriores">

   <Table
    headers={[
     'Data',
     'Fechado em',
     'Total',
     'Ações'
    ]}
   >

    {cashClosings.map(c=>
     <tr key={c.id}>

      <td>
       {dateOnly(c.closing_date)}
      </td>

      <td>
       {dt(c.closed_at)}
      </td>

      <td>
       <b>
        {money(c.total_amount)}
       </b>
      </td>

      <td>
       {canSuperAdmin
        ?<button
          className="danger"
          type="button"
          title="Excluir fechamento"
          onClick={()=>
           deleteClosing(c.id)
          }
         >
          <Trash2 size={16}/>
         </button>

        :<span className="hint">
          Somente administrador
         </span>
       }
      </td>

     </tr>
    )}


    {cashClosings.length===0&&
     <tr>
      <td colSpan="4">
       Nenhum fechamento registrado.
      </td>
     </tr>
    }

   </Table>

  </Panel>

 </section>;
}


/* =========================================================
   RELATÓRIOS
========================================================= */

function Reports({
 clients,
 vehicles,
 services,
 orders,
 employees,
 payments,
 paymentMethods
}){

 const [from,setFrom]=useState('');
 const [to,setTo]=useState('');


 const filtered=
  orders.filter(o=>
   (
    !from||
    String(
     o.completed_at||
     o.created_at
    ).slice(0,10)>=from
   )&&
   (
    !to||
    String(
     o.completed_at||
     o.created_at
    ).slice(0,10)<=to
   )
  );


 const rows=
  filtered.map(o=>{

   const v=
    vehicles.find(
     v=>v.id===o.vehicle_id
    );

   const c=
    clients.find(
     c=>c.id===v?.client_id
    );

   const s=
    services.find(
     s=>s.id===o.service_id
    );

   const e=
    employees.find(
     e=>e.id===o.employee_id
    );

   return {

    Data:
     dt(
      o.completed_at||
      o.created_at
     ),

    Cliente:
     c?.name||'',

    Placa:
     v?.plate||'',

    Veiculo:
     `${v?.brand||''} ${v?.model||''}`.trim(),

    Servico:
     s?.name||'',

    Funcionario:
     e?.name||
     o.performed_by||
     '',

    Valor:
     Number(
      o.charged_amount||
      finalPrice(s)||
      0
     ),

    Status:
     o.status||''
   };

  });


 function pdf(){

  const doc=
   new jsPDF({
    orientation:'landscape'
   });


  doc.setFontSize(18);

  doc.text(
   'Relatório de Serviços - Garagem GRAU CAR 096',
   14,
   16
  );


  doc.setFontSize(10);

  doc.text(
   `Período: ${from||'início'} a ${to||'hoje'} | Total: ${money(rows.reduce((s,r)=>s+r.Valor,0))}`,
   14,
   23
  );


  autoTable(doc,{
   startY:28,

   head:[[
    'Data',
    'Cliente',
    'Placa',
    'Veículo',
    'Serviço',
    'Funcionário',
    'Valor',
    'Status'
   ]],

   body:
    rows.map(r=>[
     r.Data,
     r.Cliente,
     r.Placa,
     r.Veiculo,
     r.Servico,
     r.Funcionario,
     money(r.Valor),
     r.Status
    ])
  });


  doc.save(
   'relatorio-servicos.pdf'
  );

 }


 function excel(){

  const wb=
   XLSX.utils.book_new();

  const ws=
   XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(
   wb,
   ws,
   'Serviços'
  );


  const payRows=
   payments.map(p=>({

    Data:
     dt(p.paid_at),

    Forma:
     paymentMethods.find(
      m=>m.id===p.payment_method_id
     )?.name||'',

    Valor:
     Number(p.amount||0)

   }));


  XLSX.utils.book_append_sheet(
   wb,
   XLSX.utils.json_to_sheet(payRows),
   'Pagamentos'
  );


  XLSX.writeFile(
   wb,
   'relatorio-estetica-veicular.xlsx'
  );

 }


 return <section>

  <Panel
   title="Relatórios PDF e Excel"
   action={
    <div className="reportBtns">

     <button
      className="secondary"
      onClick={pdf}
     >
      <FileDown size={17}/>
      PDF
     </button>

     <button
      className="primary"
      onClick={excel}
     >
      <FileDown size={17}/>
      Excel
     </button>

    </div>
   }
  >

   <div className="formGrid two">

    <label>
     De
     <input
      type="date"
      value={from}
      onChange={e=>
       setFrom(e.target.value)
      }
     />
    </label>

    <label>
     Até
     <input
      type="date"
      value={to}
      onChange={e=>
       setTo(e.target.value)
      }
     />
    </label>

   </div>


   <div className="cashSummary">

    <div>
     <span>
      Serviços no período
     </span>
     <strong>
      {rows.length}
     </strong>
    </div>

    <div>
     <span>
      Total de serviços
     </span>
     <strong>
      {money(
       rows.reduce(
        (s,r)=>s+r.Valor,
        0
       )
      )}
     </strong>
    </div>

   </div>


   <Table
    headers={[
     'Data',
     'Cliente',
     'Placa',
     'Serviço',
     'Funcionário',
     'Valor'
    ]}
   >

    {rows.map((r,i)=>
     <tr key={i}>

      <td>{r.Data}</td>
      <td>{r.Cliente}</td>
      <td>{r.Placa}</td>
      <td>{r.Servico}</td>
      <td>{r.Funcionario}</td>
      <td>{money(r.Valor)}</td>

     </tr>
    )}

   </Table>

  </Panel>

 </section>;
}


/* =========================================================
   USUÁRIOS
========================================================= */

function UsersPanel({
 profiles,
 canAdmin,
 canSuperAdmin,
 profile,
 supabase,
 addLog,
 setProfiles
}){

 const empty={
  full_name:'',
  email:'',
  password:'',
  role:'visualizador'
 };


 const [f,setF]=useState(empty);

 const [busy,setBusy]=
  useState(false);

 const [editUser,setEditUser]=
  useState(null);

 const [editForm,setEditForm]=
  useState({
   full_name:'',
   email:'',
   password:'',
   role:'visualizador'
  });


 const allowedRoles=
  canSuperAdmin
   ?[
     'administrador',
     'gerente',
     'administrativo',
     'visualizador'
    ]
   :[
     'administrativo',
     'visualizador'
    ];


 function roleLabel(role){

  if(role==='administrador'){
   return 'Administrador';
  }

  if(role==='gerente'){
   return 'Gerente';
  }

  if(role==='administrativo'){
   return 'Administrativo';
  }

  return 'Visualizador';

 }


 async function create(){

  if(!canAdmin)return;


  if(
   !allowedRoles.includes(f.role)
  ){

   return alert(
    'Você não possui permissão para criar este perfil.'
   );

  }


  if(
   !f.full_name||
   !f.email||
   f.password.length<6
  ){

   return alert(
    'Informe nome, e-mail e uma senha com pelo menos 6 caracteres.'
   );

  }


  setBusy(true);


  try{

   const {data,error}=
    await supabase.functions.invoke(
     'create-user',
     {
      body:{
       action:'create',
       ...f,
       email:
        f.email
         .trim()
         .toLowerCase()
      }
     }
    );


   if(error)throw error;

   if(data?.error){
    throw new Error(data.error);
   }


   if(data?.user){

    setProfiles(x=>{

     if(
      x.some(
       p=>p.id===data.user.id
      )
     ){
      return x.map(
       p=>
        p.id===data.user.id
         ?data.user
         :p
      );
     }

     return [
      ...x,
      data.user
     ];

    });


    await addLog(
     `Criou usuário ${f.email}`,
     'profiles',
     data.user.id
    );

   }


   setF(empty);

   alert(
    'Usuário criado com sucesso.'
   );


  }catch(e){

   alert(
    e.message||
    'Não foi possível criar o usuário.'
   );

  }finally{

   setBusy(false);

  }
 }


 function openEdit(p){

  if(!canSuperAdmin)return;


  setEditUser(p);


  setEditForm({
   full_name:p.full_name||'',
   email:p.email||'',
   password:'',
   role:p.role||'visualizador'
  });

 }


 function closeEdit(){

  setEditUser(null);

  setEditForm({
   full_name:'',
   email:'',
   password:'',
   role:'visualizador'
  });

 }


 async function saveEdit(){

  if(
   !canSuperAdmin||
   !editUser
  )return;


  if(
   !editForm.full_name.trim()||
   !editForm.email.trim()
  ){

   return alert(
    'Informe o nome e o e-mail.'
   );

  }


  if(
   editForm.password&&
   editForm.password.length<6
  ){

   return alert(
    'A nova senha deve ter pelo menos 6 caracteres.'
   );

  }


  if(
   ![
    'administrador',
    'gerente',
    'administrativo',
    'visualizador'
   ].includes(editForm.role)
  ){

   return alert(
    'Perfil inválido.'
   );

  }


  if(
   editUser.id===profile?.id&&
   editForm.role!==profile.role
  ){

   return alert(
    'Por segurança, você não pode alterar o seu próprio nível de acesso.'
   );

  }


  setBusy(true);


  try{

   const body={
    action:'update',
    id:editUser.id,
    full_name:
     editForm.full_name.trim(),
    email:
     editForm.email
      .trim()
      .toLowerCase(),
    role:
     editUser.id===profile?.id
      ?profile.role
      :editForm.role
   };


   if(editForm.password){
    body.password=
     editForm.password;
   }


   const {data,error}=
    await supabase.functions.invoke(
     'create-user',
     {body}
    );


   if(error)throw error;

   if(data?.error){
    throw new Error(data.error);
   }


   const updated=
    data?.user||{
     ...editUser,
     full_name:body.full_name,
     email:body.email,
     role:body.role
    };


   setProfiles(current=>
    current.map(p=>
     p.id===editUser.id
      ?{
        ...p,
        ...updated
       }
      :p
    )
   );


   await addLog(
    `Editou usuário ${body.email}`,
    'profiles',
    editUser.id
   );


   alert(
    'Usuário atualizado com sucesso.'
   );


   closeEdit();


  }catch(e){

   alert(
    e.message||
    'Não foi possível atualizar o usuário.'
   );

  }finally{

   setBusy(false);

  }
 }


 return <section>

  <Panel
   title="Usuários do sistema"
   action={
    canAdmin&&
    <button
     className="primary"
     disabled={busy}
     onClick={create}
    >
     <Plus size={17}/>
     {busy
      ?'Aguarde...'
      :'Criar usuário'
     }
    </button>
   }
  >

   <div className="formGrid">

    <input
     placeholder="Nome completo"
     value={f.full_name}
     onChange={e=>
      setF({
       ...f,
       full_name:e.target.value
      })
     }
    />

    <input
     type="email"
     placeholder="E-mail"
     value={f.email}
     onChange={e=>
      setF({
       ...f,
       email:e.target.value
      })
     }
    />

    <input
     type="password"
     placeholder="Senha inicial"
     value={f.password}
     onChange={e=>
      setF({
       ...f,
       password:e.target.value
      })
     }
    />

    <select
     value={f.role}
     onChange={e=>
      setF({
       ...f,
       role:e.target.value
      })
     }
    >

     {allowedRoles.map(r=>
      <option
       key={r}
       value={r}
      >
       {roleLabel(r)}
      </option>
     )}

    </select>

   </div>


   <Table
    headers={[
     'Nome',
     'E-mail',
     'Perfil',
     'Ações'
    ]}
   >

    {profiles.map(p=>
     <tr key={p.id}>

      <td>
       {p.full_name||'-'}
      </td>

      <td>
       {p.email||'-'}
      </td>

      <td>
       <Status value={p.role}/>
      </td>

      <td>

       {canSuperAdmin
        ?<button
          type="button"
          className="secondary"
          onClick={()=>
           openEdit(p)
          }
         >
          <Edit3 size={16}/>
          Editar
         </button>

        :<span className="hint">
          -
         </span>
       }

      </td>

     </tr>
    )}

   </Table>


   <div className="roleGrid">

    <div>
     <b>Administrador</b>
     <p>
      Acesso total ao sistema e gerenciamento dos usuários.
     </p>
    </div>

    <div>
     <b>Gerente</b>
     <p>
      Acesso operacional completo e exclusão de registros do histórico.
     </p>
    </div>

    <div>
     <b>Administrativo</b>
     <p>
      Clientes, veículos, agendamentos e execução dos serviços.
     </p>
    </div>

    <div>
     <b>Visualizador</b>
     <p>
      Acesso para consulta, sem alterações.
     </p>
    </div>

   </div>

  </Panel>


  {editUser&&
   <Modal
    title={`Editar usuário: ${editUser.full_name||editUser.email}`}
    onClose={closeEdit}
   >

    <div className="formGrid">

     <input
      placeholder="Nome completo"
      value={editForm.full_name}
      onChange={e=>
       setEditForm({
        ...editForm,
        full_name:e.target.value
       })
      }
     />

     <input
      type="email"
      placeholder="E-mail"
      value={editForm.email}
      onChange={e=>
       setEditForm({
        ...editForm,
        email:e.target.value
       })
      }
     />

     <input
      type="password"
      placeholder="Nova senha (deixe vazio para manter)"
      value={editForm.password}
      onChange={e=>
       setEditForm({
        ...editForm,
        password:e.target.value
       })
      }
     />

     <select
      value={editForm.role}
      disabled={
       editUser.id===profile?.id
      }
      onChange={e=>
       setEditForm({
        ...editForm,
        role:e.target.value
       })
      }
     >

      <option value="administrador">
       Administrador
      </option>

      <option value="gerente">
       Gerente
      </option>

      <option value="administrativo">
       Administrativo
      </option>

      <option value="visualizador">
       Visualizador
      </option>

     </select>

    </div>


    {editUser.id===profile?.id&&
     <p className="hint">
      Você pode alterar seu nome, e-mail e senha, mas não o seu próprio nível de acesso.
     </p>
    }


    <div className="inline">

     <button
      className="primary"
      disabled={busy}
      onClick={saveEdit}
     >
      <Save size={17}/>
      {busy
       ?'Salvando...'
       :'Salvar alterações'
      }
     </button>

     <button
      className="secondary"
      disabled={busy}
      onClick={closeEdit}
     >
      Cancelar
     </button>

    </div>

   </Modal>
  }

 </section>;
}


/* =========================================================
   AUDITORIA + RELATÓRIOS POR PERÍODO
========================================================= */

function Audit({logs}){

 const [from,setFrom]=useState('');
 const [to,setTo]=useState('');
 const [search,setSearch]=useState('');


 const filtered=
  logs.filter(l=>{

   const date=
    String(l.created_at||'')
     .slice(0,10);

   const q=
    search.trim().toLowerCase();


   const text=
    `${l.user_name||''} ${l.action||''} ${l.entity_type||''}`
     .toLowerCase();


   return (
    !from||
    date>=from
   )&&(
    !to||
    date<=to
   )&&(
    !q||
    text.includes(q)
   );

  });


 function auditPdf(){

  const doc=
   new jsPDF({
    orientation:'landscape'
   });


  doc.setFontSize(18);

  doc.text(
   'Relatório de Auditoria - Garagem GRAU CAR 096',
   14,
   16
  );


  doc.setFontSize(10);

  doc.text(
   `Período: ${from||'início'} a ${to||'hoje'} | Registros: ${filtered.length}`,
   14,
   23
  );


  autoTable(doc,{
   startY:28,

   head:[[
    'Data/Hora',
    'Usuário',
    'Ação',
    'Tipo'
   ]],

   body:
    filtered.map(l=>[
     dt(l.created_at),
     l.user_name||'-',
     l.action||'-',
     l.entity_type||'-'
    ])
  });


  doc.save(
   'relatorio-auditoria.pdf'
  );

 }


 function auditExcel(){

  const rows=
   filtered.map(l=>({

    'Data/Hora':
     dt(l.created_at),

    'Usuário':
     l.user_name||'-',

    'Ação':
     l.action||'-',

    'Tipo':
     l.entity_type||'-'

   }));


  const wb=
   XLSX.utils.book_new();

  const ws=
   XLSX.utils.json_to_sheet(rows);


  XLSX.utils.book_append_sheet(
   wb,
   ws,
   'Auditoria'
  );


  XLSX.writeFile(
   wb,
   'relatorio-auditoria.xlsx'
  );

 }


 return <section>

  <Panel
   title="Relatório da auditoria"
   action={
    <div className="reportBtns">

     <button
      className="secondary"
      onClick={auditPdf}
     >
      <FileDown size={17}/>
      PDF
     </button>

     <button
      className="primary"
      onClick={auditExcel}
     >
      <FileDown size={17}/>
      Excel
     </button>

    </div>
   }
  >

   <div className="formGrid">

    <label>
     De
     <input
      type="date"
      value={from}
      onChange={e=>
       setFrom(e.target.value)
      }
     />
    </label>

    <label>
     Até
     <input
      type="date"
      value={to}
      onChange={e=>
       setTo(e.target.value)
      }
     />
    </label>

   </div>


   <SearchBox
    value={search}
    onChange={setSearch}
    placeholder="Pesquisar por usuário, ação ou tipo"
   />


   <div className="cashSummary">

    <div>
     <span>
      Registros encontrados
     </span>

     <strong>
      {filtered.length}
     </strong>
    </div>

   </div>

  </Panel>


  <Panel title="Histórico de ações">

   <Table
    headers={[
     'Data/Hora',
     'Usuário',
     'Ação',
     'Tipo'
    ]}
   >

    {filtered.map(l=>
     <tr key={l.id}>

      <td>
       {dt(l.created_at)}
      </td>

      <td>
       {l.user_name||'-'}
      </td>

      <td>
       {l.action}
      </td>

      <td>
       {l.entity_type||'-'}
      </td>

     </tr>
    )}


    {filtered.length===0&&
     <tr>
      <td colSpan="4">
       Nenhum registro encontrado no período.
      </td>
     </tr>
    }

   </Table>

  </Panel>

 </section>;
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

createRoot(
 document.getElementById('root')
).render(
 <Root/>
);