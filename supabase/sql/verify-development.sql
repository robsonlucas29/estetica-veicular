begin;
select set_config('request.jwt.claims','{"sub":"fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7',true);
create temp table test_results(name text,passed boolean);
grant all on test_results to authenticated;
set local role authenticated;
do $$
declare c uuid;v uuid;v2 uuid;s uuid;e uuid;item uuid;account uuid;group1 uuid:=gen_random_uuid();group2 uuid:=gen_random_uuid();delta integer;balance numeric;f uuid;
begin
 insert into public.clients(name,email) values ('HOMOLOGACAO DESCARTAVEL','teste@example.invalid') returning id into c;
 insert into public.vehicles(client_id,plate) values(c,'TST0A96') returning id into v;
 insert into public.vehicles(client_id,plate) values(c,'TST0B96') returning id into v2;
 insert into public.service_types(name,price,duration_minutes) values('HOMOLOGACAO LAVAGEM',100,60) returning id into s;
 insert into public.employees(name) values('HOMOLOGACAO EQUIPE') returning id into e;
 insert into public.appointments(client_id,vehicle_id,service_id,employee_ids,scheduled_at,appointment_group_id)
 values(c,v,s,array[e],'2026-10-25T10:00:00-03:00',group1);
 begin
  insert into public.appointments(client_id,vehicle_id,service_id,employee_ids,scheduled_at,appointment_group_id)
  values(c,v2,s,array[e],'2026-10-25T10:30:00-03:00',group2);
  raise exception 'FAIL: sobreposição foi aceita';
 exception when exclusion_violation then insert into test_results values('Bloqueio de conflito de funcionário',true);end;
 begin
  insert into public.appointments(client_id,vehicle_id,service_id,scheduled_at,appointment_group_id)
  values(c,v,s,'2026-10-25T10:30:00-03:00',group2);
  raise exception 'FAIL: veículo duplicado aceito';
 exception when exclusion_violation then insert into test_results values('Bloqueio de conflito de veículo',true);end;
 insert into public.appointments(client_id,vehicle_id,service_id,employee_ids,scheduled_at,appointment_group_id)
 values(c,v2,s,array[e],'2026-10-25T11:00:00-03:00',group2);
 insert into test_results values('Horários adjacentes permitidos',true);
 perform public.reschedule_appointment_dev(group2,'2026-10-25T12:00:00-03:00');
 if not exists(select 1 from public.appointments where appointment_group_id=group2 and scheduled_at='2026-10-25T12:00:00-03:00') then raise exception 'FAIL reagendar';end if;
 insert into test_results values('Reagendamento transacional',true);
 insert into public.inventory_items(name,min_quantity) values('HOMOLOGACAO SHAMPOO',2) returning id into item;
 insert into public.inventory_movements(item_id,quantity_delta,reason,created_by) values(item,10,'Teste entrada',auth.uid()),(item,-3,'Teste saída',auth.uid());
 select current_quantity into balance from public.inventory_items where id=item;
 if balance<>7 then raise exception 'FAIL estoque %',balance;end if;
 insert into test_results values('Estoque entrada e saída = 7',true);
 begin
  insert into public.inventory_movements(item_id,quantity_delta,reason,created_by) values(item,-8,'Teste saldo negativo',auth.uid());
  raise exception 'FAIL saldo negativo aceito';
 exception when raise_exception then if sqlerrm<>'Material inexistente ou saldo insuficiente' then raise;end if;insert into test_results values('Estoque negativo bloqueado',true);end;
 insert into public.loyalty_accounts(client_id) values(c) returning id into account;
 insert into public.loyalty_transactions(account_id,points_delta,reason) values(account,100,'Teste crédito'),(account,-30,'Teste resgate');
 select points_balance into balance from public.loyalty_accounts where id=account;
 if balance<>70 then raise exception 'FAIL pontos %',balance;end if;
 insert into test_results values('Fidelidade crédito e resgate = 70',true);
 begin
  insert into public.loyalty_transactions(account_id,points_delta,reason) values(account,-71,'Teste saldo negativo');
  raise exception 'FAIL pontos negativos aceitos';
 exception when raise_exception then if sqlerrm<>'Conta inexistente ou pontos insuficientes' then raise;end if;insert into test_results values('Resgate maior que saldo bloqueado',true);end;
 insert into public.finance_expenses(description,amount,created_by) values('HOMOLOGACAO DESPESA',25,auth.uid()) returning id into f;
 update public.finance_expenses set status='pago',paid_on=current_date where id=f;
 if not exists(select 1 from public.finance_expenses where id=f and status='pago') then raise exception 'FAIL baixa despesa';end if;
 insert into test_results values('Despesa e baixa de pagamento',true);
 insert into public.notification_consents(client_id,email_opt_in,whatsapp_opt_in,consent_source,consent_recorded_at) values(c,true,false,'HOMOLOGACAO',now());
 update public.notification_consents set email_opt_in=false where client_id=c;
 insert into test_results values('Consentimento e revogação',true);
end $$;
reset role;
-- Validate the server cash task on a completed prior day and idempotency.
do $$
declare o uuid;first_count integer;second_count integer;
begin
 insert into public.service_orders(charged_amount,completed_at,status) values(123.45,'2026-10-20T13:00:00-03:00','concluido') returning id into o;
 insert into public.payments(service_order_id,amount,paid_at) values(o,123.45,'2026-10-20T13:00:00-03:00');
 first_count:=private.close_completed_cash_days_dev();second_count:=private.close_completed_cash_days_dev();
 if not exists(select 1 from public.cash_closings where closing_date='2026-10-20' and total_amount=123.45) then raise exception 'FAIL caixa';end if;
 if second_count<>0 then raise exception 'FAIL fechamento duplicado';end if;
 insert into test_results values('Fechamento no servidor, total e idempotência',true);
end $$;
-- Temporary role change rolls back together with every synthetic record.
update public.profiles set role='visualizador' where id='fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7';
set local role authenticated;
do $$ begin
 begin insert into public.clients(name) values('NAO DEVE SER GRAVADO');raise exception 'FAIL visualizador escreveu';exception when insufficient_privilege then insert into test_results values('Visualizador não pode criar cliente',true);end;
 begin perform public.reschedule_appointment_dev(gen_random_uuid(),now());raise exception 'FAIL visualizador reagendou';exception when insufficient_privilege then insert into test_results values('Visualizador não pode reagendar',true);end;
end $$;
reset role;
select jsonb_agg(jsonb_build_object('test',name,'passed',passed)) as tests from test_results;
rollback;
