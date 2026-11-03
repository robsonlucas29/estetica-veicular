const safeCell=x=>typeof x==='string'&&/^[\s]*[=+\-@]/.test(x)?"'"+x:x;
export async function exportAssistantReport(input,format){
 const reports=Array.isArray(input)?input:[input];
 if(!reports.length||reports.some(r=>!r?.columns||!r?.rows))throw Error('Gere um relatório antes de exportar.');
 const report=reports[0];
 const filename=reports.length>1?`graucar-relatorios-${report.from}-${report.to}`:`graucar-${report.topic}-${report.from}-${report.to}`;
 const descriptionFor=report=>`Período: ${report.from} a ${report.to} · Gerado: ${new Date(report.generated_at).toLocaleString('pt-BR',{timeZone:'America/Belem'})}`;
 if(format==='xlsx'){
  const XLSX=await import('xlsx');const book=XLSX.utils.book_new();for(const report of reports){const description=descriptionFor(report);const data=[['Garagem Grau Car 096'],[report.title],[description],[report.search?`Filtro: ${report.search}`:'Sem filtro de busca'],[report.note],[],...report.metrics.map(m=>[m.label,m.value]),[],report.columns,...report.rows];
  const sheet=XLSX.utils.aoa_to_sheet(data.map(r=>r.map(safeCell)));sheet['!cols']=report.columns.map(()=>({wch:25}));XLSX.utils.book_append_sheet(book,sheet,report.title.slice(0,31));}XLSX.writeFile(book,filename+'.xlsx');return;
 }
 const [{jsPDF},tableModule]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);const autoTable=tableModule.default?.default||tableModule.default;const doc=new jsPDF({orientation:reports.some(r=>r.columns.length>4)?'landscape':'portrait'});for(const [index,report] of reports.entries()){if(index)doc.addPage();const description=descriptionFor(report);doc.setFontSize(15);doc.text('Garagem Grau Car 096',14,16);doc.setFontSize(12);doc.text(report.title,14,24);doc.setFontSize(9);let y=31;
 for(const text of [description,report.search?`Filtro: ${report.search}`:'',report.note,...report.metrics.map(m=>`${m.label}: ${Number(m.value).toLocaleString('pt-BR',{maximumFractionDigits:2})}`)].filter(Boolean)){
  const lines=doc.splitTextToSize(text,doc.internal.pageSize.getWidth()-28);doc.text(lines,14,y);y+=lines.length*4+3;
 }
 autoTable(doc,{startY:y,head:[report.columns],body:report.rows.map(r=>r.map(x=>typeof x==='number'?x.toLocaleString('pt-BR',{maximumFractionDigits:2}):String(x??''))),styles:{fontSize:8,overflow:'linebreak'},headStyles:{fillColor:[170,20,42]},margin:{bottom:15}});}
 const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFontSize(8);doc.text(`${page}/${pages} · Dados consultados no sistema`,14,doc.internal.pageSize.getHeight()-7);}doc.save(filename+'.pdf');
}
