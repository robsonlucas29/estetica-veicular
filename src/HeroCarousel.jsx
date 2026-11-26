import React,{useState,useEffect} from 'react';
import './hero-carousel.css';
const photos=[['localizacao','Localização da Garagem Grau Car'],['missao','Missão ativada: devolva o brilho ao seu carro'],['volkswagen','Volkswagen na garagem'],['bmw','BMW na garagem'],['ford','Ford na garagem'],['polimento','Serviços de polimento'],['lavagem-motos','Lavagem de motos'],['lavagens-automotivas','Serviços de lavagem automotiva'],['horarios','Horários de funcionamento'],['higienizacao','Higienização e tratamentos'],['cuidado-detalhes','Cuidado em cada detalhe'],['realce-brilho','Realce o brilho do seu carro'],['tratamento-motor','Tratamento do motor']];
export default function HeroCarousel({logo}){
 const [available,setAvailable]=useState([]);
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false);
 useEffect(()=>{let active=true;Promise.all(photos.map(([name,alt])=>new Promise(resolve=>{const img=new Image();const src='/carrossel/'+name+'.webp';img.onload=()=>resolve({src,alt});img.onerror=()=>resolve(null);img.src=src;}))).then(items=>{if(active)setAvailable(items.filter(Boolean));});return()=>{active=false}},[]);
 const slides=[{src:logo,alt:'Logo Garagem Grau Car'},...available];
 useEffect(()=>{if(slides.length<2||paused||hover||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=setTimeout(()=>setIndex(i=>(i+1)%slides.length),5000);return()=>clearTimeout(timer)},[index,paused,hover,slides.length]);
 const move=d=>setIndex(i=>(i+d+slides.length)%slides.length);
 return <section className="grauHeroCarousel" aria-label="Galeria Garagem Grau Car" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
 <div className="grauHeroStage">{slides.map((s,i)=><img key={s.src} src={s.src} alt={s.alt} aria-hidden={i!==index} className={i===index?'current':''} decoding="async"/>)}
 {slides.length>1&&<><button type="button" className="grauPrev" aria-label="Imagem anterior" onClick={()=>move(-1)}>‹</button><button type="button" className="grauNext" aria-label="Próxima imagem" onClick={()=>move(1)}>›</button></>}</div>
 {slides.length>1&&<div className="grauHeroControls">{slides.map((s,i)=><button type="button" key={s.src} className={i===index?'current':''} aria-label={s.alt} aria-pressed={i===index} onClick={()=>setIndex(i)}/>)}<button type="button" className="grauPause" aria-label={paused?'Reproduzir':'Pausar'} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button></div>}</section>
}