export const INVENTORY_IMAGE_BUCKET='inventory-images';
export async function validateStockPhoto(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Escolha uma imagem JPG, PNG ou WebP.');
 if(file.size>5*1024*1024||file.size===0)throw Error('A imagem deve ter no máximo 5 MB e não pode estar vazia.');
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255,png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71,webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!(file.type==='image/jpeg'&&jpeg||file.type==='image/png'&&png||file.type==='image/webp'&&webp))throw Error('O conteúdo do arquivo não corresponde a uma imagem válida.');
 return file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';
}
export async function saveStockPhoto(db,item,file){
 const extension=await validateStockPhoto(file),path=`${item.id}/${crypto.randomUUID()}.${extension}`,bucket=db.storage.from(INVENTORY_IMAGE_BUCKET);
 const upload=await bucket.upload(path,file,{contentType:file.type,upsert:false});if(upload.error)throw Error(upload.error.message);
 const {error}=await db.from('inventory_items').update({image_path:path}).eq('id',item.id).select('id').single();
 if(error){await bucket.remove([path]);throw Error(error.message);}
 if(item.image_path)await bucket.remove([item.image_path]);return path;
}
export async function removeStockPhoto(db,item){
 const {error}=await db.from('inventory_items').update({image_path:null}).eq('id',item.id).select('id').single();if(error)throw Error(error.message);
 if(item.image_path){const result=await db.storage.from(INVENTORY_IMAGE_BUCKET).remove([item.image_path]);if(result.error)throw Error('A foto foi desvinculada, mas não foi possível remover o arquivo antigo.');}
}
