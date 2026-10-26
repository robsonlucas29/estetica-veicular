import {readFile,writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';import {build} from 'esbuild';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const main=await readFile('src/main.jsx','utf8');const entry=new URL('../src/.verify-main.jsx',import.meta.url),out=new URL('../.verify-main-screens.mjs',import.meta.url);
try{
 await writeFile(entry,main.slice(0,main.lastIndexOf('createRoot('))+'\nexport {Sidebar,Dashboard,Clients,Cash,AppointmentTabs};');
 const result=await build({entryPoints:[entry.pathname],bundle:true,platform:'node',format:'esm',packages:'external',external:['react','react-dom','react-dom/client'],loader:{'.css':'empty','.jpeg':'dataurl'},define:{'import.meta.env':JSON.stringify({MODE:'development'})},write:false});await writeFile(out,result.outputFiles[0].text);
 const {Sidebar,Dashboard,Clients,Cash,AppointmentTabs}=await import(out.href);
 const common={clients:[],vehicles:[],services:[],orders:[],appointments:[],employees:[],paymentMethods:[],cashClosings:[],payments:[{id:'p',amount:123.45,paid_at:new Date().toISOString()}],profile:{role:'administrador',full_name:'Synthetic'},canWrite:true,canAdmin:true};
 const html=x=>renderToStaticMarkup(x);
 const sidebar=html(React.createElement(Sidebar,{role:'administrador',profile:common.profile,tab:'dashboard',setTab(){}}));
 const labelOrder=['Fidelidade e clientes VIP','Assistente de IA','Integrações','Financeiro','Estoque','Auditoria'];for(let i=1;i<labelOrder.length;i++)assert(sidebar.indexOf(labelOrder[i-1])<sidebar.indexOf(labelOrder[i]));assert(!sidebar.includes('Agenda visual'));
 const dashboard=html(React.createElement(Dashboard,common));assert(dashboard.includes('123,45'));assert(dashboard.includes('Recebido no mês'));
 const cash=html(React.createElement(Cash,common));assert(cash.includes('123,45'));
 const clients=html(React.createElement(Clients,common));assert(clients.includes('Autoriza receber e-mail'));assert(clients.includes('Autoriza receber WhatsApp'));assert.equal((clients.match(/checked=""/g)||[]).length,2);
 const tabs=html(React.createElement(AppointmentTabs,{common,setAppointments(){}},React.createElement('p',null,'FORM_PRESERVED')));assert(tabs.includes('role="tablist"'));assert(tabs.includes('Agenda visual'));assert(tabs.includes('FORM_PRESERVED'));
 console.log('PASS: actual main components render; Sidebar order; shared Dashboard/Cash receipts; default client preferences; nested appointment tabs');
}finally{await unlink(entry).catch(()=>{});await unlink(out).catch(()=>{});}
