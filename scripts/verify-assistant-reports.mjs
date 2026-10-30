import assert from 'node:assert/strict';import {readFile,writeFile,unlink} from 'node:fs/promises';
const source=await readFile('supabase/functions/_shared/assistant-reports.ts','utf8'),file=new URL('../.verify-assistant-engine.mjs',import.meta.url);await writeFile(file,source);
try{
 const {generateReport,validatePlan,localDay,topics}=await import(file.href);const now=new Date('2026-10-30T14:00:00Z');
 assert.equal(localDay('2026-10-01T01:00:00Z'),'2026-09-30');assert.throws(()=>validatePlan({topic:'SQL'}));assert.throws(()=>validatePlan({topic:'servicos',from:'2026-02-30',to:'2026-10-01'}));
 const records={clients:[{id:'c',name:'Cliente',loyalty_enabled:true}],vehicles:[{id:'v',client_id:'c',plate:'SYN0001'}],service_types:[{id:'s',name:'Lavagem'}],employees:[{id:'a',name:'Chico'},{id:'b',name:'Ana'}],service_orders:[{id:'o',vehicle_id:'v',service_id:'s',employee_ids:['a','b'],status:'concluido',charged_amount:100,completed_at:'2026-10-20T15:00:00Z'},{id:'z',vehicle_id:'v',service_id:'s',employee_ids:['a'],status:'concluido',charged_amount:0,completed_at:'2026-10-21T15:00:00Z'},{id:'old',vehicle_id:'v',status:'concluido',charged_amount:999,completed_at:'2026-09-01T15:00:00Z'}],payments:[{id:'p',amount:80,paid_at:'2026-10-20T15:00:00Z'}],finance_expenses:[{id:'x',description:'Material',amount:20,status:'pago',paid_on:'2026-10-20',incurred_on:'2026-10-01'}],appointments:[],inventory_items:[],loyalty_overview:[]};
 const db={from(table){assert(Object.hasOwn(records,table));return {select(){return this},order(){return this},async range(a,b){return {data:records[table].slice(a,b+1)}}}}};
 const r=await generateReport(db,{topic:'servicos'},now);assert.equal(r.rows.length,2);assert.equal(r.metrics[1].value,100);assert.equal(r.rows[0].at(-1),0);
 const team=await generateReport(db,{topic:'equipe',search:'Chico'},now);assert.equal(team.rows.length,1);assert.deepEqual(team.rows[0],['Chico',2,50]);
 const finance=await generateReport(db,{topic:'financeiro'},now);assert.equal(finance.metrics[0].value,80);assert.equal(finance.metrics[2].value,60);
 await assert.rejects(()=>generateReport(db,{topic:'financeiro',search:'Cliente'},now));
 for(const topic of topics){const report=await generateReport(db,{topic},now);assert(Array.isArray(report.rows));assert(report.note);}
 // Actual gateway authorization and validated report execution, with provider mocked.
 const gateway=(await readFile('supabase/functions/integrations-gateway/index.ts','utf8')).replace(/^import .*\n/gm,'');let handler,role='administrador',providerCalls=0;const env={SUPABASE_URL:'https://upurwxqorziaakucrstm.supabase.co',SUPABASE_ANON_KEY:'synthetic',OPENAI_API_KEY:'synthetic'};
 const client={auth:{getUser:async()=>({data:{user:{id:'synthetic'}}})},from(t){if(t==='profiles')return {select(){return this},eq(){return this},maybeSingle:async()=>({data:{role}})};return db.from(t)}};
 new Function('Deno','createClient','fetch','generateReport','localDay','topics',gateway)({env:{get:k=>env[k]},serve:h=>handler=h},()=>client,async(url,options)=>{providerCalls++;const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert(!options.body.includes('SYN0001'));return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({action:'report',topic:'servicos',from:'2026-10-01',to:'2026-10-30',search:'',status:'',answer:''})}]}]}));},generateReport,localDay,topics);
 const req=body=>new Request('https://synthetic.invalid',{method:'POST',headers:{authorization:'Bearer synthetic'},body:JSON.stringify(body)});
 assert.equal((await handler(req({action:'ask',question:'Relatório deste mês'}))).status,200);assert.equal(providerCalls,1);
 role='administrativo';assert.equal((await handler(req({action:'report',plan:{topic:'financeiro'}}))).status,403);assert.equal(providerCalls,1);role='administrador';
 assert.equal((await handler(req({action:'report',plan:{topic:'servicos'}}))).status,200);assert.equal(providerCalls,1);
 assert.equal((await handler(req({action:'report',plan:{topic:'pg_authid'}}))).status,400);
 assert.equal((await handler(req({action:'delete',table:'clients'}))).status,400);
 console.log('PASS: seven reports; exact receipts, free services, split team totals, date/timezone filters; JWT role checks; read-only allowlist; structured AI plan; no private database rows sent to provider.');
}finally{await unlink(file).catch(()=>{});}
