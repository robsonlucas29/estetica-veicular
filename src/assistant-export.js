import {formatReportCell,reportCharts,reportHighlights} from './report-presentation.js';
const safeCell=x=>typeof x==='string'&&/^[\s]*[=+\-@]/.test(x)?"'"+x:x;
const br=v=>v?.split('-').reverse().join('/');
export async function exportAssistantReport(input,format,options={}){
 const reports=Array.isArray(input)?input:[input];
 if(!reports.length||reports.some(r=>!r?.columns?.length||!r?.rows))throw Error('Gere um relatório antes de exportar.');
 const first=reports[0],filename=reports.length>1?`graucar-relatorios-${first.from}-${first.to}`:`graucar-${first.topic}-${first.from}-${first.to}`;
 const period=r=>['estoque','fidelidade'].includes(r.topic)?'Posição atual':`${br(r.from)} a ${br(r.to)}`;
 const scope=r=>r.client_name?`Cliente: ${r.client_name}`:r.search?`Busca: ${r.search}`:'Todos os registros do período';
 if(format==='xlsx'){
  const XLSX=await import('xlsx'),book=XLSX.utils.book_new();
  for(const report of reports){
   const data=[['GARAGEM GRAU CAR 096'],[report.title],[period(report)],[scope(report)],[report.note],[],...reportHighlights(report).map(line=>[line]),[],...report.metrics.map(m=>[m.label,m.value])];
   if(report.layout?.charts!==false)for(const chart of reportCharts(report)){data.push([],[chart.title,chart.unit],...chart.points.map(p=>[p.label,p.value]));}
   if(report.layout?.table!==false)data.push([],report.columns,...report.rows.map(r=>r.map((x,i)=>/^Data/.test(report.columns[i])?formatReportCell(x,report.columns[i]):x)));
   const sheet=XLSX.utils.aoa_to_sheet(data.map(row=>row.map(safeCell)));sheet['!cols']=report.columns.map(c=>({wch:/Serviço|Responsáveis|Cliente|Descrição/.test(c)?40:24}));
   XLSX.utils.book_append_sheet(book,sheet,report.title.slice(0,31));
  }
  XLSX.writeFile(book,filename+'.xlsx');return;
 }
 const [{jsPDF},tableModule]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
 const autoTable=tableModule.default?.default||tableModule.default;
 let logo=options.logoData;if(!logo){const response=await fetch(new URL('./assets/grau-car-logo.jpeg',import.meta.url));if(!response.ok)throw Error('Não foi possível carregar a logo. Atualize a página e tente novamente.');logo=new Uint8Array(await response.arrayBuffer());}
 const doc=new jsPDF({orientation:'portrait',compress:true});const margin=15;let w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight(),inner=w-margin*2;
 const newPage=(orientation='portrait')=>{doc.addPage('a4',orientation);w=doc.internal.pageSize.getWidth();h=doc.internal.pageSize.getHeight();inner=w-margin*2;};
 const ink=[26,27,36],muted=[104,109,123],red=[185,24,54],light=[246,247,250];
 const text=(value,x,y,size=9,color=ink,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(Array.isArray(value)?value:String(value??''),x,y);};
 const fit=(value,width,size=9)=>{doc.setFontSize(size);let valueText=String(value??'');while(doc.getTextWidth(valueText)>width&&valueText.length>3)valueText=valueText.slice(0,-4)+'...';return valueText;};
 function header(report){
  doc.setFillColor(...ink);doc.rect(0,0,w,55,'F');doc.setFillColor(...red);doc.rect(0,0,4,55,'F');
  doc.addImage(logo,'JPEG',margin,7,29,29,'graucar-logo');
  text('RELATÓRIO GERENCIAL  /  GRAU CAR 096',49,10,7,[255,182,196],true);
  text(fit(report.title,w-64,15),49,22,15,[255,255,255],true);
  text(fit(scope(report),w-64,9),49,32,9,[230,231,238]);
  text(period(report),49,42,9,[255,230,235],true);
  text(`${report.row_count??report.rows.length} registros no recorte selecionado`,margin,50,7,[185,188,201]);
  text(new Date(report.generated_at).toLocaleString('pt-BR',{timeZone:'America/Belem',hour12:false}),w-70,50,7,[220,221,230]);
 }
 const palette=[[185,24,54],[237,111,139],[107,94,157],[220,170,71],[112,142,151]];
 function donutBox(chart,x,y,width,height){
  doc.setFillColor(...light);doc.setDrawColor(227,230,237);doc.roundedRect(x,y,width,height,3,3,'FD');text(fit(chart.title,width-12,9),x+6,y+9,9,ink,true);
  const total=chart.points.reduce((n,p)=>n+p.value,0),cx=x+width/2,cy=y+32,r=15;let angle=-Math.PI/2;
  for(const [index,point] of chart.points.entries()){const span=point.value/total*Math.PI*2,steps=Math.max(1,Math.ceil(span/.08));doc.setFillColor(...palette[index%palette.length]);doc.setDrawColor(...palette[index%palette.length]);const arc=[];let previousX=0,previousY=0;for(let i=0;i<=steps;i++){const a=angle+span*i/steps,nextX=Math.cos(a)*r,nextY=Math.sin(a)*r;arc.push([nextX-previousX,nextY-previousY]);previousX=nextX;previousY=nextY;}doc.lines(arc,cx,cy,[1,1],'F',true);angle+=span;}
  doc.setFillColor(...light);doc.circle(cx,cy,r*.62,'F');text('100%',cx-6,cy+1,11,ink,true);
  chart.points.forEach((point,i)=>{const row=y+54+i*6;doc.setFillColor(...palette[i%palette.length]);doc.roundedRect(x+6,row-2,2,2,.4,.4,'F');text(fit(point.label,width-30,6.5),x+10,row,6.5,ink);text(`${(point.value/total*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`,x+width-18,row,6.5,red,true);});
 }
 function lineBox(chart,x,y,width,height){
  doc.setFillColor(...light);doc.setDrawColor(227,230,237);doc.roundedRect(x,y,width,height,3,3,'FD');text(chart.title,x+6,y+9,10,ink,true);text(chart.unit==='R$'?'Valores em reais por data':'Registros por data',x+6,y+15,7,muted);
  const left=x+16,right=x+width-8,top=y+22,bottom=y+height-12,max=Math.max(1,...chart.points.map(p=>p.value)),min=Math.min(0,...chart.points.map(p=>p.value));
  for(let i=0;i<=2;i++){const gy=top+(bottom-top)*i/2;doc.setDrawColor(222,225,232);doc.setLineWidth(.15);doc.line(left,gy,right,gy);text(Math.round(max-(max-min)*i/2).toLocaleString('pt-BR'),x+3,gy+1,6,muted);}
  const px=i=>left+i*(right-left)/Math.max(1,chart.points.length-1),py=v=>bottom-(v-min)/(max-min||1)*(bottom-top);
  doc.setDrawColor(...red);doc.setFillColor(...red);doc.setLineWidth(.65);chart.points.forEach((p,i)=>{if(i)doc.line(px(i-1),py(chart.points[i-1].value),px(i),py(p.value));if(chart.points.length<=62)doc.circle(px(i),py(p.value),.65,'F');});
  for(const i of [...new Set([0,Math.floor((chart.points.length-1)/2),chart.points.length-1])])text(chart.points[i].label.length===10?br(chart.points[i].label).slice(0,5):chart.points[i].label,Math.min(right-12,px(i)),bottom+6,6,muted);
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
  if(index)newPage();header(report);let y=63;
  const highlights=reportHighlights(report);if(highlights.length){text('LEITURA EXECUTIVA',margin,y,9,red,true);y+=7;for(const line of highlights){const lines=doc.splitTextToSize(line,inner-8);text(lines,margin+3,y,8,ink);y+=lines.length*3.5+2;}y+=5;}
  if(report.metrics.length){const perRow=Math.min(4,report.metrics.length),gap=5,cardW=(inner-gap*(perRow-1))/perRow;
   report.metrics.forEach((metric,i)=>{const x=margin+(i%perRow)*(cardW+gap),cy=y+Math.floor(i/perRow)*30;doc.setFillColor(...light);doc.roundedRect(x,cy,cardW,25,3,3,'F');doc.setFillColor(...red);doc.rect(x+3,cy+5,1,15,'F');text(fit(metric.label,cardW-13,8),x+8,cy+8,8,muted);text(fit(formatReportCell(metric.value,metric.label),cardW-13,16),x+8,cy+19,16,ink,true);});
   y+=Math.ceil(report.metrics.length/perRow)*30;
  }
  const charts=reportCharts(report),overview=charts.filter(c=>c.type!=='line'),trend=charts.find(c=>c.type==='line');
  if(overview.length){const gap=6,chartW=(inner-gap*(overview.length-1))/overview.length,chartH=86;
   if(y+chartH>h-20){newPage();header(report);y=63;}
   overview.forEach((chart,i)=>chart.type==='donut'?donutBox(chart,margin+i*(chartW+gap),y,chartW,chartH):chartBox(chart,margin+i*(chartW+gap),y,chartW,chartH));y+=chartH+7;
  }
  if(trend){if(y+57>h-20){newPage();header(report);y=63;}lineBox(trend,margin,y,inner,55);y+=62;}
  const note=doc.splitTextToSize(report.note,inner);
  const detailOnNewPage=report.layout?.table!==false&&(charts.length>0||report.columns.length>4);
  if(detailOnNewPage){newPage(report.columns.length>4?'landscape':'portrait');header(report);y=63;}
  else if(y+note.length*3.5+12>h-20){newPage();header(report);y=63;}
  const noteLines=doc.splitTextToSize(report.note,inner);text(noteLines,margin,y,8,muted);y+=noteLines.length*3.5+8;
  if(report.layout?.table!==false){
   if(y>h-38){newPage();header(report);y=63;}
   text('DETALHAMENTO',margin,y,9,red,true);y+=5;
   autoTable(doc,{startY:y,head:[report.columns],body:report.rows.map(row=>row.map((cell,i)=>formatReportCell(cell,report.columns[i]))),styles:{font:'helvetica',fontSize:8,cellPadding:3,overflow:'linebreak',textColor:ink,lineColor:[232,234,240],lineWidth:.15},headStyles:{fillColor:red,textColor:255,fontStyle:'bold',fontSize:8},alternateRowStyles:{fillColor:light},margin:{top:18,bottom:16,left:margin,right:margin},didDrawPage:({pageNumber})=>{if(pageNumber>1){doc.addImage(logo,'JPEG',margin,2,11,11,'graucar-logo');text(`${report.title}  /  continuação`,margin+15,9,8,muted,true);}}});
  }
 }
 const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);w=doc.internal.pageSize.getWidth();h=doc.internal.pageSize.getHeight();doc.setDrawColor(226,228,235);doc.line(margin,h-12,w-margin,h-12);text('GARAGEM GRAU CAR 096  |  Dados consultados no sistema',margin,h-7,7,muted);text(`${page} / ${pages}`,w-margin-17,h-7,7,muted);}
 doc.save(filename+'.pdf');
}
