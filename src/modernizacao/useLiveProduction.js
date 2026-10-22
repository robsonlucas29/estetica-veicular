import {useEffect,useState} from 'react';

/**
 * Sincroniza apenas os conjuntos usados pela agenda e pelo painel.
 * Os eventos do Realtime nao incluem dados sensiveis na interface:
 * sao usados apenas como gatilho para consultar novamente com RLS.
 */
export function useLiveProduction(supabase,enabled,initialAppointments,initialOrders){
 const [appointments,setAppointments]=useState(initialAppointments||[]);
 const [orders,setOrders]=useState(initialOrders||[]);
 const [status,setStatus]=useState('aguardando');
 useEffect(()=>setAppointments(initialAppointments||[]),[initialAppointments]);
 useEffect(()=>setOrders(initialOrders||[]),[initialOrders]);
 useEffect(()=>{
  if(!enabled||!supabase){setStatus('desconectado');return;}
  let alive=true,loading=false,dirty=false;
  async function refresh(){
   if(loading){dirty=true;return;}
   loading=true;
   try{
    do{
     dirty=false;
     const [a,o]=await Promise.all([
      supabase.from('appointments').select('*').order('created_at',{ascending:false}).limit(2000),
      supabase.from('service_orders').select('*').order('created_at',{ascending:false}).limit(2000)
     ]);
     if(!alive)return;
     if(a.error||o.error){setStatus('erro de leitura');return;}
     setAppointments(a.data||[]);
     setOrders(o.data||[]);
    }while(dirty&&alive);
   }finally{loading=false;}
  }
  const channel=supabase.channel('modernizacao-producao-'+Math.random().toString(36).slice(2))
   .on('postgres_changes',{event:'*',schema:'public',table:'appointments'},refresh)
   .on('postgres_changes',{event:'*',schema:'public',table:'service_orders'},refresh)
   .subscribe((state)=>{
    if(!alive)return;
    if(state==='SUBSCRIBED'){setStatus('conectado');refresh();}
    else if(state==='CHANNEL_ERROR'||state==='TIMED_OUT')setStatus('reconectando');
   });
  // Verificacao periodica como fallback caso um evento nao seja entregue.
  const interval=setInterval(refresh,60000);
  return()=>{alive=false;clearInterval(interval);supabase.removeChannel(channel);};
 },[supabase,enabled]);
 return {appointments,orders,status};
}
