begin;
select set_config('request.jwt.claim.sub','fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7',true);
select set_config('request.jwt.claims','{"sub":"fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7","role":"authenticated"}',true);
create temp table transaction_results(name text,passed boolean);
do $$
declare c uuid;v uuid;s uuid;e uuid;m uuid;g uuid:=gen_random_uuid();g2 uuid:=gen_random_uuid();payload jsonb;result jsonb;tested_role public.user_role;
begin
 insert into public.clients(name) values('HOMOLOGACAO TRANSACAO') returning id into c;
 insert into public.vehicles(client_id,plate) values(c,'TRX0A96') returning id into v;
 insert into public.service_types(name,price) values('HOMOLOGACAO',100) returning id into s;
 insert into public.employees(name) values('HOMOLOGACAO') returning id into e;
 insert into public.payment_methods(name) values('HOMOLOGACAO PIX') returning id into m;
 payload:=jsonb_build_array(jsonb_build_object('client_id',c,'vehicle_id',v,'service_id',s,'employee_ids',jsonb_build_array(e),'charged_amount',100,'status','agendado'));
 foreach tested_role in array array['administrador','gerente','administrativo']::public.user_role[] loop
  update public.profiles set role=tested_role where id=auth.uid();
  g:=gen_random_uuid();
  result:=public.save_appointment_group_dev(g,payload,false,m,'2026-10-26T10:00:00-03:00');
  if jsonb_array_length(result->'appointments')<>1 then raise exception 'FAIL criar %',tested_role;end if;
  perform public.save_appointment_group_dev(g2,payload,false,m,'2026-10-26T12:00:00-03:00');
  begin
   perform public.save_appointment_group_dev(g,payload,false,m,'2026-10-26T12:30:00-03:00');
   raise exception 'FAIL conflito aceito';
  exception when exclusion_violation then null;end;
  if not exists(select 1 from public.appointments where appointment_group_id=g and scheduled_at='2026-10-26T10:00:00-03:00') then raise exception 'FAIL original perdido';end if;
  insert into transaction_results values('Edição com conflito preserva original · '||tested_role,true);
  result:=public.save_appointment_group_dev(g,payload,true,m,'2026-10-26T10:00:00-03:00');
  if (result->'payment'->>'amount')::numeric<>100 or jsonb_array_length(result->'orders')<>1 or exists(select 1 from public.appointments where appointment_group_id=g) then raise exception 'FAIL conclusão %',tested_role;end if;
  insert into transaction_results values('Histórico e pagamento atômicos · '||tested_role,true);
  begin
   perform public.save_appointment_group_dev(g,payload,true,m,'2026-10-26T10:00:00-03:00');
   raise exception 'FAIL duplicado aceito';
  exception when raise_exception then if sqlerrm not like 'Atendimento já concluído.%' then raise;end if;end;
  insert into transaction_results values('Conclusão duplicada bloqueada · '||tested_role,true);
  delete from public.appointments where appointment_group_id=g2;
 end loop;
 update public.profiles set role='visualizador' where id=auth.uid();
 begin
  perform public.save_appointment_group_dev(gen_random_uuid(),payload,true,m,now());raise exception 'FAIL visualizador aceito';
 exception when insufficient_privilege then insert into transaction_results values('Visualizador bloqueado na conclusão',true);end;
 perform set_config('request.jwt.claim.sub','',true);perform set_config('request.jwt.claims','{}',true);
 begin
  perform public.save_appointment_group_dev(gen_random_uuid(),payload,true,m,now());raise exception 'FAIL anônimo aceito';
 exception when insufficient_privilege then insert into transaction_results values('Anônimo bloqueado na conclusão',true);end;
end $$;
select jsonb_agg(jsonb_build_object('test',name,'passed',passed)) as tests from transaction_results;
rollback;
