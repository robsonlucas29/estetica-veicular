import React,{useState} from 'react';
import {runtime} from './runtime-environment.js';
import {businessDate} from './business-metrics.js';
import {exportAssistantReport} from './assistant-export.js';
import {reportTopics as topics,reportColumns,defaultReportLayout,presentReport,reportCharts,formatReportCell} from './report-presentation.js';
const brDate=v=>v?.split('-').reverse().join('/');
function DashboardChart({chart}){const max=Math.max(...chart.points.map(p=>p.value),1);return <div className="reportChart"><h4>{chart.title}</h4><small>{chart.unit==='R$'?'Valores em reais':'Quantidade de registros'} · até 6 destaques</small>{chart.points.map(p=><div className="reportBar" key={p.label}><div><span>{/^\d{4}-\d{2}-\d{2}$/.test(p.label)?brDate(p.label):p.label}</span><strong>{p.value.toLocaleString('pt-BR',{maximumFractionDigits:2})}</strong></div><div className="reportBarTrack"><i style={{width:`${Math.max(0,p.value)/max*100}%`}}/></div></div>)}</div>;}
export default function ManagementAssistant({supabase,profile,clients=[]}){
 const today=businessDate(new Date());
 const [question,setQuestion]=useState(''),[answer,setAnswer]=useState(''),[reports,setReports]=useState([]),[selectedTopics,setSelectedTopics]=useState(['servicos']),[error,setError]=useState(''),[busy,setBusy]=useState(false),[exporting,setExporting]=useState(false);
 const [plan,setPlan]=useState({from:today.slice(0,7)+'-01',to:today,search:'',status:'',client_id:''});
 const [fields,setFields]=useState(reportColumns),[layout,setLayout]=useState(defaultReportLayout);
 const shown=reports.map(r=>presentReport(r,fields[r.topic],layout));
 function chooseClient(id){setPlan(p=>({...p,client_id:id,search:''}));setReports([]);if(id)setSelectedTopics(current=>{const allowed=current.filter(t=>!['financeiro','estoque'].includes(t));return allowed.length?allowed:['servicos'];});}
 function toggleField(topic,column){setFields(current=>{const list=current[topic]||reportColumns[topic];if(list.includes(column)&&list.length===1)return current;return {...current,[topic]:list.includes(column)?list.filter(c=>c!==column):[...list,column]};});}
 async function request(body){
  if(busy)return;setBusy(true);setError('');setAnswer('');setReports([]);
  try{
   const invoke=async payload=>{const {data,error}=await supabase.functions.invoke(runtime.functions.gateway,{body:payload});if(error){let detail;try{detail=await error.context?.json();}catch{}throw Error(detail?.error||error.message);}if(data?.error)throw Error(data.error);return data;};
   if(body.action==='report'){
    if(!selectedTopics.length)throw Error('Selecione pelo menos um tipo de relatório.');
    if(plan.search&&selectedTopics.includes('financeiro'))throw Error('O financeiro é geral. Desmarque Recebimentos e despesas para gerar somente os dados da busca.');
    const results=await Promise.all(selectedTopics.map(topic=>invoke({action:'report',plan:{...plan,topic}})));setReports(results.map(x=>x.report));
   }else{
    const data=await invoke(body);setAnswer(data.report?'':data.answer||'');setReports(data.report?[data.report]:[]);
    if(data.report){setSelectedTopics([data.report.topic]);setPlan({from:data.report.from,to:data.report.to,search:data.report.search,status:data.report.status,client_id:data.report.client_id||''});}
   }
  }catch(e){setError(e.message||'Não foi possível concluir a consulta.');}finally{setBusy(false);}
 }
 async function download(format,selection=shown){setExporting(true);setError('');try{await exportAssistantReport(selection,format);}catch(e){setError(e.message||'Falha ao exportar. Tente novamente.');}finally{setExporting(false);}}
 if(profile&&!['administrador','gerente'].includes(profile.role))return <section className="devBox"><p>Acesso restrito à gestão.</p></section>;
 return <section className="devBox assistantWorkspace"><h2>Assistente de gestão e relatórios</h2><p>Consulte os dados reais e monte o relatório com as informações que você precisa.</p>
 <form onSubmit={e=>{e.preventDefault();request({action:'ask',question});}}><label>O que você precisa?<textarea required minLength={4} maxLength={1200} rows={3} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ex.: Gere um relatório dos serviços do Chico neste mês em PDF"/></label><button disabled={busy}>{busy?'Consultando…':'Pedir à IA'}</button></form>
 <div className="assistantExamples">{['Relatório financeiro deste mês','Produção de cada lavador neste mês','Clientes que mais fizeram serviços neste mês','Agendamentos de amanhã'].map(text=><button type="button" disabled={busy} key={text} onClick={()=>{setQuestion(text);request({action:'ask',question:text});}}>{text}</button>)}</div>
 <details className="assistantFilters"><summary>Gerar relatório com filtros</summary><form onSubmit={e=>{e.preventDefault();request({action:'report'});}}><div className="assistantFilterGrid">
 <label>Cliente<select value={plan.client_id} onChange={e=>chooseClient(e.target.value)}><option value="">Todos os clientes</option>{[...clients].sort((a,b)=>a.name.localeCompare(b.name)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <div className="assistantTopicField"><span>Tipos de relatório</span><details className="assistantTopicPicker"><summary>{selectedTopics.length===1?topics[selectedTopics[0]]:`${selectedTopics.length} tipos selecionados`}</summary><div>{Object.entries(topics).map(([key,label])=><label key={key}><input type="checkbox" disabled={Boolean(plan.client_id&&['financeiro','estoque'].includes(key))} checked={selectedTopics.includes(key)} onChange={e=>setSelectedTopics(current=>e.target.checked?[...current,key]:current.filter(x=>x!==key))}/><span>{label}</span></label>)}</div></details></div>
 <label>De<input type="date" required value={plan.from} onChange={e=>setPlan({...plan,from:e.target.value})}/></label><label>Até<input type="date" required min={plan.from} value={plan.to} onChange={e=>setPlan({...plan,to:e.target.value})}/></label><label>Busca adicional por nome, placa ou serviço<input maxLength={160} value={plan.search} onChange={e=>setPlan({...plan,search:e.target.value})}/></label>
 </div>{plan.client_id&&<p className="hint">Somente o cliente selecionado. Financeiro geral e estoque não se aplicam a esse filtro e ficam fora da seleção.</p>}
 <button disabled={busy||!selectedTopics.length}>{selectedTopics.length>1?`Gerar ${selectedTopics.length} relatórios`:'Gerar relatório'}</button></form></details>
 <details className="reportCustomization" open><summary>Personalizar informações do relatório</summary><div className="reportLayoutChoices">{[['indicators','Indicadores e totais'],['charts','Gráficos do dashboard'],['table','Tabela detalhada']].map(([key,label])=><label key={key}><input type="checkbox" checked={layout[key]} onChange={e=>setLayout(current=>({...current,[key]:e.target.checked}))}/>{label}</label>)}</div>{[...new Set([...selectedTopics,...reports.map(r=>r.topic)])].map(topic=><fieldset key={topic}><legend>{topics[topic]} · colunas</legend><div className="reportColumnChoices">{reportColumns[topic].map(column=><label key={column}><input type="checkbox" checked={fields[topic].includes(column)} disabled={fields[topic].length===1&&fields[topic].includes(column)} onChange={()=>toggleField(topic,column)}/>{column}</label>)}</div></fieldset>)}<small>As escolhas são aplicadas à prévia, ao PDF e ao Excel. Ao ocultar a coluna de valores, os indicadores financeiros também são retirados.</small></details>
 {error&&<p role="alert" className="devError">{error}</p>}{answer&&<div className="devAnswer" role="status">{answer}</div>}
 {shown.length>1&&<div className="assistantDownloads"><button disabled={busy||exporting} onClick={()=>download('pdf')}>Baixar selecionados em PDF</button><button disabled={busy||exporting} onClick={()=>download('xlsx')}>Baixar selecionados em Excel</button></div>}
 {shown.map(report=><section key={report.topic} className="assistantReport reportDashboard"><div className="reportDashboardHead"><div><small>GARAGEM GRAU CAR 096 · RELATÓRIO</small><h3>{report.title}</h3><p>{report.client_name?`Cliente: ${report.client_name}`:report.search?`Busca: ${report.search}`:'Todos os registros do período'}</p></div><span className="reportPeriod">{['estoque','fidelidade'].includes(report.topic)?'Posição atual':`${brDate(report.from)} a ${brDate(report.to)}`}</span></div>
 {report.metrics.length>0&&<div className="reportKpis">{report.metrics.map(x=><div key={x.label}><span>{x.label}</span><strong>{formatReportCell(x.value,x.label)}</strong></div>)}</div>}
 {reportCharts(report).length>0&&<div className="reportCharts">{reportCharts(report).map(chart=><DashboardChart key={chart.title} chart={chart}/>)}</div>}
 <p className="reportMethod">{report.note}</p><div className="assistantDownloads"><button disabled={busy||exporting} onClick={()=>download('pdf',[report])}>Baixar PDF</button><button disabled={busy||exporting} onClick={()=>download('xlsx',[report])}>Baixar Excel</button></div>
 {report.layout.table&&<><div className="devTable"><table><thead><tr>{report.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{report.rows.slice(0,100).map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{formatReportCell(cell,report.columns[j])}</td>)}</tr>)}</tbody></table>{!report.rows.length&&<p>Nenhum registro encontrado com estes filtros.</p>}</div>{report.rows.length>100&&<p>A prévia mostra 100 linhas. A tabela exportada inclui todas as {report.row_count} linhas.</p>}</>}
 <small>{report.row_count} registro(s) · Consulta em {new Date(report.generated_at).toLocaleString('pt-BR',{timeZone:'America/Belem'})}</small></section>)}
 <p className="hint">Cadastros, alterações e envios continuam nas áreas correspondentes. A IA não altera registros por esta conversa.</p></section>;
}
