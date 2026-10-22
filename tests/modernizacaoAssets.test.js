import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const file=path=>readFileSync(new URL(path,root),'utf8');

test('PWA possui manifesto, icone e service worker conservador',()=>{
 const manifest=JSON.parse(file('public/manifest.webmanifest'));
 assert.equal(manifest.display,'standalone');
 assert.ok(manifest.icons.some(i=>existsSync(new URL('public'+i.src,root))));
 assert.match(file('index.html'),/rel="manifest"/);
 const sw=file('public/sw.js');
 assert.doesNotMatch(sw,/caches\.open\s*\(/);
 assert.doesNotMatch(sw,/addEventListener\(['"]fetch['"]/);
});

test('central de alertas nao inclui chaves ou provedores externos',()=>{
 const src=file('src/modernizacao/OperationalAlerts.jsx');
 assert.doesNotMatch(src,/sk-[a-zA-Z0-9]{10,}/);
 assert.doesNotMatch(src,/dangerouslySetInnerHTML/);
});

test('fluxo financeiro nao exporta relatorio truncado',()=>{
 const src=file('src/modernizacao/FinanceOverview.jsx');
 assert.match(src,/truncated/);
 assert.match(src,/disabled=\{loading\|\|Boolean\(error\)\|\|truncated\}/);
});
