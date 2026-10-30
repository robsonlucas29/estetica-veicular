import {businessDate} from './business-metrics.js';
export function completionDateError(completedAt,scheduledAt,now=new Date()){
 const day=businessDate(completedAt),scheduled=businessDate(scheduledAt);
 if(!day)return 'Informe uma data de conclusão válida.';
 if(day>businessDate(now))return 'A data de conclusão não pode ser posterior ao dia de hoje.';
 if(scheduled&&day<scheduled)return 'A data de conclusão não pode ser anterior à data do agendamento.';
 return '';
}
