create table public.finance_recurring_rules(
 id uuid primary key default gen_random_uuid(),description text not null check(length(trim(description)) between 1 and 200),
 start_month date not null check(extract(day from start_month)=1),end_month date check(end_month is null or extract(day from end_month)=1),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.finance_recurring_versions(
 id uuid primary key default gen_random_uuid(),recurrence_id uuid not null references public.finance_recurring_rules(id) on delete cascade,
 effective_month date not null check(extract(day from effective_month)=1),description text not null check(length(trim(description)) between 1 and 200),
 amount numeric(12,2) not null check(amount>0),due_day integer not null check(due_day between 1 and 31),notes text not null default '' check(length(notes)<=2000),
 created_at timestamptz not null default now(),unique(recurrence_id,effective_month)
);
alter table public.finance_recurring_rules enable row level security;
alter table public.finance_recurring_versions enable row level security;
revoke all on public.finance_recurring_rules,public.finance_recurring_versions from public,anon,authenticated;
grant select on public.finance_recurring_rules,public.finance_recurring_versions to authenticated;
create policy recurring_rules_read on public.finance_recurring_rules for select to authenticated using((select private.app_role())::text in('administrador','gerente'));
create policy recurring_versions_read on public.finance_recurring_versions for select to authenticated using((select private.app_role())::text in('administrador','gerente'));
create index recurring_rules_actor_idx on public.finance_recurring_rules(created_by);
alter table public.finance_expenses add column recurrence_id uuid references public.finance_recurring_rules(id),add column competency_month date,add column recurring_override boolean not null default false,add column recurrence_canceled boolean not null default false,add column notes text not null default '' check(length(notes)<=2000);
alter table public.finance_expenses add constraint finance_recurrence_month_check check((recurrence_id is null and competency_month is null) or (recurrence_id is not null and competency_month is not null and extract(day from competency_month)=1));
create unique index finance_recurrence_month_idx on public.finance_expenses(recurrence_id,competency_month) where recurrence_id is not null;
revoke insert,update,delete on public.finance_expenses from authenticated;

create function private.finance_due_date(p_month date,p_day integer) returns date language sql immutable set search_path='' as $$
 select (date_trunc('month',p_month)::date+ (least(p_day,extract(day from(date_trunc('month',p_month)+interval '1 month - 1 day'))::integer)-1));
$$;
revoke all on function private.finance_due_date(date,integer) from public,anon,authenticated;
create function private.materialize_recurring_expenses() returns integer language plpgsql security definer set search_path='' as $$
declare r public.finance_recurring_rules;v public.finance_recurring_versions;month_at date;total integer:=0;n integer;until_month date:=(date_trunc('month',now() at time zone 'America/Belem')+interval '12 months')::date;
begin
 perform pg_advisory_xact_lock(968097);
 for r in select * from public.finance_recurring_rules where start_month<=until_month loop
  for month_at in select d::date from generate_series(r.start_month,least(until_month,coalesce(r.end_month,until_month)),interval '1 month') d loop
   select * into v from public.finance_recurring_versions where recurrence_id=r.id and effective_month<=month_at order by effective_month desc limit 1;
   if v.id is not null then
    insert into public.finance_expenses(description,amount,incurred_on,due_on,created_by,recurrence_id,competency_month,notes)
    values(v.description,v.amount,month_at,private.finance_due_date(month_at,v.due_day),r.created_by,r.id,month_at,v.notes) on conflict(recurrence_id,competency_month) where recurrence_id is not null do nothing;
    get diagnostics n=row_count;total:=total+n;
   end if;
  end loop;
 end loop;
 return total;
end $$;
revoke all on function private.materialize_recurring_expenses() from public,anon,authenticated;

create function private.finance_command(p_action text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();e public.finance_expenses;r public.finance_recurring_rules;id_at uuid;month_at date;start_at date;end_at date;scope_at text;description_at text;amount_at numeric;date_at date;due_at date;notes_at text;day_at integer;n integer:=0;generated integer:=0;status_at text;method_at uuid;
begin
 if actor is null or coalesce(private.app_role()::text,'') not in('administrador','gerente') then raise exception 'Acesso restrito à gestão' using errcode='42501';end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Dados inválidos';end if;
 perform pg_advisory_xact_lock(968097);
 if p_action='sync' then return jsonb_build_object('generated',private.materialize_recurring_expenses());end if;
 if p_action in('create','edit') then
  description_at:=trim(coalesce(p_payload->>'description',''));amount_at:=(p_payload->>'amount')::numeric;date_at:=(p_payload->>'incurred_on')::date;due_at:=nullif(p_payload->>'due_on','')::date;notes_at:=coalesce(p_payload->>'notes','');
  if length(description_at) not between 1 and 200 or amount_at is null or amount_at<=0 or amount_at>=10000000000 or amount_at<>round(amount_at,2) or date_at is null or not isfinite(date_at) or (due_at is not null and not isfinite(due_at)) or length(notes_at)>2000 then raise exception 'Preencha descrição, valor e datas válidos.';end if;
 end if;
 if p_action='create' then
  id_at:=(p_payload->>'id')::uuid;if id_at is null then raise exception 'Identificador obrigatório';end if;
  if coalesce((p_payload->>'recurring')::boolean,false) then
   if exists(select 1 from public.finance_recurring_rules where id=id_at and created_by=actor) then return jsonb_build_object('id',id_at,'duplicate',true);end if;
   start_at:=date_trunc('month',date_at)::date;end_at:=nullif(p_payload->>'end_month','')::date;if end_at is not null then end_at:=date_trunc('month',end_at)::date;end if;
   if start_at<(date_trunc('month',now() at time zone 'America/Belem')-interval '10 years')::date or start_at>(date_trunc('month',now() at time zone 'America/Belem')+interval '12 months')::date or (end_at is not null and end_at<start_at) then raise exception 'Defina o início dentro de 10 anos anteriores a 12 meses futuros e um término não anterior ao início.';end if;
   day_at:=(p_payload->>'due_day')::integer;if day_at is null or day_at not between 1 and 31 then raise exception 'Informe o dia mensal do vencimento entre 1 e 31';end if;
   insert into public.finance_recurring_rules(id,description,start_month,end_month,created_by) values(id_at,description_at,start_at,end_at,actor);
   insert into public.finance_recurring_versions(recurrence_id,effective_month,description,amount,due_day,notes) values(id_at,start_at,description_at,amount_at,day_at,notes_at);
   generated:=private.materialize_recurring_expenses();
  else
   if exists(select 1 from public.finance_expenses where id=id_at and created_by=actor) then return jsonb_build_object('id',id_at,'duplicate',true);end if;
   insert into public.finance_expenses(id,description,amount,incurred_on,due_on,created_by,notes) values(id_at,description_at,amount_at,date_at,due_at,actor,notes_at);n:=1;
  end if;
 elsif p_action in('edit','status') then
  select * into e from public.finance_expenses where id=(p_payload->>'id')::uuid for update;
  if e.id is null then raise exception 'Despesa não encontrada';end if;
  if nullif(p_payload->>'expected_updated_at','')::timestamptz is distinct from e.updated_at then raise exception 'A despesa foi alterada. Atualize a tela antes de continuar.' using errcode='40001';end if;
  id_at:=e.id;
  if p_action='status' then
   status_at:=p_payload->>'status';if status_at is null or status_at not in('pendente','pago','cancelado') then raise exception 'Situação inválida';end if;
   date_at:=nullif(p_payload->>'paid_on','')::date;
   if status_at='pago' and (date_at is null or not isfinite(date_at) or date_at>(now() at time zone 'America/Belem')::date) then raise exception 'Informe uma data de pagamento válida, até hoje.';end if;
   method_at:=case when p_payload?'payment_method_id' then nullif(p_payload->>'payment_method_id','')::uuid else e.payment_method_id end;
   if status_at='pago' and method_at is not null and not exists(select 1 from public.payment_methods where id=method_at and active) then raise exception 'Forma de pagamento inválida';end if;
   if e.status='cancelado' and status_at='pago' then raise exception 'Reabra a despesa antes de registrar o pagamento.';end if;
   if e.recurrence_canceled and status_at='pendente' then raise exception 'Reative a recorrência para reabrir uma parcela cancelada pelo encerramento.';end if;
   update public.finance_expenses set status=status_at,payment_method_id=case when status_at='pago' then method_at else payment_method_id end,paid_on=case when status_at='pago' then date_at else null end,updated_at=clock_timestamp(),recurring_override=case when recurrence_id is not null and status_at='cancelado' then true else recurring_override end where id=e.id;n:=1;
  else
   if e.status<>'pendente' then raise exception 'Reabra a despesa antes de editar. Pagamentos e cancelamentos são preservados.';end if;
   scope_at:=coalesce(p_payload->>'scope','month');if scope_at not in('month','following','all_pending') or (e.recurrence_id is null and scope_at<>'month') then raise exception 'Escopo de alteração inválido';end if;
   if scope_at='month' then
    update public.finance_expenses set description=description_at,amount=amount_at,incurred_on=date_at,due_on=due_at,notes=notes_at,recurring_override=recurrence_id is not null,updated_at=clock_timestamp() where id=e.id;n:=1;
   else
    if due_at is null and nullif(p_payload->>'due_day','') is null then raise exception 'Informe o vencimento para atualizar a recorrência.';end if;
    select * into r from public.finance_recurring_rules where id=e.recurrence_id for update;
    month_at:=case when scope_at='all_pending' then r.start_month else e.competency_month end;day_at:=coalesce(nullif(p_payload->>'due_day','')::integer,extract(day from due_at)::integer);if day_at not between 1 and 31 then raise exception 'Dia de vencimento inválido';end if;
    delete from public.finance_recurring_versions where recurrence_id=r.id and effective_month>=month_at;
    insert into public.finance_recurring_versions(recurrence_id,effective_month,description,amount,due_day,notes) values(r.id,month_at,description_at,amount_at,day_at,notes_at);
    update public.finance_recurring_rules set description=description_at,updated_at=clock_timestamp() where id=r.id;
    update public.finance_expenses set description=description_at,amount=amount_at,incurred_on=competency_month,due_on=private.finance_due_date(competency_month,day_at),notes=notes_at,recurring_override=false,updated_at=clock_timestamp() where recurrence_id=r.id and competency_month>=month_at and status='pendente';get diagnostics n=row_count;
   end if;
  end if;
 elsif p_action='end' then
  select * into r from public.finance_recurring_rules where id=(p_payload->>'id')::uuid for update;if r.id is null then raise exception 'Recorrência não encontrada';end if;
  if nullif(p_payload->>'expected_updated_at','')::timestamptz is distinct from r.updated_at then raise exception 'A recorrência foi alterada. Atualize a tela.' using errcode='40001';end if;
  id_at:=r.id;end_at:=nullif(p_payload->>'end_month','')::date;
  if end_at is not null then
   end_at:=date_trunc('month',end_at)::date;
   update public.finance_recurring_rules set end_month=end_at,updated_at=clock_timestamp() where id=r.id;
   update public.finance_expenses set status='cancelado',paid_on=null,recurrence_canceled=true,updated_at=clock_timestamp() where recurrence_id=r.id and competency_month>end_at and status='pendente';get diagnostics n=row_count;
  else
   update public.finance_recurring_rules set end_month=null,updated_at=clock_timestamp() where id=r.id;
   update public.finance_expenses set status='pendente',recurrence_canceled=false,updated_at=clock_timestamp() where recurrence_id=r.id and recurrence_canceled;get diagnostics n=row_count;
   generated:=private.materialize_recurring_expenses();
  end if;
 else raise exception 'Operação inválida';end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id) values(actor,'Financeiro: '||p_action||coalesce(' / '||scope_at,''),'finance_expenses',id_at);
 return jsonb_build_object('id',id_at,'updated',n,'generated',generated);
end $$;
revoke all on function private.finance_command(text,jsonb) from public,anon;
grant execute on function private.finance_command(text,jsonb) to authenticated;
create function public.finance_command(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.finance_command(p_action,p_payload)$$;
revoke all on function public.finance_command(text,jsonb) from public,anon;grant execute on function public.finance_command(text,jsonb) to authenticated;
select cron.schedule('graucar-recurring-expenses-daily','20 3 * * *','select private.materialize_recurring_expenses()');

alter table public.inventory_items add column image_path text;
grant update(image_path) on public.inventory_items to authenticated;
alter table public.inventory_items add constraint inventory_image_path_check check(image_path is null or (image_path like id::text||'/%' and image_path~'^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('inventory-images','inventory-images',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy inventory_images_read on storage.objects for select to authenticated using(bucket_id='inventory-images' and (select private.app_role())::text in('administrador','gerente'));
create policy inventory_images_insert on storage.objects for insert to authenticated with check(bucket_id='inventory-images' and (select private.app_role())::text in('administrador','gerente') and name~'^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' and exists(select 1 from public.inventory_items i where i.id::text=(storage.foldername(name))[1]));
create policy inventory_images_delete on storage.objects for delete to authenticated using(bucket_id='inventory-images' and (select private.app_role())::text in('administrador','gerente'));
