import React,{useEffect,useRef,useState} from 'react';
import {Monitor,Maximize,Minimize,ArrowLeft,LogOut,Car,Clock3,CalendarDays,CheckCircle2,Wrench} from 'lucide-react';
import './tv-panel.css';
const zone='America/Belem';
const day=d=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).filter(x=>x.type!=='literal').reduce((a,x)=>({...a,[x.type]:x.value}),{});
const key=d=>{const p=day(d);return p.year+'-'+p.month+'-'+p.day};
const time=d=>new Date(d).toLocaleTimeString('pt-BR',{timeZone:zone,hour:'2-digit',minute:'2-digit'});
const date=d=>new Date(d).toLocaleDateString('pt-BR',{timeZone:zone,day:'2-digit',month:'2-digit',year:'numeric'});
const stages=[['agendado','Agendados',CalendarDays],['confirmado','Confirmados',Clock3],['em_atendimento','Em serviço',Wrench],['concluido','Concluídos',CheckCircle2]];
async function rows(query){let out=[];for(let i=0;;i+=500){const {data,error}=await query().range(i,i+499);if(error)throw error;out.push(...(data||[]));if(!data||data.length<500)return out;}}
function groups(records,completed){const map=new Map();for(const r of records){const id=completed?(r.atendimento_id||r.id):(r.appointment_group_id||r.id);if(!map.has(id))map.set(id,{...r,items:[]});map.get(id).items.push(r);}return [...map.values()];}
export default function TvPanel({supabase,logo,onExit,onSignOut,role}){
 const [now,setNow]=useState(new Date()),[data,setData]=useState(null),[error,setError]=useState(''),[updated,setUpdated]=useState(null),[full,setFull]=useState(false);
 useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);const f=()=>setFull(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',f);return()=>{clearInterval(t);document.removeEventListener('fullscreenchange',f)}},[]);
 useEffect(()=>{let active=true,busy=false;async function refresh(){if(busy)return;busy=true;try{const start=new Date(key(new Date())+'T00:00:00-03:00'),end=new Date(start.getTime()+86400000);const [a,o,v,s,e]=await Promise.all([
 rows(()=>supabase.from('appointments').select('id,appointment_group_id,vehicle_id,service_id,employee_id,employee_ids,status,scheduled_at').in('status',['agendado','confirmado','em_atendimento']).order('id')),
 rows(()=>supabase.from('service_orders').select('id,atendimento_id,vehicle_id,service_id,employee_id,employee_ids,status,completed_at').eq('status','concluido').gte('completed_at',start.toISOString()).lt('completed_at',end.toISOString()).order('id')),
 rows(()=>supabase.from('vehicles').select('id,brand,model').order('id')),
 rows(()=>supabase.from('service_types').select('id,name').order('id')),
 rows(()=>supabase.from('employees').select('id,name').order('id'))
 ]);if(active){setData({a,o,v,s,e});setUpdated(new Date());setError('')}}catch(e){if(active)setError(e.message||'Falha na atualização')}finally{busy=false}}
 refresh();const t=setInterval(refresh,10000);return()=>{active=false;clearInterval(t)}},[supabase]);
 const list=data?[...groups(data.a.filter(r=>['agendado','confirmado','em_atendimento'].includes(r.status)),false),...groups(data.o,true)].sort((a,b)=>String(a.scheduled_at||a.completed_at).localeCompare(String(b.scheduled_at||b.completed_at))):[];
 const panelRef=useRef(null);
 useEffect(()=>{
  const states=new WeakMap();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const tick=()=>{
   if(reduced.matches||document.hidden)return;
   for(const el of panelRef.current?.querySelectorAll('.tvScroll')||[]){
    const max=el.scrollHeight-el.clientHeight;
    let st=states.get(el);
    if(!st){st={until:Date.now()+2500,atEnd:false};states.set(el,st);}
    if(max<=1){el.scrollTop=0;st.atEnd=false;st.until=Date.now()+2500;continue;}
    if(el.matches(':hover')&&!document.fullscreenElement){st.until=Date.now()+1000;continue;}
    if(Date.now()<st.until)continue;
    if(el.scrollTop>=max-1){
     if(!st.atEnd){st.atEnd=true;st.until=Date.now()+2500;}
     else{el.scrollTop=0;st.atEnd=false;st.until=Date.now()+2500;}
    }else{st.atEnd=false;el.scrollTop=Math.min(max,el.scrollTop+1);}
   }
  };
  const t=setInterval(tick,40);return()=>clearInterval(t);
 },[]);
 const toggle=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else setError('Tela cheia indisponível neste navegador.')}catch{setError('Não foi possível ativar tela cheia.')}};
 const leave=()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});onExit()};
 return <div className="tvPanel" ref={panelRef}><div className="tvHead"><img src={logo} alt="Grau Car"/><div><small>CENTRAL OPERACIONAL</small><h1>Painel de serviços</h1></div><div className="tvClock"><strong>{time(now)}</strong><span>{now.toLocaleDateString('pt-BR',{timeZone:zone,weekday:'long',day:'2-digit',month:'long'})}</span></div></div>
 <div className="tvTools"><span className={error?'tvOffline':'tvOnline'}>{error?'● Atualização indisponível':updated?'● Atualizado às '+time(updated):'Carregando…'} · Atualização a cada 10 s</span><button onClick={toggle}>{full?<Minimize/>:<Maximize/>} {full?'Sair da tela cheia':'Tela cheia'}</button><button onClick={leave}><ArrowLeft/> Voltar</button><button onClick={onSignOut}><LogOut/> Sair</button></div>
 {error&&<p role="alert" className="tvError">Não foi possível atualizar o painel. Os dados anteriores podem estar desatualizados. {error}</p>}
 <div className="tvStats">{stages.map(([id,label,I])=><div key={id} className={'tvStat '+id}><I/><span>{label}</span><strong>{data?list.filter(r=>r.status===id).length:'—'}</strong></div>)}</div>
 <div className="tvColumns">{stages.map(([id,label,I])=>{const items=list.filter(r=>r.status===id);return <section className={'tvColumn '+id} key={id}><h2><I/>{label}</h2><div className="tvScroll" tabIndex={0} aria-label={'Atendimentos: '+label}>{items.length?items.map(r=>{const v=data.v.find(x=>x.id===r.vehicle_id);const names=[...new Set(r.items.map(x=>data.s.find(s=>s.id===x.service_id)?.name).filter(Boolean))];const ids=[...new Set(r.items.flatMap(x=>x.employee_ids?.length?x.employee_ids:[x.employee_id]).filter(Boolean))];const team=ids.map(i=>data.e.find(e=>e.id===i)?.name?.split(' ')[0]).filter(Boolean);return <article key={r.id}><h3><Car/>{v?[v.brand,v.model].filter(Boolean).join(' '):'Veículo'}</h3><p>{names.join(' · ')||'Serviço'}</p><span>{team.join(', ')||'Sem responsável'}</span><small>{id==='concluido'?'Concluído':'Agendado'} às {time(r.scheduled_at||r.completed_at)} · {date(r.scheduled_at||r.completed_at)}</small></article>}):<p className="tvEmpty">{data?'Nenhum atendimento':'Carregando…'}</p>}</div></section>})}</div>
 <footer>Garagem Grau Car 096 · Pendências e conclusões do dia <span>{role==='visualizador'?'Modo de exibição contínua':'Sessão sujeita ao limite de inatividade'}</span></footer></div>
}
