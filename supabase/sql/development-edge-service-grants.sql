-- Applied only to DEV hgmmabtixqaztuswmivv, migration dev_edge_function_service_role_grants.
-- Server functions need explicit table grants in addition to service_role BYPASSRLS.
grant select, insert, update on public.profiles to service_role;
grant select, insert, update on public.notification_outbox to service_role;
grant select on public.notification_consents to service_role;
notify pgrst, 'reload schema';
