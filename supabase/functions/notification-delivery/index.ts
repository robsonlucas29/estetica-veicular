// Intencionalmente sem chamadas externas: bloqueio de envio desta release.
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','content-type':'application/json','cache-control':'no-store'};
Deno.serve(req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return new Response(null,{status:405,headers});
 return new Response(JSON.stringify({sent:false,simulated:true,disabled:true,message:'Envios reais desativados.',error:'Envios reais desativados.'}),{status:403,headers});
});
