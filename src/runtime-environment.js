import {DEVELOPMENT_URL,DEVELOPMENT_PUBLIC_KEY} from './development-config.js';

export const PRODUCTION_URL='https://upurwxqorziaakucrstm.supabase.co';
export function resolveEnvironment(env){
 const isDevelopment=env.MODE==='development'||env.VITE_APP_ENV==='development';
 if(env.MODE==='production'&&env.VITE_APP_ENV==='development')throw new Error('Build de produção não pode usar configuração DEV.');
 const url=isDevelopment?DEVELOPMENT_URL:env.VITE_SUPABASE_URL;
 const key=isDevelopment?DEVELOPMENT_PUBLIC_KEY:env.VITE_SUPABASE_ANON_KEY;
 if(url!==(isDevelopment?DEVELOPMENT_URL:PRODUCTION_URL))throw new Error('Banco incompatível com o ambiente selecionado.');
 if(!key)throw new Error('Chave pública Supabase não configurada.');
 let claims;try{claims=JSON.parse(atob(key.split('.')[1]));}catch{throw new Error('Configure a chave pública anon do projeto correto.');}
 if(claims.role!=='anon'||claims.ref!==new URL(url).hostname.split('.')[0])throw new Error('A chave deve ser anon e pertencer ao ambiente selecionado.');
 return {isDevelopment,url,key,modernized:true,functions:{gateway:isDevelopment?'integrations-gateway-dev':'integrations-gateway',insights:isDevelopment?'operational-insights-dev':'operational-insights'},rpc:{reschedule:isDevelopment?'reschedule_appointment_dev':'reschedule_appointment',save:isDevelopment?'save_appointment_group_dev':'save_appointment_group'}};
}
export const runtime=resolveEnvironment(import.meta.env);
