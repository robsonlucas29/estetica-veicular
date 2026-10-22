import {execFileSync} from 'node:child_process';
const production=process.env.VERCEL_ENV==='production';
const branch=process.env.VERCEL_GIT_COMMIT_REF||'';
if(production&&branch.startsWith('desenvolvimento/'))throw new Error('Esta branch não pode ser publicada em produção. Use Preview.');
execFileSync('npm',['run',production?'build':'build:dev'],{stdio:'inherit'});
