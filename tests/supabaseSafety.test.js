import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSupabaseEnvironment } from '../src/config/supabaseSafety.js';

const prod = 'https://upurwxqorziaakucrstm.supabase.co';
const dev = 'https://hgmmabtixqaztuswmivv.supabase.co';

test('bloqueia banco oficial em preview Vercel', () => {
  assert.equal(checkSupabaseEnvironment(prod, 'estetica-veicular-git-desenvolvimento-modernizacao.vercel.app').allowed, false);
});
test('bloqueia banco oficial em localhost', () => {
  assert.equal(checkSupabaseEnvironment(prod, 'localhost').allowed, false);
});
test('permite banco de desenvolvimento em preview', () => {
  assert.equal(checkSupabaseEnvironment(dev, 'estetica-veicular.vercel.app').allowed, true);
});
test('permite banco oficial somente no dominio oficial', () => {
  assert.equal(checkSupabaseEnvironment(prod, 'www.graucargaragem.com.br').allowed, true);
});
test('rejeita URL invalida e protocolo inseguro', () => {
  assert.equal(checkSupabaseEnvironment('not-a-url', 'localhost').allowed, false);
  assert.equal(checkSupabaseEnvironment('http://example.supabase.co', 'localhost').allowed, false);
});
