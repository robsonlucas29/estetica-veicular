-- Somente banco de desenvolvimento; nao aplicar na producao.
-- Migracao correspondente a finance_expenses_categories_dev.
create table if not exists public.finance_categories (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 kind text not null check(kind in ('receita','despesa')),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.finance_expenses (
 id uuid primary key default gen_random_uuid(),
 category_id uuid references public.finance_categories(id) on delete restrict,
 description text not null,
 amount numeric(12,2) not null check(amount>0),
 incurred_on date not null default current_date,
 due_on date,
 paid_on date,
 status text not null default 'pendente' check(status in ('pendente','pago','cancelado')),
 payment_method_id uuid references public.payment_methods(id) on delete set null,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint finance_expenses_paid_status_check check(status <> 'pago' or paid_on is not null)
);
create index if not exists finance_expenses_incurred_idx on public.finance_expenses(incurred_on desc);
create index if not exists finance_expenses_status_due_idx on public.finance_expenses(status,due_on);
alter table public.finance_categories enable row level security;
alter table public.finance_expenses enable row level security;
grant select,insert,update,delete on public.finance_categories,public.finance_expenses to authenticated;
create policy finance_categories_read on public.finance_categories for select to authenticated using ((select private.app_role()) in ('administrador','gerente'));
create policy finance_categories_manage on public.finance_categories for all to authenticated using ((select private.app_role()) in ('administrador','gerente')) with check ((select private.app_role()) in ('administrador','gerente'));
create policy finance_expenses_read on public.finance_expenses for select to authenticated using ((select private.app_role()) in ('administrador','gerente'));
create policy finance_expenses_insert on public.finance_expenses for insert to authenticated with check ((select private.app_role()) in ('administrador','gerente') and created_by=(select auth.uid()));
create policy finance_expenses_update on public.finance_expenses for update to authenticated using ((select private.app_role()) in ('administrador','gerente')) with check ((select private.app_role()) in ('administrador','gerente'));
create policy finance_expenses_delete on public.finance_expenses for delete to authenticated using ((select private.app_role()) = 'administrador');
