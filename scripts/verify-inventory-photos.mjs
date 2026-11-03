import assert from 'node:assert/strict';
import {File} from 'node:buffer';
import {validateStockPhoto,saveStockPhoto} from '../src/inventory-photos.js';
const png=new File([new Uint8Array([137,80,78,71,13,10,26,10])],'photo.png',{type:'image/png'});
assert.equal(await validateStockPhoto(png),'png');
await assert.rejects(validateStockPhoto(new File(['<svg/>'],'fake.png',{type:'image/png'})));
await assert.rejects(validateStockPhoto(new File(['x'],'bad.svg',{type:'image/svg+xml'})));
await assert.rejects(validateStockPhoto(new File([new Uint8Array(5242881)],'large.png',{type:'image/png'})));
for(const fail of [false,true]){
 const events=[];const item={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',image_path:'old.png'};
 const db={storage:{from:()=>({upload:async p=>{events.push(['upload',p]);return {}},remove:async p=>{events.push(['remove',p[0]]);return {}}})},from:()=>({update:()=>({eq:()=>({select:()=>({single:async()=>{events.push(['update']);return {error:fail?{message:'database failure'}:null}}})})})})};
 if(fail){await assert.rejects(saveStockPhoto(db,item,png));assert.equal(events[2][1],events[0][1]);}
 else{await saveStockPhoto(db,item,png);assert.equal(events[2][1],'old.png');}
 assert.deepEqual(events.map(e=>e[0]),['upload','update','remove']);
}
console.log('PASS: photo formats, size, spoof rejection, replacement and failure cleanup');
