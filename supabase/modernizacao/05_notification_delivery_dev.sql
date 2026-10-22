-- Somente projeto de desenvolvimento hgmmabtixqaztuswmivv.
-- Estado 'processing' reservado atomicamente pelo backend para impedir duplo envio.
alter table public.notification_outbox drop constraint if exists notification_outbox_status_check;
alter table public.notification_outbox add constraint notification_outbox_status_check
 check(status in ('pending','processing','sent','failed','canceled'));
create index if not exists notification_outbox_pending_created_idx
 on public.notification_outbox(created_at) where status='pending';
