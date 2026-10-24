import {execFileSync} from 'node:child_process';
const production=process.env.VERCEL_ENV==='production';
const branch=process.env.VERCEL_GIT_COMMIT_REF||'';
if(production&&branch.startsWith('desenvolvimento/'))throw new Error('Esta branch não pode ser publicada em produção. Use Preview.');
if(production){
 if(process.env.VITE_APP_ENV==='development')throw new Error('Produção não pode usar VITE_APP_ENV=development.');
 if(process.env.VITE_SUPABASE_URL!=='https://upurwxqorziaakucrstm.supabase.co')throw new Error('URL de produção incompatível.');
 let claims;try{claims=JSON.parse(Buffer.from((process.env.VITE_SUPABASE_ANON_KEY||'').split('.')[1],'base64url').toString())}catch{throw new Error('Chave pública anon ausente ou inválida.')}
 if(claims.role!=='anon'||claims.ref!=='upurwxqorziaakucrstm')throw new Error('Chave pública pertence a outro projeto ou tem privilégio indevido.');
}
execFileSync('npm',['run',production?'build':'build:dev'],{stdio:'inherit'});
