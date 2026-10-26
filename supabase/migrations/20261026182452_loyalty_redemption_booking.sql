alter table public.clients add column loyalty_enabled boolean not null default true;
-- Exact requested businesses, normalized only for accents, case and repeated spaces.
update public.clients set loyalty_enabled=false where regexp_replace(translate(lower(trim(name)),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),'\s+',' ','g') = any(array['localiza semi-novos','localiza aluguel','autentica veiculos','rede amazonica','macapa seminovos m v m dos santos ltda','grand cite','pires veiculo','nissan dubai','equinocio vigilancia e seguranca privada']);
alter table public.service_types add column loyalty_reward_code text;
create unique index loyalty_reward_service_category_idx on public.service_types(loyalty_reward_code,coalesce(category_id,'00000000-0000-0000-0000-000000000000'::uuid)) where loyalty_reward_code is not null;
create table public.loyalty_redemptions(
 id uuid primary key default gen_random_uuid(),appointment_group_id uuid not null unique,
 client_id uuid not null references public.clients(id),account_id uuid not null references public.loyalty_accounts(id),
 reward_code text not null check(reward_code in ('simple_no_wax','simple_wax','technical','engine_underbody','major_discount')),
 points_cost integer not null check(points_cost>0),benefit_label text not null,
 vehicle_id uuid not null references public.vehicles(id),service_id uuid not null references public.service_types(id),
 charged_amount numeric not null check(charged_amount>=0),discount_percent numeric not null default 0 check(discount_percent between 0 and 100),
 payment_method_id uuid not null references public.payment_methods(id),
 status text not null default 'reserved' check(status in ('reserved','completed','canceled')),
 created_by uuid references public.profiles(id),created_at timestamptz not null default now(),completed_at timestamptz,canceled_at timestamptz
);
alter table public.loyalty_redemptions enable row level security;
revoke all on public.loyalty_redemptions from public,anon,authenticated;
grant select on public.loyalty_redemptions to authenticated;
create policy loyalty_redemptions_read on public.loyalty_redemptions for select to authenticated using((select private.app_role()) in ('administrador','gerente','administrativo'));
create index loyalty_redemptions_client_idx on public.loyalty_redemptions(client_id);
create index loyalty_redemptions_account_idx on public.loyalty_redemptions(account_id);
create index loyalty_redemptions_vehicle_idx on public.loyalty_redemptions(vehicle_id);
create index loyalty_redemptions_service_idx on public.loyalty_redemptions(service_id);
create index loyalty_redemptions_method_idx on public.loyalty_redemptions(payment_method_id);
create index loyalty_redemptions_actor_idx on public.loyalty_redemptions(created_by);
alter table public.appointments add column loyalty_redemption_id uuid references public.loyalty_redemptions(id);
alter table public.service_orders add column loyalty_redemption_id uuid references public.loyalty_redemptions(id);
create index appointments_redemption_idx on public.appointments(loyalty_redemption_id) where loyalty_redemption_id is not null;
create index service_orders_redemption_idx on public.service_orders(loyalty_redemption_id) where loyalty_redemption_id is not null;

-- Standalone point debits cannot bypass the booking workflow.
create or replace function public.redeem_loyalty_reward(p_client uuid,p_reward text,p_note text default '') returns uuid language plpgsql security invoker set search_path='' as $$
begin raise exception 'Use o resgate integrado ao agendamento';end $$;
revoke execute on function private.redeem_loyalty_reward(uuid,text,text) from authenticated;

create or replace function private.refund_loyalty_redemption(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare r public.loyalty_redemptions%rowtype;
begin
 select * into r from public.loyalty_redemptions where id=p_id for update;
 if not found or r.status<>'reserved' then return;end if;
 insert into public.loyalty_transactions(account_id,points_delta,reason,source_kind,event_key) values(r.account_id,r.points_cost,'Devolução de pontos: resgate cancelado','redemption','refund:'||r.id) on conflict(event_key) do nothing;
 update public.loyalty_redemptions set status='canceled',canceled_at=now() where id=r.id;
end $$;
CREATE OR REPLACE FUNCTION private.save_appointment_group_base(p_group uuid, p_rows jsonb, p_complete boolean, p_method uuid, p_when timestamp with time zone)
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

revoke all on function private.save_appointment_group_base(uuid,jsonb,boolean,uuid,timestamptz) from public,anon,authenticated;

create or replace function private.save_appointment_group(p_group uuid,p_rows jsonb,p_complete boolean,p_method uuid,p_when timestamptz) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.loyalty_redemptions%rowtype;item jsonb;result jsonb;
begin
 if auth.uid() is null or coalesce(private.app_role()::text,'') not in ('administrador','gerente','administrativo') then raise exception 'Acesso negado' using errcode='42501';end if;
 perform pg_advisory_xact_lock(968096);
 select * into r from public.loyalty_redemptions where appointment_group_id=p_group for update;
 if found then
  if r.status<>'reserved' then raise exception 'Resgate já concluído ou cancelado';end if;
  if jsonb_array_length(p_rows)<>1 then raise exception 'Resgate permite um benefício por atendimento';end if;
  item:=p_rows->0;
  if (item->>'client_id')::uuid is distinct from r.client_id or (item->>'vehicle_id')::uuid is distinct from r.vehicle_id or (item->>'service_id')::uuid is distinct from r.service_id or (item->>'charged_amount')::numeric is distinct from r.charged_amount or coalesce((item->>'discount_percent')::numeric,0)<>r.discount_percent or p_method is distinct from r.payment_method_id then raise exception 'Não altere cliente, veículo, benefício ou valores de um resgate reservado';end if;
 elsif exists(select 1 from jsonb_array_elements(p_rows) x join public.service_types s on s.id=(x->>'service_id')::uuid where s.loyalty_reward_code is not null) then raise exception 'Esse benefício exige resgate de pontos';
 end if;
 result:=private.save_appointment_group_base(p_group,p_rows,p_complete,p_method,p_when);
 if r.id is not null then
  if p_complete then
   update public.service_orders set loyalty_redemption_id=r.id,notes=concat_ws(E'\n',nullif(notes,''),'Benefício de fidelidade: '||r.benefit_label||' — '||r.points_cost||' pontos') where atendimento_id=p_group;
   update public.loyalty_redemptions set status='completed',completed_at=p_when where id=r.id;
   result:=jsonb_set(result,'{orders}',(select jsonb_agg(to_jsonb(o)) from public.service_orders o where atendimento_id=p_group));
  else
   update public.appointments set loyalty_redemption_id=r.id where appointment_group_id=p_group;
   if not exists(select 1 from public.appointments where appointment_group_id=p_group and status<>'cancelado') then perform private.refund_loyalty_redemption(r.id);end if;
   result:=jsonb_set(result,'{appointments}',(select jsonb_agg(to_jsonb(a)) from public.appointments a where appointment_group_id=p_group));
  end if;
 end if;
 return result;
end $$;
-- DEV's existing public RPC retains its name, while using the same tested guard.
create or replace function private.save_appointment_group_dev(p_group uuid,p_rows jsonb,p_complete boolean,p_method uuid,p_when timestamptz) returns jsonb language sql security invoker set search_path='' as $$select private.save_appointment_group(p_group,p_rows,p_complete,p_method,p_when)$$;
revoke all on function private.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz),private.save_appointment_group_dev(uuid,jsonb,boolean,uuid,timestamptz) from public,anon;
grant execute on function private.save_appointment_group(uuid,jsonb,boolean,uuid,timestamptz),private.save_appointment_group_dev(uuid,jsonb,boolean,uuid,timestamptz) to authenticated;

create or replace function private.create_loyalty_redemption(p_group uuid,p_client uuid,p_reward text,p_vehicle uuid,p_employees uuid[],p_when timestamptz,p_status text,p_service uuid,p_discount numeric,p_charged numeric,p_method uuid,p_note text,p_variant text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.loyalty_redemptions%rowtype;cost integer;label text;account public.loyalty_accounts%rowtype;vehicle public.vehicles%rowtype;service public.service_types%rowtype;method uuid;amount numeric:=0;discount numeric:=0;result jsonb;
begin
 if auth.uid() is null or coalesce(private.app_role()::text,'') not in ('administrador','gerente') then raise exception 'Acesso restrito à gestão';end if;
 if p_group is null or p_when is null or p_status not in ('agendado','confirmado','em_atendimento','concluido') then raise exception 'Data, hora ou status inválidos';end if;
 if coalesce(array_length(p_employees,1),0)=0 or exists(select 1 from unnest(p_employees) e where not exists(select 1 from public.employees where id=e and active)) then raise exception 'Selecione um lavador ativo';end if;
 perform pg_advisory_xact_lock(968096);
 select * into r from public.loyalty_redemptions where appointment_group_id=p_group for update;
 if found then
  if r.client_id<>p_client or r.reward_code<>p_reward then raise exception 'Identificador já utilizado';end if;
  return jsonb_build_object('redemption_id',r.id,'duplicate',true,'status',r.status);
 end if;
 if not exists(select 1 from public.clients where id=p_client and loyalty_enabled) then raise exception 'Cliente não participa do programa de fidelidade';end if;
 select * into vehicle from public.vehicles where id=p_vehicle and client_id=p_client;if not found then raise exception 'Veículo não pertence ao cliente';end if;
 cost:=case p_reward when 'simple_no_wax' then 1000 when 'simple_wax' then 1350 when 'technical' then 1700 when 'engine_underbody' then 2050 when 'major_discount' then 2451 else null end;
 label:=case p_reward when 'simple_no_wax' then 'Lavagem Simples sem cera' when 'simple_wax' then 'Lavagem Simples com cera' when 'technical' then 'Lavagem Técnica' when 'engine_underbody' then case when p_variant='engine' then 'Lavagem técnica do motor' when p_variant='underbody' then 'Lavagem do Baixo' else null end when 'major_discount' then 'Desconto em serviços maiores' else null end;
 if cost is null or label is null then raise exception 'Benefício inválido';end if;
 select * into account from public.loyalty_accounts where client_id=p_client for update;
 if account.id is null or account.points_balance<cost or account.points_debt>0 then raise exception 'Pontos insuficientes para este benefício';end if;
 if p_reward='major_discount' then
  select * into service from public.service_types where id=p_service and active and loyalty_reward_code is null and category_id is not distinct from vehicle.category_id;
  if service.id is null or service.price<=0 or p_charged is null or p_charged<0 or p_charged>=service.price or p_discount is null or p_discount<=0 or p_discount>100 then raise exception 'Selecione serviço e desconto válidos para o veículo';end if;
  amount:=round(p_charged,2);discount:=round(p_discount,4);
  if abs(amount-round(service.price*(1-discount/100),2))>0.01 then raise exception 'Desconto e valor cobrado não conferem';end if;
  method:=p_method;
 else
  if coalesce(p_charged,0)<>0 or coalesce(p_discount,0)<>0 then raise exception 'Benefício em serviço não permite cobrança ou desconto';end if;
  select * into service from public.service_types where loyalty_reward_code=p_reward||case when p_reward='engine_underbody' then ':'||p_variant else '' end and category_id is not distinct from vehicle.category_id;
  if not found then
   insert into public.service_types(name,price,category_id,active,loyalty_reward_code) values(label||' (Fidelidade)',0,vehicle.category_id,true,p_reward||case when p_reward='engine_underbody' then ':'||p_variant else '' end) returning * into service;
  end if;
  select id into method from public.payment_methods where name='Fidelidade (resgate)' and active order by created_at limit 1;
  if method is null then insert into public.payment_methods(name,active) values('Fidelidade (resgate)',true) returning id into method;end if;
 end if;
 if not exists(select 1 from public.payment_methods where id=method and active) then raise exception 'Forma de pagamento inválida';end if;
 insert into public.loyalty_redemptions(appointment_group_id,client_id,account_id,reward_code,points_cost,benefit_label,vehicle_id,service_id,charged_amount,discount_percent,payment_method_id,created_by)
 values(p_group,p_client,account.id,p_reward,cost,label,p_vehicle,service.id,amount,discount,method,auth.uid()) returning * into r;
 insert into public.loyalty_transactions(account_id,points_delta,reason,source_kind,event_key) values(account.id,-cost,'Reserva para resgate: '||label,'redemption','reservation:'||r.id);
 result:=private.save_appointment_group(p_group,jsonb_build_array(jsonb_build_object('client_id',p_client,'vehicle_id',p_vehicle,'service_id',service.id,'employee_ids',to_jsonb(p_employees),'charged_amount',amount,'discount_percent',discount,'status',p_status,'notes',left(coalesce(p_note,''),1000))),p_status='concluido',method,p_when);
 insert into public.audit_logs(user_id,action,entity_type,entity_id) values(auth.uid(),'Reservou pontos e agendou benefício de fidelidade','loyalty_redemptions',r.id);
 return result||jsonb_build_object('redemption_id',r.id,'points_cost',cost);
end $$;
create or replace function public.create_loyalty_redemption(p_group uuid,p_client uuid,p_reward text,p_vehicle uuid,p_employees uuid[],p_when timestamptz,p_status text,p_service uuid default null,p_discount numeric default 0,p_charged numeric default 0,p_method uuid default null,p_note text default '',p_variant text default '') returns jsonb language sql security invoker set search_path='' as $$select private.create_loyalty_redemption(p_group,p_client,p_reward,p_vehicle,p_employees,p_when,p_status,p_service,p_discount,p_charged,p_method,p_note,p_variant)$$;
revoke all on function public.create_loyalty_redemption(uuid,uuid,text,uuid,uuid[],timestamptz,text,uuid,numeric,numeric,uuid,text,text),private.create_loyalty_redemption(uuid,uuid,text,uuid,uuid[],timestamptz,text,uuid,numeric,numeric,uuid,text,text) from public,anon;
grant execute on function public.create_loyalty_redemption(uuid,uuid,text,uuid,uuid[],timestamptz,text,uuid,numeric,numeric,uuid,text,text),private.create_loyalty_redemption(uuid,uuid,text,uuid,uuid[],timestamptz,text,uuid,numeric,numeric,uuid,text,text) to authenticated;

create or replace function private.guard_loyalty_booking() returns trigger language plpgsql security definer set search_path='' as $$
declare r public.loyalty_redemptions%rowtype;group_id uuid;old_group uuid;reward text;
begin
 group_id:=(to_jsonb(new)->>case when tg_table_name='appointments' then 'appointment_group_id' else 'atendimento_id' end)::uuid;
 perform pg_advisory_xact_lock(968096);
 if tg_op='UPDATE' then
  old_group:=(to_jsonb(old)->>case when tg_table_name='appointments' then 'appointment_group_id' else 'atendimento_id' end)::uuid;
  if old_group is distinct from group_id and exists(select 1 from public.loyalty_redemptions where appointment_group_id=old_group) then raise exception 'Não altere a identificação de um resgate';end if;
 end if;
 select * into r from public.loyalty_redemptions where appointment_group_id=group_id;
 select loyalty_reward_code into reward from public.service_types where id=new.service_id;
 if r.id is null then if reward is not null or new.loyalty_redemption_id is not null then raise exception 'Benefício sem reserva de pontos';end if;return new;end if;
 if new.vehicle_id<>r.vehicle_id or new.service_id<>r.service_id or new.charged_amount is distinct from r.charged_amount then raise exception 'Benefício e valor vinculados ao resgate';end if;
 if tg_table_name='appointments' then
  if new.client_id<>r.client_id or new.discount_percent is distinct from r.discount_percent or new.payment_method_id is distinct from r.payment_method_id or r.status<>'reserved' then raise exception 'Agendamento incompatível com o resgate';end if;
  if exists(select 1 from public.appointments a where a.appointment_group_id=group_id and a.id<>new.id) then raise exception 'Resgate já possui agendamento';end if;
 end if;
 if tg_table_name='service_orders' and tg_op='INSERT' and (r.status<>'reserved' or exists(select 1 from public.service_orders where atendimento_id=group_id and id<>new.id)) then raise exception 'Resgate já concluído ou lançado';end if;
 new.loyalty_redemption_id:=r.id;return new;
end $$;
create trigger guard_loyalty_booking before insert or update on public.appointments for each row execute function private.guard_loyalty_booking();
create trigger guard_loyalty_service before insert or update on public.service_orders for each row execute function private.guard_loyalty_booking();

-- Deferred check survives the normal delete/reinsert used while editing an appointment.
create or replace function private.reconcile_redemption_booking() returns trigger language plpgsql security definer set search_path='' as $$
declare group_id uuid;r public.loyalty_redemptions%rowtype;
begin
 group_id:=old.appointment_group_id;
 select * into r from public.loyalty_redemptions where appointment_group_id=group_id for update;
 if r.id is not null and r.status='reserved' then
  if exists(select 1 from public.service_orders where atendimento_id=group_id and status='concluido') then update public.loyalty_redemptions set status='completed',completed_at=now() where id=r.id;
  elsif not exists(select 1 from public.appointments where appointment_group_id=group_id and status<>'cancelado') then perform private.refund_loyalty_redemption(r.id);end if;
 end if;return null;
end $$;
create constraint trigger reconcile_redemption_booking after delete or update on public.appointments deferrable initially deferred for each row execute function private.reconcile_redemption_booking();
revoke all on function private.refund_loyalty_redemption(uuid),private.guard_loyalty_booking(),private.reconcile_redemption_booking() from public,anon,authenticated;

create or replace function private.apply_loyalty_transaction() returns trigger language plpgsql security definer set search_path='' as $$
declare net integer;
begin
 select points_balance-points_debt+new.points_delta into net from public.loyalty_accounts where id=new.account_id for update;
 if not found then raise exception 'Conta de fidelidade inexistente'; end if;
 if new.points_delta<0 and new.source_kind<>'service' and net<0 then raise exception 'Pontos insuficientes para resgate'; end if;
 update public.loyalty_accounts set points_balance=greatest(net,0),points_debt=greatest(-net,0),updated_at=now() where id=new.account_id;
 return new;
end $$;

create or replace function private.sync_service_loyalty(p_order uuid) returns void language plpgsql security definer set search_path='' as $$
declare o record; prev private.loyalty_service_awards%rowtype; client uuid; target_points integer:=0; rate numeric; amount numeric:=0; account uuid; delta integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_order::text,62026));
 select * into prev from private.loyalty_service_awards where order_id=p_order for update;
 select so.*,v.client_id,c.loyalty_enabled into o from public.service_orders so join public.vehicles v on v.id=so.vehicle_id join public.clients c on c.id=v.client_id where so.id=p_order;
 if found and o.status='concluido' then
  client:=o.client_id; amount:=greatest(coalesce(o.charged_amount,0),0);
  rate:=coalesce(prev.points_per_real,(select points_per_real from public.loyalty_settings where id=1));
  if not o.loyalty_enabled and prev.order_id is null then return;end if;
  target_points:=floor(amount*rate)::integer;
  if not o.loyalty_enabled then target_points:=least(target_points,coalesce(prev.points,0));end if;
 end if;
 if prev.order_id is not null and (client is null or prev.client_id<>client) and prev.points>0 then
  select id into account from public.loyalty_accounts where client_id=prev.client_id;
  insert into public.loyalty_transactions(account_id,points_delta,reason,source_kind,source_order_id,event_key) values(account,-prev.points,'Estorno automático: atendimento removido ou cliente alterado','service',p_order,gen_random_uuid()::text);
 end if;
 if client is not null then
  insert into public.loyalty_accounts(client_id) values(client) on conflict(client_id) do nothing;
  select id into account from public.loyalty_accounts where client_id=client;
  delta:=target_points-case when prev.client_id=client then prev.points else 0 end;
  if delta<>0 then
   insert into public.loyalty_transactions(account_id,points_delta,reason,source_kind,source_order_id,event_key) values(account,delta,case when delta>0 then 'Crédito automático por serviço concluído' else 'Ajuste automático do valor do serviço' end,'service',p_order,gen_random_uuid()::text);
  end if;
  insert into private.loyalty_service_awards(order_id,client_id,points,points_per_real,charged_amount) values(p_order,client,target_points,rate,amount)
   on conflict(order_id) do update set client_id=excluded.client_id,points=excluded.points,charged_amount=excluded.charged_amount,updated_at=now();
 elsif prev.order_id is not null then
  update private.loyalty_service_awards set points=0,charged_amount=0,updated_at=now() where order_id=p_order;
 end if;
 perform private.refresh_loyalty_vip();
end $$;

create or replace view public.loyalty_overview with (security_invoker=true) as
 select a.id,a.client_id,a.points_balance,a.points_debt,a.created_at,a.updated_at,coalesce(v.visits,0)::integer as visits_in_window,
 case when coalesce(v.visits,0)>=s.diamond_visits then 'diamante' when coalesce(v.visits,0)>=s.gold_visits then 'ouro' when coalesce(v.visits,0)>=s.silver_visits then 'prata' else 'regular' end as vip_tier
 from public.loyalty_accounts a join public.clients c on c.id=a.client_id cross join public.loyalty_settings s left join lateral (
  select count(distinct coalesce(o.atendimento_id,o.id)) visits from public.service_orders o join public.vehicles vehicle on vehicle.id=o.vehicle_id
  where vehicle.client_id=a.client_id and o.status='concluido' and (coalesce(o.completed_at,o.created_at) at time zone 'America/Belem')::date between (now() at time zone 'America/Belem')::date-s.vip_window_days+1 and (now() at time zone 'America/Belem')::date
 ) v on true where s.id=1 and c.loyalty_enabled;

create or replace function private.client_preferences_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notification_consents(client_id,email_opt_in,whatsapp_opt_in,consent_source,consent_recorded_at,updated_at)
 values(new.id,new.email_opt_in,new.whatsapp_opt_in,'Preferências registradas no cadastro pela equipe',now(),now())
 on conflict(client_id) do update set email_opt_in=excluded.email_opt_in,whatsapp_opt_in=excluded.whatsapp_opt_in,consent_source=excluded.consent_source,consent_recorded_at=excluded.consent_recorded_at,updated_at=now()
 where (public.notification_consents.email_opt_in,public.notification_consents.whatsapp_opt_in) is distinct from (excluded.email_opt_in,excluded.whatsapp_opt_in);
 if new.loyalty_enabled then insert into public.loyalty_accounts(client_id) values(new.id) on conflict(client_id) do nothing;end if;
 return null;
end $$;

drop trigger client_preferences_changed on public.clients;
create trigger client_preferences_changed after insert or update of email_opt_in,whatsapp_opt_in,loyalty_enabled on public.clients for each row execute function private.client_preferences_changed();
