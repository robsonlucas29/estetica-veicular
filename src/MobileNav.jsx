import React,{useEffect,useState} from 'react';
import {LayoutGrid,CalendarDays,Users,ClipboardList,MoreHorizontal,LogOut,Car} from 'lucide-react';

export default function MobileNav({items=[],tab,setTab,signOut,role}){
 const [open,setOpen]=useState(false);
 useEffect(()=>{setOpen(false)},[tab]);
 useEffect(()=>{
  if(!open)return;
  const onKey=e=>{if(e.key==='Escape')setOpen(false)};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[open]);
 const quickIds=['dashboard','agendamentos','clientes','producao','historico','veiculos'];
 const quick=quickIds.map(id=>items.find(item=>item[0]===id)).filter(Boolean).slice(0,4);
 const rest=items.filter(item=>!quick.some(q=>q[0]===item[0]));
 const choose=id=>{setTab(id);setOpen(false);window.scrollTo({top:0,behavior:'auto'})};
 return <div className="mobileNavigation">
  {open&&<div className="mobileNavBackdrop" onClick={()=>setOpen(false)} aria-hidden="true"/>}
  {open&&<div className="mobileNavSheet" role="dialog" aria-label="Todos os módulos" aria-modal="false">
   <div className="mobileNavSheetTitle"><strong>Todos os módulos</strong><span>{role}</span></div>
   <div className="mobileNavSheetGrid">
    {rest.map(([id,Icon,label])=><button type="button" key={id} className={tab===id?'active':''} onClick={()=>choose(id)}><Icon size={19}/><span>{label}</span></button>)}
   </div>
   <div className="mobileNavSheetFooter">
    <button type="button" onClick={()=>{window.location.href='/'}}><Car size={18}/> Site</button>
    <button type="button" onClick={signOut}><LogOut size={18}/> Sair</button>
   </div>
  </div>}
  <nav className="mobileNavDock" aria-label="Navegação rápida">
   {quick.map(([id,Icon,label])=><button type="button" key={id} className={tab===id?'active':''} aria-current={tab===id?'page':undefined} onClick={()=>choose(id)}><Icon size={21}/><span>{label}</span></button>)}
   <button type="button" className={open||rest.some(item=>item[0]===tab)?'active':''} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><MoreHorizontal size={22}/><span>Mais</span></button>
  </nav>
 </div>;
}
