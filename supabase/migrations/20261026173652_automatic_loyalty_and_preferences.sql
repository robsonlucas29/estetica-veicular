-- Automatic loyalty, recurrence VIP, and communication preferences. No messages are sent.
create table public.loyalty_settings (
 id integer primary key default 1 check(id=1),
 points_per_real numeric(8,2) not null default 1 check(points_per_real>0 and points_per_real<=100),
 vip_window_days integer not null default 90 check(vip_window_days between 30 and 365),
 silver_visits integer not null default 3,
 gold_visits integer not null default 6,
 diamond_visits integer not null default 10,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(silver_visits>=1 and gold_visits>silver_visits and diamond_visits>gold_visits and diamond_visits<=1000)
);
insert into public.loyalty_settings(id) values(1);
alter table public.loyalty_settings enable row level security;
revoke all on public.loyalty_settings from public,anon,authenticated;
grant select,update on public.loyalty_settings to authenticated;
create policy loyalty_settings_read on public.loyalty_settings for select to authenticated using ((select private.app_role()) in ('administrador','gerente','administrativo'));
create policy loyalty_settings_update on public.loyalty_settings for update to authenticated using ((select private.app_role())='administrador') with check ((select private.app_role())='administrador');

alter table public.loyalty_accounts add column points_debt integer not null default 0 check(points_debt>=0);
alter table public.loyalty_transactions add column source_kind text not null default 'manual' check(source_kind in ('manual','service','redemption'));
alter table public.loyalty_transactions add column source_order_id uuid;
alter table public.loyalty_transactions add column event_key text unique;
-- Internal award state survives a service deletion so repeated trigger calls cannot double-award.
create table private.loyalty_service_awards (
 order_id uuid primary key,client_id uuid not null references public.clients(id) on delete cascade,
 points integer not null check(points>=0),points_per_real numeric not null,charged_amount numeric not null,
 updated_at timestamptz not null default now()
);
alter table private.loyalty_service_awards enable row level security;
revoke all on private.loyalty_service_awards from public,anon,authenticated;
create policy loyalty_service_awards_internal_only on private.loyalty_service_awards for all to authenticated using(false) with check(false);
create index loyalty_service_awards_client_idx on private.loyalty_service_awards(client_id);
create index if not exists service_orders_loyalty_completed_idx on public.service_orders(vehicle_id,completed_at,created_at) where status='concluido';

create or replace function private.apply_loyalty_transaction() returns trigger language plpgsql security definer set search_path='' as $$
declare net integer;
begin
 select points_balance-points_debt+new.points_delta into net from public.loyalty_accounts where id=new.account_id for update;
 if not found then raise exception 'Conta de fidelidade inexistente'; end if;
 if new.source_kind<>'service' and net<0 then raise exception 'Pontos insuficientes para resgate'; end if;
 update public.loyalty_accounts set points_balance=greatest(net,0),points_debt=greatest(-net,0),updated_at=now() where id=new.account_id;
 return new;
end $$;
create or replace function private.restrict_loyalty_updates() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.points_balance is distinct from old.points_balance or new.points_debt is distinct from old.points_debt) and pg_trigger_depth()=1 then raise exception 'Alteracao de pontos exige movimentacao'; end if;
 return new;
end $$;
drop trigger loyalty_tier_by_balance on public.loyalty_accounts;

create or replace function private.loyalty_visit_count(p_client uuid,p_days integer) returns integer language sql stable security definer set search_path='' as $$
 select count(distinct coalesce(o.atendimento_id,o.id))::integer from public.service_orders o join public.vehicles v on v.id=o.vehicle_id
 where v.client_id=p_client and o.status='concluido'
 and (coalesce(o.completed_at,o.created_at) at time zone 'America/Belem')::date between (now() at time zone 'America/Belem')::date-p_days+1 and (now() at time zone 'America/Belem')::date
$$;
create or replace function private.refresh_loyalty_vip() returns void language plpgsql security definer set search_path='' as $$
begin
 update public.loyalty_accounts a set vip_tier=case when private.loyalty_visit_count(a.client_id,s.vip_window_days)>=s.diamond_visits then 'diamante' when private.loyalty_visit_count(a.client_id,s.vip_window_days)>=s.gold_visits then 'ouro' when private.loyalty_visit_count(a.client_id,s.vip_window_days)>=s.silver_visits then 'prata' else 'regular' end from public.loyalty_settings s where s.id=1;
end $$;

create or replace function private.sync_service_loyalty(p_order uuid) returns void language plpgsql security definer set search_path='' as $$
declare o record; prev private.loyalty_service_awards%rowtype; client uuid; target_points integer:=0; rate numeric; amount numeric:=0; account uuid; delta integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_order::text,62026));
 select * into prev from private.loyalty_service_awards where order_id=p_order for update;
 select so.*,v.client_id into o from public.service_orders so join public.vehicles v on v.id=so.vehicle_id where so.id=p_order;
 if found and o.status='concluido' then
  client:=o.client_id; amount:=greatest(coalesce(o.charged_amount,0),0);
  rate:=coalesce(prev.points_per_real,(select points_per_real from public.loyalty_settings where id=1));
  target_points:=floor(amount*rate)::integer;
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
create or replace function private.service_loyalty_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin perform private.sync_service_loyalty(case when tg_op='DELETE' then old.id else new.id end); return null; end $$;
create trigger service_loyalty_changed after insert or update of status,charged_amount,vehicle_id,completed_at,atendimento_id or delete on public.service_orders for each row execute function private.service_loyalty_changed();
create or replace function private.vehicle_loyalty_changed() returns trigger language plpgsql security definer set search_path='' as $$
declare item record;
begin
 if old.client_id is distinct from new.client_id then for item in select id from public.service_orders where vehicle_id=new.id loop perform private.sync_service_loyalty(item.id); end loop; end if;
 return null;
end $$;
create trigger vehicle_loyalty_changed after update of client_id on public.vehicles for each row execute function private.vehicle_loyalty_changed();
create or replace function private.loyalty_settings_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin perform private.refresh_loyalty_vip();return null;end $$;
create trigger loyalty_settings_changed after update on public.loyalty_settings for each statement execute function private.loyalty_settings_changed();

-- Credits are automatic. Only managed redemptions are exposed as an authenticated RPC.
drop policy loyalty_transactions_insert on public.loyalty_transactions;
revoke insert on public.loyalty_transactions from authenticated;
create or replace function public.redeem_loyalty_reward(p_client uuid,p_reward text,p_note text default '') returns uuid language plpgsql security invoker set search_path='' as $$
begin return private.redeem_loyalty_reward(p_client,p_reward,p_note);end $$;
create or replace function private.redeem_loyalty_reward(p_client uuid,p_reward text,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
declare cost integer; label text; account uuid; movement uuid;
begin
 if auth.uid() is null or private.app_role() not in ('administrador','gerente') then raise exception 'Acesso restrito à gestão'; end if;
 cost:=case p_reward when 'simple_no_wax' then 1000 when 'simple_wax' then 1350 when 'technical' then 1700 when 'engine_underbody' then 2050 when 'major_discount' then 2451 else null end;
 label:=case p_reward when 'simple_no_wax' then 'Lavagem Simples sem cera' when 'simple_wax' then 'Lavagem Simples com cera' when 'technical' then 'Lavagem Técnica' when 'engine_underbody' then 'Lavagem técnica do motor ou Lavagem do Baixo' when 'major_discount' then 'Desconto em serviços maiores' else null end;
 if cost is null then raise exception 'Benefício inválido';end if;
 if p_reward='major_discount' and length(trim(p_note))<5 then raise exception 'Informe o desconto acordado com o cliente';end if;
 select id into account from public.loyalty_accounts where client_id=p_client for update;
 if account is null then raise exception 'Conta não encontrada';end if;
 insert into public.loyalty_transactions(account_id,points_delta,reason,source_kind,event_key) values(account,-cost,'Resgate: '||label||case when length(trim(p_note))>0 then ' — '||left(trim(p_note),200) else '' end,'redemption',gen_random_uuid()::text) returning id into movement;
 return movement;
end $$;
revoke all on function public.redeem_loyalty_reward(uuid,text,text) from public,anon;
grant execute on function public.redeem_loyalty_reward(uuid,text,text) to authenticated;
revoke all on function private.redeem_loyalty_reward(uuid,text,text) from public,anon;
grant execute on function private.redeem_loyalty_reward(uuid,text,text) to authenticated;
-- View runs as the user, honoring RLS; VIP is always current even before the nightly refresh.
create view public.loyalty_overview with (security_invoker=true) as
 select a.id,a.client_id,a.points_balance,a.points_debt,a.created_at,a.updated_at,coalesce(v.visits,0)::integer as visits_in_window,
 case when coalesce(v.visits,0)>=s.diamond_visits then 'diamante' when coalesce(v.visits,0)>=s.gold_visits then 'ouro' when coalesce(v.visits,0)>=s.silver_visits then 'prata' else 'regular' end as vip_tier
 from public.loyalty_accounts a cross join public.loyalty_settings s left join lateral (
  select count(distinct coalesce(o.atendimento_id,o.id)) visits from public.service_orders o join public.vehicles vehicle on vehicle.id=o.vehicle_id
  where vehicle.client_id=a.client_id and o.status='concluido' and (coalesce(o.completed_at,o.created_at) at time zone 'America/Belem')::date between (now() at time zone 'America/Belem')::date-s.vip_window_days+1 and (now() at time zone 'America/Belem')::date
 ) v on true where s.id=1;
revoke all on public.loyalty_overview from public,anon;
grant select on public.loyalty_overview to authenticated;

-- Preferences are part of the client record and atomically mirrored to notification_consents.
alter table public.clients add column email_opt_in boolean not null default true;
alter table public.clients add column whatsapp_opt_in boolean not null default true;
update public.clients c set email_opt_in=n.email_opt_in,whatsapp_opt_in=n.whatsapp_opt_in from public.notification_consents n where n.client_id=c.id;
alter table public.notification_consents alter column email_opt_in set default true;
alter table public.notification_consents alter column whatsapp_opt_in set default true;
insert into public.notification_consents(client_id,email_opt_in,whatsapp_opt_in,consent_source,consent_recorded_at)
 select id,email_opt_in,whatsapp_opt_in,'Preferência padrão definida pela gestão; não comprovação individual',now() from public.clients on conflict(client_id) do nothing;
create or replace function private.client_preferences_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notification_consents(client_id,email_opt_in,whatsapp_opt_in,consent_source,consent_recorded_at,updated_at)
 values(new.id,new.email_opt_in,new.whatsapp_opt_in,'Preferências registradas no cadastro pela equipe',now(),now())
 on conflict(client_id) do update set email_opt_in=excluded.email_opt_in,whatsapp_opt_in=excluded.whatsapp_opt_in,consent_source=excluded.consent_source,consent_recorded_at=excluded.consent_recorded_at,updated_at=now()
 where (public.notification_consents.email_opt_in,public.notification_consents.whatsapp_opt_in) is distinct from (excluded.email_opt_in,excluded.whatsapp_opt_in);
 if tg_op='INSERT' then insert into public.loyalty_accounts(client_id) values(new.id) on conflict(client_id) do nothing;end if;
 return null;
end $$;
create trigger client_preferences_changed after insert or update of email_opt_in,whatsapp_opt_in on public.clients for each row execute function private.client_preferences_changed();
create or replace function private.mirror_notification_preferences() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.clients set email_opt_in=new.email_opt_in,whatsapp_opt_in=new.whatsapp_opt_in where id=new.client_id and (email_opt_in,whatsapp_opt_in) is distinct from (new.email_opt_in,new.whatsapp_opt_in);
 return null;
end $$;
create trigger mirror_notification_preferences after insert or update of email_opt_in,whatsapp_opt_in on public.notification_consents for each row execute function private.mirror_notification_preferences();

-- Automatic cash closing uses the same actual receipts as the UI, without rewriting historical closings.
create or replace function private.close_completed_cash_days() returns integer language plpgsql set search_path='' as $$
declare affected integer;
begin
 with methods as (
 select (p.paid_at at time zone 'America/Belem')::date as closing_day,coalesce(m.name,'Sem forma de pagamento') as name,sum(p.amount) as total
 from public.payments p left join public.payment_methods m on m.id=p.payment_method_id
 where (p.paid_at at time zone 'America/Belem')::date<(now() at time zone 'America/Belem')::date group by 1,2
 ) insert into public.cash_closings(closing_date,total_amount,details,closed_at)
 select closing_day,sum(total),jsonb_agg(jsonb_build_object('name',name,'total',total)),now() from methods group by closing_day on conflict(closing_date) do nothing;
 get diagnostics affected=row_count; return affected;
end $$;

revoke all on function private.loyalty_visit_count(uuid,integer),private.refresh_loyalty_vip(),private.sync_service_loyalty(uuid),private.service_loyalty_changed(),private.vehicle_loyalty_changed(),private.loyalty_settings_changed(),private.client_preferences_changed(),private.mirror_notification_preferences() from public,anon,authenticated;
-- Keep deletion of an unused client possible; source service/vehicle constraints still protect operational history.
alter table public.loyalty_accounts drop constraint loyalty_accounts_client_id_fkey;
alter table public.loyalty_accounts add constraint loyalty_accounts_client_id_fkey foreign key(client_id) references public.clients(id) on delete cascade;
alter table public.loyalty_transactions drop constraint loyalty_transactions_account_id_fkey;
alter table public.loyalty_transactions add constraint loyalty_transactions_account_id_fkey foreign key(account_id) references public.loyalty_accounts(id) on delete cascade;
select cron.schedule('graucar-loyalty-vip-refresh','10 3 * * *','select private.refresh_loyalty_vip()');
-- Backfill each existing completed service once, preserving previous manual credits/resgates.
insert into public.loyalty_accounts(client_id) select id from public.clients on conflict(client_id) do nothing;
do $$declare item record;begin for item in select id from public.service_orders where status='concluido' order by created_at,id loop perform private.sync_service_loyalty(item.id);end loop;end$$;
select private.refresh_loyalty_vip();
