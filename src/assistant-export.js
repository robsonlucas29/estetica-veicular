import {formatReportCell,reportCharts} from './report-presentation.js';
const safeCell=x=>typeof x==='string'&&/^[\s]*[=+\-@]/.test(x)?"'"+x:x;
const br=v=>v?.split('-').reverse().join('/');
export async function exportAssistantReport(input,format){
 const reports=Array.isArray(input)?input:[input];
 if(!reports.length||reports.some(r=>!r?.columns?.length||!r?.rows))throw Error('Gere um relatório antes de exportar.');
 const first=reports[0],filename=reports.length>1?`graucar-relatorios-${first.from}-${first.to}`:`graucar-${first.topic}-${first.from}-${first.to}`;
 const period=r=>['estoque','fidelidade'].includes(r.topic)?'Posição atual':`${br(r.from)} a ${br(r.to)}`;
 const scope=r=>r.client_name?`Cliente: ${r.client_name}`:r.search?`Busca: ${r.search}`:'Todos os registros do período';
 if(format==='xlsx'){
  const XLSX=await import('xlsx'),book=XLSX.utils.book_new();
  for(const report of reports){
   const data=[['GARAGEM GRAU CAR 096'],[report.title],[period(report)],[scope(report)],[report.note],[],...report.metrics.map(m=>[m.label,m.value])];
   if(report.layout?.charts!==false)for(const chart of reportCharts(report)){data.push([],[chart.title,chart.unit],...chart.points.map(p=>[p.label,p.value]));}
   if(report.layout?.table!==false)data.push([],report.columns,...report.rows.map(r=>r.map((x,i)=>/^Data/.test(report.columns[i])?formatReportCell(x,report.columns[i]):x)));
   const sheet=XLSX.utils.aoa_to_sheet(data.map(row=>row.map(safeCell)));sheet['!cols']=report.columns.map(c=>({wch:/Serviço|Responsáveis|Cliente|Descrição/.test(c)?40:24}));
   XLSX.utils.book_append_sheet(book,sheet,report.title.slice(0,31));
  }
  XLSX.writeFile(book,filename+'.xlsx');return;
 }
 const [{jsPDF},tableModule]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
 const autoTable=tableModule.default?.default||tableModule.default;
 const landscape=reports.some(r=>r.columns.length>4),doc=new jsPDF({orientation:landscape?'landscape':'portrait'});
 const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight(),margin=15,inner=w-margin*2;
 const ink=[26,27,36],muted=[104,109,123],red=[185,24,54],light=[246,247,250];
 const text=(value,x,y,size=9,color=ink,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(Array.isArray(value)?value:String(value??''),x,y);};
 const fit=(value,width,size=9)=>{doc.setFontSize(size);let valueText=String(value??'');while(doc.getTextWidth(valueText)>width&&valueText.length>3)valueText=valueText.slice(0,-4)+'...';return valueText;};
 function header(report){
  doc.setFillColor(...ink);doc.rect(0,0,w,49,'F');doc.setFillColor(...red);doc.rect(0,0,4,49,'F');
  text('GARAGEM GRAU CAR 096',margin,11,9,[255,182,196],true);
  text(report.title,margin,23,17,[255,255,255],true);
  text(fit(scope(report),inner-77,9),margin,33,9,[230,231,238]);
  text(`${report.row_count??report.rows.length} registros selecionados`,margin,41,8,[185,188,201]);
  doc.setFillColor(57,42,54);doc.roundedRect(w-87,12,72,13,3,3,'F');text(period(report),w-82,20,9,[255,230,235],true);
  text('EMITIDO EM',w-87,34,7,[185,188,201]);text(new Date(report.generated_at).toLocaleString('pt-BR',{timeZone:'America/Belem',hour12:false}),w-87,41,8,[245,245,248]);
 }
 function chartBox(chart,x,y,width,height){
  doc.setFillColor(...light);doc.setDrawColor(227,230,237);doc.roundedRect(x,y,width,height,3,3,'FD');
  text(fit(chart.title,width-12,10),x+6,y+9,10,ink,true);text(chart.unit==='R$'?'Valores em reais · até 6 destaques':'Quantidade de registros · até 6 destaques',x+6,y+15,7,muted);
  const max=Math.max(1,...chart.points.map(p=>p.value)),step=Math.min(10,(height-23)/Math.max(chart.points.length,1));
  chart.points.forEach((point,index)=>{const cy=y+23+index*step;const label=/^\d{4}-\d{2}-\d{2}$/.test(point.label)?br(point.label):point.label;
   text(fit(label,width-42,7),x+6,cy,7,ink);text(point.value.toLocaleString('pt-BR',{maximumFractionDigits:2}),x+width-31,cy,7,red,true);
   doc.setFillColor(227,230,237);doc.roundedRect(x+6,cy+2,width-12,2,1,1,'F');const size=(width-12)*Math.max(0,point.value)/max;if(size>0){doc.setFillColor(...red);doc.roundedRect(x+6,cy+2,size,2,.8,.8,'F');}
  });
 }
 for(const [index,report] of reports.entries()){
  if(index)doc.addPage();header(report);let y=57;
  if(report.metrics.length){const perRow=Math.min(4,report.metrics.length),gap=5,cardW=(inner-gap*(perRow-1))/perRow;
   report.metrics.forEach((metric,i)=>{const x=margin+(i%perRow)*(cardW+gap),cy=y+Math.floor(i/perRow)*30;doc.setFillColor(...light);doc.roundedRect(x,cy,cardW,25,3,3,'F');doc.setFillColor(...red);doc.rect(x+3,cy+5,1,15,'F');text(fit(metric.label,cardW-13,8),x+8,cy+8,8,muted);text(fit(formatReportCell(metric.value,metric.label),cardW-13,16),x+8,cy+19,16,ink,true);});
   y+=Math.ceil(report.metrics.length/perRow)*30;
  }
  const charts=reportCharts(report);
  if(charts.length){const gap=6,chartW=(inner-gap*(charts.length-1))/charts.length;const chartH=charts.some(c=>c.points.length>4)?84:70;
   if(y+chartH>h-28){doc.addPage();header(report);y=57;}
   charts.forEach((chart,i)=>chartBox(chart,margin+i*(chartW+gap),y,chartW,chartH));y+=chartH+8;
  }
  const note=doc.splitTextToSize(report.note,inner);if(y+note.length*3.5+12>h-20){doc.addPage();header(report);y=57;}text(note,margin,y,8,muted);y+=note.length*3.5+8;
  if(report.layout?.table!==false){
   if(y>h-38){doc.addPage();header(report);y=57;}
   text('DETALHAMENTO',margin,y,9,red,true);y+=5;
   autoTable(doc,{startY:y,head:[report.columns],body:report.rows.map(row=>row.map((cell,i)=>formatReportCell(cell,report.columns[i]))),styles:{font:'helvetica',fontSize:8,cellPadding:3,overflow:'linebreak',textColor:ink,lineColor:[232,234,240],lineWidth:.15},headStyles:{fillColor:red,textColor:255,fontStyle:'bold',fontSize:8},alternateRowStyles:{fillColor:light},margin:{top:18,bottom:16,left:margin,right:margin},didDrawPage:({pageNumber})=>{if(pageNumber>1)text(`GARAGEM GRAU CAR 096  /  ${report.title}`,margin,10,8,muted,true);}});
  }
 }
 const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);doc.setDrawColor(226,228,235);doc.line(margin,h-12,w-margin,h-12);text('GARAGEM GRAU CAR 096  |  Dados consultados no sistema',margin,h-7,7,muted);text(`${page} / ${pages}`,w-margin-17,h-7,7,muted);}
 doc.save(filename+'.pdf');
}
