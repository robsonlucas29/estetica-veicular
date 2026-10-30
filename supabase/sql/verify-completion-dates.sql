-- Synthetic DEV fixtures only; no notifications; no records retained.
begin;
do $$
declare c uuid:=gen_random_uuid();v uuid:=gen_random_uuid();e uuid:=gen_random_uuid();s uuid:=gen_random_uuid();m uuid:=gen_random_uuid();g uuid:=gen_random_uuid();actor uuid;payload jsonb;result jsonb;oid uuid;scheduled timestamptz:=now()-interval '1 day';
begin
 insert into public.clients(id,name) values(c,'DATE_GUARD_SYNTHETIC');
 insert into public.vehicles(id,client_id,plate) values(v,c,'DATE-'||left(v::text,8));
 insert into public.employees(id,name,active) values(e,'DATE_GUARD_SYNTHETIC',true);
 insert into public.service_types(id,name,price) values(s,'DATE_GUARD_SYNTHETIC',0);
 insert into public.payment_methods(id,name,active) values(m,'DATE-'||m,true);
 select id into actor from public.profiles where role='administrador' limit 1;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 payload:=jsonb_build_array(jsonb_build_object('client_id',c,'vehicle_id',v,'service_id',s,'employee_ids',jsonb_build_array(e),'charged_amount',0,'discount_percent',0,'status','agendado'));
 execute 'set local role authenticated';
 -- Future scheduling remains available.
 perform public.save_appointment_group_dev(g,payload,false,m,now()+interval '2 days');
 begin perform public.save_appointment_group_dev(g,payload,true,m,now()+interval '2 days');raise exception 'FAIL future completion accepted';exception when check_violation then null;end;
 if not exists(select 1 from public.appointments where appointment_group_id=g) or exists(select 1 from public.service_orders where atendimento_id=g) then raise exception 'FAIL invalid completion not atomic';end if;
 perform public.save_appointment_group_dev(g,payload,false,m,scheduled);
 begin perform public.save_appointment_group_dev(g,payload,true,m,scheduled-interval '2 days');raise exception 'FAIL before booking accepted';exception when check_violation then null;end;
 result:=public.save_appointment_group_dev(g,payload,true,m,now());oid:=(result->'orders'->0->>'id')::uuid;
 if not exists(select 1 from public.service_orders where id=oid and appointment_scheduled_at=scheduled) then raise exception 'FAIL missing snapshot';end if;
 if exists(select 1 from public.appointments where appointment_group_id=g) then raise exception 'FAIL completion not archived';end if;
 begin update public.service_orders set completed_at=scheduled-interval '2 days',appointment_scheduled_at=null where id=oid;raise exception 'FAIL historical lower bound bypass';exception when check_violation then null;end;
 begin update public.service_orders set completed_at=now()+interval '2 days' where id=oid;raise exception 'FAIL historical future accepted';exception when check_violation then null;end;
 update public.service_orders set completed_at=now() where id=oid;
 execute 'reset role';
 raise notice 'PASS: future appointments allowed, future/early completions rejected atomically, today accepted, original schedule retained, history update bypass rejected.';
end $$;
rollback;
