import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 try{
  const auth=req.headers.get('Authorization'); if(!auth)throw new Error('Não autenticado.')
  const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}}); const {data:{user}}=await caller.auth.getUser(); if(!user)throw new Error('Sessão inválida.')
  const {data:profile}=await caller.from('profiles').select('role').eq('id',user.id).single(); if(profile?.role!=='gerente')throw new Error('Apenas gerentes podem criar usuários.')
  const body=await req.json(); const {full_name,email,password,role}=body; if(!full_name||!email||!password)throw new Error('Dados incompletos.'); if(!['gerente','administrativo','visualizador'].includes(role))throw new Error('Perfil inválido.')
  const admin=createClient(url,service); const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name}}); if(error)throw error
  await admin.from('profiles').update({full_name,email,role}).eq('id',data.user.id)
  return new Response(JSON.stringify({user:{id:data.user.id,full_name,email,role}}),{headers:{...cors,'Content-Type':'application/json'}})
 }catch(e){return new Response(JSON.stringify({error:e.message}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
})
