import React,{useState,useEffect} from 'react';
import {createPortal} from 'react-dom';
import {Search} from 'lucide-react';
export default function AppointmentMultiPicker({label,count,open,onToggle,children,search, onSearch, placeholder}){
 const anchor=React.useRef(null);
 const popup=React.useRef(null);
 const onToggleRef=React.useRef(onToggle);
 onToggleRef.current=onToggle;
 const [pos,setPos]=useState({top:0,left:0,width:280,maxHeight:240});

 useEffect(()=>{
  if(!open)return;
  const reposition=()=>{
   const rect=anchor.current?.getBoundingClientRect();
   if(!rect)return;
   const margin=12,gap=6;
   const below=window.innerHeight-rect.bottom-margin-gap;
   const above=rect.top-margin-gap;
   const up=below<230&&above>below;
   const room=Math.max(110,up?above:below);
   const maxHeight=Math.min(320,room);
   const width=Math.min(rect.width,window.innerWidth-2*margin);
   const left=Math.max(margin,Math.min(rect.left,window.innerWidth-margin-width));
   setPos({top:up?Math.max(margin,rect.top-gap-maxHeight):rect.bottom+gap,left,width,maxHeight});
  };
  const outside=e=>{
   if(!anchor.current?.contains(e.target)&&!popup.current?.contains(e.target))onToggleRef.current(false);
  };
  const escape=e=>{if(e.key==='Escape')onToggleRef.current(false)};
  reposition();
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  window.addEventListener('resize',reposition);
  window.addEventListener('scroll',reposition,true);
  return ()=>{
   document.removeEventListener('pointerdown',outside);
   document.removeEventListener('keydown',escape);
   window.removeEventListener('resize',reposition);
   window.removeEventListener('scroll',reposition,true);
  };
 },[open]);

 return <div ref={anchor} className="multi-services" style={{minWidth:0}}>
  <button type="button" aria-expanded={open} aria-haspopup="true" onClick={()=>onToggle(!open)}
   style={{width:'100%',minHeight:48,padding:'10px 13px',borderRadius:12,
    border:`1px solid ${open?'#ef233c':'rgba(255,255,255,.22)'}`,
    background:'#0d0d12',color:'#fff',font:'inherit',fontSize:14,fontWeight:600,
    display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,textAlign:'left',cursor:'pointer'}}>
   <span style={{minWidth:0,overflowWrap:'anywhere'}}>{count?`${count} ${label.selected}`:label.empty}</span>
   <span aria-hidden="true" style={{flexShrink:0}}>{open?'⌃':'⌄'}</span>
  </button>
  {open&&createPortal(<div ref={popup} role="group" aria-label={label.title}
   className="services-dropdown-list"
   style={{position:'fixed',top:pos.top,left:pos.left,width:pos.width,maxHeight:pos.maxHeight,
    boxSizing:'border-box',overflowY:'auto',overscrollBehavior:'contain',
    background:'#101016',color:'#fff',border:'1px solid #ef233c',borderRadius:12,
    boxShadow:'0 14px 36px rgba(0,0,0,.7)',padding:8,zIndex:100000}}>
   {onSearch&&<div className="appointmentPickerSearch"><Search size={17}/><input autoFocus type="search" value={search||''} onChange={e=>onSearch(e.target.value)} placeholder={placeholder||'Pesquisar...'} aria-label={placeholder||'Pesquisar'} /></div>}
   <div className="appointmentPickerOptions">{children}</div>
  </div>,document.body)}
 </div>;
}

