-- Applied to DEV and production on 2026-10-27; preserve booking dates in service history.
alter table public.service_orders add column appointment_scheduled_at timestamptz;
create or replace function private.guard_service_completion_date()
returns trigger language plpgsql security invoker set search_path='' as $$
declare scheduled timestamptz;completion_day date;validate_date boolean;
begin
 if TG_OP='UPDATE' then
  new.appointment_scheduled_at:=old.appointment_scheduled_at;
  validate_date:=new.completed_at is distinct from old.completed_at or new.status is distinct from old.status;
 else new.appointment_scheduled_at:=null;validate_date:=true;end if;
 select max(a.scheduled_at) into scheduled from public.appointments a where coalesce(a.appointment_group_id,a.id)=new.atendimento_id;
 new.appointment_scheduled_at:=coalesce(new.appointment_scheduled_at,scheduled);
 if new.status='concluido' and validate_date then
  if new.completed_at is null or not isfinite(new.completed_at) then raise exception 'Informe uma data de conclusão válida.' using errcode='23514';end if;
  completion_day:=(new.completed_at at time zone 'America/Belem')::date;
  if completion_day>(current_timestamp at time zone 'America/Belem')::date then raise exception 'A data de conclusão não pode ser posterior ao dia de hoje.' using errcode='23514';end if;
  if new.appointment_scheduled_at is not null and completion_day<(new.appointment_scheduled_at at time zone 'America/Belem')::date then raise exception 'A data de conclusão não pode ser anterior à data do agendamento.' using errcode='23514';end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_service_completion_date() from public,anon,authenticated;
create trigger guard_service_completion_date before insert or update on public.service_orders for each row execute function private.guard_service_completion_date();
comment on column public.service_orders.appointment_scheduled_at is 'Original scheduled date captured by the server before completion removes the appointment; immutable in history.';
