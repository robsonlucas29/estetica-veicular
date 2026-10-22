-- Executar somente no projeto Supabase de desenvolvimento hgmmabtixqaztuswmivv.
-- Impede leitura por usuarios autenticados sem perfil; protege pagamentos e caixa.
alter policy appointment_files_read on public.appointment_files using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy appointments_read on public.appointments using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy clients_read on public.clients using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy employees_read on public.employees using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy payment_methods_read on public.payment_methods using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy service_images_read on public.service_images using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy service_orders_read on public.service_orders using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy service_types_read on public.service_types using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy vehicle_categories_read on public.vehicle_categories using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy vehicles_read on public.vehicles using ((select private.app_role()) in ('administrador','gerente','administrativo','visualizador'));
alter policy cash_closings_read on public.cash_closings using ((select private.app_role()) in ('administrador','gerente'));
alter policy payments_read on public.payments using ((select private.app_role()) in ('administrador','gerente'));
