import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient} from '@supabase/supabase-js';
import {
 Car,Users,Wrench,ClipboardList,ShieldCheck,LogOut,Plus,Camera,Trash2,Edit3,
 CalendarDays,Wallet,UserRoundCog,FileDown,MessageCircle,Eye,X,CheckCircle2,
 Clock3,CreditCard,Percent,Image as ImageIcon,Save,Search,MapPin,Mail,Phone,IdCard,
 User,Briefcase,DollarSign,Lock,Tag,Palette,Hash,FileText,ImagePlus,BarChart3
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import logoGraucar from './assets/grau-car-logo.jpeg';
import './styles.css';

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=(url&&key)?createClient(url,key):null;

const money=v=>Number(v||0).toLocaleString('pt-BR',{
 style:'currency',
 currency:'BRL'
});

// Compatibilidade: registros antigos possuem apenas employee_id.
// Os novos registros podem possuir vários responsáveis em employee_ids.
const responsibleEmployeeIds=record=>{
 const ids=Array.isArray(record?.employee_ids)
  ?record.employee_ids.filter(Boolean)
  :[];
 if(ids.length)return [...new Set(ids)];
 return record?.employee_id?[record.employee_id]:[];
};

const responsibleEmployeeNames=(record,employees=[],fallback='')=>{
 const names=responsibleEmployeeIds(record)
  .map(id=>employees.find(e=>e.id===id)?.name)
  .filter(Boolean);
 return names.length?names.join(', '):(fallback||'-');
};

const employeeGeneratedShare=(record,employeeId)=>{
 const ids=responsibleEmployeeIds(record);
 if(!ids.includes(employeeId))return 0;
 return Number(record?.charged_amount||0)/Math.max(1,ids.length);
};

const dt=v=>v?new Date(v).toLocaleString('pt-BR'):'-';

const dateOnly=v=>v
 ?new Date(v+'T12:00:00').toLocaleDateString('pt-BR')
 :'-';

const finalPrice=s=>
 Number(s?.price||0)*(1-Number(s?.discount_percent||0)/100);

const safePhone=p=>String(p||'').replace(/\D/g,'');

// Máscara brasileira de telefone: (DD) 99999-9999 ou (DD) 9999-9999
const maskPhoneBR=value=>{
 const n=String(value||'').replace(/\D/g,'').slice(0,11);

 if(!n)return '';
 if(n.length<=2)return `(${n}`;

 const ddd=n.slice(0,2);
 const rest=n.slice(2);

 if(n.length<=10){
  if(rest.length<=4)return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0,4)}-${rest.slice(4)}`;
 }

 if(rest.length<=5)return `(${ddd}) ${rest}`;
 return `(${ddd}) ${rest.slice(0,5)}-${rest.slice(5)}`;
};

const VEHICLE_BRAND_GROUPS=[
 {
  name:'Grandes Grupos e Marcas Populares',
  brands:['Toyota','Volkswagen','Ford','Chevrolet (GM)','Fiat','Honda','Hyundai','Kia','Nissan','Renault','Peugeot','Citroën','Jeep','Ram','Mitsubishi','Subaru','Suzuki','Mazda','Daihatsu','Dacia']
 },
 {
  name:'Eletrificação e Novas Marcas',
  brands:['BYD','Tesla','XPeng','Geely','Chery','Caoa Chery','Changan','GAC Motor','Nio','Li Auto','Ora (Great Wall)','Haval','Zeekr','Lotus','Polestar','Smart','VinFast','Faraday Future','Rivian','Lucid Motors']
 },
 {
  name:'Luxo e Esportivas',
  brands:['Mercedes-Benz','BMW','Audi','Porsche','Volvo','Lexus','Infiniti','Acura','Genesis','Jaguar','Land Rover','Maserati','Alfa Romeo','Ferrari','Lamborghini','Aston Martin','Bentley','Rolls-Royce','Bugatti','McLaren','Pagani','Koenigsegg','Rimac','Alpine','Mini','DS Automobiles','Maybach','TVR','Morgan','Caterham']
 },
 {
  name:'Comerciais, Nacionais e Regionais',
  brands:['Iveco','Agrale','Troller','SsangYong (KGM)','Mahindra','Tata Motors','Isuzu','Hino','Foton','JAC Motors']
 },
 {
  name:'Históricas, Nicho e Outras',
  brands:['Dodge','Chrysler','Buick','Cadillac','GMC','Lincoln','Mercury','Pontiac','Saturn','Oldsmobile','Plymouth','Hummer','Scion','Lancia','Autobianchi','Rover','Saab','Daewoo','Lifan','Hafe']
 },
 {
  name:'Motos',
  brands:['Aprilia','Avelloz','Bajaj','Benelli','BMW','Bull Motors','CFMOTO','Dafra','Ducati','GasGas','Haojue','Harley-Davidson','Honda','Husqvarna','Kawasaki','KTM','Kymco','Mottu','MV Agusta','Royal Enfield','Shineray','Suzuki','Triumph','Voge','Yamaha']
 }
];

const upperVehicleText=value=>String(value||'').toLocaleUpperCase('pt-BR');

const findVehicleBrandGroup=(brand,categoryName='')=>{
 const b=String(brand||'').trim().toLocaleUpperCase('pt-BR');
 const isMoto=String(categoryName||'').toLocaleUpperCase('pt-BR').includes('MOTO');
 if(isMoto){
  const moto=VEHICLE_BRAND_GROUPS.find(g=>g.name==='Motos');
  if(moto?.brands.some(x=>upperVehicleText(x)===b))return moto.name;
 }
 if(['CHEVROLET','GM'].includes(b))return 'Grandes Grupos e Marcas Populares';
 return VEHICLE_BRAND_GROUPS.find(g=>g.brands.some(x=>upperVehicleText(x)===b))?.name||'';
};

// Máscara automática para CPF (11 dígitos) e CNPJ (14 dígitos)
const maskCpfCnpj=value=>{
 const n=String(value||'').replace(/\D/g,'').slice(0,14);

 if(!n)return '';

 if(n.length<=11){
  return n
   .replace(/^(\d{3})(\d)/,'$1.$2')
   .replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3')
   .replace(/\.(\d{3})(\d)/,'.$1-$2');
 }

 return n
  .replace(/^(\d{2})(\d)/,'$1.$2')
  .replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
  .replace(/\.(\d{3})(\d)/,'.$1/$2')
  .replace(/(\d{4})(\d)/,'$1-$2');
};

const validEmail=value=>
 /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());

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

const isoDateToBR=value=>{
 if(!value)return '';
 const [y,m,d]=String(value).slice(0,10).split('-');
 return y&&m&&d?`${d}/${m}/${y}`:'';
};

async function uploadIdentityPhoto(file,folder='avatars'){
 if(!file)return '';
 if(!file.type?.startsWith('image/')){
  throw new Error('Selecione um arquivo de imagem válido.');
 }
 if(file.size>5*1024*1024){
  throw new Error('A imagem deve possuir no máximo 5 MB.');
 }
 const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
 const path=`${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
 const {error}=await supabase.storage.from('service-images').upload(path,file);
 if(error)throw error;
 return supabase.storage.from('service-images').getPublicUrl(path).data.publicUrl;
}

const excelColors={red:'EF233C',dark:'0B0B0E',panel:'15151B',panel2:'1D1D24',white:'FFFFFF',muted:'A1A1AA',grid:'30303A'};
function excelCellStyle({fill=excelColors.panel,font=excelColors.white,bold=false,size=11,align='left',border=true}={}){const st={fill:{fgColor:{rgb:fill}},font:{color:{rgb:font},bold,sz:size,name:'Aptos'},alignment:{horizontal:align,vertical:'center',wrapText:true}};if(border)st.border={top:{style:'thin',color:{rgb:excelColors.grid}},bottom:{style:'thin',color:{rgb:excelColors.grid}},left:{style:'thin',color:{rgb:excelColors.grid}},right:{style:'thin',color:{rgb:excelColors.grid}}};return st;}
function styleExcelRange(ws,range,style){const r=XLSX.utils.decode_range(range);for(let R=r.s.r;R<=r.e.r;R++)for(let C=r.s.c;C<=r.e.c;C++){const a=XLSX.utils.encode_cell({r:R,c:C});if(!ws[a])ws[a]={t:'s',v:''};ws[a].s=style;}}
function makeExcelDashboard({title,period,metrics=[],sections=[]}){const data=Array.from({length:50},()=>Array(12).fill(''));data[0][0]='GARAGEM GRAU CAR 096';data[1][0]=title;data[2][0]=`Período: ${period}`;data[2][7]=`Emitido em: ${new Date().toLocaleString('pt-BR')}`;metrics.slice(0,4).forEach((m,i)=>{const c=i*3;data[4][c]=m.label.toUpperCase();data[5][c]=m.value;});let row=9;sections.forEach(sec=>{data[row][0]=sec.title.toUpperCase();row++;const max=Math.max(1,...(sec.items||[]).map(x=>Number(x.value)||0));(sec.items||[]).slice(0,10).forEach((item,i)=>{const pct=(Number(item.value)||0)/max;data[row+i][0]=item.label;data[row+i][3]=item.display??item.value;data[row+i][5]='█'.repeat(Math.max(1,Math.round(pct*18)));});row+=Math.min(10,(sec.items||[]).length)+2;});const ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=[{wch:28},{wch:15},{wch:4},{wch:18},{wch:4},{wch:24},{wch:4},{wch:24},{wch:4},{wch:18},{wch:4},{wch:18}];ws['!rows']=Array.from({length:50},(_,i)=>({hpt:i<3?24:i===5?32:20}));ws['!merges']=[XLSX.utils.decode_range('A1:L1'),XLSX.utils.decode_range('A2:L2'),XLSX.utils.decode_range('A3:F3'),XLSX.utils.decode_range('H3:L3')];styleExcelRange(ws,'A1:L50',excelCellStyle({fill:excelColors.dark,border:false}));styleExcelRange(ws,'A1:L1',excelCellStyle({fill:excelColors.red,bold:true,size:16,border:false}));styleExcelRange(ws,'A2:L2',excelCellStyle({fill:excelColors.dark,bold:true,size:20,border:false}));styleExcelRange(ws,'A3:L3',excelCellStyle({fill:excelColors.dark,font:excelColors.muted,size:10,border:false}));metrics.slice(0,4).forEach((m,i)=>{const c=i*3;styleExcelRange(ws,`${XLSX.utils.encode_cell({r:4,c})}:${XLSX.utils.encode_cell({r:6,c:c+1})}`,excelCellStyle({fill:excelColors.panel,border:true}));ws[XLSX.utils.encode_cell({r:4,c})].s=excelCellStyle({fill:excelColors.panel,font:excelColors.muted,bold:true,size:9,border:false});ws[XLSX.utils.encode_cell({r:5,c})].s=excelCellStyle({fill:excelColors.panel,bold:true,size:18,border:false});});for(let R=9;R<50;R++){const a=ws[XLSX.utils.encode_cell({r:R,c:0})];if(a?.v&&String(a.v)===String(a.v).toUpperCase())styleExcelRange(ws,`${XLSX.utils.encode_cell({r:R,c:0})}:${XLSX.utils.encode_cell({r:R,c:11})}`,excelCellStyle({fill:excelColors.panel2,bold:true,border:false}));const bar=ws[XLSX.utils.encode_cell({r:R,c:5})];if(bar?.v)bar.s=excelCellStyle({fill:excelColors.dark,font:excelColors.red,bold:true,border:false});}return ws;}
function makeExcelDataSheet(rows,columns){const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=columns.map(c=>({wch:c.width||18}));if(rows.length)ws['!autofilter']={ref:`A1:${XLSX.utils.encode_col(columns.length-1)}${rows.length+1}`};styleExcelRange(ws,`A1:${XLSX.utils.encode_col(columns.length-1)}1`,excelCellStyle({fill:excelColors.red,bold:true,align:'center'}));for(let r=2;r<=rows.length+1;r++){const fill=r%2===0?'F3F4F6':'FFFFFF';for(let c=0;c<columns.length;c++){const a=XLSX.utils.encode_cell({r:r-1,c});if(ws[a])ws[a].s={fill:{fgColor:{rgb:fill}},font:{color:{rgb:'202027'},sz:10,name:'Aptos'},alignment:{vertical:'center',wrapText:true},border:{bottom:{style:'thin',color:{rgb:'E5E7EB'}}}};}}return ws;}

function IconField({I,children,className=''}){
 return <div className={`iconField ${className}`}>
  {I&&<I size={17} aria-hidden="true"/>}
  {children}
 </div>;
}

function PhotoPicker({file,currentUrl,onChange,label='Foto de identificação'}){
 const preview=useMemo(()=>file?URL.createObjectURL(file):currentUrl||'',[file,currentUrl]);
 useEffect(()=>()=>{if(file&&preview?.startsWith('blob:'))URL.revokeObjectURL(preview)},[file,preview]);
 return <div className="photoPicker">
  <div className="photoPreview">
   {preview?<img src={preview} alt="Prévia da identificação"/>:<User size={28}/>}
  </div>
  <label>
   <ImagePlus size={17}/>
   <span>{file?file.name:label}</span>
   <input type="file" accept="image/*" onChange={e=>onChange(e.target.files?.[0]||null)}/>
  </label>
  <small>JPG, PNG ou WEBP · até 5 MB</small>
 </div>;
}


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

     <div className="heroTrustRow">
      <span><CheckCircle2 size={16}/> Atendimento organizado</span>
      <span><Clock3 size={16}/> Acompanhamento de serviços</span>
      <span><ShieldCheck size={16}/> Histórico digital</span>
     </div>

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
      className="publicPrimary mapRouteButton"
      href="https://www.google.com/maps/dir/?api=1&destination=Avenida+Coaracy+Nunes,+907+B,+Centro,+Macapa,+AP"
      target="_blank"
      rel="noreferrer"
      style={{textDecoration:'none'}}
     >
      <MapPin size={19}/>
      <span><b>Traçar rota</b><small>Abrir no Google Maps</small></span>
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

     <IconField I={User}><input
      required
      placeholder="Nome completo"
      value={application.name}
      onChange={e=>setApplication({
       ...application,
       name:e.target.value
      })}
     /></IconField>

     <input
      required
      placeholder="Telefone / WhatsApp"
      value={application.phone}
      onChange={e=>setApplication({
       ...application,
       phone:e.target.value
      })}
     />

     <IconField I={Mail}><input
      required
      type="email"
      placeholder="E-mail"
      value={application.email}
      onChange={e=>setApplication({
       ...application,
       email:e.target.value
      })}
     /></IconField>

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
   profile={profiles.find(p=>p.id===profile?.id)||profile}
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

   {tab==='usuarios'&&
    <UsersPanel
     {...common}
     setProfiles={setProfiles}
     setProfile={setProfile}
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
       placeholder="🔒 Nova senha"
       value={newPassword}
       onChange={e=>
        setNewPassword(e.target.value)
       }
      />

      <input
       type="password"
       autoComplete="new-password"
       placeholder="🔒 Confirmar nova senha"
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
    placeholder="✉ Usuário"
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
    placeholder="🔒 Senha"
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
 profile,
 signOut
}){
 const [photoOk,setPhotoOk]=useState(false);
 const [showPhoto,setShowPhoto]=useState(false);
 const photoUrl=String(profile?.photo_url||'').trim();

 useEffect(()=>{
  setPhotoOk(false);
  setShowPhoto(false);
  if(!photoUrl)return;
  const probe=new Image();
  probe.onload=()=>setPhotoOk(true);
  probe.onerror=()=>{setPhotoOk(false);setShowPhoto(false);};
  probe.src=photoUrl;
  return()=>{probe.onload=null;probe.onerror=null;};
 },[photoUrl]);

 useEffect(()=>{
  if(!photoUrl||!photoOk){setShowPhoto(false);return;}
  const timer=setInterval(()=>setShowPhoto(v=>!v),4500);
  return()=>clearInterval(timer);
 },[photoUrl,photoOk]);

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
  ['usuarios',ShieldCheck,['administrador','gerente'].includes(role)?'Usuários':'Meu perfil'],
  ['auditoria',ShieldCheck,'Auditoria']
 ];

 const managerOnly=new Set(['servicos','equipe','caixa','relatorios','auditoria']);
 const items=all.filter(([id])=>['administrador','gerente'].includes(role)||!managerOnly.has(id));
 const showingUser=Boolean(photoUrl&&photoOk&&showPhoto);

 return <aside>
  <div className="logo identitySlot">
   <img
    key={showingUser?`user-${photoUrl}`:'grau-car-logo'}
    src={showingUser?photoUrl:logoGraucar}
    alt={showingUser?`Foto de ${profile?.full_name||'usuário'}`:'Grau Car Garagem'}
    className={showingUser?'sidebarIdentityImage sidebarUserPhoto':'sidebarIdentityImage sidebarBrandLogo'}
    onError={()=>{if(showingUser){setPhotoOk(false);setShowPhoto(false);}}}
   />
   <div className="identityOrbit" aria-hidden="true">
    <span className="orbitItem orbitCar">🚗</span>
    <span className="orbitItem orbitMoto">🏍️</span>
    <span className="orbitItem orbitSoap">🧼</span>
    <span className="orbitItem orbitFoam">🫧</span>
    <span className="orbitItem orbitSponge">🧽</span>
   </div>
  </div>

  <nav>
   {items.map(([id,I,l])=>
    <button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}>
     <I size={19}/>{l}
    </button>
   )}
  </nav>

  <div className="asideBottom">
   <span>Perfil: {role}</span>
   <button type="button" onClick={()=>{window.location.href='/';}}><Car size={18}/>Voltar ao site</button>
   <button onClick={signOut}><LogOut size={18}/>Sair</button>
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


function Card({t,v,I,hint}){
 return <div className="card modernMetricCard">
  <div className="metricTop">
   <span>{t}</span>
   {I&&<span className="metricIcon"><I size={18}/></span>}
  </div>
  <strong>{v}</strong>
  {hint&&<small>{hint}</small>}
 </div>
}

function Status({value}){
 return <span className={`status ${value}`}>
  {String(value||'-').replaceAll('_',' ')}
 </span>
}

function paymentSymbol(name){
 const n=String(name||'').toLowerCase();
 if(n.includes('pix'))return '◆';
 if(n.includes('dinheiro'))return '💵';
 if(n.includes('crédito')||n.includes('credito'))return '💳';
 if(n.includes('débito')||n.includes('debito'))return '▣';
 if(n.includes('conta'))return '🏦';
 if(n.includes('parceiro'))return '🤝';
 if(n.includes('boleto'))return '▤';
 return '●';
}

function percentChange(current,previous){
 const c=Number(current||0),p=Number(previous||0);
 if(p===0)return c===0?0:null;
 return ((c-p)/p)*100;
}

function drawPdfHeader(doc,title,subtitle=''){
 const pageWidth=doc.internal.pageSize.getWidth();
 doc.setFillColor(10,10,13);doc.rect(0,0,pageWidth,38,'F');
 doc.setFillColor(215,25,32);doc.rect(0,0,5,38,'F');
 doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(18);
 doc.text('GARAGEM GRAU CAR 096',14,14);
 doc.setFont('helvetica','normal');doc.setFontSize(11);doc.setTextColor(218,218,222);doc.text(title,14,23);
 if(subtitle){doc.setFontSize(8.5);doc.setTextColor(175,175,182);doc.text(subtitle,14,31);}
}

function drawPdfMetric(doc,x,y,w,label,value){
 doc.setFillColor(247,247,249);doc.setDrawColor(226,226,231);doc.roundedRect(x,y,w,23,3,3,'FD');
 doc.setTextColor(115,115,124);doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.text(String(label).toUpperCase(),x+5,y+7);
 doc.setTextColor(28,28,34);doc.setFontSize(14);doc.text(String(value),x+5,y+17);
}

function drawPdfBars(doc,items,x,y,w,h){
 const safe=items.filter(i=>Number(i.value||0)>0).slice(0,7);
 if(!safe.length){doc.setTextColor(125,125,132);doc.setFontSize(8);doc.text('Sem dados suficientes para o gráfico.',x,y+8);return;}
 const max=Math.max(1,...safe.map(i=>Number(i.value||0)));
 const gap=4,barW=(w-gap*(safe.length-1))/safe.length;
 safe.forEach((item,i)=>{
  const bh=Math.max(3,(Number(item.value||0)/max)*(h-16));const bx=x+i*(barW+gap),by=y+h-12-bh;
  doc.setFillColor(231,34,58);doc.roundedRect(bx,by,barW,bh,1.5,1.5,'F');
  doc.setTextColor(80,80,88);doc.setFontSize(6.5);doc.text(String(item.label).slice(0,12),bx,y+h-5,{maxWidth:barW});
 });
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
 clients,
 vehicles,
 services,
 orders,
 appointments,
 profile
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

 const openAppointments=
  appointments.filter(a=>a.status!=='concluido');

 const todayAppointments=
  openAppointments.filter(a=>
   String(a.scheduled_at||'').slice(0,10)===today
  );

 const openAppointmentCount=new Set(openAppointments.map(a=>a.appointment_group_id||a.id)).size;
 const todayAppointmentCount=new Set(todayAppointments.map(a=>a.appointment_group_id||a.id)).size;

 const countAppointmentGroups=status=>
  new Set(
   appointments
    .filter(a=>a.status===status)
    .map(a=>a.appointment_group_id||a.id)
  ).size;

 const appointmentStatusCounts={
  agendado:countAppointmentGroups('agendado'),
  confirmado:countAppointmentGroups('confirmado'),
  em_atendimento:countAppointmentGroups('em_atendimento')
 };

 const revenueNow=new Date();
 const currentMonthCompletedOrders=
  completedOrders.filter(o=>{
   const d=new Date(o.completed_at||o.created_at);
   return (
    d.getFullYear()===revenueNow.getFullYear()&&
    d.getMonth()===revenueNow.getMonth()
   );
  });

 const revenue=
  currentMonthCompletedOrders.reduce(
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

 const operationalFlowTotal=completedOrders.length+openAppointmentCount;
 const completionRate=
  operationalFlowTotal
   ?Math.round((completedOrders.length/operationalFlowTotal)*100)
   :0;

 const serviceRanking=
  services
   .map(service=>({
    name:service.name,
    count:completedOrders.filter(
     o=>o.service_id===service.id
    ).length
   }))
   .filter(x=>x.count>0)
   .sort((a,b)=>b.count-a.count)
   .slice(0,5);

 const maxServiceCount=
  Math.max(1,...serviceRanking.map(x=>x.count));

 const dateLabel=
  new Date().toLocaleDateString(
   'pt-BR',
   {
    weekday:'long',
    day:'2-digit',
    month:'long'
   }
  );

 return <section className="dashboardPage">

  <div className="dashboardWelcome">
   <div>
    <span className="dashboardEyebrow">CENTRAL OPERACIONAL</span>
    <h2>
     Olá, {String(profile?.full_name||'equipe').split(' ')[0]}.
    </h2>
    <p>
     Visão geral da operação · {dateLabel}
    </p>
   </div>

   <div className="liveBadge">
    <span className="liveDot"/>
    Sistema online
   </div>
  </div>

  <div className="cards">

   <Card
    t="Clientes"
    v={clients.length}
    I={Users}
    hint="Base cadastrada"
   />

   <Card
    t="Veículos"
    v={vehicles.length}
    I={Car}
    hint="Veículos vinculados"
   />

   {profile?.role!=='administrativo'&&
    <Card
     t="Faturamento registrado"
     v={money(revenue)}
     I={Wallet}
     hint="Mês atual"
    />
   }

   <Card
    t="Serviços hoje"
    v={todayOrders.length}
    I={CheckCircle2}
    hint="Concluídos hoje"
   />

   <Card
    t="Agendamentos"
    v={openAppointmentCount}
    I={CalendarDays}
    hint={`${todayAppointmentCount} para hoje`}
   />

  </div>

  <div className="appointmentStatusGrid">
   <div className="appointmentStatusCard scheduled"><CalendarDays size={18}/><span>Agendados</span><strong>{appointmentStatusCounts.agendado}</strong></div>
   <div className="appointmentStatusCard confirmed"><CheckCircle2 size={18}/><span>Confirmados</span><strong>{appointmentStatusCounts.confirmado}</strong></div>
   <div className="appointmentStatusCard serving"><Clock3 size={18}/><span>Em atendimento</span><strong>{appointmentStatusCounts.em_atendimento}</strong></div>
  </div>

  <div className="dashboardGrid">

   <Panel title="Desempenho operacional">
    <div className="performanceBlock">
     <div className="performanceRing" style={{'--progress':`${completionRate}%`}}>
      <div>
       <strong>{completionRate}%</strong>
       <span>conclusão</span>
      </div>
     </div>

     <div className="performanceCopy">
      <span className="dashboardEyebrow">FLUXO DE SERVIÇOS</span>
      <h3>{completedOrders.length} serviços concluídos</h3>
      <p>
       Indicador calculado considerando os serviços concluídos e os agendamentos que ainda estão abertos.
      </p>
      <div className="miniStats">
       <span><b>{orders.length}</b> registrados</span>
       <span><b>{openAppointmentCount}</b> agendamentos abertos</span>
      </div>
     </div>
    </div>
   </Panel>

   <Panel title="Serviços mais realizados">
    <div className="rankingList">
     {serviceRanking.length===0
      ?<p className="hint">Ainda não há serviços concluídos para gerar o ranking.</p>
      :serviceRanking.map((item,index)=>
       <div className="rankingItem" key={item.name}>
        <div className="rankingMeta">
         <span>{String(index+1).padStart(2,'0')} · {item.name}</span>
         <b>{item.count}</b>
        </div>
        <div className="rankingTrack">
         <span style={{width:`${(item.count/maxServiceCount)*100}%`}}/>
        </div>
       </div>
      )
     }
    </div>
   </Panel>

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

    {openAppointments
     .slice(0,8)
     .map(a=>
      <tr key={a.id}>

       <td>{dt(a.scheduled_at)}</td>

       <td>
        {clients.find(c=>c.id===a.client_id)?.name||'-'}
       </td>

       <td>
        {vehicles.find(v=>v.id===a.vehicle_id)?.plate||'-'}
       </td>

       <td>
        {services.find(s=>s.id===a.service_id)?.name||'-'}
       </td>

       <td><Status value={a.status}/></td>

      </tr>
     )
    }

    {openAppointments.length===0&&
     <tr>
      <td colSpan="5" className="emptyStateCell">
       Nenhum agendamento pendente no momento.
      </td>
     </tr>
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
 canAdmin,
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

  if(edit&&!canAdmin){
   return alert('Você não possui permissão para editar clientes.');
  }

  const name=f.name.trim();
  const phone=maskPhoneBR(f.phone);
  const email=f.email.trim().toLowerCase();
  const document=maskCpfCnpj(f.document);

  if(!name||!phone||!email||!document){
   return alert(
    'Preencha todas as informações do cliente: nome, telefone, e-mail e CPF/CNPJ.'
   );
  }

  const phoneDigits=safePhone(phone);

  if(![10,11].includes(phoneDigits.length)){
   return alert(
    'Informe um telefone válido com DDD. Exemplo: (96) 98814-0106.'
   );
  }

  if(!validEmail(email)){
   return alert('Informe um e-mail válido.');
  }

  const documentDigits=String(document).replace(/\D/g,'');

  if(![11,14].includes(documentDigits.length)){
   return alert(
    'Informe um CPF com 11 dígitos ou um CNPJ com 14 dígitos.'
   );
  }

  const payload={
   name,
   phone,
   email,
   document
  };

  let saved;

  if(edit){
   saved=await update(
    'clients',
    edit,
    payload,
    setClients,
    'Editou cliente'
   );
  }else{
   saved=await insert(
    'clients',
    payload,
    setClients,
    'Cadastrou cliente'
   );
  }

  if(!saved)return;

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
    <div className="formGrid">
     <IconField I={User}><input
      required
      placeholder="Nome completo"
      value={f.name}
      onChange={e=>setF({...f,name:e.target.value})}
     /></IconField>

     <IconField I={Phone}><input
      required
      type="tel"
      inputMode="tel"
      maxLength={15}
      placeholder="Telefone"
      value={f.phone}
      onChange={e=>setF({...f,phone:maskPhoneBR(e.target.value)})}
     /></IconField>

     <IconField I={Mail}><input
      required
      type="email"
      placeholder="E-mail"
      value={f.email}
      onChange={e=>setF({...f,email:e.target.value})}
     /></IconField>

     <IconField I={IdCard}><input
      required
      inputMode="numeric"
      maxLength={18}
      placeholder="CPF/CNPJ"
      value={f.document}
      onChange={e=>setF({...f,document:maskCpfCnpj(e.target.value)})}
     /></IconField>
    </div>
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
      <td>{r.phone?maskPhoneBR(r.phone):'-'}</td>
      <td>{r.email||'-'}</td>
      <td>{r.document?maskCpfCnpj(r.document):'-'}</td>

      <td>
       <Actions
        onView={()=>setDetail(r.id)}

        onEdit={
         canAdmin
          ?()=>{
            setEdit(r.id);

            setF({
             name:r.name||'',
             phone:maskPhoneBR(r.phone||''),
             email:r.email||'',
             document:maskCpfCnpj(r.document||'')
            });
           }
          :null
        }

        onDelete={
         canAdmin
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

    <div className="formGrid">
     <IconField I={User}><input
      required
      placeholder="Nome completo"
      value={f.name}
      onChange={e=>setF({...f,name:e.target.value})}
     /></IconField>

     <IconField I={Phone}><input
      required
      type="tel"
      inputMode="tel"
      maxLength={15}
      placeholder="Telefone"
      value={f.phone}
      onChange={e=>setF({...f,phone:maskPhoneBR(e.target.value)})}
     /></IconField>

     <IconField I={Mail}><input
      required
      type="email"
      placeholder="E-mail"
      value={f.email}
      onChange={e=>setF({...f,email:e.target.value})}
     /></IconField>

     <IconField I={IdCard}><input
      required
      inputMode="numeric"
      maxLength={18}
      placeholder="CPF/CNPJ"
      value={f.document}
      onChange={e=>setF({...f,document:maskCpfCnpj(e.target.value)})}
     /></IconField>
    </div>

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
      <span>{client.phone?maskPhoneBR(client.phone):'-'}</span>
     </div>

     <div>
      <b>E-mail</b>
      <span>{client.email||'-'}</span>
     </div>

     <div>
      <b>Documento</b>
      <span>{client.document?maskCpfCnpj(client.document):'-'}</span>
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

        const employeeNames=
         responsibleEmployeeNames(o,employees,o.performed_by||'-');

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
          {employeeNames}
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
 const [brandNiche,setBrandNiche]=useState('');

 function closeEdit(){
  setEdit(null);
  setF(empty);
  setBrandNiche('');
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

  const payload={
   ...f,
   plate:upperVehicleText(f.plate),
   brand:upperVehicleText(f.brand),
   model:upperVehicleText(f.model),
   color:upperVehicleText(f.color)
  };

  if(edit){

   await update(
    'vehicles',
    edit,
    payload,
    setVehicles,
    'Editou veículo'
   );

  }else{

   await insert(
    'vehicles',
    payload,
    setVehicles,
    'Cadastrou veículo'
   );

  }

  setF(empty);
  setBrandNiche('');
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
     👤 Cliente
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
     🚘 Categoria do veículo
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


   <select
    value={brandNiche}
    onChange={e=>{
     setBrandNiche(e.target.value);
     setF({...f,brand:''});
    }}
   >
    <option value="">🏷 Nicho da marca</option>
    {VEHICLE_BRAND_GROUPS.map(group=>
     <option key={group.name} value={group.name}>{group.name}</option>
    )}
   </select>

   <select
    value={f.brand}
    disabled={!brandNiche}
    onChange={e=>setF({...f,brand:upperVehicleText(e.target.value)})}
   >
    <option value="">◆ {brandNiche?'Marca':'Escolha primeiro o nicho'}</option>
    {f.brand&&brandNiche&&!((VEHICLE_BRAND_GROUPS.find(g=>g.name===brandNiche)?.brands||[]).some(brand=>upperVehicleText(brand)===upperVehicleText(f.brand)))&&
     <option value={f.brand}>{upperVehicleText(f.brand)}</option>
    }
    {(VEHICLE_BRAND_GROUPS.find(g=>g.name===brandNiche)?.brands||[]).map(brand=>
     <option key={brand} value={upperVehicleText(brand)}>{upperVehicleText(brand)}</option>
    )}
   </select>

   <input
    placeholder="▣ Placa"
    value={f.plate}
    onChange={e=>setF({...f,plate:upperVehicleText(e.target.value)})}
    style={{textTransform:'uppercase'}}
   />

   <input
    placeholder="🚗 Modelo"
    value={f.model}
    onChange={e=>setF({...f,model:upperVehicleText(e.target.value)})}
    style={{textTransform:'uppercase'}}
   />

   <input
    placeholder="◉ Cor"
    value={f.color}
    onChange={e=>setF({...f,color:upperVehicleText(e.target.value)})}
    style={{textTransform:'uppercase'}}
   />

   <input
    placeholder="◷ Ano"
    value={f.year}
    onChange={e=>setF({...f,year:e.target.value.replace(/\D/g,'').slice(0,4)})}
    inputMode="numeric"
   />

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
      placeholder="🏷 Categoria · Ex.: SUV, PICKUP, RET, SEDAN, MOTO..."
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

            const categoryNameForBrand=vehicleCategories.find(c=>c.id===r.category_id)?.name||'';
            setBrandNiche(findVehicleBrandGroup(r.brand,categoryNameForBrand));
            setF({
             client_id:r.client_id||'',
             category_id:r.category_id||'',
             plate:upperVehicleText(r.plate||''),
             brand:upperVehicleText(r.brand||''),
             model:upperVehicleText(r.model||''),
             color:upperVehicleText(r.color||''),
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


function VehicleReferenceImage({vehicle,category}){
 const [state,setState]=useState({loading:true,url:'',title:'',source:'',pageUrl:''});
 const [imageFailed,setImageFailed]=useState(false);

 useEffect(()=>{
  const controller=new AbortController();
  const brandStored=String(vehicle.brand||'').trim();
  const brand=brandStored.replace(/\s*\(GM\)\s*/i,'').trim();
  const rawModel=String(vehicle.model||'').trim();
  const year=String(vehicle.year||'').trim();
  setImageFailed(false);
  if(!brand&&!rawModel){setState({loading:false,url:'',title:'',source:'',pageUrl:''});return()=>controller.abort();}

  const esc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  let model=rawModel.replace(new RegExp(`^${esc(brand)}\\s+`,'i'),'').trim();
  const trimWords=/\b(YOUNG|LTZ|LT|LS|PREMIER|COMFORTLINE|HIGHLINE|TRENDLINE|XLS|XLT|LIMITED|EX|LX|LXS|TOURING|ADVANCE|AUDACE|DRIVE|ATTRACTIVE|ESSENCE|WAY|FIRE|ECONOMY|JOY|ACTIV|RS|SS|FLEX|AUTOMATICO|AUTOMÁTICO|MANUAL)\b/gi;
  const baseModel=model.replace(trimWords,' ').replace(/\s+/g,' ').trim()||model;
  const upper=`${brand} ${rawModel}`.toUpperCase();
  const aliases=[];
  if(upper.includes('EVOQUE'))aliases.push('Range Rover Evoque','Land Rover Range Rover Evoque');
  if(upper.includes('PALIO'))aliases.push('Fiat Palio');
  if(upper.includes('CRUZE'))aliases.push('Chevrolet Cruze');
  if(upper.includes('STRADA'))aliases.push('Fiat Strada');
  if(upper.includes('SAVEIRO'))aliases.push('Volkswagen Saveiro');
  if(upper.includes('HILUX'))aliases.push('Toyota Hilux');
  if(upper.includes('S10'))aliases.push('Chevrolet S-10','Chevrolet S10');

  const queries=[...aliases,`${brand} ${model}`,`${brand} ${baseModel}`]
   .map(x=>x.replace(/\s+/g,' ').trim()).filter((x,i,a)=>x&&a.indexOf(x)===i);
  const stop=new Set(['land','rover','chevrolet','fiat','volkswagen','vw','ford','toyota','honda','renault','hyundai','jeep','nissan','mitsubishi','mercedes','benz','bmw','audi','carro','automovel','automóvel']);
  const modelTokens=baseModel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(t=>t.length>2&&!stop.has(t));
  const brandTokens=brand.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(t=>t.length>2);
  const norm=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  async function summary(lang,key,title){
   try{
    const res=await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key||title.replace(/\s+/g,'_'))}`,{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!res.ok)return null;
    const d=await res.json();
    let url=d?.originalimage?.source||d?.thumbnail?.source||'';
    if(url.startsWith('//'))url=`https:${url}`;
    if(!url)return null;
    return {url,title:d?.title||title,source:`Wikipedia (${lang.toUpperCase()})`,pageUrl:d?.content_urls?.desktop?.page||''};
   }catch{return null;}
  }

  async function wikipediaSearch(lang,q){
   const res=await fetch(`https://${lang}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=8`,{signal:controller.signal,headers:{Accept:'application/json'}});
   if(!res.ok)return null;
   const data=await res.json();
   const pages=Array.isArray(data?.pages)?data.pages:[];
   const ranked=pages.map(pg=>{
    const hay=norm(`${pg.title||''} ${pg.description||''} ${pg.excerpt||''}`);
    const modelHits=modelTokens.filter(t=>hay.includes(t)).length;
    const brandHits=brandTokens.filter(t=>hay.includes(t)).length;
    const exact=norm(pg.title).includes(norm(baseModel))?4:0;
    return {pg,score:modelHits*5+brandHits*2+exact,modelHits};
   }).filter(x=>modelTokens.length?x.modelHits>0:true).sort((a,b)=>b.score-a.score);
   for(const item of ranked){
    const pg=item.pg;
    // A API de busca devolve miniaturas pequenas. Primeiro buscamos a página
    // completa para usar originalimage e evitar fotos ampliadas/embaçadas.
    const full=await summary(lang,pg.key,pg.title||q);
    if(full)return full;
    let url=pg?.thumbnail?.url||'';
    if(url.startsWith('//'))url=`https:${url}`;
    if(url)return {url,title:pg.title||q,source:`Wikipedia (${lang.toUpperCase()})`,pageUrl:`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(pg.key||String(pg.title||'').replace(/\s+/g,'_'))}`};
   }
   return null;
  }

  async function find(){
   try{
    for(const q of queries){
     for(const lang of ['pt','en']){
      const found=await wikipediaSearch(lang,q);
      if(found){setState({loading:false,...found});return;}
     }
    }
    setState({loading:false,url:'',title:'',source:'',pageUrl:''});
   }catch(e){if(e.name!=='AbortError')setState({loading:false,url:'',title:'',source:'',pageUrl:''});}
  }

  setState({loading:true,url:'',title:'',source:'',pageUrl:''});
  find();
  return()=>controller.abort();
 },[vehicle.brand,vehicle.model,vehicle.year]);

 if(state.loading)return <div className="vehicleReference loading"><div className="vehicleImageSkeleton"/><div><span className="dashboardEyebrow">FOTO DO MODELO</span><b>Localizando {vehicle.brand} {vehicle.model}...</b><small>Buscando uma referência específica do modelo cadastrado.</small></div></div>;
 if(!state.url||imageFailed)return <div className="vehiclePhotoUnavailable"><div className="vehiclePhotoPlaceholder"><Car size={62}/></div><div><span className="dashboardEyebrow">FOTO DO MODELO</span><h4>{vehicle.brand} {vehicle.model} {vehicle.year}</h4><p>Não encontrei uma fotografia confiável deste modelo. Para evitar mostrar um veículo diferente, nenhuma imagem genérica foi exibida.</p><div className="vehicleBlueprintMeta"><span>{category?.name||'Categoria não informada'}</span><span>{vehicle.color||'Cor não informada'}</span><span>Placa {vehicle.plate||'-'}</span></div></div></div>;
 return <div className="vehicleReference"><div className="vehicleReferenceImage"><img src={state.url} alt={`${vehicle.brand||''} ${vehicle.model||''} ${vehicle.year||''}`.trim()} onError={()=>setImageFailed(true)}/><span>Foto de referência do modelo</span></div><div className="vehicleReferenceInfo"><span className="dashboardEyebrow">REFERÊNCIA VISUAL DO MODELO</span><h4>{vehicle.brand} {vehicle.model} {vehicle.year}</h4><p>Modelo identificado como <b>{state.title}</b>. A foto pode representar outro ano, versão, cor ou acabamento, mas a busca exige correspondência com o modelo cadastrado.</p><div className="vehicleBlueprintMeta"><span>{category?.name||'Categoria não informada'}</span><span>{vehicle.color||'Cor não informada'}</span><span>Placa {vehicle.plate||'-'}</span></div><small>Fonte visual: {state.source}</small></div></div>;
}

function VehicleBlueprint({vehicle,category}){
 const type=String(category?.name||'').toLowerCase();
 const isPickup=type.includes('pickup')||type.includes('picape');
 const isMoto=type.includes('moto');
 const isSuv=type.includes('suv')||type.includes('utilit');
 const isHatch=type.includes('hatch');
 const path=isPickup
  ?'M120 170 L165 118 L355 112 L420 142 L565 145 L610 170 L625 205 L600 218 L150 218 L105 198 Z'
  :isSuv
   ?'M105 180 L155 112 L405 102 L510 132 L590 170 L610 205 L585 220 L135 220 L92 202 Z'
   :isHatch
    ?'M115 182 L180 122 L365 110 L470 140 L555 176 L575 207 L548 220 L140 220 L100 201 Z'
    :'M105 183 L185 128 L390 116 L505 148 L575 180 L590 207 L565 220 L135 220 L95 202 Z';
 return <div className="vehicleBlueprint">
  <div className="vehicleBlueprintHead"><span>ILUSTRAÇÃO TÉCNICA</span><b>{vehicle.brand||'Veículo'} {vehicle.model||''} {vehicle.year||''}</b></div>
  {isMoto?
   <svg viewBox="0 0 700 280" role="img" aria-label="Ilustração aproximada da motocicleta">
    <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
     <circle cx="210" cy="205" r="55"/><circle cx="500" cy="205" r="55"/><path d="M210 205 L305 120 L395 205 L500 205 L430 105 L350 105 L305 120 M430 105 L485 80 M300 120 L270 90"/>
    </g>
   </svg>
   :<svg viewBox="0 0 700 280" role="img" aria-label="Ilustração aproximada do veículo">
    <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
     <path d={path}/><circle cx="205" cy="214" r="48"/><circle cx="510" cy="214" r="48"/>
     <path d="M205 166 A48 48 0 0 1 253 214 M462 214 A48 48 0 0 1 510 166" opacity=".7"/>
     <path d="M190 125 L245 78 L390 78 L455 128" opacity=".75"/>
     <path d="M265 82 L285 128 M385 82 L405 128" opacity=".55"/>
     <path d="M135 190 L175 190 M545 190 L590 190" opacity=".55"/>
    </g>
   </svg>}
  <div className="vehicleBlueprintMeta"><span>{category?.name||'Categoria não informada'}</span><span>{vehicle.color||'Cor não informada'}</span><span>Placa {vehicle.plate||'-'}</span></div>
  <small>Desenho ilustrativo aproximado, gerado a partir da categoria e dos dados cadastrados; não representa necessariamente o desenho exato do modelo.</small>
 </div>;
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

  <VehicleReferenceImage vehicle={vehicle} category={category}/>

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
    placeholder="🔧 Nome do serviço"
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
     🚘 Categoria do veículo
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
    placeholder="R$ Preço"
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
    placeholder="% Desconto"
    value={f.discount_percent}
    onChange={e=>
     setF({
      ...f,
      discount_percent:e.target.value
     })
    }
   />

   <input
    placeholder="▤ Descrição"
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
     o=>responsibleEmployeeNames(o,employees,o.performed_by||'')
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
     placeholder="⌕ Cliente, placa, veículo, serviço ou funcionário"
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
         g.rows.flatMap(o=>{
          const ids=responsibleEmployeeIds(o);
          if(!ids.length)return [o.performed_by||'-'];
          return ids.map(id=>employees.find(e=>e.id===id)?.name).filter(Boolean);
         })
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
  employee_ids:[],
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
      employee_id:f.employee_ids[0]||null,
      employee_ids:f.employee_ids,
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
   !f.employee_ids.length||
   !f.scheduled_date||
   !f.scheduled_time||
   f.charged_amount===''||
   !f.payment_method_id
  ){

   return alert(
    'Preencha todos os campos obrigatórios: cliente, veículo, serviço, pelo menos um funcionário responsável, data, hora, valor cobrado e forma de pagamento.'
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
      employee_id:f.employee_ids[0]||null,
      employee_ids:f.employee_ids,
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
    responsibleEmployeeNames(a,employees,'');

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
   employee_id:responsibleEmployeeIds(a)[0]||'',
   employee_ids:responsibleEmployeeIds(a),
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
     👤 Cliente *
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
     🚗 Veículo *
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
       :'🔧 Serviços *'
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


   <div className="multi-services">
    <details className="services-dropdown">
     <summary>
      {f.employee_ids.length
       ?`${f.employee_ids.length} funcionário(s) responsável(is) *`
       :'👷 Funcionário(s) responsável(is) *'
      }
     </summary>
     <div className="services-dropdown-list">
      {employees
       .filter(e=>e.active!==false)
       .map(e=>{
        const selected=f.employee_ids.includes(e.id);
        return <label key={e.id} className="service-check">
         <input
          type="checkbox"
          checked={selected}
          onChange={event=>{
           const ids=event.target.checked
            ?[...f.employee_ids,e.id]
            :f.employee_ids.filter(id=>id!==e.id);
           setF({
            ...f,
            employee_ids:ids,
            employee_id:ids[0]||''
           });
          }}
         />
         <span>{e.name}{e.position?` · ${e.position}`:''}</span>
        </label>;
       })
      }
     </div>
    </details>
   </div>


   <div className="appointment-datetime">

    <input
     type="text"
     inputMode="numeric"
     placeholder="📅 DD/MM/AAAA *"
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
     placeholder="◷ HH:MM *"
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
    placeholder="% Desconto"
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
    placeholder="R$ Valor cobrado *"
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
     💳 Forma de pagamento *
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
    placeholder="▤ Observações"
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
     placeholder="👤 Cliente"
     value={filters.client}
     onChange={e=>
      setFilters({
       ...filters,
       client:e.target.value
      })
     }
    />

    <input
     placeholder="🚗 Veículo / placa"
     value={filters.vehicle}
     onChange={e=>
      setFilters({
       ...filters,
       vehicle:e.target.value
      })
     }
    />

    <input
     placeholder="🔧 Serviço"
     value={filters.service}
     onChange={e=>
      setFilters({
       ...filters,
       service:e.target.value
      })
     }
    />

    <input
     placeholder="👷 Funcionário"
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

     const employeeNames=
      responsibleEmployeeNames(a,employees,'-');

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
       {employeeNames}
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
  active:true,
  photo_url:''
 };

 const [f,setF]=useState(empty);
 const [edit,setEdit]=useState(null);
 const [search,setSearch]=useState('');
 const [detail,setDetail]=useState(null);
 const [photoFile,setPhotoFile]=useState(null);

 function closeEdit(){
  setEdit(null);
  setF(empty);
  setPhotoFile(null);
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

  if(photoFile){
   try{p.photo_url=await uploadIdentityPhoto(photoFile,'employees');}
   catch(e){return alert(e.message||'Não foi possível enviar a foto.');}
  }

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
  setPhotoFile(null);
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
    o=>responsibleEmployeeIds(o).includes(detail)
   )
   .sort(
    (a,b)=>
     new Date(b.completed_at||b.created_at)-
     new Date(a.completed_at||a.created_at)
   );


 const employeeCompletedHistory=history.filter(o=>o.status==='concluido');
 const employeeAllTimeTotal=employeeCompletedHistory.reduce((sum,o)=>sum+employeeGeneratedShare(o,detail),0);
 const employeeNow=new Date();
 const employeeCurrentMonthTotal=employeeCompletedHistory
  .filter(o=>{
   const d=new Date(o.completed_at||o.created_at);
   return d.getFullYear()===employeeNow.getFullYear()&&d.getMonth()===employeeNow.getMonth();
  })
  .reduce((sum,o)=>sum+employeeGeneratedShare(o,detail),0);

 const employeeFields=
  <>
  <div className="formGrid">

   <input
    placeholder="👤 Nome"
    value={f.name}
    onChange={e=>
     setF({
      ...f,
      name:e.target.value
     })
    }
   />

   <input
    placeholder="☎ Telefone"
    value={f.phone}
    onChange={e=>
     setF({
      ...f,
      phone:maskPhoneBR(e.target.value)
     })
    }
    inputMode="tel"
    maxLength={15}
   />

   <input
    placeholder="◆ Função"
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
    placeholder="% Comissão"
    value={f.commission_percent}
    onChange={e=>
     setF({
      ...f,
      commission_percent:e.target.value
     })
    }
   />

  </div>
  <PhotoPicker file={photoFile} currentUrl={f.photo_url} onChange={setPhotoFile} label="Foto de identificação do integrante"/>
  </>;


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
     'Gerado no mês',
     'Total geral',
     'Comissão estimada (mês)',
     'Ações'
    ]}
   >

    {filtered.map(e=>{

     const eo=
      orders.filter(
       o=>
        responsibleEmployeeIds(o).includes(e.id)&&
        o.status==='concluido'
      );

     const total=
      eo.reduce(
       (s,o)=>s+employeeGeneratedShare(o,e.id),
       0
      );

     const now=new Date();
     const monthTotal=eo
      .filter(o=>{
       const d=new Date(o.completed_at||o.created_at);
       return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
      })
      .reduce((s,o)=>s+employeeGeneratedShare(o,e.id),0);

     return <tr key={e.id}>

      <td><div className="personCell">{e.photo_url?<img src={e.photo_url} alt=""/>:<span className="avatarFallback"><User size={15}/></span>}<b>{e.name}</b></div></td>
      <td>{e.position||'-'}</td>
      <td>{e.phone?maskPhoneBR(e.phone):'-'}</td>
      <td>{e.commission_percent||0}%</td>
      <td><b>{money(monthTotal)}</b></td>
      <td>{money(total)}</td>

      <td>
       <b>
        {money(
         monthTotal*
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
             phone:maskPhoneBR(e.phone||''),
             position:e.position||'',
             commission_percent:
              e.commission_percent||0,
             active:e.active!==false,
             photo_url:e.photo_url||''
            });
            setPhotoFile(null);
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

    {employee.photo_url&&<div className="profileHero"><img src={employee.photo_url} alt={`Foto de ${employee.name}`}/><div><span className="dashboardEyebrow">IDENTIFICAÇÃO</span><strong>{employee.name}</strong><small>{employee.position||'Integrante da equipe'}</small></div></div>}

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
       {employee.phone?maskPhoneBR(employee.phone):'-'}
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

     <div>
      <b>Gerado no mês vigente</b>
      <span>{money(employeeCurrentMonthTotal)}</span>
     </div>

     <div>
      <b>Total gerado — todos os meses</b>
      <span>{money(employeeAllTimeTotal)}</span>
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
           employeeGeneratedShare(o,employee.id)
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

 const firstDayOfMonth=`${today.slice(0,8)}01`;
 const [rangeFrom,setRangeFrom]=useState(firstDayOfMonth);
 const [rangeTo,setRangeTo]=useState(today);
 const [rangeFromText,setRangeFromText]=useState(isoDateToBR(firstDayOfMonth));
 const [rangeToText,setRangeToText]=useState(isoDateToBR(today));

 const [methodName,setMethodName]=
  useState('');

 const [evolutionMode,setEvolutionMode]=useState('day');


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
   const d=String(e.paid_at).slice(0,10);
   return (!rangeFrom||d>=rangeFrom)&&(!rangeTo||d<=rangeTo);
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


 const evolutionPoints=useMemo(()=>{
  const map={};
  selectedEntries.forEach(e=>{
   const date=String(e.paid_at).slice(0,10);
   const key=evolutionMode==='day'?date:evolutionMode==='month'?date.slice(0,7):date.slice(0,4);
   map[key]=(map[key]||0)+Number(e.amount||0);
  });
  return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>({
   key,
   label:evolutionMode==='day'?`${key.slice(8,10)}/${key.slice(5,7)}`:evolutionMode==='month'?new Date(`${key}-01T12:00:00`).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}):key,
   value
  }));
 },[selectedEntries,evolutionMode]);

 const evolutionMax=Math.max(1,...evolutionPoints.map(p=>p.value));
 const evolutionPolyline=evolutionPoints.map((p,i)=>{
  const x=evolutionPoints.length===1?500:40+(i*(920/(evolutionPoints.length-1)));
  const y=205-(p.value/evolutionMax)*150;
  return `${x},${y}`;
 }).join(' ');

 const selectedLabel=`${rangeFrom?isoDateToBR(rangeFrom):'início'} a ${rangeTo?isoDateToBR(rangeTo):'hoje'}`;


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



 function cashPdf(){
  const doc=new jsPDF({orientation:'landscape'});
  const subtitle=`Período: ${selectedLabel}  •  Emitido em ${new Date().toLocaleString('pt-BR')}`;
  drawPdfHeader(doc,'Relatório de Caixa',subtitle);
  const avg=selectedEntries.length?selectedTotal/selectedEntries.length:0;
  drawPdfMetric(doc,14,45,58,'Total do período',money(selectedTotal));
  drawPdfMetric(doc,76,45,48,'Atendimentos',selectedEntries.length);
  drawPdfMetric(doc,128,45,58,'Ticket médio',money(avg));
  drawPdfMetric(doc,190,45,72,'Formas utilizadas',selectedByMethod.length);
  doc.setTextColor(40,40,46);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('Distribuição por forma de pagamento',14,78);
  drawPdfBars(doc,selectedByMethod.map(x=>({label:x.name,value:x.total})),14,82,118,52);
  doc.text('Evolução do faturamento',150,78);
  drawPdfBars(doc,evolutionPoints.map(x=>({label:x.label,value:x.value})),150,82,118,52);
  autoTable(doc,{startY:145,margin:{left:14,right:14},head:[['Data/Hora','Forma de pagamento','Valor','Referência']],body:selectedEntries.map(e=>[dt(e.paid_at),paymentMethods.find(m=>m.id===e.payment_method_id)?.name||'Sem forma de pagamento',money(e.amount),e.order_id?.slice(0,8)||'-']),theme:'grid',styles:{fontSize:8,cellPadding:3,lineColor:[228,228,232],lineWidth:.15},headStyles:{fillColor:[215,25,32],textColor:[255,255,255]},alternateRowStyles:{fillColor:[248,248,250]}});
  doc.save(`relatorio-caixa-${rangeFrom||'inicio'}-a-${rangeTo||'hoje'}.pdf`);
 }

 function cashExcel(){
  const wb=XLSX.utils.book_new();
  const avg=selectedEntries.length?selectedTotal/selectedEntries.length:0;
  const dashboard=makeExcelDashboard({
   title:'Dashboard Gerencial do Caixa',period:selectedLabel,
   metrics:[{label:'Faturamento',value:money(selectedTotal)},{label:'Atendimentos',value:selectedEntries.length},{label:'Ticket médio',value:money(avg)},{label:'Formas utilizadas',value:selectedByMethod.length}],
   sections:[
    {title:'Distribuição por forma de pagamento',items:selectedByMethod.map(x=>({label:`${paymentSymbol(x.name)} ${x.name}`,value:x.total,display:money(x.total)}))},
    {title:`Evolução do faturamento — ${evolutionMode==='day'?'por dia':evolutionMode==='month'?'por mês':'por ano'}`,items:evolutionPoints.map((x,i)=>({label:x.label,value:x.value,display:`${money(x.value)}${i?`  (${percentChange(x.value,evolutionPoints[i-1].value)>=0?'↑':'↓'} ${Math.abs(percentChange(x.value,evolutionPoints[i-1].value)||0).toFixed(1)}%)`:''}`}))}
   ]
  });
  XLSX.utils.book_append_sheet(wb,dashboard,'Dashboard');
  const methodRows=selectedByMethod.map(x=>({'Forma de pagamento':x.name,'Total':x.total,'Participação (%)':selectedTotal?(x.total/selectedTotal)*100:0}));
  XLSX.utils.book_append_sheet(wb,makeExcelDataSheet(methodRows,[{width:28},{width:18},{width:18}]),'Formas de pagamento');
  const evoRows=evolutionPoints.map((x,i)=>({'Período':x.label,'Faturamento':x.value,'Variação (%)':i?percentChange(x.value,evolutionPoints[i-1].value):0}));
  XLSX.utils.book_append_sheet(wb,makeExcelDataSheet(evoRows,[{width:18},{width:20},{width:18}]),'Evolução');
  const detailRows=selectedEntries.map(e=>({'Data/Hora':dt(e.paid_at),'Forma de pagamento':paymentMethods.find(m=>m.id===e.payment_method_id)?.name||'Sem forma de pagamento','Valor':Number(e.amount||0),'Referência':e.order_id?.slice(0,8)||'-'}));
  XLSX.utils.book_append_sheet(wb,makeExcelDataSheet(detailRows,[{width:22},{width:28},{width:18},{width:18}]),'Movimentações');
  XLSX.writeFile(wb,'relatorio-caixa-grau-car.xlsx');
 }

 return <section>

  <Panel title="Selecionar período" action={<span className="hint">Consulta: {selectedLabel}</span>}>
   <div className="rangeSelector">
    <label><CalendarDays size={17}/><span>De</span><input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={rangeFromText} onChange={e=>{const v=maskDateBR(e.target.value);setRangeFromText(v);setRangeFrom(brDateToIso(v));}}/></label>
    <label><CalendarDays size={17}/><span>Até</span><input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={rangeToText} onChange={e=>{const v=maskDateBR(e.target.value);setRangeToText(v);setRangeTo(brDateToIso(v));}}/></label>
   </div>
  </Panel>

  <Panel title="Resumo do caixa" action={<div className="reportBtns"><button className="secondary" onClick={cashPdf}><FileDown size={17}/>PDF</button><button className="primary" onClick={cashExcel}><FileDown size={17}/>Excel</button></div>}>
   <div className="cashSummary">
    <div><span>Hoje</span><strong>{money(todayTotal)}</strong></div>
    <div><span>Mês atual</span><strong>{money(monthTotal)}</strong></div>
    <div><span>Período selecionado</span><strong>{money(selectedTotal)}</strong></div>
   </div>
  </Panel>

  <div className="cashVisualGrid">
   <Panel title="Distribuição por forma de pagamento">
    <div className="rankingList">
     {selectedByMethod.length===0?<p className="hint">Sem movimentações no período selecionado.</p>:selectedByMethod.map(item=>{const max=Math.max(1,...selectedByMethod.map(x=>x.total));const share=selectedTotal?(item.total/selectedTotal)*100:0;return <div className="rankingItem paymentRanking" key={item.name}><div className="rankingMeta"><span><i>{paymentSymbol(item.name)}</i>{item.name}<small>{share.toFixed(1)}%</small></span><b>{money(item.total)}</b></div><div className="rankingTrack"><span style={{width:`${(item.total/max)*100}%`}}/></div></div>;})}
    </div>
   </Panel>

   <Panel title="Evolução do faturamento" action={<div className="segmentedControl compact"><button className={evolutionMode==='day'?'active':''} onClick={()=>setEvolutionMode('day')}>Dias</button><button className={evolutionMode==='month'?'active':''} onClick={()=>setEvolutionMode('month')}>Meses</button><button className={evolutionMode==='year'?'active':''} onClick={()=>setEvolutionMode('year')}>Anos</button></div>}>
    {evolutionPoints.length===0?<p className="hint">Os dados do período aparecerão aqui em formato gráfico.</p>:<div className="revenueEvolution">
     <svg viewBox="0 0 1000 240" preserveAspectRatio="none" className="revenueLine" aria-hidden="true"><polyline points={evolutionPolyline}/>{evolutionPoints.map((p,i)=>{const x=evolutionPoints.length===1?500:40+(i*(920/(evolutionPoints.length-1)));const y=205-(p.value/evolutionMax)*150;return <circle key={p.key} cx={x} cy={y} r="7"/>;})}</svg>
     <div className="evolutionColumns">{evolutionPoints.map((p,i)=>{const change=i?percentChange(p.value,evolutionPoints[i-1].value):null;return <div className="evolutionPoint" key={p.key}><strong>{money(p.value)}</strong><div className="evolutionBar"><span style={{height:`${Math.max(8,(p.value/evolutionMax)*100)}%`}}/></div><b>{p.label}</b><small className={change===null?'neutral':change>=0?'up':'down'}>{i===0?'Base':change===null?'Novo':`${change>=0?'↑':'↓'} ${Math.abs(change).toFixed(1)}%`}</small></div>;})}</div>
    </div>}
    <p className="hint evolutionHint">Dias = agrupa o intervalo por dia · Meses = agrupa o intervalo por mês · Anos = agrupa o intervalo por ano.</p>
   </Panel>
  </div>

  <Panel title="Movimentações do período">
   <div className="cashSummary compactSummary"><div><span>Total do período</span><strong>{money(selectedTotal)}</strong></div>{selectedByMethod.map(x=><div key={x.name}><span>{paymentSymbol(x.name)} {x.name}</span><strong>{money(x.total)}</strong></div>)}</div>
   <Table headers={['Data','Total','Por forma de pagamento']}>{dailyBreakdown.map(row=><tr key={row.date}><td>{dateOnly(row.date)}</td><td><b>{money(row.total)}</b></td><td><div className="serviceTags">{Object.entries(row.byMethod).map(([name,value])=><span key={name}>{paymentSymbol(name)} {name}: {money(value)}</span>)}</div></td></tr>)}{dailyBreakdown.length===0&&<tr><td colSpan="3">Nenhum faturamento encontrado no período.</td></tr>}</Table>
  </Panel>

  {canAdmin&&<Panel title="Formas de pagamento" action={<button className="primary" onClick={addMethod}><Plus size={17}/>Adicionar</button>}><div className="formGrid two"><input placeholder="💳 Ex.: PIX, Dinheiro, Cartão" value={methodName} onChange={e=>setMethodName(e.target.value)}/></div><div className="methodChips">{paymentMethods.map(m=><span key={m.id}><i>{paymentSymbol(m.name)}</i>{m.name}<button onClick={()=>remove('payment_methods',m.id,setPaymentMethods,'Excluiu forma de pagamento')}><X size={14}/></button></span>)}</div></Panel>}

  <Panel title="Fechamento de caixa" action={<div className="inline"><div className="iconField"><CalendarDays size={17}/><input className="dateInput" type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={selectedDayText} onChange={e=>{const masked=maskDateBR(e.target.value);setSelectedDayText(masked);const iso=brDateToIso(masked);if(iso)setSelectedDay(iso);}}/></div>{canAdmin&&<button className="primary" onClick={close}><Wallet size={17}/>Fechar caixa do dia</button>}</div>}><p className="hint">O fechamento manual continua disponível. O sistema também verifica automaticamente o fechamento às 23:59 enquanto estiver em execução.</p></Panel>

  <Panel title="Fechamentos anteriores"><Table headers={['Data','Fechado em','Total','Ações']}>{cashClosings.map(c=><tr key={c.id}><td>{dateOnly(c.closing_date)}</td><td>{dt(c.closed_at)}</td><td><b>{money(c.total_amount)}</b></td><td>{canSuperAdmin?<button className="danger" type="button" title="Excluir fechamento" onClick={()=>deleteClosing(c.id)}><Trash2 size={16}/></button>:<span className="hint">Somente administrador</span>}</td></tr>)}{cashClosings.length===0&&<tr><td colSpan="4">Nenhum fechamento registrado.</td></tr>}</Table></Panel>

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
 const [fromText,setFromText]=useState('');
 const [toText,setToText]=useState('');


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

   const employeeNames=
    responsibleEmployeeNames(o,employees,o.performed_by||'');

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
     employeeNames,

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
  const total=rows.reduce((sum,r)=>sum+r.Valor,0);
  const doc=new jsPDF({orientation:'landscape'});
  drawPdfHeader(doc,'Relatório Gerencial de Serviços',`Período: ${from?isoDateToBR(from):'início'} a ${to?isoDateToBR(to):'hoje'}  •  Emitido em ${new Date().toLocaleString('pt-BR')}`);
  const uniqueClients=new Set(rows.map(r=>r.Cliente).filter(Boolean)).size;
  const avg=rows.length?total/rows.length:0;
  drawPdfMetric(doc,14,45,55,'Serviços',rows.length);drawPdfMetric(doc,73,45,62,'Faturamento',money(total));drawPdfMetric(doc,139,45,55,'Clientes',uniqueClients);drawPdfMetric(doc,198,45,62,'Ticket médio',money(avg));
  const byService=Object.values(rows.reduce((a,r)=>{a[r.Servico]=a[r.Servico]||{label:r.Servico||'Sem serviço',value:0};a[r.Servico].value+=r.Valor;return a;},{})).sort((a,b)=>b.value-a.value).slice(0,7);
  const byDay=Object.values(filtered.reduce((a,o)=>{const k=String(o.completed_at||o.created_at).slice(0,10);const serv=services.find(x=>x.id===o.service_id);a[k]=a[k]||{label:isoDateToBR(k).slice(0,5),value:0};a[k].value+=Number(o.charged_amount||finalPrice(serv)||0);return a;},{})).slice(-7);
  doc.setTextColor(40,40,46);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('Faturamento por serviço',14,79);drawPdfBars(doc,byService,14,83,118,48);doc.text('Evolução recente',150,79);drawPdfBars(doc,byDay,150,83,118,48);
  autoTable(doc,{startY:142,margin:{left:14,right:14},head:[['Data','Cliente','Placa','Veículo','Serviço','Funcionário','Valor','Status']],body:rows.map(r=>[r.Data,r.Cliente,r.Placa,r.Veiculo,r.Servico,r.Funcionario,money(r.Valor),String(r.Status||'').replaceAll('_',' ')]),theme:'grid',styles:{fontSize:7.7,cellPadding:2.8,lineColor:[226,226,230],lineWidth:.15,textColor:[45,45,50]},headStyles:{fillColor:[215,25,32],textColor:[255,255,255],fontStyle:'bold'},alternateRowStyles:{fillColor:[248,248,250]},didDrawPage:()=>{const page=doc.internal.getNumberOfPages(),height=doc.internal.pageSize.getHeight();doc.setFontSize(8);doc.setTextColor(120,120,128);doc.text(`Garagem Grau Car 096 • Relatório gerencial • Página ${page}`,14,height-8);}});
  doc.save('relatorio-gerencial-grau-car.pdf');
 }

 function excel(){
  const wb=XLSX.utils.book_new();
  const total=rows.reduce((sum,r)=>sum+r.Valor,0);
  const uniqueClients=new Set(rows.map(r=>r.Cliente).filter(Boolean)).size;
  const avg=rows.length?total/rows.length:0;
  const byService=Object.values(rows.reduce((a,r)=>{const k=r.Servico||'Sem serviço';a[k]=a[k]||{label:k,value:0};a[k].value+=r.Valor;return a;},{})).sort((a,b)=>b.value-a.value).slice(0,10);
  const byEmployee=Object.values(rows.reduce((a,r)=>{const k=r.Funcionario||'Não informado';a[k]=a[k]||{label:k,value:0};a[k].value+=r.Valor;return a;},{})).sort((a,b)=>b.value-a.value).slice(0,10);
  const period=`${from?isoDateToBR(from):'início'} a ${to?isoDateToBR(to):'hoje'}`;
  XLSX.utils.book_append_sheet(wb,makeExcelDashboard({title:'Dashboard Gerencial de Serviços',period,metrics:[{label:'Serviços',value:rows.length},{label:'Faturamento',value:money(total)},{label:'Clientes',value:uniqueClients},{label:'Ticket médio',value:money(avg)}],sections:[{title:'Faturamento por serviço',items:byService.map(x=>({...x,display:money(x.value)}))},{title:'Faturamento por integrante',items:byEmployee.map(x=>({...x,display:money(x.value)}))}]}),'Dashboard');
  XLSX.utils.book_append_sheet(wb,makeExcelDataSheet(rows,[{width:20},{width:28},{width:12},{width:24},{width:28},{width:24},{width:16},{width:16}]),'Serviços');
  const payRows=payments.filter(p=>{const d=String(p.paid_at||'').slice(0,10);return(!from||d>=from)&&(!to||d<=to)}).map(p=>({'Data/Hora':dt(p.paid_at),'Forma de pagamento':paymentMethods.find(m=>m.id===p.payment_method_id)?.name||'Sem forma de pagamento','Valor':Number(p.amount||0)}));
  XLSX.utils.book_append_sheet(wb,makeExcelDataSheet(payRows,[{width:22},{width:28},{width:18}]),'Pagamentos');
  XLSX.writeFile(wb,'relatorio-gerencial-grau-car.xlsx');
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
     <CalendarDays size={17}/> De
     <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={fromText}
      onChange={e=>{const v=maskDateBR(e.target.value);setFromText(v);setFrom(brDateToIso(v));}}/>
    </label>

    <label>
     <CalendarDays size={17}/> Até
     <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={toText}
      onChange={e=>{const v=maskDateBR(e.target.value);setToText(v);setTo(brDateToIso(v));}}/>
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
 setProfiles,
 setProfile
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
 const [photoFile,setPhotoFile]=useState(null);
 const [editPhotoFile,setEditPhotoFile]=useState(null);

 const [editUser,setEditUser]=
  useState(null);

 const [editForm,setEditForm]=
  useState({
   full_name:'',
   email:'',
   password:'',
   role:'visualizador',
   photo_url:''
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

 function canEditUserRecord(p){
  if(!p)return false;
  if(p.id===profile?.id)return true;
  if(canSuperAdmin)return true;
  if(
   profile?.role==='gerente'&&
   ['administrativo','visualizador'].includes(p.role)
  )return true;
  return false;
 }

 const visibleProfiles=
  canAdmin
   ?profiles
   :profiles.filter(p=>p.id===profile?.id);

 function editableRolesFor(p){
  if(p?.id===profile?.id)return [p.role];
  if(canSuperAdmin)return ['administrador','gerente','administrativo','visualizador'];
  if(profile?.role==='gerente')return ['administrativo','visualizador'];
  return [p?.role||'visualizador'];
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

    let createdUser=data.user;
    if(photoFile){
     const photo_url=await uploadIdentityPhoto(photoFile,'profiles');
     const {data:photoData,error:photoError}=await supabase.functions.invoke(
      'create-user',
      {
       body:{
        action:'update',
        id:data.user.id,
        full_name:data.user.full_name||f.full_name.trim(),
        email:data.user.email||f.email.trim().toLowerCase(),
        role:data.user.role||f.role,
        photo_url
       }
      }
     );
     if(photoError)throw photoError;
     if(photoData?.error)throw new Error(photoData.error);
     createdUser=photoData?.user||{...data.user,photo_url};
    }

    setProfiles(x=>{

     if(
      x.some(
       p=>p.id===data.user.id
      )
     ){
      return x.map(
       p=>
        p.id===data.user.id
         ?createdUser
         :p
      );
     }

     return [
      ...x,
      createdUser
     ];

    });


    await addLog(
     `Criou usuário ${f.email}`,
     'profiles',
     data.user.id
    );

   }


   setF(empty);
   setPhotoFile(null);

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

  if(!canEditUserRecord(p))return;


  setEditUser(p);


  setEditForm({
   full_name:p.full_name||'',
   email:p.email||'',
   password:'',
   role:p.role||'visualizador',
   photo_url:p.photo_url||''
  });
  setEditPhotoFile(null);

 }


 function closeEdit(){

  setEditUser(null);

  setEditForm({
   full_name:'',
   email:'',
   password:'',
   role:'visualizador',
   photo_url:''
  });
  setEditPhotoFile(null);

 }


 async function saveEdit(){

  if(
   !editUser||
   !canEditUserRecord(editUser)
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

  if(
   profile?.role==='gerente'&&
   editUser.id!==profile?.id&&
   (
    !['administrativo','visualizador'].includes(editUser.role)||
    !['administrativo','visualizador'].includes(editForm.role)
   )
  ){
   return alert(
    'Gerentes só podem editar usuários Administrativo ou Visualizador.'
   );
  }


  setBusy(true);


  try{

   let uploadedPhotoUrl='';
   if(editPhotoFile){
    uploadedPhotoUrl=await uploadIdentityPhoto(editPhotoFile,'profiles');
   }

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

   if(uploadedPhotoUrl){
    body.photo_url=uploadedPhotoUrl;
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


   let updated=
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

   if(editUser.id===profile?.id){
    setProfile?.(current=>({...current,...updated}));
   }


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
   title={canAdmin?"Usuários do sistema":"Meu perfil"}
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

   {canAdmin&&<>
   <div className="formGrid">

    <input
     placeholder="👤 Nome completo"
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
     placeholder="✉ E-mail"
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
     placeholder="🔒 Senha inicial"
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

   <PhotoPicker file={photoFile} currentUrl={f.photo_url} onChange={setPhotoFile} label="Foto de identificação do usuário"/>
   </>}

   <Table
    headers={[
     'Nome',
     'E-mail',
     'Perfil',
     'Ações'
    ]}
   >

    {visibleProfiles.map(p=>
     <tr key={p.id}>

      <td><div className="personCell">{p.photo_url?<img src={p.photo_url} alt=""/>:<span className="avatarFallback"><User size={15}/></span>}<b>{p.full_name||'-'}</b></div></td>

      <td>
       {p.email||'-'}
      </td>

      <td>
       <Status value={p.role}/>
      </td>

      <td>

       {canEditUserRecord(p)
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


   {canAdmin&&<div className="roleGrid">

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
      Clientes, veículos, agendamentos e execução dos serviços. Pode cadastrar clientes, mas não editar nem excluir clientes. Não visualiza faturamento no Dashboard.
     </p>
    </div>

    <div>
     <b>Visualizador</b>
     <p>
      Acesso para consulta, sem alterações.
     </p>
    </div>

   </div>}

  </Panel>


  {editUser&&
   <Modal
    title={`Editar usuário: ${editUser.full_name||editUser.email}`}
    onClose={closeEdit}
   >

    <div className="formGrid">

     <input
      placeholder="👤 Nome completo"
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
      placeholder="✉ E-mail"
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

      {editableRolesFor(editUser).map(r=>
       <option key={r} value={r}>
        {roleLabel(r)}
       </option>
      )}

     </select>

    </div>

    <PhotoPicker file={editPhotoFile} currentUrl={editForm.photo_url||editUser.photo_url} onChange={setEditPhotoFile} label="Alterar foto de identificação"/>

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
 const [from,setFrom]=useState('');const [to,setTo]=useState('');const [fromText,setFromText]=useState('');const [toText,setToText]=useState('');const [search,setSearch]=useState('');
 const filtered=logs.filter(l=>{const date=String(l.created_at||'').slice(0,10),q=search.trim().toLowerCase(),txt=`${l.user_name||''} ${l.action||''} ${l.entity_type||''}`.toLowerCase();return(!from||date>=from)&&(!to||date<=to)&&(!q||txt.includes(q));});
 const uniqueUsers=new Set(filtered.map(l=>l.user_name).filter(Boolean)).size;
 const uniqueTypes=new Set(filtered.map(l=>l.entity_type).filter(Boolean)).size;
 const byType=Object.values(filtered.reduce((a,l)=>{const k=l.entity_type||'Outros';a[k]=a[k]||{label:k,value:0};a[k].value++;return a;},{})).sort((a,b)=>b.value-a.value).slice(0,7);
 const byDay=Object.values(filtered.reduce((a,l)=>{const k=String(l.created_at||'').slice(0,10);a[k]=a[k]||{label:isoDateToBR(k).slice(0,5),value:0};a[k].value++;return a;},{})).slice(-10);
 function auditPdf(){const doc=new jsPDF({orientation:'landscape'});drawPdfHeader(doc,'Relatório Gerencial de Auditoria',`Período: ${from?isoDateToBR(from):'início'} a ${to?isoDateToBR(to):'hoje'}  •  Emitido em ${new Date().toLocaleString('pt-BR')}`);drawPdfMetric(doc,14,45,55,'Registros',filtered.length);drawPdfMetric(doc,73,45,55,'Usuários',uniqueUsers);drawPdfMetric(doc,132,45,55,'Tipos',uniqueTypes);drawPdfMetric(doc,191,45,69,'Última atividade',filtered[0]?dt(filtered[0].created_at).slice(0,16):'-');doc.setTextColor(40,40,46);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('Registros por tipo',14,79);drawPdfBars(doc,byType,14,83,118,48);doc.text('Atividade ao longo do período',150,79);drawPdfBars(doc,byDay,150,83,118,48);autoTable(doc,{startY:142,margin:{left:14,right:14},head:[['Data/Hora','Usuário','Ação','Tipo']],body:filtered.map(l=>[dt(l.created_at),l.user_name||'-',l.action||'-',l.entity_type||'-']),theme:'grid',styles:{fontSize:8,cellPadding:3,lineColor:[226,226,230],lineWidth:.15},headStyles:{fillColor:[215,25,32],textColor:[255,255,255]},alternateRowStyles:{fillColor:[248,248,250]}});doc.save('relatorio-auditoria-grau-car.pdf');}
 function auditExcel(){
  const wb=XLSX.utils.book_new();
  const period=`${from?isoDateToBR(from):'início'} a ${to?isoDateToBR(to):'hoje'}`;
  XLSX.utils.book_append_sheet(wb,makeExcelDashboard({title:'Dashboard Gerencial de Auditoria',period,metrics:[{label:'Registros',value:filtered.length},{label:'Usuários envolvidos',value:uniqueUsers},{label:'Tipos de entidade',value:uniqueTypes},{label:'Última atividade',value:filtered[0]?dt(filtered[0].created_at).slice(0,16):'-'}],sections:[{title:'Registros por tipo',items:byType.map(x=>({...x,display:`${x.value} registros`}))},{title:'Atividade por dia',items:byDay.map(x=>({...x,display:`${x.value} ações`}))}]}),'Dashboard');
  const rows=filtered.map(l=>({'Data/Hora':dt(l.created_at),'Usuário':l.user_name||'-','Ação':l.action||'-','Tipo':l.entity_type||'-'}));
  XLSX.utils.book_append_sheet(wb,makeExcelDataSheet(rows,[{width:22},{width:28},{width:56},{width:24}]),'Auditoria');
  XLSX.writeFile(wb,'relatorio-auditoria-grau-car.xlsx');
 }
 return <section><Panel title="Relatório da auditoria" action={<div className="reportBtns"><button className="secondary" onClick={auditPdf}><FileDown size={17}/>PDF</button><button className="primary" onClick={auditExcel}><FileDown size={17}/>Excel</button></div>}><div className="formGrid"><label><CalendarDays size={17}/> De<input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={fromText} onChange={e=>{const v=maskDateBR(e.target.value);setFromText(v);setFrom(brDateToIso(v));}}/></label><label><CalendarDays size={17}/> Até<input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={toText} onChange={e=>{const v=maskDateBR(e.target.value);setToText(v);setTo(brDateToIso(v));}}/></label></div><SearchBox value={search} onChange={setSearch} placeholder="Pesquisar por usuário, ação ou tipo"/><div className="cashSummary"><div><span>Registros encontrados</span><strong>{filtered.length}</strong></div><div><span>Usuários envolvidos</span><strong>{uniqueUsers}</strong></div><div><span>Tipos de registro</span><strong>{uniqueTypes}</strong></div></div><div className="auditDashboard"><div><h4>Registros por tipo</h4>{byType.map(x=><div className="auditBar" key={x.label}><span>{x.label}</span><div><i style={{width:`${(x.value/Math.max(1,...byType.map(y=>y.value)))*100}%`}}/></div><b>{x.value}</b></div>)}</div><div><h4>Atividade recente</h4><div className="auditTimeline">{byDay.map(x=><div key={x.label}><b>{x.value}</b><span>{x.label}</span></div>)}</div></div></div></Panel><Panel title="Histórico de ações"><Table headers={['Data/Hora','Usuário','Ação','Tipo']}>{filtered.map(l=><tr key={l.id}><td>{dt(l.created_at)}</td><td>{l.user_name||'-'}</td><td>{l.action}</td><td>{l.entity_type||'-'}</td></tr>)}{filtered.length===0&&<tr><td colSpan="4">Nenhum registro encontrado no período.</td></tr>}</Table></Panel></section>;
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

createRoot(
 document.getElementById('root')
).render(
 <Root/>
);