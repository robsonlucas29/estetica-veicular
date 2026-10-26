export const BUSINESS_TIME_ZONE='America/Belem';
export function businessDate(value){
 if(!value)return '';
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const d=new Date(value);if(Number.isNaN(d.getTime()))return '';
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:BUSINESS_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 const part=t=>p.find(x=>x.type===t)?.value;return `${part('year')}-${part('month')}-${part('day')}`;
}
export const sumMoney=rows=>Math.round(rows.reduce((n,x)=>n+Number(x.amount??0),0)*100)/100;
export function receiptEntries(payments=[]){return payments.filter(p=>p.paid_at&&Number.isFinite(Number(p.amount))).map(p=>({key:p.id,amount:Number(p.amount??0),payment_method_id:p.payment_method_id,paid_at:p.paid_at,order_id:p.service_order_id}));}
export function monthReceipts(payments=[],now=new Date()){const month=businessDate(now).slice(0,7);return sumMoney(receiptEntries(payments).filter(p=>businessDate(p.paid_at).startsWith(month)));}
export function monthServices(orders=[],now=new Date()){const month=businessDate(now).slice(0,7);return sumMoney(orders.filter(o=>o.status==='concluido'&&businessDate(o.completed_at||o.created_at).startsWith(month)).map(o=>({amount:o.charged_amount??0})));}
export const LOYALTY_REWARDS=[
 {id:'simple_no_wax',points:1000,label:'Lavagem Simples sem cera'},
 {id:'simple_wax',points:1350,label:'Lavagem Simples com cera'},
 {id:'technical',points:1700,label:'Lavagem Técnica'},
 {id:'engine_underbody',points:2050,label:'Lavagem técnica do motor ou Lavagem do Baixo'},
 {id:'major_discount',points:2451,label:'Desconto em serviços maiores',note:'Acima de 2.450 pontos; desconto definido no orçamento'}
];
export const DEFAULT_LOYALTY_SETTINGS={points_per_real:1,vip_window_days:90,silver_visits:3,gold_visits:6,diamond_visits:10};
