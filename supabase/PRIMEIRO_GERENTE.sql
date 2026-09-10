-- PASSO ÚNICO PARA LIBERAR O PRIMEIRO GERENTE
-- 1) No Supabase, crie primeiro o usuário em Authentication > Users.
-- 2) Troque abaixo SEU_EMAIL@EXEMPLO.COM pelo e-mail desse usuário.
-- 3) Execute este arquivo no SQL Editor.

insert into public.profiles (id, full_name, email, role)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  email,
  'gerente'::public.user_role
from auth.users
where lower(email) = lower('SEU_EMAIL@EXEMPLO.COM')
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    role = 'gerente'::public.user_role;

-- Confirmação: deve retornar o seu usuário com role = gerente.
select id, full_name, email, role
from public.profiles
where lower(email) = lower('SEU_EMAIL@EXEMPLO.COM');
