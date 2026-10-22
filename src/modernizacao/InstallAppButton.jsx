import React,{useEffect,useState} from 'react';

export function InstallAppButton(){
 const [prompt,setPrompt]=useState(null);
 const [installed,setInstalled]=useState(false);
 useEffect(()=>{
  const capture=e=>{e.preventDefault();setPrompt(e);};
  const done=()=>{setInstalled(true);setPrompt(null);};
  window.addEventListener('beforeinstallprompt',capture);
  window.addEventListener('appinstalled',done);
  const media=window.matchMedia?.('(display-mode: standalone)');
  if(media?.matches)setInstalled(true);
  return()=>{window.removeEventListener('beforeinstallprompt',capture);window.removeEventListener('appinstalled',done);};
 },[]);
 async function install(){
  if(!prompt)return;
  try{
   await prompt.prompt();
   const choice=await prompt.userChoice;
   if(choice?.outcome==='accepted')setPrompt(null);
  }catch(error){console.warn('Instalação não disponível:',error);}
 }
 if(installed||!prompt)return null;
 return <button type="button" className="secondary" onClick={install} title="Instalar aplicativo neste dispositivo">Instalar aplicativo</button>;
}
