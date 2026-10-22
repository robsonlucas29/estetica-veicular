import test from 'node:test';
import assert from 'node:assert/strict';
import {distinctAppointments,overlappingStaffAppointments,isOpenAppointment} from '../src/modernizacao/agendaRules.js';

const a=(id,time,staff,group=null,status='agendado')=>({id,scheduled_at:time,employee_id:staff,appointment_group_id:group,status});
test('concluidos e cancelados nao participam dos conflitos',()=>{
 assert.equal(isOpenAppointment({status:'concluído'}),false);
 assert.equal(isOpenAppointment({status:'cancelado'}),false);
 assert.equal(distinctAppointments([a('1','2026-10-22T13:00:00Z','e'),a('2','2026-10-22T13:10:00Z','e',null,'concluido')]).length,1);
});
test('multiplos servicos no mesmo grupo sao um atendimento',()=>{
 const rows=[a('1','2026-10-22T13:00:00Z','e','g'),a('2','2026-10-22T13:00:00Z','e','g')];
 assert.equal(distinctAppointments(rows).length,1);
 assert.equal(overlappingStaffAppointments(rows).length,0);
});
test('conflito com mesmo funcionario e horario proximo',()=>{
 const rows=[a('1','2026-10-22T13:00:00Z','e'),a('2','2026-10-22T13:30:00Z','e')];
 assert.equal(overlappingStaffAppointments(rows).length,1);
});
test('nao conflita funcionario diferente ou distancia >= 60 minutos',()=>{
 const rows=[a('1','2026-10-22T13:00:00Z','e'),a('2','2026-10-22T13:30:00Z','f'),a('3','2026-10-22T14:00:00Z','e')];
 assert.equal(overlappingStaffAppointments(rows).length,0);
});
test('funcionarios multiplos sao considerados',()=>{
 const rows=[{...a('1','2026-10-22T13:00:00Z',null),employee_ids:['a','b']},a('2','2026-10-22T13:15:00Z','b')];
 assert.deepEqual(overlappingStaffAppointments(rows)[0].employeeIds,['b']);
});

test('duracao cadastrada maior detecta sobreposicao depois de 60 minutos',()=>{
 const rows=[{...a('1','2026-10-22T13:00:00Z','e'),service_id:'lavagem'},a('2','2026-10-22T14:30:00Z','e')];
 assert.equal(overlappingStaffAppointments(rows).length,0);
 assert.equal(overlappingStaffAppointments(rows,60,[{id:'lavagem',duration_minutes:120}]).length,1);
});
test('atendimento com dois servicos soma duracoes para alertar',()=>{
 const rows=[
  {...a('1','2026-10-22T13:00:00Z','e','grupo'),service_id:'a'},
  {...a('2','2026-10-22T13:00:00Z','e','grupo'),service_id:'b'},
  a('3','2026-10-22T14:15:00Z','e')
 ];
 assert.equal(overlappingStaffAppointments(rows,60,[{id:'a',duration_minutes:60},{id:'b',duration_minutes:45}]).length,1);
});
