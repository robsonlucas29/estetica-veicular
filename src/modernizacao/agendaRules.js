/**
 * Utilitarios puros da agenda. Nenhuma alteracao de dados ou agendamento.
 */
export const isOpenAppointment=a=>!['concluido','concluído','cancelado','cancelada'].includes(String(a?.status||'').trim().toLowerCase());
export const appointmentKey=a=>a.appointment_group_id||a.id;
export function distinctAppointments(appointments=[]){
 const map=new Map();
 for(const a of appointments.filter(isOpenAppointment)){
  const key=appointmentKey(a);
  if(!map.has(key))map.set(key,a);
 }
 return [...map.values()];
}
export function overlappingStaffAppointments(appointments=[],minutes=60){
 const rows=distinctAppointments(appointments).filter(a=>a.scheduled_at);
 const conflicts=[];
 for(let i=0;i<rows.length;i++){
  const a=rows[i],startA=Date.parse(a.scheduled_at);
  if(!Number.isFinite(startA))continue;
  const staffA=new Set([a.employee_id,...(Array.isArray(a.employee_ids)?a.employee_ids:[])].filter(Boolean));
  if(!staffA.size)continue;
  for(let j=i+1;j<rows.length;j++){
   const b=rows[j],startB=Date.parse(b.scheduled_at);
   if(!Number.isFinite(startB)||Math.abs(startA-startB)>=minutes*60000)continue;
   const staffB=[b.employee_id,...(Array.isArray(b.employee_ids)?b.employee_ids:[])].filter(Boolean);
   const common=staffB.filter(id=>staffA.has(id));
   if(common.length)conflicts.push({first:a,second:b,employeeIds:[...new Set(common)]});
  }
 }
 return conflicts;
}
