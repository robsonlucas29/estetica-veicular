export const reportColumns={
 servicos:['Data','Cliente','Placa','Serviço','Responsáveis','Situação','Valor (R$)'],
 agendamentos:['Data','Cliente','Placa','Serviço','Responsáveis','Situação','Valor (R$)'],
 clientes:['Cliente','Atendimentos','Serviços','Valor realizado (R$)'],
 equipe:['Funcionário','Participações em serviços','Valor proporcional (R$)'],
 financeiro:['Data de referência','Tipo','Descrição','Situação','Valor (R$)'],
 estoque:['Material','Saldo atual','Unidade','Mínimo','Situação'],
 fidelidade:['Cliente','Saldo de pontos','Pontos a compensar','Categoria VIP']
};
export const reportTopics={servicos:'Serviços realizados',clientes:'Serviços por cliente',equipe:'Produção da equipe',financeiro:'Recebimentos e despesas',agendamentos:'Agendamentos',estoque:'Estoque atual',fidelidade:'Fidelidade e VIP'};
export const defaultReportLayout={indicators:true,charts:true,table:true,summary:true};
export const formatReportCell=(value,column)=>{
 if(value===null||value===undefined)return '—';
 if(/R\$/.test(column)&&typeof value==='number')return value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 if(/^Data/.test(column)&&/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return value.split('-').reverse().join('/');
 if(typeof value==='number')return value.toLocaleString('pt-BR',{maximumFractionDigits:2});
 return ({concluido:'Concluído',em_atendimento:'Em atendimento',agendado:'Agendado',confirmado:'Confirmado',cancelado:'Cancelado',pendente:'Pendente',pago:'Pago',recebido:'Recebido'})[value]||String(value);
};
export function presentReport(report,selected,layout=defaultReportLayout){
 const columns=report.columns.filter(c=>!selected||selected.includes(c));
 if(!columns.length)throw Error(`Escolha pelo menos uma coluna para ${report.title}.`);
 const indices=columns.map(c=>report.columns.indexOf(c));
 const hasMoney=columns.some(c=>/R\$/.test(c));
 const metrics=(layout.indicators?report.metrics:[]).filter(m=>hasMoney||!/R\$/.test(m.label));
 return {...report,columns,rows:report.rows.map(r=>indices.map(i=>r[i])),metrics,layout:{...defaultReportLayout,...layout}};
}
export function reportCharts(report){
 if(report.layout?.charts===false||!report.rows.length)return [];
 const moneyIndex=report.columns.findIndex(c=>/R\$/.test(c));
 const groupIndex=['Serviço','Cliente','Funcionário','Tipo','Situação','Categoria VIP','Material'].map(c=>report.columns.indexOf(c)).find(i=>i>=0);
 const unit=moneyIndex>=0?'R$':'registros',measure=row=>moneyIndex>=0?Number(row[moneyIndex]||0):1;
 const charts=[];
 if(groupIndex!==undefined){
  const groups=new Map();for(const row of report.rows){const key=String(row[groupIndex]??'Sem informação');groups.set(key,(groups.get(key)||0)+measure(row));}
  const all=[...groups].map(([label,value])=>({label,value:Math.round(value*100)/100})).sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
  charts.push({type:'bar',title:`Distribuição por ${report.columns[groupIndex].toLowerCase()}`,unit,points:all.slice(0,6)});
  if(all.length>1&&all.every(p=>p.value>=0)&&all.some(p=>p.value>0)){
   const points=all.slice(0,4);if(all.length>4)points.push({label:'Outros',value:Math.round(all.slice(4).reduce((n,p)=>n+p.value,0)*100)/100});
   charts.push({type:'donut',title:'Participação no total selecionado',unit,points});
  }
 }
 const dateIndex=report.columns.findIndex(c=>/^Data/.test(c));
 if(dateIndex>=0){
  const groups=new Map();for(const row of report.rows){const key=String(row[dateIndex]||'');if(/^\d{4}-\d{2}-\d{2}$/.test(key))groups.set(key,(groups.get(key)||0)+measure(row));}
  const dates=[...groups.keys()].sort();
  if(dates.length){
   const span=(Date.parse(report.to)-Date.parse(report.from))/86400000;
   if(span>=0&&span<=62){for(let d=Date.parse(report.from+'T12:00:00Z');d<=Date.parse(report.to+'T12:00:00Z');d+=86400000){const key=new Date(d).toISOString().slice(0,10);if(!groups.has(key))groups.set(key,0);}}
   let points=[...groups].map(([label,value])=>({label,value:Math.round(value*100)/100})).sort((a,b)=>a.label.localeCompare(b.label));
   if(points.length>62){const months=new Map();for(const p of points){const key=p.label.slice(0,7);months.set(key,(months.get(key)||0)+p.value);}points=[...months].map(([label,value])=>({label,value:Math.round(value*100)/100}));}
   charts.push({type:'line',title:points[0].label.length===7?'Evolução mensal':'Evolução no período',unit,points});
  }
 }
 return charts;
}
export function reportHighlights(report){
 if(report.layout?.summary===false)return [];
 const result=[`${report.row_count??report.rows.length} registro(s) no recorte selecionado.`];
 const plateIndex=report.columns.indexOf('Placa');if(plateIndex>=0){const count=new Set(report.rows.map(r=>r[plateIndex]).filter(x=>x&&x!=='—')).size;result.push(`${count} veículo(s) identificado(s) no período.`);}
 const moneyIndex=report.columns.findIndex(c=>/R\$/.test(c));
 if(moneyIndex>=0&&['servicos','agendamentos'].includes(report.topic)&&report.rows.length){const average=report.rows.reduce((n,r)=>n+Number(r[moneyIndex]||0),0)/report.rows.length;result.push(`Valor médio por serviço: ${average.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}.`);}
 const charts=reportCharts({...report,layout:{...report.layout,charts:true}}),trend=charts.find(c=>c.type==='line');
 if(trend){const top=[...trend.points].sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label))[0];if(top?.value>0){const date=top.label.length===10?top.label.split('-').reverse().join('/'):top.label.split('-').reverse().join('/');result.push(`Maior movimento em ${date}: ${trend.unit==='R$'?top.value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):`${top.value} registro(s)`}.`);}}
 return result;
}
