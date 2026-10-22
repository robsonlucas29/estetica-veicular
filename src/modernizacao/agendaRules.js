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
/**
 * Duracao total estimada de um grupo: soma dos servicos agendados.
 * Se a duracao nao estiver cadastrada, considera 60 min por servico.
 */
export function groupedAppointmentDurations(appointments=[],services=[],defaultMinutes=60){
 const durations=new Map();
 const byService=new Map(services.map(s=>[s.id,s]));
 for(const a of appointments.filter(isOpenAppointment)){
  const key=appointmentKey(a);
  const configured=Number(byService.get(a.service_id)?.duration_minutes);
  const duration=Number.isFinite(configured)&&configured>=5&&configured<=720?configured:defaultMinutes;
  durations.set(key,(durations.get(key)||0)+duration);
 }
 return durations;
}
export function overlappingStaffAppointments(appointments=[],minutes=60,services=[]){
 const rows=distinctAppointments(appointments).filter(a=>a.scheduled_at);
 const durations=groupedAppointmentDurations(appointments,services,minutes);
 const conflicts=[];
 for(let i=0;i<rows.length;i++){
  const a=rows[i],startA=Date.parse(a.scheduled_at);
  if(!Number.isFinite(startA))continue;
  const endA=startA+(durations.get(appointmentKey(a))||minutes)*60000;
  const staffA=new Set([a.employee_id,...(Array.isArray(a.employee_ids)?a.employee_ids:[])].filter(Boolean));
  if(!staffA.size)continue;
  for(let j=i+1;j<rows.length;j++){
   const b=rows[j],startB=Date.parse(b.scheduled_at);
   if(!Number.isFinite(startB))continue;
   const endB=startB+(durations.get(appointmentKey(b))||minutes)*60000;
   if(startA>=endB||startB>=endA)continue;
   const staffB=[b.employee_id,...(Array.isArray(b.employee_ids)?b.employee_ids:[])].filter(Boolean);
   const common=staffB.filter(id=>staffA.has(id));
   if(common.length)conflicts.push({first:a,second:b,employeeIds:[...new Set(common)]});
  }
 }
 return conflicts;
}
