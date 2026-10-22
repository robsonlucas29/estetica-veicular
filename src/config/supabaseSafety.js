// Protecao adicional: uma URL de Preview ou ambiente local nao pode
// acessar o projeto Supabase oficial, mesmo com variaveis Vercel incorretas.
const PRODUCTION_SUPABASE_REF = 'upurwxqorziaakucrstm';
const PRODUCTION_HOSTS = new Set([
  'www.graucargaragem.com.br',
  'graucargaragem.com.br',
]);

export function checkSupabaseEnvironment(url, hostname) {
  if (!url) return { allowed: false, reason: 'URL do Supabase nao configurada.' };
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, reason: 'URL do Supabase invalida.' };
  }
  if (parsed.protocol !== 'https:') {
    return { allowed: false, reason: 'Supabase deve utilizar HTTPS.' };
  }
  const official = parsed.hostname === `${PRODUCTION_SUPABASE_REF}.supabase.co`;
  const isProductionSite = PRODUCTION_HOSTS.has(String(hostname || '').toLowerCase());
  if (official && !isProductionSite) {
    return {
      allowed: false,
      reason: 'Ambiente de testes bloqueado: configure o Supabase de desenvolvimento nas variaveis Preview da Vercel.',
    };
  }
  return { allowed: true, reason: null };
}
