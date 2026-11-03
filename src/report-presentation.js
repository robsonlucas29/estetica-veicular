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
export const defaultReportLayout={indicators:true,charts:true,table:true};
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
 const charts=[];
 function chart(index,title,max=6){const groups=new Map();for(const row of report.rows){const key=String(row[index]??'Sem informação');groups.set(key,(groups.get(key)||0)+(moneyIndex>=0?Number(row[moneyIndex]||0):1));}return {title,unit:moneyIndex>=0?'R$':'registros',points:[...groups].map(([label,value])=>({label,value:Math.round(value*100)/100})).sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label)).slice(0,max)};}
 if(groupIndex!==undefined)charts.push(chart(groupIndex,`Distribuição por ${report.columns[groupIndex].toLowerCase()}`));
 const dateIndex=report.columns.findIndex(c=>/^Data/.test(c));
 if(dateIndex>=0)charts.push(chart(dateIndex,'Dias com maior movimento'));
 return charts;
}
