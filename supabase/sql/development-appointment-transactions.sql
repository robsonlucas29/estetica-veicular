-- Atomic appointment save/completion. Restricted private implementation; public invoker facade.
create or replace function private.save_appointment_group_dev(p_group uuid,p_rows jsonb,p_complete boolean,p_method uuid,p_when timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb;result jsonb:='[]';created public.service_orders;pay public.payments;total numeric:=0;first_order uuid;actor uuid:=auth.uid();new_group uuid:=coalesce(p_group,gen_random_uuid());
begin
 if actor is null or coalesce(private.app_role()::text,'') not in ('administrador','gerente','administrativo') then raise exception 'Acesso negado' using errcode='42501';end if;
 if p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 30 or p_when is null then raise exception 'Atendimento inválido';end if;
 perform pg_advisory_xact_lock(968096);
 if exists(select 1 from public.service_orders where atendimento_id=new_group) then raise exception 'Atendimento já concluído. Atualize a tela antes de continuar.';end if;
 if not exists(select 1 from public.payment_methods where id=p_method and active) then raise exception 'Forma de pagamento inválida';end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  if not exists(select 1 from public.vehicles where id=(r->>'vehicle_id')::uuid and client_id=(r->>'client_id')::uuid) then raise exception 'Veículo não pertence ao cliente';end if;
  if not exists(select 1 from public.service_types where id=(r->>'service_id')::uuid and active) then raise exception 'Serviço inválido';end if;
  if coalesce((r->>'charged_amount')::numeric,-1)<0 then raise exception 'Valor inválido';end if;
  if jsonb_array_length(coalesce(r->'employee_ids','[]'))=0 or exists(select 1 from jsonb_array_elements_text(r->'employee_ids') v where not exists(select 1 from public.employees e where e.id=v::uuid and e.active)) then raise exception 'Responsável inválido';end if;
 end loop;
 if p_complete then
  for r in select value from jsonb_array_elements(p_rows) loop
   insert into public.service_orders(vehicle_id,service_id,atendimento_id,employee_id,employee_ids,performed_by,status,notes,charged_amount,completed_at,created_by)
   values((r->>'vehicle_id')::uuid,(r->>'service_id')::uuid,new_group,(r->'employee_ids'->>0)::uuid,array(select jsonb_array_elements_text(r->'employee_ids')::uuid),(select full_name from public.profiles where id=actor),'concluido',r->>'notes',(r->>'charged_amount')::numeric,p_when,actor) returning * into created;
   result:=result||jsonb_build_array(to_jsonb(created));first_order:=coalesce(first_order,created.id);total:=total+created.charged_amount;
  end loop;
  insert into public.payments(service_order_id,payment_method_id,amount,paid_at,created_by) values(first_order,p_method,total,p_when,actor) returning * into pay;
  insert into public.service_images(service_order_id,image_url,file_name) select first_order,file_url,file_name from public.appointment_files where appointment_group_id=new_group;
  delete from public.appointment_files where appointment_group_id=new_group;
  delete from public.appointments where coalesce(appointment_group_id,id)=new_group;
  insert into public.audit_logs(user_id,action,entity_type,entity_id) values(actor,'Concluiu atendimento e registrou pagamento (DEV)','appointments',new_group);
  return jsonb_build_object('orders',result,'payment',to_jsonb(pay),'group_id',new_group,'images',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.service_images i where service_order_id=first_order));
 else
  delete from public.appointments where coalesce(appointment_group_id,id)=new_group;
  for r in select value from jsonb_array_elements(p_rows) loop
   if coalesce(r->>'status','agendado') not in ('agendado','confirmado','em_atendimento','cancelado') then raise exception 'Situação inválida';end if;
   insert into public.appointments(appointment_group_id,client_id,vehicle_id,service_id,employee_id,employee_ids,scheduled_at,notes,status,discount_percent,charged_amount,payment_method_id,created_by)
   values(new_group,(r->>'client_id')::uuid,(r->>'vehicle_id')::uuid,(r->>'service_id')::uuid,(r->'employee_ids'->>0)::uuid,array(select jsonb_array_elements_text(r->'employee_ids')::uuid),p_when,r->>'notes',coalesce(r->>'status','agendado'),coalesce((r->>'discount_percent')::numeric,0),(r->>'charged_amount')::numeric,p_method,actor);
  end loop;
  select jsonb_agg(to_jsonb(a)) into result from public.appointments a where appointment_group_id=new_group;
  insert into public.audit_logs(user_id,action,entity_type,entity_id) values(actor,'Salvou agendamento (DEV)','appointments',new_group);
  return jsonb_build_object('appointments',result,'group_id',new_group);
 end if;
end $$;
revoke all on function private.save_appointment_group_dev(uuid,jsonb,boolean,uuid,timestamptz) from public,anon;
grant execute on function private.save_appointment_group_dev(uuid,jsonb,boolean,uuid,timestamptz) to authenticated;
create or replace function public.save_appointment_group_dev(p_group uuid,p_rows jsonb,p_complete boolean,p_method uuid,p_when timestamptz)
returns jsonb language sql security invoker set search_path='' as $$select private.save_appointment_group_dev(p_group,p_rows,p_complete,p_method,p_when)$$;
revoke all on function public.save_appointment_group_dev(uuid,jsonb,boolean,uuid,timestamptz) from public,anon;
grant execute on function public.save_appointment_group_dev(uuid,jsonb,boolean,uuid,timestamptz) to authenticated;
