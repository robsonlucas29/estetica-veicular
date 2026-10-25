-- Production release: additive tables/columns; no customer rows copied from DEV.

-- Apply only after a verified production backup. Transactional deployment.

set local lock_timeout='5s';

set local statement_timeout='90s';

set local search_path=public,extensions;

create schema if not exists private;

revoke all on schema private from public,anon;

grant usage on schema private to authenticated,service_role;

alter table public.service_types add column if not exists duration_minutes integer not null default 60;

alter table public.service_types add constraint service_types_duration_minutes_valid check(duration_minutes between 5 and 720);

create table public."finance_categories"(
 "id" uuid default gen_random_uuid() not null,
 "name" text not null,
 "kind" text not null,
 "active" boolean default true not null,
 "created_at" timestamp with time zone default now() not null,
 constraint "finance_categories_kind_check" CHECK ((kind = ANY (ARRAY['receita'::text, 'despesa'::text]))),
 constraint "finance_categories_pkey" PRIMARY KEY (id),
 constraint "finance_categories_name_key" UNIQUE (name)
);

alter table public."finance_categories" enable row level security;

revoke all on public."finance_categories" from public,anon,authenticated;

create table public."finance_expenses"(
 "id" uuid default gen_random_uuid() not null,
 "category_id" uuid,
 "description" text not null,
 "amount" numeric(12,2) not null,
 "incurred_on" date default CURRENT_DATE not null,
 "due_on" date,
 "paid_on" date,
 "status" text default 'pendente'::text not null,
 "payment_method_id" uuid,
 "created_by" uuid,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null,
 constraint "finance_expenses_amount_check" CHECK ((amount > (0)::numeric)),
 constraint "finance_expenses_status_check" CHECK ((status = ANY (ARRAY['pendente'::text, 'pago'::text, 'cancelado'::text]))),
 constraint "finance_expenses_paid_status_check" CHECK (((status <> 'pago'::text) OR (paid_on IS NOT NULL))),
 constraint "finance_expenses_pkey" PRIMARY KEY (id)
);

alter table public."finance_expenses" enable row level security;

revoke all on public."finance_expenses" from public,anon,authenticated;

create table public."inventory_items"(
 "id" uuid default gen_random_uuid() not null,
 "sku" text,
 "name" text not null,
 "unit" text default 'unidade'::text not null,
 "min_quantity" numeric(14,3) default 0 not null,
 "current_quantity" numeric(14,3) default 0 not null,
 "active" boolean default true not null,
 "created_at" timestamp with time zone default now() not null,
 constraint "inventory_items_min_quantity_check" CHECK ((min_quantity >= (0)::numeric)),
 constraint "inventory_items_current_quantity_check" CHECK ((current_quantity >= (0)::numeric)),
 constraint "inventory_items_pkey" PRIMARY KEY (id),
 constraint "inventory_items_sku_key" UNIQUE (sku)
);

alter table public."inventory_items" enable row level security;

revoke all on public."inventory_items" from public,anon,authenticated;

create table public."inventory_movements"(
 "id" uuid default gen_random_uuid() not null,
 "item_id" uuid not null,
 "quantity_delta" numeric(14,3) not null,
 "reason" text not null,
 "service_order_id" uuid,
 "created_by" uuid,
 "created_at" timestamp with time zone default now() not null,
 constraint "inventory_movements_quantity_delta_check" CHECK ((quantity_delta <> (0)::numeric)),
 constraint "inventory_movements_pkey" PRIMARY KEY (id)
);

alter table public."inventory_movements" enable row level security;

revoke all on public."inventory_movements" from public,anon,authenticated;

create table public."loyalty_accounts"(
 "id" uuid default gen_random_uuid() not null,
 "client_id" uuid not null,
 "points_balance" integer default 0 not null,
 "vip_tier" text default 'regular'::text not null,
 "created_at" timestamp with time zone default now() not null,
 "updated_at" timestamp with time zone default now() not null,
 constraint "loyalty_accounts_points_balance_check" CHECK ((points_balance >= 0)),
 constraint "loyalty_accounts_vip_tier_check" CHECK ((vip_tier = ANY (ARRAY['regular'::text, 'prata'::text, 'ouro'::text, 'diamante'::text]))),
 constraint "loyalty_accounts_pkey" PRIMARY KEY (id),
 constraint "loyalty_accounts_client_id_key" UNIQUE (client_id)
);

alter table public."loyalty_accounts" enable row level security;

revoke all on public."loyalty_accounts" from public,anon,authenticated;

create table public."loyalty_transactions"(
 "id" uuid default gen_random_uuid() not null,
 "account_id" uuid not null,
 "points_delta" integer not null,
 "reason" text not null,
 "created_at" timestamp with time zone default now() not null,
 constraint "loyalty_transactions_points_delta_check" CHECK ((points_delta <> 0)),
 constraint "loyalty_transactions_pkey" PRIMARY KEY (id)
);

alter table public."loyalty_transactions" enable row level security;

revoke all on public."loyalty_transactions" from public,anon,authenticated;

create table public."notification_consents"(
 "client_id" uuid not null,
 "email_opt_in" boolean default false not null,
 "whatsapp_opt_in" boolean default false not null,
 "consent_source" text,
 "consent_recorded_at" timestamp with time zone,
 "updated_at" timestamp with time zone default now() not null,
 constraint "consent_record_required" CHECK ((((NOT email_opt_in) AND (NOT whatsapp_opt_in)) OR ((consent_source IS NOT NULL) AND (consent_recorded_at IS NOT NULL)))),
 constraint "notification_consents_pkey" PRIMARY KEY (client_id)
);

alter table public."notification_consents" enable row level security;

revoke all on public."notification_consents" from public,anon,authenticated;

create table public."notification_outbox"(
 "id" uuid default gen_random_uuid() not null,
 "event_key" text not null,
 "channel" text not null,
 "recipient" text not null,
 "template_name" text not null,
 "payload" jsonb default '{}'::jsonb not null,
 "status" text default 'pending'::text not null,
 "attempts" integer default 0 not null,
 "last_error" text,
 "created_at" timestamp with time zone default now() not null,
 "sent_at" timestamp with time zone,
 constraint "notification_outbox_channel_check" CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text]))),
 constraint "notification_outbox_attempts_check" CHECK ((attempts >= 0)),
 constraint "notification_outbox_pkey" PRIMARY KEY (id),
 constraint "notification_outbox_event_key_channel_recipient_key" UNIQUE (event_key, channel, recipient),
 constraint "notification_outbox_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'sent'::text, 'failed'::text, 'canceled'::text])))
);

alter table public."notification_outbox" enable row level security;

revoke all on public."notification_outbox" from public,anon,authenticated;

alter table public."loyalty_accounts" add constraint "loyalty_accounts_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

alter table public."loyalty_transactions" add constraint "loyalty_transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES loyalty_accounts(id) ON DELETE RESTRICT;

alter table public."inventory_movements" add constraint "inventory_movements_item_id_fkey" FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

alter table public."inventory_movements" add constraint "inventory_movements_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE SET NULL;

alter table public."inventory_movements" add constraint "inventory_movements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

alter table public."finance_expenses" add constraint "finance_expenses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE RESTRICT;

alter table public."finance_expenses" add constraint "finance_expenses_payment_method_id_fkey" FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;

alter table public."finance_expenses" add constraint "finance_expenses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

alter table public."notification_consents" add constraint "notification_consents_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX loyalty_accounts_client_id_fk_idx ON public.loyalty_accounts USING btree (client_id);

CREATE INDEX inventory_movements_item_date_idx ON public.inventory_movements USING btree (item_id, created_at DESC);

CREATE INDEX inventory_movements_item_id_fk_idx ON public.inventory_movements USING btree (item_id);

CREATE INDEX inventory_movements_service_order_id_fk_idx ON public.inventory_movements USING btree (service_order_id);

CREATE INDEX inventory_movements_created_by_fk_idx ON public.inventory_movements USING btree (created_by);

CREATE INDEX loyalty_transactions_account_date_idx ON public.loyalty_transactions USING btree (account_id, created_at DESC);

CREATE INDEX loyalty_transactions_account_id_fk_idx ON public.loyalty_transactions USING btree (account_id);

CREATE INDEX notification_outbox_status_created_idx ON public.notification_outbox USING btree (status, created_at);

CREATE INDEX notification_outbox_client_pending_idx ON public.notification_outbox USING btree (((payload ->> 'client_id'::text)), channel) WHERE (status = 'pending'::text);

CREATE INDEX notification_outbox_pending_created_idx ON public.notification_outbox USING btree (created_at) WHERE (status = 'pending'::text);

CREATE INDEX finance_expenses_incurred_idx ON public.finance_expenses USING btree (incurred_on DESC);

CREATE INDEX finance_expenses_status_due_idx ON public.finance_expenses USING btree (status, due_on);

CREATE INDEX finance_expenses_category_id_fk_idx ON public.finance_expenses USING btree (category_id);

CREATE INDEX finance_expenses_payment_method_id_fk_idx ON public.finance_expenses USING btree (payment_method_id);

CREATE INDEX finance_expenses_created_by_fk_idx ON public.finance_expenses USING btree (created_by);

CREATE OR REPLACE FUNCTION private.app_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select role from public.profiles where id=(select auth.uid()) $function$;

CREATE OR REPLACE FUNCTION private.apply_inventory_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare new_balance numeric(14,3);
begin
 if new.created_by is distinct from auth.uid() then
  raise exception 'Movimentacao deve pertencer ao usuario autenticado';
 end if;
 update public.inventory_items
 set current_quantity=current_quantity+new.quantity_delta
 where id=new.item_id and current_quantity+new.quantity_delta>=0
 returning current_quantity into new_balance;
 if not found then raise exception 'Material inexistente ou saldo insuficiente'; end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.apply_loyalty_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare new_balance integer;
begin
 update public.loyalty_accounts
 set points_balance=points_balance+new.points_delta,updated_at=now()
 where id=new.account_id and points_balance+new.points_delta>=0
 returning points_balance into new_balance;
 if not found then raise exception 'Conta inexistente ou pontos insuficientes'; end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.cancel_revoked_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if old.email_opt_in and not new.email_opt_in then
  update public.notification_outbox
  set status='canceled',last_error='Consentimento de email revogado'
  where status='pending' and channel='email' and payload->>'client_id'=new.client_id::text;
 end if;
 if old.whatsapp_opt_in and not new.whatsapp_opt_in then
  update public.notification_outbox
  set status='canceled',last_error='Consentimento de WhatsApp revogado'
  where status='pending' and channel='whatsapp' and payload->>'client_id'=new.client_id::text;
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.restrict_inventory_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if new.current_quantity is distinct from old.current_quantity and pg_trigger_depth()=1 then
  raise exception 'Alteracao de saldo exige movimentacao';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.restrict_loyalty_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if new.points_balance is distinct from old.points_balance and pg_trigger_depth()=1 then
  raise exception 'Alteracao de pontos exige movimentacao';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.recalculate_vip_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin new.vip_tier:=case when new.points_balance>=2000 then 'diamante' when new.points_balance>=1000 then 'ouro' when new.points_balance>=300 then 'prata' else 'regular' end; new.updated_at:=now(); return new; end $function$;

CREATE OR REPLACE FUNCTION private.require_notification_consent()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare permitted boolean;
begin
 select case when new.channel='email' then email_opt_in else whatsapp_opt_in end into permitted
 from public.notification_consents
 where client_id=(new.payload->>'client_id')::uuid;
 if coalesce(permitted,false)=false then
  raise exception 'Consentimento de notificacao ausente ou revogado';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION private.close_completed_cash_days()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare affected integer;
begin
 with order_groups as (
  select coalesce(o.atendimento_id,o.id) as group_id,array_agg(o.id) as order_ids,
   sum(coalesce(o.charged_amount,0)) as amount,min(o.completed_at) as completed_at,min(o.created_at) as created_at
  from public.service_orders o where o.status='concluido' group by coalesce(o.atendimento_id,o.id)
 ), groups as (
  select o.group_id,o.amount,coalesce(p.paid_at,o.completed_at,o.created_at) as paid_at,p.payment_method_id as method
  from order_groups o left join lateral (
   select payment_method_id,paid_at from public.payments where service_order_id=any(o.order_ids) order by paid_at desc,id limit 1
  ) p on true
 ), methods as (
  select (g.paid_at at time zone 'America/Belem')::date as day,coalesce(m.name,'Sem forma de pagamento') as name,sum(g.amount) as total
  from groups g left join public.payment_methods m on m.id=g.method
  where (g.paid_at at time zone 'America/Belem')::date < (now() at time zone 'America/Belem')::date
  group by 1,2
 ) insert into public.cash_closings(closing_date,total_amount,details,closed_at)
 select day,sum(total),jsonb_agg(jsonb_build_object('name',name,'total',total)),now() from methods group by day
 on conflict(closing_date) do nothing;
 get diagnostics affected=row_count;
 return affected;
end $function$;

CREATE OR REPLACE FUNCTION private.save_appointment_group(p_group uuid, p_rows jsonb, p_complete boolean, p_method uuid, p_when timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  insert into public.audit_logs(user_id,action,entity_type,entity_id) values(actor,'Concluiu atendimento e registrou pagamento','appointments',new_group);
  return jsonb_build_object('orders',result,'payment',to_jsonb(pay),'group_id',new_group,'images',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.service_images i where service_order_id=first_order));
 else
  delete from public.appointments where coalesce(appointment_group_id,id)=new_group;
  for r in select value from jsonb_array_elements(p_rows) loop
   if coalesce(r->>'status','agendado') not in ('agendado','confirmado','em_atendimento','cancelado') then raise exception 'Situação inválida';end if;
   insert into public.appointments(appointment_group_id,client_id,vehicle_id,service_id,employee_id,employee_ids,scheduled_at,notes,status,discount_percent,charged_amount,payment_method_id,created_by)
   values(new_group,(r->>'client_id')::uuid,(r->>'vehicle_id')::uuid,(r->>'service_id')::uuid,(r->'employee_ids'->>0)::uuid,array(select jsonb_array_elements_text(r->'employee_ids')::uuid),p_when,r->>'notes',coalesce(r->>'status','agendado'),coalesce((r->>'discount_percent')::numeric,0),(r->>'charged_amount')::numeric,p_method,actor);
  end loop;
  select jsonb_agg(to_jsonb(a)) into result from public.appointments a where appointment_group_id=new_group;
  insert into public.audit_logs(user_id,action,entity_type,entity_id) values(actor,'Salvou agendamento','appointments',new_group);
  return jsonb_build_object('appointments',result,'group_id',new_group);
 end if;
end $function$;

CREATE OR REPLACE FUNCTION private.check_appointment_conflict()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare duration integer;
begin
 if new.status in ('cancelado','concluido','concluído') then return new; end if;
 perform pg_advisory_xact_lock(968096);
 select coalesce(s.duration_minutes,60) into duration from public.service_types s where s.id=new.service_id;
 duration:=coalesce(duration,60);
 if exists(select 1 from public.appointments a left join public.service_types s on s.id=a.service_id
  where a.id<>new.id and coalesce(a.appointment_group_id,a.id)<>coalesce(new.appointment_group_id,new.id)
  and a.status not in ('cancelado','concluido','concluído')
  and (a.vehicle_id=new.vehicle_id or
   (coalesce(a.employee_ids,'{}'::uuid[])||array[a.employee_id]) && (coalesce(new.employee_ids,'{}'::uuid[])||array[new.employee_id]))
  and tstzrange(a.scheduled_at,a.scheduled_at+make_interval(mins=>coalesce(s.duration_minutes,60)),'[)') &&
      tstzrange(new.scheduled_at,new.scheduled_at+make_interval(mins=>duration),'[)')) then
  raise exception 'Conflito de horário: veículo ou funcionário já ocupado nesse intervalo.' using errcode='23P01';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.reschedule_appointment(p_group uuid, p_when timestamp with time zone)
 RETURNS SETOF appointments
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or coalesce(private.app_role()::text,'') not in ('administrador','gerente','administrativo') then raise exception 'Acesso negado' using errcode='42501'; end if;
 if p_when is null then raise exception 'Data obrigatória'; end if;
 return query update public.appointments set scheduled_at=p_when
 where coalesce(appointment_group_id,id)=p_group and status not in ('cancelado','concluido','concluído') returning *;
 if not found then raise exception 'Agendamento não encontrado'; end if;
end $function$;

CREATE OR REPLACE FUNCTION public.save_appointment_group(p_group uuid, p_rows jsonb, p_complete boolean, p_method uuid, p_when timestamp with time zone)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$select private.save_appointment_group(p_group,p_rows,p_complete,p_method,p_when)$function$;

revoke all on function private.app_role() from public,anon,authenticated;

grant execute on function private.app_role() to authenticated;

revoke all on function private.apply_inventory_movement() from public,anon,authenticated;

revoke all on function private.apply_loyalty_transaction() from public,anon,authenticated;

revoke all on function private.cancel_revoked_notifications() from public,anon,authenticated;

revoke all on function private.restrict_inventory_updates() from public,anon,authenticated;

revoke all on function private.restrict_loyalty_updates() from public,anon,authenticated;

revoke all on function private.recalculate_vip_tier() from public,anon,authenticated;

revoke all on function private.require_notification_consent() from public,anon,authenticated;

revoke all on function private.close_completed_cash_days() from public,anon,authenticated;

revoke all on function private.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz) from public,anon,authenticated;

grant execute on function private.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz) to authenticated;

revoke all on function private.check_appointment_conflict() from public,anon,authenticated;

revoke all on function public.reschedule_appointment(uuid,timestamptz) from public,anon,authenticated;

grant execute on function public.reschedule_appointment(uuid,timestamptz) to authenticated;

revoke all on function public.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz) from public,anon,authenticated;

grant execute on function public.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz) to authenticated;

CREATE TRIGGER apply_inventory_movement BEFORE INSERT ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION private.apply_inventory_movement();

CREATE TRIGGER apply_loyalty_transaction BEFORE INSERT ON public.loyalty_transactions FOR EACH ROW EXECUTE FUNCTION private.apply_loyalty_transaction();

CREATE TRIGGER loyalty_tier_by_balance BEFORE INSERT OR UPDATE OF points_balance ON public.loyalty_accounts FOR EACH ROW EXECUTE FUNCTION private.recalculate_vip_tier();

CREATE TRIGGER prevent_inventory_direct_balance BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION private.restrict_inventory_updates();

CREATE TRIGGER prevent_loyalty_direct_balance BEFORE UPDATE ON public.loyalty_accounts FOR EACH ROW EXECUTE FUNCTION private.restrict_loyalty_updates();

CREATE TRIGGER notification_consent_required BEFORE INSERT ON public.notification_outbox FOR EACH ROW EXECUTE FUNCTION private.require_notification_consent();

CREATE TRIGGER cancel_notifications_on_consent_revocation AFTER UPDATE OF email_opt_in, whatsapp_opt_in ON public.notification_consents FOR EACH ROW EXECUTE FUNCTION private.cancel_revoked_notifications();

CREATE TRIGGER appointment_conflict BEFORE INSERT OR UPDATE OF scheduled_at, vehicle_id, employee_id, employee_ids, service_id, status ON public.appointments FOR EACH ROW EXECUTE FUNCTION private.check_appointment_conflict();

drop policy "vehicle_categories_select_authenticated" on public."vehicle_categories";

drop policy "vehicle_categories_insert_manager" on public."vehicle_categories";

drop policy "vehicle_categories_update_manager" on public."vehicle_categories";

drop policy "vehicle_categories_delete_manager" on public."vehicle_categories";

drop policy "manager closings" on public."cash_closings";

drop policy "read profiles" on public."profiles";

drop policy "manager profiles" on public."profiles";

drop policy "read clients" on public."clients";

drop policy "read audit" on public."audit_logs";

drop policy "insert audit" on public."audit_logs";

drop policy "write clients" on public."clients";

drop policy "read vehicles" on public."vehicles";

drop policy "write vehicles" on public."vehicles";

drop policy "read services" on public."service_types";

drop policy "manager services" on public."service_types";

drop policy "read employees" on public."employees";

drop policy "manager employees" on public."employees";

drop policy "read payment methods" on public."payment_methods";

drop policy "manager payment methods" on public."payment_methods";

drop policy "read orders" on public."service_orders";

drop policy "write orders" on public."service_orders";

drop policy "read images" on public."service_images";

drop policy "write images" on public."service_images";

drop policy "read appointments" on public."appointments";

drop policy "write appointments" on public."appointments";

drop policy "read payments" on public."payments";

drop policy "write payments" on public."payments";

drop policy "read closings" on public."cash_closings";

drop policy "admin_full_access" on public."appointments";

drop policy "admin_full_access" on public."audit_logs";

drop policy "admin_full_access" on public."cash_closings";

drop policy "admin_full_access" on public."clients";

drop policy "admin_full_access" on public."employees";

drop policy "admin_full_access" on public."payment_methods";

drop policy "admin_full_access" on public."payments";

drop policy "admin_full_access" on public."profiles";

drop policy "admin_full_access" on public."service_images";

drop policy "admin_full_access" on public."service_orders";

drop policy "admin_full_access" on public."service_types";

drop policy "admin_full_access" on public."vehicle_categories";

drop policy "admin_full_access" on public."vehicles";

drop policy "history_delete_admin_only" on public."service_orders";

drop policy "appointment_files_select_authenticated" on public."appointment_files";

drop policy "appointment_files_insert_write_roles" on public."appointment_files";

drop policy "service_orders_delete_admin_gerente" on public."service_orders";

drop policy "gestao atualiza foto de perfil" on public."profiles";

create policy "profiles_read" on public."profiles" as PERMISSIVE for SELECT to authenticated using (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))));

create policy "profiles_admin_update" on public."profiles" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = 'administrador'::user_role)) with check ((( SELECT private.app_role() AS app_role) = 'administrador'::user_role));

create policy "profiles_admin_insert" on public."profiles" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = 'administrador'::user_role));

create policy "profiles_admin_delete" on public."profiles" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = 'administrador'::user_role));

create policy "vehicles_update" on public."vehicles" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "clients_insert" on public."clients" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "clients_update" on public."clients" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "clients_delete" on public."clients" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "vehicles_insert" on public."vehicles" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "vehicles_read" on public."vehicles" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "vehicles_delete" on public."vehicles" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "appointments_insert" on public."appointments" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "appointments_update" on public."appointments" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "appointments_delete" on public."appointments" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "service_images_insert" on public."service_images" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "service_images_update" on public."service_images" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "service_images_delete" on public."service_images" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "payments_insert" on public."payments" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "payments_update" on public."payments" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "payments_delete" on public."payments" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "vehicle_categories_manage" on public."vehicle_categories" as PERMISSIVE for ALL to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "service_types_manage" on public."service_types" as PERMISSIVE for ALL to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "employees_manage" on public."employees" as PERMISSIVE for ALL to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "payment_methods_manage" on public."payment_methods" as PERMISSIVE for ALL to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "cash_closings_manage" on public."cash_closings" as PERMISSIVE for ALL to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "service_orders_write" on public."service_orders" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "service_orders_update" on public."service_orders" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "service_orders_delete" on public."service_orders" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "appointment_files_write" on public."appointment_files" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "appointment_files_delete" on public."appointment_files" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "audit_logs_read" on public."audit_logs" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "audit_logs_insert" on public."audit_logs" as PERMISSIVE for INSERT to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy "inventory_items_read" on public."inventory_items" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "inventory_items_update" on public."inventory_items" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "inventory_items_delete" on public."inventory_items" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = 'administrador'::user_role));

create policy "inventory_movements_read" on public."inventory_movements" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "loyalty_accounts_read" on public."loyalty_accounts" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "loyalty_accounts_update" on public."loyalty_accounts" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "loyalty_transactions_read" on public."loyalty_transactions" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_categories_read" on public."finance_categories" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_expenses_read" on public."finance_expenses" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_expenses_insert" on public."finance_expenses" as PERMISSIVE for INSERT to authenticated with check (((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])) AND (created_by = ( SELECT auth.uid() AS uid))));

create policy "finance_expenses_update" on public."finance_expenses" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_expenses_delete" on public."finance_expenses" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = 'administrador'::user_role));

create policy "finance_categories_insert" on public."finance_categories" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_categories_update" on public."finance_categories" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "appointments_read" on public."appointments" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "finance_categories_delete" on public."finance_categories" as PERMISSIVE for DELETE to authenticated using ((( SELECT private.app_role() AS app_role) = 'administrador'::user_role));

create policy "inventory_movements_insert" on public."inventory_movements" as PERMISSIVE for INSERT to authenticated with check (((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])) AND (created_by = ( SELECT auth.uid() AS uid))));

create policy "loyalty_transactions_insert" on public."loyalty_transactions" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "inventory_items_insert" on public."inventory_items" as PERMISSIVE for INSERT to authenticated with check (((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])) AND (current_quantity = (0)::numeric)));

create policy "loyalty_accounts_insert" on public."loyalty_accounts" as PERMISSIVE for INSERT to authenticated with check (((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])) AND (points_balance = 0)));

create policy "notification_outbox_read" on public."notification_outbox" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "consent_read" on public."notification_consents" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "consent_insert" on public."notification_consents" as PERMISSIVE for INSERT to authenticated with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "consent_update" on public."notification_consents" as PERMISSIVE for UPDATE to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "appointment_files_read" on public."appointment_files" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "clients_read" on public."clients" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "employees_read" on public."employees" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "payment_methods_read" on public."payment_methods" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "service_images_read" on public."service_images" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "service_orders_read" on public."service_orders" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "service_types_read" on public."service_types" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "vehicle_categories_read" on public."vehicle_categories" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "cash_closings_read" on public."cash_closings" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "payments_read" on public."payments" as PERMISSIVE for SELECT to authenticated using ((( SELECT private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

grant DELETE,INSERT,SELECT,UPDATE on public."finance_categories" to authenticated;

grant DELETE,INSERT,SELECT,UPDATE on public."finance_expenses" to authenticated;

grant DELETE,INSERT,SELECT,UPDATE on public."inventory_items" to authenticated;

grant INSERT,SELECT on public."inventory_movements" to authenticated;

grant INSERT,SELECT,UPDATE on public."loyalty_accounts" to authenticated;

grant INSERT,SELECT on public."loyalty_transactions" to authenticated;

grant INSERT,SELECT,UPDATE on public."notification_consents" to authenticated;

grant SELECT on public."notification_outbox" to authenticated;

grant select,insert,update on public.profiles,public.notification_outbox to service_role;

grant select on public.notification_consents to service_role;

create or replace function public.current_role() returns public.user_role language sql stable security invoker set search_path='' as $$select private.app_role()$$;

revoke all on function public.current_role() from public,anon;

grant execute on function public.current_role() to authenticated;

revoke all on function public.handle_new_user() from public,anon,authenticated;

revoke all on function public.fechar_caixa_automaticamente() from public,anon,authenticated;

alter view public.audit_logs_view set (security_invoker=true);

-- CRON DEPLOYMENT BEGIN

select cron.unschedule(jobid) from cron.job where jobname='fechamento-automatico-caixa';

select cron.schedule('graucar-production-cash-closing','5 3 * * *','select private.close_completed_cash_days()');

-- CRON DEPLOYMENT END

notify pgrst,'reload schema';
