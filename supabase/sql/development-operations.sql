-- Run only on hgmmabtixqaztuswmivv. No production deployment.
create extension if not exists pg_cron with schema pg_catalog;

create or replace function private.check_appointment_conflict_dev()
returns trigger language plpgsql set search_path='' as $$
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
end $$;
drop trigger if exists appointment_conflict_dev on public.appointments;
create trigger appointment_conflict_dev before insert or update of scheduled_at,vehicle_id,employee_id,employee_ids,service_id,status on public.appointments
for each row execute function private.check_appointment_conflict_dev();

create or replace function public.reschedule_appointment_dev(p_group uuid,p_when timestamptz)
returns setof public.appointments language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or coalesce(private.app_role()::text,'') not in ('administrador','gerente','administrativo') then raise exception 'Acesso negado' using errcode='42501'; end if;
 if p_when is null then raise exception 'Data obrigatória'; end if;
 return query update public.appointments set scheduled_at=p_when
 where coalesce(appointment_group_id,id)=p_group and status not in ('cancelado','concluido','concluído') returning *;
 if not found then raise exception 'Agendamento não encontrado'; end if;
end $$;
revoke all on function public.reschedule_appointment_dev(uuid,timestamptz) from public,anon;
grant execute on function public.reschedule_appointment_dev(uuid,timestamptz) to authenticated;

-- The daily server task closes completed days, catches missed days and preserves manual closings.
create or replace function private.close_completed_cash_days_dev()
returns integer language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
 with groups as (
  select coalesce(o.atendimento_id,o.id) as group_id,sum(coalesce(o.charged_amount,0)) as amount,
   coalesce((array_agg(p.paid_at order by p.paid_at) filter(where p.id is not null))[1],min(o.completed_at),min(o.created_at)) as paid_at,
   (array_agg(p.payment_method_id order by p.paid_at) filter(where p.id is not null))[1] as method
  from public.service_orders o left join public.payments p on p.service_order_id=o.id where o.status='concluido'
  group by coalesce(o.atendimento_id,o.id)
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
end $$;
revoke all on function private.close_completed_cash_days_dev() from public,anon,authenticated;
select cron.schedule('graucar-dev-cash-closing','5 3 * * *','select private.close_completed_cash_days_dev()');
