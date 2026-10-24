-- DEV ONLY: creates a schema-only production fixture and rolls back all objects/data.
-- Does not export production rows; does not install cron or alter source public/private schemas.
begin;
create schema graucar_release_validation;
create schema graucar_release_validation_private;
grant usage on schema graucar_release_validation to authenticated,anon,service_role;
set local search_path=graucar_release_validation,extensions;
create type graucar_release_validation.user_role as enum('gerente','administrativo','visualizador','administrador');
create table "appointment_files"(
"id" uuid default gen_random_uuid() not null,
"appointment_group_id" uuid not null,
"file_url" text not null,
"file_name" text not null,
"file_type" text,
"storage_path" text,
"created_at" timestamp with time zone default now() not null,
constraint "appointment_files_pkey" PRIMARY KEY (id)
);
alter table "appointment_files" enable row level security;
grant all on "appointment_files" to authenticated,service_role;
create table "appointments"(
"id" uuid default gen_random_uuid() not null,
"client_id" uuid,
"vehicle_id" uuid,
"service_id" uuid,
"scheduled_at" timestamp with time zone not null,
"status" text default 'agendado'::text not null,
"notes" text,
"created_at" timestamp with time zone default now(),
"created_by" uuid,
"appointment_group_id" uuid default gen_random_uuid(),
"employee_id" uuid,
"discount_percent" numeric default 0 not null,
"charged_amount" numeric,
"payment_method_id" uuid,
"employee_ids" uuid[] default '{}'::uuid[] not null,
constraint "appointments_pkey" PRIMARY KEY (id)
);
alter table "appointments" enable row level security;
grant all on "appointments" to authenticated,service_role;
create table "audit_logs"(
"id" uuid default gen_random_uuid() not null,
"user_id" uuid,
"action" text not null,
"entity_type" text,
"entity_id" uuid,
"created_at" timestamp with time zone default now(),
constraint "audit_logs_pkey" PRIMARY KEY (id)
);
alter table "audit_logs" enable row level security;
grant all on "audit_logs" to authenticated,service_role;
create table "cash_closings"(
"id" uuid default gen_random_uuid() not null,
"closing_date" date not null,
"total_amount" numeric(12,2) default 0 not null,
"details" jsonb default '[]'::jsonb,
"closed_at" timestamp with time zone default now(),
"closed_by" uuid,
constraint "cash_closings_pkey" PRIMARY KEY (id),
constraint "cash_closings_closing_date_key" UNIQUE (closing_date)
);
alter table "cash_closings" enable row level security;
grant all on "cash_closings" to authenticated,service_role;
create table "clients"(
"id" uuid default gen_random_uuid() not null,
"name" text not null,
"phone" text,
"email" text,
"document" text,
"created_at" timestamp with time zone default now(),
constraint "clients_pkey" PRIMARY KEY (id)
);
alter table "clients" enable row level security;
grant all on "clients" to authenticated,service_role;
create table "employees"(
"id" uuid default gen_random_uuid() not null,
"name" text not null,
"phone" text,
"position" text,
"commission_percent" numeric(5,2) default 0 not null,
"active" boolean default true,
"created_at" timestamp with time zone default now(),
"photo_url" text,
constraint "employees_commission_percent_check" CHECK (((commission_percent >= (0)::numeric) AND (commission_percent <= (100)::numeric))),
constraint "employees_pkey" PRIMARY KEY (id)
);
alter table "employees" enable row level security;
grant all on "employees" to authenticated,service_role;
create table "payment_methods"(
"id" uuid default gen_random_uuid() not null,
"name" text not null,
"active" boolean default true,
"created_at" timestamp with time zone default now(),
constraint "payment_methods_pkey" PRIMARY KEY (id),
constraint "payment_methods_name_key" UNIQUE (name)
);
alter table "payment_methods" enable row level security;
grant all on "payment_methods" to authenticated,service_role;
create table "payments"(
"id" uuid default gen_random_uuid() not null,
"service_order_id" uuid,
"payment_method_id" uuid,
"amount" numeric(12,2) default 0 not null,
"paid_at" timestamp with time zone default now(),
"created_by" uuid,
constraint "payments_pkey" PRIMARY KEY (id)
);
alter table "payments" enable row level security;
grant all on "payments" to authenticated,service_role;
create table "profiles"(
"id" uuid not null,
"full_name" text not null,
"email" text,
"role" user_role default 'visualizador'::user_role not null,
"created_at" timestamp with time zone default now(),
"photo_url" text,
constraint "profiles_pkey" PRIMARY KEY (id)
);
alter table "profiles" enable row level security;
grant all on "profiles" to authenticated,service_role;
create table "service_images"(
"id" uuid default gen_random_uuid() not null,
"service_order_id" uuid,
"image_url" text not null,
"file_name" text,
"created_at" timestamp with time zone default now(),
constraint "service_images_pkey" PRIMARY KEY (id)
);
alter table "service_images" enable row level security;
grant all on "service_images" to authenticated,service_role;
create table "service_orders"(
"id" uuid default gen_random_uuid() not null,
"vehicle_id" uuid,
"service_id" uuid,
"employee_id" uuid,
"performed_by" text,
"notes" text,
"status" text default 'concluido'::text not null,
"charged_amount" numeric(12,2),
"completed_at" timestamp with time zone,
"created_at" timestamp with time zone default now(),
"created_by" uuid,
"atendimento_id" uuid,
"employee_ids" uuid[] default '{}'::uuid[] not null,
constraint "service_orders_pkey" PRIMARY KEY (id)
);
alter table "service_orders" enable row level security;
grant all on "service_orders" to authenticated,service_role;
create table "service_types"(
"id" uuid default gen_random_uuid() not null,
"name" text not null,
"description" text,
"price" numeric(12,2) default 0 not null,
"discount_percent" numeric(5,2) default 0 not null,
"active" boolean default true,
"created_at" timestamp with time zone default now(),
"category_id" uuid,
constraint "service_types_discount_percent_check" CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric))),
constraint "service_types_pkey" PRIMARY KEY (id)
);
alter table "service_types" enable row level security;
grant all on "service_types" to authenticated,service_role;
create table "vehicle_categories"(
"id" uuid default gen_random_uuid() not null,
"name" text not null,
"created_at" timestamp with time zone default now() not null,
constraint "vehicle_categories_pkey" PRIMARY KEY (id)
);
alter table "vehicle_categories" enable row level security;
grant all on "vehicle_categories" to authenticated,service_role;
create table "vehicles"(
"id" uuid default gen_random_uuid() not null,
"client_id" uuid,
"plate" text not null,
"brand" text,
"model" text,
"color" text,
"year" text,
"created_at" timestamp with time zone default now(),
"category_id" uuid,
constraint "vehicles_pkey" PRIMARY KEY (id),
constraint "vehicles_plate_key" UNIQUE (plate)
);
alter table "vehicles" enable row level security;
grant all on "vehicles" to authenticated,service_role;
alter table "profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "vehicles" add constraint "vehicles_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table "service_orders" add constraint "service_orders_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);
alter table "service_orders" add constraint "service_orders_service_id_fkey" FOREIGN KEY (service_id) REFERENCES service_types(id);
alter table "service_orders" add constraint "service_orders_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
alter table "service_orders" add constraint "service_orders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table "service_images" add constraint "service_images_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE;
alter table "appointments" add constraint "appointments_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id);
alter table "appointments" add constraint "appointments_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);
alter table "appointments" add constraint "appointments_service_id_fkey" FOREIGN KEY (service_id) REFERENCES service_types(id);
alter table "appointments" add constraint "appointments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table "payments" add constraint "payments_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id);
alter table "payments" add constraint "payments_payment_method_id_fkey" FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id);
alter table "payments" add constraint "payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table "cash_closings" add constraint "cash_closings_closed_by_fkey" FOREIGN KEY (closed_by) REFERENCES auth.users(id);
alter table "audit_logs" add constraint "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table "vehicles" add constraint "vehicles_category_id_fkey" FOREIGN KEY (category_id) REFERENCES vehicle_categories(id) ON DELETE RESTRICT;
alter table "service_types" add constraint "service_types_category_id_fkey" FOREIGN KEY (category_id) REFERENCES vehicle_categories(id) ON DELETE RESTRICT;
alter table "appointments" add constraint "appointments_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
alter table "appointments" add constraint "appointments_payment_method_id_fkey" FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;
CREATE OR REPLACE FUNCTION graucar_release_validation.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'graucar_release_validation'
AS $function$ begin insert into graucar_release_validation.profiles(id,full_name,email,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.email),new.email,'visualizador') on conflict(id) do nothing; return new; end; $function$
;
CREATE OR REPLACE FUNCTION graucar_release_validation."current_role"()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'graucar_release_validation'
AS $function$ select role from graucar_release_validation.profiles where id=auth.uid(); $function$
;
CREATE OR REPLACE FUNCTION graucar_release_validation.fechar_caixa_automaticamente()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'graucar_release_validation'
AS $function$
declare
  v_data date;
  v_total numeric := 0;
  v_detalhes jsonb := '[]'::jsonb;
begin

  -- Data atual de Macapá
  v_data := (now() at time zone 'America/Belem')::date;

  -- Evita criar fechamento duplicado
  if exists (
    select 1
    from graucar_release_validation.cash_closings
    where closing_date = v_data
  ) then
    return;
  end if;

  /*
    Soma os serviços concluídos no dia.
    charged_amount já representa o valor efetivamente
    cobrado em cada serviço do atendimento.
  */
  select coalesce(sum(charged_amount), 0)
  into v_total
  from graucar_release_validation.service_orders
  where status = 'concluido'
    and (completed_at at time zone 'America/Belem')::date = v_data;

  /*
    Resumo por forma de pagamento.
  */
  with atendimentos as (
    select
      coalesce(so.atendimento_id::text, so.id::text) as atendimento,
      array_agg(so.id) as order_ids,
      sum(coalesce(so.charged_amount, 0)) as total
    from graucar_release_validation.service_orders so
    where so.status = 'concluido'
      and (so.completed_at at time zone 'America/Belem')::date = v_data
    group by coalesce(so.atendimento_id::text, so.id::text)
  ),
  valores as (
    select
      coalesce(pm.name, 'Sem forma de pagamento') as forma,
      sum(a.total) as total
    from atendimentos a
    left join lateral (
      select p.payment_method_id
      from graucar_release_validation.payments p
      where p.service_order_id = any(a.order_ids)
      order by p.paid_at desc
      limit 1
    ) pg on true
    left join graucar_release_validation.payment_methods pm
      on pm.id = pg.payment_method_id
    group by coalesce(pm.name, 'Sem forma de pagamento')
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name', forma,
        'total', total
      )
    ),
    '[]'::jsonb
  )
  into v_detalhes
  from valores;

  insert into graucar_release_validation.cash_closings (
    closing_date,
    total_amount,
    details,
    closed_at
  )
  values (
    v_data,
    v_total,
    v_detalhes,
    now()
  );

end;
$function$
;
create view "audit_logs_view" as  SELECT a.id,
    a.user_id,
    a.action,
    a.entity_type,
    a.entity_id,
    a.created_at,
    p.full_name AS user_name
   FROM (audit_logs a
     LEFT JOIN profiles p ON ((p.id = a.user_id)));
create policy "vehicle_categories_select_authenticated" on "vehicle_categories" as PERMISSIVE for SELECT to authenticated using (true);
create policy "vehicle_categories_insert_manager" on "vehicle_categories" as PERMISSIVE for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))))));
create policy "vehicle_categories_update_manager" on "vehicle_categories" as PERMISSIVE for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))))));
create policy "vehicle_categories_delete_manager" on "vehicle_categories" as PERMISSIVE for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))))));
create policy "manager closings" on "cash_closings" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'gerente'::user_role)) with check (("current_role"() = 'gerente'::user_role));
create policy "read profiles" on "profiles" as PERMISSIVE for SELECT to authenticated using (((id = auth.uid()) OR ("current_role"() = 'gerente'::user_role)));
create policy "manager profiles" on "profiles" as PERMISSIVE for UPDATE to authenticated using (("current_role"() = 'gerente'::user_role)) with check (("current_role"() = 'gerente'::user_role));
create policy "read clients" on "clients" as PERMISSIVE for SELECT to authenticated using (true);
create policy "read audit" on "audit_logs" as PERMISSIVE for SELECT to authenticated using (("current_role"() = 'gerente'::user_role));
create policy "insert audit" on "audit_logs" as PERMISSIVE for INSERT to authenticated with check ((auth.uid() = user_id));
create policy "write clients" on "clients" as PERMISSIVE for ALL to authenticated using (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role]))) with check (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role])));
create policy "read vehicles" on "vehicles" as PERMISSIVE for SELECT to authenticated using (true);
create policy "write vehicles" on "vehicles" as PERMISSIVE for ALL to authenticated using (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role]))) with check (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role])));
create policy "read services" on "service_types" as PERMISSIVE for SELECT to authenticated using (true);
create policy "manager services" on "service_types" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'gerente'::user_role)) with check (("current_role"() = 'gerente'::user_role));
create policy "read employees" on "employees" as PERMISSIVE for SELECT to authenticated using (true);
create policy "manager employees" on "employees" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'gerente'::user_role)) with check (("current_role"() = 'gerente'::user_role));
create policy "read payment methods" on "payment_methods" as PERMISSIVE for SELECT to authenticated using (true);
create policy "manager payment methods" on "payment_methods" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'gerente'::user_role)) with check (("current_role"() = 'gerente'::user_role));
create policy "read orders" on "service_orders" as PERMISSIVE for SELECT to authenticated using (true);
create policy "write orders" on "service_orders" as PERMISSIVE for ALL to authenticated using (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role]))) with check (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role])));
create policy "read images" on "service_images" as PERMISSIVE for SELECT to authenticated using (true);
create policy "write images" on "service_images" as PERMISSIVE for ALL to authenticated using (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role]))) with check (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role])));
create policy "read appointments" on "appointments" as PERMISSIVE for SELECT to authenticated using (true);
create policy "write appointments" on "appointments" as PERMISSIVE for ALL to authenticated using (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role]))) with check (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role])));
create policy "read payments" on "payments" as PERMISSIVE for SELECT to authenticated using (true);
create policy "write payments" on "payments" as PERMISSIVE for ALL to authenticated using (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role]))) with check (("current_role"() = ANY (ARRAY['gerente'::user_role, 'administrativo'::user_role])));
create policy "read closings" on "cash_closings" as PERMISSIVE for SELECT to authenticated using (true);
create policy "admin_full_access" on "appointments" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "audit_logs" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "cash_closings" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "clients" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "employees" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "payment_methods" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "payments" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "profiles" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "service_images" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "service_orders" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "service_types" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "vehicle_categories" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "admin_full_access" on "vehicles" as PERMISSIVE for ALL to authenticated using (("current_role"() = 'administrador'::user_role)) with check (("current_role"() = 'administrador'::user_role));
create policy "history_delete_admin_only" on "service_orders" as RESTRICTIVE for DELETE to authenticated using (("current_role"() = 'administrador'::user_role));
create policy "appointment_files_select_authenticated" on "appointment_files" as PERMISSIVE for SELECT to authenticated using (true);
create policy "appointment_files_insert_write_roles" on "appointment_files" as PERMISSIVE for INSERT to public;
create policy "service_orders_delete_admin_gerente" on "service_orders" as PERMISSIVE for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))))));
create policy "gestao atualiza foto de perfil" on "profiles" as PERMISSIVE for UPDATE to authenticated using ((("current_role"())::text = ANY (ARRAY['administrador'::text, 'gerente'::text]))) with check ((("current_role"())::text = ANY (ARRAY['administrador'::text, 'gerente'::text])));
-- Production release: additive tables/columns; no customer rows copied from DEV.

-- Apply only after a verified production backup. Transactional deployment.

set local lock_timeout='5s';

set local statement_timeout='90s';

set local search_path=graucar_release_validation,extensions;

create schema if not exists graucar_release_validation_private;

revoke all on schema graucar_release_validation_private from public,anon;

grant usage on schema graucar_release_validation_private to authenticated,service_role;

alter table graucar_release_validation.service_types add column if not exists duration_minutes integer not null default 60;

alter table graucar_release_validation.service_types add constraint service_types_duration_minutes_valid check(duration_minutes between 5 and 720);

create table graucar_release_validation."finance_categories"(
 "id" uuid default gen_random_uuid() not null,
 "name" text not null,
 "kind" text not null,
 "active" boolean default true not null,
 "created_at" timestamp with time zone default now() not null,
 constraint "finance_categories_kind_check" CHECK ((kind = ANY (ARRAY['receita'::text, 'despesa'::text]))),
 constraint "finance_categories_pkey" PRIMARY KEY (id),
 constraint "finance_categories_name_key" UNIQUE (name)
);

alter table graucar_release_validation."finance_categories" enable row level security;

revoke all on graucar_release_validation."finance_categories" from public,anon,authenticated;

create table graucar_release_validation."finance_expenses"(
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

alter table graucar_release_validation."finance_expenses" enable row level security;

revoke all on graucar_release_validation."finance_expenses" from public,anon,authenticated;

create table graucar_release_validation."inventory_items"(
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

alter table graucar_release_validation."inventory_items" enable row level security;

revoke all on graucar_release_validation."inventory_items" from public,anon,authenticated;

create table graucar_release_validation."inventory_movements"(
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

alter table graucar_release_validation."inventory_movements" enable row level security;

revoke all on graucar_release_validation."inventory_movements" from public,anon,authenticated;

create table graucar_release_validation."loyalty_accounts"(
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

alter table graucar_release_validation."loyalty_accounts" enable row level security;

revoke all on graucar_release_validation."loyalty_accounts" from public,anon,authenticated;

create table graucar_release_validation."loyalty_transactions"(
 "id" uuid default gen_random_uuid() not null,
 "account_id" uuid not null,
 "points_delta" integer not null,
 "reason" text not null,
 "created_at" timestamp with time zone default now() not null,
 constraint "loyalty_transactions_points_delta_check" CHECK ((points_delta <> 0)),
 constraint "loyalty_transactions_pkey" PRIMARY KEY (id)
);

alter table graucar_release_validation."loyalty_transactions" enable row level security;

revoke all on graucar_release_validation."loyalty_transactions" from public,anon,authenticated;

create table graucar_release_validation."notification_consents"(
 "client_id" uuid not null,
 "email_opt_in" boolean default false not null,
 "whatsapp_opt_in" boolean default false not null,
 "consent_source" text,
 "consent_recorded_at" timestamp with time zone,
 "updated_at" timestamp with time zone default now() not null,
 constraint "consent_record_required" CHECK ((((NOT email_opt_in) AND (NOT whatsapp_opt_in)) OR ((consent_source IS NOT NULL) AND (consent_recorded_at IS NOT NULL)))),
 constraint "notification_consents_pkey" PRIMARY KEY (client_id)
);

alter table graucar_release_validation."notification_consents" enable row level security;

revoke all on graucar_release_validation."notification_consents" from public,anon,authenticated;

create table graucar_release_validation."notification_outbox"(
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

alter table graucar_release_validation."notification_outbox" enable row level security;

revoke all on graucar_release_validation."notification_outbox" from public,anon,authenticated;

alter table graucar_release_validation."loyalty_accounts" add constraint "loyalty_accounts_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

alter table graucar_release_validation."loyalty_transactions" add constraint "loyalty_transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES loyalty_accounts(id) ON DELETE RESTRICT;

alter table graucar_release_validation."inventory_movements" add constraint "inventory_movements_item_id_fkey" FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT;

alter table graucar_release_validation."inventory_movements" add constraint "inventory_movements_service_order_id_fkey" FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE SET NULL;

alter table graucar_release_validation."inventory_movements" add constraint "inventory_movements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

alter table graucar_release_validation."finance_expenses" add constraint "finance_expenses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE RESTRICT;

alter table graucar_release_validation."finance_expenses" add constraint "finance_expenses_payment_method_id_fkey" FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;

alter table graucar_release_validation."finance_expenses" add constraint "finance_expenses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

alter table graucar_release_validation."notification_consents" add constraint "notification_consents_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX loyalty_accounts_client_id_fk_idx ON graucar_release_validation.loyalty_accounts USING btree (client_id);

CREATE INDEX inventory_movements_item_date_idx ON graucar_release_validation.inventory_movements USING btree (item_id, created_at DESC);

CREATE INDEX inventory_movements_item_id_fk_idx ON graucar_release_validation.inventory_movements USING btree (item_id);

CREATE INDEX inventory_movements_service_order_id_fk_idx ON graucar_release_validation.inventory_movements USING btree (service_order_id);

CREATE INDEX inventory_movements_created_by_fk_idx ON graucar_release_validation.inventory_movements USING btree (created_by);

CREATE INDEX loyalty_transactions_account_date_idx ON graucar_release_validation.loyalty_transactions USING btree (account_id, created_at DESC);

CREATE INDEX loyalty_transactions_account_id_fk_idx ON graucar_release_validation.loyalty_transactions USING btree (account_id);

CREATE INDEX notification_outbox_status_created_idx ON graucar_release_validation.notification_outbox USING btree (status, created_at);

CREATE INDEX notification_outbox_client_pending_idx ON graucar_release_validation.notification_outbox USING btree (((payload ->> 'client_id'::text)), channel) WHERE (status = 'pending'::text);

CREATE INDEX notification_outbox_pending_created_idx ON graucar_release_validation.notification_outbox USING btree (created_at) WHERE (status = 'pending'::text);

CREATE INDEX finance_expenses_incurred_idx ON graucar_release_validation.finance_expenses USING btree (incurred_on DESC);

CREATE INDEX finance_expenses_status_due_idx ON graucar_release_validation.finance_expenses USING btree (status, due_on);

CREATE INDEX finance_expenses_category_id_fk_idx ON graucar_release_validation.finance_expenses USING btree (category_id);

CREATE INDEX finance_expenses_payment_method_id_fk_idx ON graucar_release_validation.finance_expenses USING btree (payment_method_id);

CREATE INDEX finance_expenses_created_by_fk_idx ON graucar_release_validation.finance_expenses USING btree (created_by);

CREATE OR REPLACE FUNCTION graucar_release_validation_private.app_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select role from graucar_release_validation.profiles where id=(select auth.uid()) $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation_private.apply_inventory_movement()
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
 update graucar_release_validation.inventory_items
 set current_quantity=current_quantity+new.quantity_delta
 where id=new.item_id and current_quantity+new.quantity_delta>=0
 returning current_quantity into new_balance;
 if not found then raise exception 'Material inexistente ou saldo insuficiente'; end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation_private.apply_loyalty_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare new_balance integer;
begin
 update graucar_release_validation.loyalty_accounts
 set points_balance=points_balance+new.points_delta,updated_at=now()
 where id=new.account_id and points_balance+new.points_delta>=0
 returning points_balance into new_balance;
 if not found then raise exception 'Conta inexistente ou pontos insuficientes'; end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation_private.cancel_revoked_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if old.email_opt_in and not new.email_opt_in then
  update graucar_release_validation.notification_outbox
  set status='canceled',last_error='Consentimento de email revogado'
  where status='pending' and channel='email' and payload->>'client_id'=new.client_id::text;
 end if;
 if old.whatsapp_opt_in and not new.whatsapp_opt_in then
  update graucar_release_validation.notification_outbox
  set status='canceled',last_error='Consentimento de WhatsApp revogado'
  where status='pending' and channel='whatsapp' and payload->>'client_id'=new.client_id::text;
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation_private.restrict_inventory_updates()
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

CREATE OR REPLACE FUNCTION graucar_release_validation_private.restrict_loyalty_updates()
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

CREATE OR REPLACE FUNCTION graucar_release_validation_private.recalculate_vip_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin new.vip_tier:=case when new.points_balance>=2000 then 'diamante' when new.points_balance>=1000 then 'ouro' when new.points_balance>=300 then 'prata' else 'regular' end; new.updated_at:=now(); return new; end $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation_private.require_notification_consent()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare permitted boolean;
begin
 select case when new.channel='email' then email_opt_in else whatsapp_opt_in end into permitted
 from graucar_release_validation.notification_consents
 where client_id=(new.payload->>'client_id')::uuid;
 if coalesce(permitted,false)=false then
  raise exception 'Consentimento de notificacao ausente ou revogado';
 end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation_private.close_completed_cash_days()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare affected integer;
begin
 with order_groups as (
  select coalesce(o.atendimento_id,o.id) as group_id,array_agg(o.id) as order_ids,
   sum(coalesce(o.charged_amount,0)) as amount,min(o.completed_at) as completed_at,min(o.created_at) as created_at
  from graucar_release_validation.service_orders o where o.status='concluido' group by coalesce(o.atendimento_id,o.id)
 ), groups as (
  select o.group_id,o.amount,coalesce(p.paid_at,o.completed_at,o.created_at) as paid_at,p.payment_method_id as method
  from order_groups o left join lateral (
   select payment_method_id,paid_at from graucar_release_validation.payments where service_order_id=any(o.order_ids) order by paid_at desc,id limit 1
  ) p on true
 ), methods as (
  select (g.paid_at at time zone 'America/Belem')::date as day,coalesce(m.name,'Sem forma de pagamento') as name,sum(g.amount) as total
  from groups g left join graucar_release_validation.payment_methods m on m.id=g.method
  where (g.paid_at at time zone 'America/Belem')::date < (now() at time zone 'America/Belem')::date
  group by 1,2
 ) insert into graucar_release_validation.cash_closings(closing_date,total_amount,details,closed_at)
 select day,sum(total),jsonb_agg(jsonb_build_object('name',name,'total',total)),now() from methods group by day
 on conflict(closing_date) do nothing;
 get diagnostics affected=row_count;
 return affected;
end $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation_private.save_appointment_group(p_group uuid, p_rows jsonb, p_complete boolean, p_method uuid, p_when timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r jsonb;result jsonb:='[]';created graucar_release_validation.service_orders;pay graucar_release_validation.payments;total numeric:=0;first_order uuid;actor uuid:=auth.uid();new_group uuid:=coalesce(p_group,gen_random_uuid());
begin
 if actor is null or coalesce(graucar_release_validation_private.app_role()::text,'') not in ('administrador','gerente','administrativo') then raise exception 'Acesso negado' using errcode='42501';end if;
 if p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 30 or p_when is null then raise exception 'Atendimento inválido';end if;
 perform pg_advisory_xact_lock(968096);
 if exists(select 1 from graucar_release_validation.service_orders where atendimento_id=new_group) then raise exception 'Atendimento já concluído. Atualize a tela antes de continuar.';end if;
 if not exists(select 1 from graucar_release_validation.payment_methods where id=p_method and active) then raise exception 'Forma de pagamento inválida';end if;
 for r in select value from jsonb_array_elements(p_rows) loop
  if not exists(select 1 from graucar_release_validation.vehicles where id=(r->>'vehicle_id')::uuid and client_id=(r->>'client_id')::uuid) then raise exception 'Veículo não pertence ao cliente';end if;
  if not exists(select 1 from graucar_release_validation.service_types where id=(r->>'service_id')::uuid and active) then raise exception 'Serviço inválido';end if;
  if coalesce((r->>'charged_amount')::numeric,-1)<0 then raise exception 'Valor inválido';end if;
  if jsonb_array_length(coalesce(r->'employee_ids','[]'))=0 or exists(select 1 from jsonb_array_elements_text(r->'employee_ids') v where not exists(select 1 from graucar_release_validation.employees e where e.id=v::uuid and e.active)) then raise exception 'Responsável inválido';end if;
 end loop;
 if p_complete then
  for r in select value from jsonb_array_elements(p_rows) loop
   insert into graucar_release_validation.service_orders(vehicle_id,service_id,atendimento_id,employee_id,employee_ids,performed_by,status,notes,charged_amount,completed_at,created_by)
   values((r->>'vehicle_id')::uuid,(r->>'service_id')::uuid,new_group,(r->'employee_ids'->>0)::uuid,array(select jsonb_array_elements_text(r->'employee_ids')::uuid),(select full_name from graucar_release_validation.profiles where id=actor),'concluido',r->>'notes',(r->>'charged_amount')::numeric,p_when,actor) returning * into created;
   result:=result||jsonb_build_array(to_jsonb(created));first_order:=coalesce(first_order,created.id);total:=total+created.charged_amount;
  end loop;
  insert into graucar_release_validation.payments(service_order_id,payment_method_id,amount,paid_at,created_by) values(first_order,p_method,total,p_when,actor) returning * into pay;
  insert into graucar_release_validation.service_images(service_order_id,image_url,file_name) select first_order,file_url,file_name from graucar_release_validation.appointment_files where appointment_group_id=new_group;
  delete from graucar_release_validation.appointment_files where appointment_group_id=new_group;
  delete from graucar_release_validation.appointments where coalesce(appointment_group_id,id)=new_group;
  insert into graucar_release_validation.audit_logs(user_id,action,entity_type,entity_id) values(actor,'Concluiu atendimento e registrou pagamento','appointments',new_group);
  return jsonb_build_object('orders',result,'payment',to_jsonb(pay),'group_id',new_group,'images',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from graucar_release_validation.service_images i where service_order_id=first_order));
 else
  delete from graucar_release_validation.appointments where coalesce(appointment_group_id,id)=new_group;
  for r in select value from jsonb_array_elements(p_rows) loop
   if coalesce(r->>'status','agendado') not in ('agendado','confirmado','em_atendimento','cancelado') then raise exception 'Situação inválida';end if;
   insert into graucar_release_validation.appointments(appointment_group_id,client_id,vehicle_id,service_id,employee_id,employee_ids,scheduled_at,notes,status,discount_percent,charged_amount,payment_method_id,created_by)
   values(new_group,(r->>'client_id')::uuid,(r->>'vehicle_id')::uuid,(r->>'service_id')::uuid,(r->'employee_ids'->>0)::uuid,array(select jsonb_array_elements_text(r->'employee_ids')::uuid),p_when,r->>'notes',coalesce(r->>'status','agendado'),coalesce((r->>'discount_percent')::numeric,0),(r->>'charged_amount')::numeric,p_method,actor);
  end loop;
  select jsonb_agg(to_jsonb(a)) into result from graucar_release_validation.appointments a where appointment_group_id=new_group;
  insert into graucar_release_validation.audit_logs(user_id,action,entity_type,entity_id) values(actor,'Salvou agendamento','appointments',new_group);
  return jsonb_build_object('appointments',result,'group_id',new_group);
 end if;
end $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation_private.check_appointment_conflict()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare duration integer;
begin
 if new.status in ('cancelado','concluido','concluído') then return new; end if;
 perform pg_advisory_xact_lock(968096);
 select coalesce(s.duration_minutes,60) into duration from graucar_release_validation.service_types s where s.id=new.service_id;
 duration:=coalesce(duration,60);
 if exists(select 1 from graucar_release_validation.appointments a left join graucar_release_validation.service_types s on s.id=a.service_id
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

CREATE OR REPLACE FUNCTION graucar_release_validation.reschedule_appointment(p_group uuid, p_when timestamp with time zone)
 RETURNS SETOF appointments
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or coalesce(graucar_release_validation_private.app_role()::text,'') not in ('administrador','gerente','administrativo') then raise exception 'Acesso negado' using errcode='42501'; end if;
 if p_when is null then raise exception 'Data obrigatória'; end if;
 return query update graucar_release_validation.appointments set scheduled_at=p_when
 where coalesce(appointment_group_id,id)=p_group and status not in ('cancelado','concluido','concluído') returning *;
 if not found then raise exception 'Agendamento não encontrado'; end if;
end $function$;

CREATE OR REPLACE FUNCTION graucar_release_validation.save_appointment_group(p_group uuid, p_rows jsonb, p_complete boolean, p_method uuid, p_when timestamp with time zone)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$select graucar_release_validation_private.save_appointment_group(p_group,p_rows,p_complete,p_method,p_when)$function$;

revoke all on function graucar_release_validation_private.app_role() from public,anon,authenticated;

grant execute on function graucar_release_validation_private.app_role() to authenticated;

revoke all on function graucar_release_validation_private.apply_inventory_movement() from public,anon,authenticated;

revoke all on function graucar_release_validation_private.apply_loyalty_transaction() from public,anon,authenticated;

revoke all on function graucar_release_validation_private.cancel_revoked_notifications() from public,anon,authenticated;

revoke all on function graucar_release_validation_private.restrict_inventory_updates() from public,anon,authenticated;

revoke all on function graucar_release_validation_private.restrict_loyalty_updates() from public,anon,authenticated;

revoke all on function graucar_release_validation_private.recalculate_vip_tier() from public,anon,authenticated;

revoke all on function graucar_release_validation_private.require_notification_consent() from public,anon,authenticated;

revoke all on function graucar_release_validation_private.close_completed_cash_days() from public,anon,authenticated;

revoke all on function graucar_release_validation_private.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz) from public,anon,authenticated;

grant execute on function graucar_release_validation_private.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz) to authenticated;

revoke all on function graucar_release_validation_private.check_appointment_conflict() from public,anon,authenticated;

revoke all on function graucar_release_validation.reschedule_appointment(uuid,timestamptz) from public,anon,authenticated;

grant execute on function graucar_release_validation.reschedule_appointment(uuid,timestamptz) to authenticated;

revoke all on function graucar_release_validation.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz) from public,anon,authenticated;

grant execute on function graucar_release_validation.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz) to authenticated;

CREATE TRIGGER apply_inventory_movement BEFORE INSERT ON graucar_release_validation.inventory_movements FOR EACH ROW EXECUTE FUNCTION graucar_release_validation_private.apply_inventory_movement();

CREATE TRIGGER apply_loyalty_transaction BEFORE INSERT ON graucar_release_validation.loyalty_transactions FOR EACH ROW EXECUTE FUNCTION graucar_release_validation_private.apply_loyalty_transaction();

CREATE TRIGGER loyalty_tier_by_balance BEFORE INSERT OR UPDATE OF points_balance ON graucar_release_validation.loyalty_accounts FOR EACH ROW EXECUTE FUNCTION graucar_release_validation_private.recalculate_vip_tier();

CREATE TRIGGER prevent_inventory_direct_balance BEFORE UPDATE ON graucar_release_validation.inventory_items FOR EACH ROW EXECUTE FUNCTION graucar_release_validation_private.restrict_inventory_updates();

CREATE TRIGGER prevent_loyalty_direct_balance BEFORE UPDATE ON graucar_release_validation.loyalty_accounts FOR EACH ROW EXECUTE FUNCTION graucar_release_validation_private.restrict_loyalty_updates();

CREATE TRIGGER notification_consent_required BEFORE INSERT ON graucar_release_validation.notification_outbox FOR EACH ROW EXECUTE FUNCTION graucar_release_validation_private.require_notification_consent();

CREATE TRIGGER cancel_notifications_on_consent_revocation AFTER UPDATE OF email_opt_in, whatsapp_opt_in ON graucar_release_validation.notification_consents FOR EACH ROW EXECUTE FUNCTION graucar_release_validation_private.cancel_revoked_notifications();

CREATE TRIGGER appointment_conflict BEFORE INSERT OR UPDATE OF scheduled_at, vehicle_id, employee_id, employee_ids, service_id, status ON graucar_release_validation.appointments FOR EACH ROW EXECUTE FUNCTION graucar_release_validation_private.check_appointment_conflict();

drop policy "vehicle_categories_select_authenticated" on graucar_release_validation."vehicle_categories";

drop policy "vehicle_categories_insert_manager" on graucar_release_validation."vehicle_categories";

drop policy "vehicle_categories_update_manager" on graucar_release_validation."vehicle_categories";

drop policy "vehicle_categories_delete_manager" on graucar_release_validation."vehicle_categories";

drop policy "manager closings" on graucar_release_validation."cash_closings";

drop policy "read profiles" on graucar_release_validation."profiles";

drop policy "manager profiles" on graucar_release_validation."profiles";

drop policy "read clients" on graucar_release_validation."clients";

drop policy "read audit" on graucar_release_validation."audit_logs";

drop policy "insert audit" on graucar_release_validation."audit_logs";

drop policy "write clients" on graucar_release_validation."clients";

drop policy "read vehicles" on graucar_release_validation."vehicles";

drop policy "write vehicles" on graucar_release_validation."vehicles";

drop policy "read services" on graucar_release_validation."service_types";

drop policy "manager services" on graucar_release_validation."service_types";

drop policy "read employees" on graucar_release_validation."employees";

drop policy "manager employees" on graucar_release_validation."employees";

drop policy "read payment methods" on graucar_release_validation."payment_methods";

drop policy "manager payment methods" on graucar_release_validation."payment_methods";

drop policy "read orders" on graucar_release_validation."service_orders";

drop policy "write orders" on graucar_release_validation."service_orders";

drop policy "read images" on graucar_release_validation."service_images";

drop policy "write images" on graucar_release_validation."service_images";

drop policy "read appointments" on graucar_release_validation."appointments";

drop policy "write appointments" on graucar_release_validation."appointments";

drop policy "read payments" on graucar_release_validation."payments";

drop policy "write payments" on graucar_release_validation."payments";

drop policy "read closings" on graucar_release_validation."cash_closings";

drop policy "admin_full_access" on graucar_release_validation."appointments";

drop policy "admin_full_access" on graucar_release_validation."audit_logs";

drop policy "admin_full_access" on graucar_release_validation."cash_closings";

drop policy "admin_full_access" on graucar_release_validation."clients";

drop policy "admin_full_access" on graucar_release_validation."employees";

drop policy "admin_full_access" on graucar_release_validation."payment_methods";

drop policy "admin_full_access" on graucar_release_validation."payments";

drop policy "admin_full_access" on graucar_release_validation."profiles";

drop policy "admin_full_access" on graucar_release_validation."service_images";

drop policy "admin_full_access" on graucar_release_validation."service_orders";

drop policy "admin_full_access" on graucar_release_validation."service_types";

drop policy "admin_full_access" on graucar_release_validation."vehicle_categories";

drop policy "admin_full_access" on graucar_release_validation."vehicles";

drop policy "history_delete_admin_only" on graucar_release_validation."service_orders";

drop policy "appointment_files_select_authenticated" on graucar_release_validation."appointment_files";

drop policy "appointment_files_insert_write_roles" on graucar_release_validation."appointment_files";

drop policy "service_orders_delete_admin_gerente" on graucar_release_validation."service_orders";

drop policy "gestao atualiza foto de perfil" on graucar_release_validation."profiles";

create policy "profiles_read" on graucar_release_validation."profiles" as PERMISSIVE for SELECT to authenticated using (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))));

create policy "profiles_admin_update" on graucar_release_validation."profiles" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = 'administrador'::user_role)) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = 'administrador'::user_role));

create policy "profiles_admin_insert" on graucar_release_validation."profiles" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = 'administrador'::user_role));

create policy "profiles_admin_delete" on graucar_release_validation."profiles" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = 'administrador'::user_role));

create policy "vehicles_update" on graucar_release_validation."vehicles" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "clients_insert" on graucar_release_validation."clients" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "clients_update" on graucar_release_validation."clients" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "clients_delete" on graucar_release_validation."clients" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "vehicles_insert" on graucar_release_validation."vehicles" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "vehicles_read" on graucar_release_validation."vehicles" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "vehicles_delete" on graucar_release_validation."vehicles" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "appointments_insert" on graucar_release_validation."appointments" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "appointments_update" on graucar_release_validation."appointments" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "appointments_delete" on graucar_release_validation."appointments" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "service_images_insert" on graucar_release_validation."service_images" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "service_images_update" on graucar_release_validation."service_images" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "service_images_delete" on graucar_release_validation."service_images" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "payments_insert" on graucar_release_validation."payments" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "payments_update" on graucar_release_validation."payments" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "payments_delete" on graucar_release_validation."payments" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "vehicle_categories_manage" on graucar_release_validation."vehicle_categories" as PERMISSIVE for ALL to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "service_types_manage" on graucar_release_validation."service_types" as PERMISSIVE for ALL to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "employees_manage" on graucar_release_validation."employees" as PERMISSIVE for ALL to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "payment_methods_manage" on graucar_release_validation."payment_methods" as PERMISSIVE for ALL to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "cash_closings_manage" on graucar_release_validation."cash_closings" as PERMISSIVE for ALL to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "service_orders_write" on graucar_release_validation."service_orders" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "service_orders_update" on graucar_release_validation."service_orders" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "service_orders_delete" on graucar_release_validation."service_orders" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "appointment_files_write" on graucar_release_validation."appointment_files" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "appointment_files_delete" on graucar_release_validation."appointment_files" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "audit_logs_read" on graucar_release_validation."audit_logs" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "audit_logs_insert" on graucar_release_validation."audit_logs" as PERMISSIVE for INSERT to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)));

create policy "inventory_items_read" on graucar_release_validation."inventory_items" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "inventory_items_update" on graucar_release_validation."inventory_items" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "inventory_items_delete" on graucar_release_validation."inventory_items" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = 'administrador'::user_role));

create policy "inventory_movements_read" on graucar_release_validation."inventory_movements" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "loyalty_accounts_read" on graucar_release_validation."loyalty_accounts" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "loyalty_accounts_update" on graucar_release_validation."loyalty_accounts" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "loyalty_transactions_read" on graucar_release_validation."loyalty_transactions" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_categories_read" on graucar_release_validation."finance_categories" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_expenses_read" on graucar_release_validation."finance_expenses" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_expenses_insert" on graucar_release_validation."finance_expenses" as PERMISSIVE for INSERT to authenticated with check (((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])) AND (created_by = ( SELECT auth.uid() AS uid))));

create policy "finance_expenses_update" on graucar_release_validation."finance_expenses" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_expenses_delete" on graucar_release_validation."finance_expenses" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = 'administrador'::user_role));

create policy "finance_categories_insert" on graucar_release_validation."finance_categories" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "finance_categories_update" on graucar_release_validation."finance_categories" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "appointments_read" on graucar_release_validation."appointments" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "finance_categories_delete" on graucar_release_validation."finance_categories" as PERMISSIVE for DELETE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = 'administrador'::user_role));

create policy "inventory_movements_insert" on graucar_release_validation."inventory_movements" as PERMISSIVE for INSERT to authenticated with check (((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])) AND (created_by = ( SELECT auth.uid() AS uid))));

create policy "loyalty_transactions_insert" on graucar_release_validation."loyalty_transactions" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "inventory_items_insert" on graucar_release_validation."inventory_items" as PERMISSIVE for INSERT to authenticated with check (((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])) AND (current_quantity = (0)::numeric)));

create policy "loyalty_accounts_insert" on graucar_release_validation."loyalty_accounts" as PERMISSIVE for INSERT to authenticated with check (((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])) AND (points_balance = 0)));

create policy "notification_outbox_read" on graucar_release_validation."notification_outbox" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "consent_read" on graucar_release_validation."notification_consents" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role])));

create policy "consent_insert" on graucar_release_validation."notification_consents" as PERMISSIVE for INSERT to authenticated with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "consent_update" on graucar_release_validation."notification_consents" as PERMISSIVE for UPDATE to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role]))) with check ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "appointment_files_read" on graucar_release_validation."appointment_files" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "clients_read" on graucar_release_validation."clients" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "employees_read" on graucar_release_validation."employees" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "payment_methods_read" on graucar_release_validation."payment_methods" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "service_images_read" on graucar_release_validation."service_images" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "service_orders_read" on graucar_release_validation."service_orders" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "service_types_read" on graucar_release_validation."service_types" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "vehicle_categories_read" on graucar_release_validation."vehicle_categories" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role, 'administrativo'::user_role, 'visualizador'::user_role])));

create policy "cash_closings_read" on graucar_release_validation."cash_closings" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

create policy "payments_read" on graucar_release_validation."payments" as PERMISSIVE for SELECT to authenticated using ((( SELECT graucar_release_validation_private.app_role() AS app_role) = ANY (ARRAY['administrador'::user_role, 'gerente'::user_role])));

grant DELETE,INSERT,SELECT,UPDATE on graucar_release_validation."finance_categories" to authenticated;

grant DELETE,INSERT,SELECT,UPDATE on graucar_release_validation."finance_expenses" to authenticated;

grant DELETE,INSERT,SELECT,UPDATE on graucar_release_validation."inventory_items" to authenticated;

grant INSERT,SELECT on graucar_release_validation."inventory_movements" to authenticated;

grant INSERT,SELECT,UPDATE on graucar_release_validation."loyalty_accounts" to authenticated;

grant INSERT,SELECT on graucar_release_validation."loyalty_transactions" to authenticated;

grant INSERT,SELECT,UPDATE on graucar_release_validation."notification_consents" to authenticated;

grant SELECT on graucar_release_validation."notification_outbox" to authenticated;

grant select,insert,update on graucar_release_validation.profiles,graucar_release_validation.notification_outbox to service_role;

grant select on graucar_release_validation.notification_consents to service_role;

create or replace function graucar_release_validation.current_role() returns graucar_release_validation.user_role language sql stable security invoker set search_path='' as $$select graucar_release_validation_private.app_role()$$;

revoke all on function graucar_release_validation.current_role() from public,anon;

grant execute on function graucar_release_validation.current_role() to authenticated;

revoke all on function graucar_release_validation.handle_new_user() from public,anon,authenticated;

revoke all on function graucar_release_validation.fechar_caixa_automaticamente() from public,anon,authenticated;

alter view graucar_release_validation.audit_logs_view set (security_invoker=true);



notify pgrst,'reload schema';

insert into graucar_release_validation.profiles(id,full_name,email,role) values('fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7','Teste isolado',null,'administrador');
select set_config('request.jwt.claims','{"sub":"fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7',true);
create temp table test_results(name text,passed boolean);
grant all on test_results to authenticated;
set local role authenticated;
do $$
declare c uuid;v uuid;v2 uuid;s uuid;e uuid;item uuid;account uuid;group1 uuid:=gen_random_uuid();group2 uuid:=gen_random_uuid();delta integer;balance numeric;f uuid;
begin
 insert into graucar_release_validation.clients(name,email) values ('HOMOLOGACAO DESCARTAVEL','teste@example.invalid') returning id into c;
 insert into graucar_release_validation.vehicles(client_id,plate) values(c,'TST0A96') returning id into v;
 insert into graucar_release_validation.vehicles(client_id,plate) values(c,'TST0B96') returning id into v2;
 insert into graucar_release_validation.service_types(name,price,duration_minutes) values('HOMOLOGACAO LAVAGEM',100,60) returning id into s;
 insert into graucar_release_validation.employees(name) values('HOMOLOGACAO EQUIPE') returning id into e;
 insert into graucar_release_validation.appointments(client_id,vehicle_id,service_id,employee_ids,scheduled_at,appointment_group_id)
 values(c,v,s,array[e],'2026-10-25T10:00:00-03:00',group1);
 begin
  insert into graucar_release_validation.appointments(client_id,vehicle_id,service_id,employee_ids,scheduled_at,appointment_group_id)
  values(c,v2,s,array[e],'2026-10-25T10:30:00-03:00',group2);
  raise exception 'FAIL: sobreposição foi aceita';
 exception when exclusion_violation then insert into test_results values('Bloqueio de conflito de funcionário',true);end;
 begin
  insert into graucar_release_validation.appointments(client_id,vehicle_id,service_id,scheduled_at,appointment_group_id)
  values(c,v,s,'2026-10-25T10:30:00-03:00',group2);
  raise exception 'FAIL: veículo duplicado aceito';
 exception when exclusion_violation then insert into test_results values('Bloqueio de conflito de veículo',true);end;
 insert into graucar_release_validation.appointments(client_id,vehicle_id,service_id,employee_ids,scheduled_at,appointment_group_id)
 values(c,v2,s,array[e],'2026-10-25T11:00:00-03:00',group2);
 insert into test_results values('Horários adjacentes permitidos',true);
 perform graucar_release_validation.reschedule_appointment(group2,'2026-10-25T12:00:00-03:00');
 if not exists(select 1 from graucar_release_validation.appointments where appointment_group_id=group2 and scheduled_at='2026-10-25T12:00:00-03:00') then raise exception 'FAIL reagendar';end if;
 insert into test_results values('Reagendamento transacional',true);
 insert into graucar_release_validation.inventory_items(name,min_quantity) values('HOMOLOGACAO SHAMPOO',2) returning id into item;
 insert into graucar_release_validation.inventory_movements(item_id,quantity_delta,reason,created_by) values(item,10,'Teste entrada',auth.uid()),(item,-3,'Teste saída',auth.uid());
 select current_quantity into balance from graucar_release_validation.inventory_items where id=item;
 if balance<>7 then raise exception 'FAIL estoque %',balance;end if;
 insert into test_results values('Estoque entrada e saída = 7',true);
 begin
  insert into graucar_release_validation.inventory_movements(item_id,quantity_delta,reason,created_by) values(item,-8,'Teste saldo negativo',auth.uid());
  raise exception 'FAIL saldo negativo aceito';
 exception when raise_exception then if sqlerrm<>'Material inexistente ou saldo insuficiente' then raise;end if;insert into test_results values('Estoque negativo bloqueado',true);end;
 insert into graucar_release_validation.loyalty_accounts(client_id) values(c) returning id into account;
 insert into graucar_release_validation.loyalty_transactions(account_id,points_delta,reason) values(account,100,'Teste crédito'),(account,-30,'Teste resgate');
 select points_balance into balance from graucar_release_validation.loyalty_accounts where id=account;
 if balance<>70 then raise exception 'FAIL pontos %',balance;end if;
 insert into test_results values('Fidelidade crédito e resgate = 70',true);
 begin
  insert into graucar_release_validation.loyalty_transactions(account_id,points_delta,reason) values(account,-71,'Teste saldo negativo');
  raise exception 'FAIL pontos negativos aceitos';
 exception when raise_exception then if sqlerrm<>'Conta inexistente ou pontos insuficientes' then raise;end if;insert into test_results values('Resgate maior que saldo bloqueado',true);end;
 insert into graucar_release_validation.finance_expenses(description,amount,created_by) values('HOMOLOGACAO DESPESA',25,auth.uid()) returning id into f;
 update graucar_release_validation.finance_expenses set status='pago',paid_on=current_date where id=f;
 if not exists(select 1 from graucar_release_validation.finance_expenses where id=f and status='pago') then raise exception 'FAIL baixa despesa';end if;
 insert into test_results values('Despesa e baixa de pagamento',true);
 insert into graucar_release_validation.notification_consents(client_id,email_opt_in,whatsapp_opt_in,consent_source,consent_recorded_at) values(c,true,false,'HOMOLOGACAO',now());
 update graucar_release_validation.notification_consents set email_opt_in=false where client_id=c;
 insert into test_results values('Consentimento e revogação',true);
end $$;
reset role;
-- Validate the server cash task on a completed prior day and idempotency.
do $$
declare o uuid;first_count integer;second_count integer;
begin
 insert into graucar_release_validation.service_orders(charged_amount,completed_at,status) values(123.45,'2026-10-20T13:00:00-03:00','concluido') returning id into o;
 insert into graucar_release_validation.payments(service_order_id,amount,paid_at) values(o,123.45,'2026-10-20T13:00:00-03:00');
 first_count:=graucar_release_validation_private.close_completed_cash_days();second_count:=graucar_release_validation_private.close_completed_cash_days();
 if not exists(select 1 from graucar_release_validation.cash_closings where closing_date='2026-10-20' and total_amount=123.45) then raise exception 'FAIL caixa';end if;
 if second_count<>0 then raise exception 'FAIL fechamento duplicado';end if;
 insert into test_results values('Fechamento no servidor, total e idempotência',true);
end $$;
-- Temporary role change rolls back together with every synthetic record.
update graucar_release_validation.profiles set role='visualizador' where id='fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7';
set local role authenticated;
do $$ begin
 begin insert into graucar_release_validation.clients(name) values('NAO DEVE SER GRAVADO');raise exception 'FAIL visualizador escreveu';exception when insufficient_privilege then insert into test_results values('Visualizador não pode criar cliente',true);end;
 begin perform graucar_release_validation.reschedule_appointment(gen_random_uuid(),now());raise exception 'FAIL visualizador reagendou';exception when insufficient_privilege then insert into test_results values('Visualizador não pode reagendar',true);end;
end $$;
reset role;



select set_config('request.jwt.claim.sub','fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7',true);
select set_config('request.jwt.claims','{"sub":"fa67cdd0-bf7c-4fb5-993e-62ac4406b5b7","role":"authenticated"}',true);
create temp table transaction_results(name text,passed boolean);
do $$
declare c uuid;v uuid;s uuid;e uuid;m uuid;g uuid:=gen_random_uuid();g2 uuid:=gen_random_uuid();payload jsonb;result jsonb;tested_role graucar_release_validation.user_role;
begin
 insert into graucar_release_validation.clients(name) values('HOMOLOGACAO TRANSACAO') returning id into c;
 insert into graucar_release_validation.vehicles(client_id,plate) values(c,'TRX0A96') returning id into v;
 insert into graucar_release_validation.service_types(name,price) values('HOMOLOGACAO',100) returning id into s;
 insert into graucar_release_validation.employees(name) values('HOMOLOGACAO') returning id into e;
 insert into graucar_release_validation.payment_methods(name) values('HOMOLOGACAO PIX') returning id into m;
 payload:=jsonb_build_array(jsonb_build_object('client_id',c,'vehicle_id',v,'service_id',s,'employee_ids',jsonb_build_array(e),'charged_amount',100,'status','agendado'));
 foreach tested_role in array array['administrador','gerente','administrativo']::graucar_release_validation.user_role[] loop
  update graucar_release_validation.profiles set role=tested_role where id=auth.uid();
  g:=gen_random_uuid();
  result:=graucar_release_validation.save_appointment_group(g,payload,false,m,'2026-10-26T10:00:00-03:00');
  if jsonb_array_length(result->'appointments')<>1 then raise exception 'FAIL criar %',tested_role;end if;
  perform graucar_release_validation.save_appointment_group(g2,payload,false,m,'2026-10-26T12:00:00-03:00');
  begin
   perform graucar_release_validation.save_appointment_group(g,payload,false,m,'2026-10-26T12:30:00-03:00');
   raise exception 'FAIL conflito aceito';
  exception when exclusion_violation then null;end;
  if not exists(select 1 from graucar_release_validation.appointments where appointment_group_id=g and scheduled_at='2026-10-26T10:00:00-03:00') then raise exception 'FAIL original perdido';end if;
  insert into transaction_results values('Edição com conflito preserva original · '||tested_role,true);
  result:=graucar_release_validation.save_appointment_group(g,payload,true,m,'2026-10-26T10:00:00-03:00');
  if (result->'payment'->>'amount')::numeric<>100 or jsonb_array_length(result->'orders')<>1 or exists(select 1 from graucar_release_validation.appointments where appointment_group_id=g) then raise exception 'FAIL conclusão %',tested_role;end if;
  insert into transaction_results values('Histórico e pagamento atômicos · '||tested_role,true);
  begin
   perform graucar_release_validation.save_appointment_group(g,payload,true,m,'2026-10-26T10:00:00-03:00');
   raise exception 'FAIL duplicado aceito';
  exception when raise_exception then if sqlerrm not like 'Atendimento já concluído.%' then raise;end if;end;
  insert into transaction_results values('Conclusão duplicada bloqueada · '||tested_role,true);
  delete from graucar_release_validation.appointments where appointment_group_id=g2;
 end loop;
 update graucar_release_validation.profiles set role='visualizador' where id=auth.uid();
 begin
  perform graucar_release_validation.save_appointment_group(gen_random_uuid(),payload,true,m,now());raise exception 'FAIL visualizador aceito';
 exception when insufficient_privilege then insert into transaction_results values('Visualizador bloqueado na conclusão',true);end;
 perform set_config('request.jwt.claim.sub','',true);perform set_config('request.jwt.claims','{}',true);
 begin
  perform graucar_release_validation.save_appointment_group(gen_random_uuid(),payload,true,m,now());raise exception 'FAIL anônimo aceito';
 exception when insufficient_privilege then insert into transaction_results values('Anônimo bloqueado na conclusão',true);end;
end $$;



select jsonb_build_object('tests',(select count(*) from test_results)+(select count(*) from transaction_results),'passed',(select bool_and(passed) from (select passed from test_results union all select passed from transaction_results) t),'new_tables',(select count(*) from information_schema.tables where table_schema='graucar_release_validation' and table_name in ('finance_categories','finance_expenses','inventory_items','inventory_movements','loyalty_accounts','loyalty_transactions','notification_consents','notification_outbox'))) as release_validation;
rollback;