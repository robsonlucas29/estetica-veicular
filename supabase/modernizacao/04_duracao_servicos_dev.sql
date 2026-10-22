-- Somente projeto Supabase de desenvolvimento hgmmabtixqaztuswmivv.
alter table public.service_types add column if not exists duration_minutes integer not null default 60;
alter table public.service_types add constraint service_types_duration_minutes_valid check(duration_minutes between 5 and 720);
comment on column public.service_types.duration_minutes is 'Duracao estimada para avisos de conflito na agenda; 60 min ate configuracao.';
