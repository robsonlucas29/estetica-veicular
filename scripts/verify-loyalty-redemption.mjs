import assert from 'node:assert/strict';import {build} from 'esbuild';import {writeFile,unlink} from 'node:fs/promises';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {canRedeem,sortedLoyaltyAccounts,redeemableAccounts} from '../src/loyalty-rules.js';import {LOYALTY_REWARDS} from '../src/business-metrics.js';
const clients=[{id:'robson',name:'Robson Lucas',loyalty_enabled:true},{id:'eligible',name:'Cliente elegível',loyalty_enabled:true},{id:'excluded',name:'Empresa excluída',loyalty_enabled:false}];
const accounts=[{id:'a1',client_id:'robson',points_balance:100},{id:'a2',client_id:'excluded',points_balance:9000},{id:'a3',client_id:'eligible',points_balance:1200}];
assert.equal(canRedeem(accounts[0],LOYALTY_REWARDS[0],clients[0]),false);
assert.equal(canRedeem(accounts[2],LOYALTY_REWARDS[0],clients[1]),true);
assert.equal(canRedeem(accounts[2],LOYALTY_REWARDS[1],clients[1]),false);
assert.equal(canRedeem({...accounts[2],points_debt:1},LOYALTY_REWARDS[0],clients[1]),false);
assert.equal(canRedeem(accounts[1],LOYALTY_REWARDS[0],clients[2]),false);
assert.deepEqual(sortedLoyaltyAccounts(accounts,clients).map(a=>a.points_balance),[1200,100]);
assert.deepEqual(redeemableAccounts(accounts,clients).map(a=>a.client_id),['eligible']);
const temp=new URL('../.verify-redemption.mjs',import.meta.url);
try{
 const result=await build({entryPoints:['src/LoyaltyRedemptionForm.jsx'],bundle:true,platform:'node',format:'esm',external:['react'],define:{'import.meta.env':JSON.stringify({MODE:'development'})},write:false});await writeFile(temp,result.outputFiles[0].text);
 const {default:Form}=await import(temp.href);const html=renderToStaticMarkup(React.createElement(Form,{accounts,clients,supabase:{}}));
 assert(html.includes('value="eligible"'));assert(!html.includes('value="robson"'));assert(!html.includes('value="excluded"'));
 assert(html.includes('Hora (24h)'));assert(html.includes('Status do agendamento'));assert(html.includes('Lavador(es)'));assert(html.includes('Veículo'));assert(html.includes('disabled=""'));
 console.log('PASS: 100 points cannot redeem 1000; insufficient rewards/debt/opt-out blocked; descending balances; eligible-only client selector; appointment fields and disabled submit render');
}finally{await unlink(temp).catch(()=>{});}
