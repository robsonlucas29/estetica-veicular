import {build} from 'esbuild';
import {writeFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const temp=new URL('../.verify-development.mjs',import.meta.url);
try{
 const result=await build({entryPoints:['src/DevelopmentWorkspace.jsx'],bundle:true,platform:'node',format:'esm',external:['react','react-dom','lucide-react'],loader:{'.css':'empty'},define:{'import.meta.env':JSON.stringify({MODE:'development'})},write:false});
 await writeFile(temp,result.outputFiles[0].text);
 const {fetchAllRows,default:Workspace,developmentTabs}=await import(temp.href);
 const records=Array.from({length:1205},(_,id)=>({id,created_at:id}));let pages=0;
 const db={from(){return{select(){return this},order(){return this},async range(start,end){pages++;return{data:records.slice(start,end+1),error:null}}}}};
 const read=await fetchAllRows(db,'fixture');assert.equal(read.data.length,1205);assert.equal(pages,3);assert.equal(new Set(read.data.map(x=>x.id)).size,1205);
 console.log('PASS: paginação com 1.205 registros, três páginas, sem perdas ou duplicatas');
 for(const tab of developmentTabs){const html=renderToStaticMarkup(React.createElement(Workspace,{tab,supabase:db,profile:{id:'test'},clients:[],vehicles:[],employees:[],services:[],payments:[],canWrite:true}));assert.ok(html.length>100);console.log('PASS: renderização inicial '+tab);}
}finally{await unlink(temp).catch(()=>{})}
