import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const edge=readFileSync(new URL('../supabase/functions/operational-insights-dev/index.ts',import.meta.url),'utf8');
test('resumo operacional exige JWT e perfil gestor',()=>{
 assert.match(edge,/verify_jwt|auth\.getUser\(/);
 assert.match(edge,/administrador/);
 assert.match(edge,/gerente/);
 assert.match(edge,/Sem permissao/);
});
test('resumo operacional usa consultas com RLS, sem chave de servico',()=>{
 assert.match(edge,/SUPABASE_ANON_KEY/);
 assert.doesNotMatch(edge,/SERVICE_ROLE_KEY/);
 assert.doesNotMatch(edge,/OPENAI_API_KEY/);
 assert.match(edge,/no-store/);
});
test('resumo operacional nao modifica dados nem envia mensagens',()=>{
 assert.doesNotMatch(edge,/\.insert\(|\.update\(|\.delete\(|fetch\(/);
});
