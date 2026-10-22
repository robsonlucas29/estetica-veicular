-- Apenas para Supabase de DESENVOLVIMENTO. Nao executar na producao.
-- Fase 1: novas tabelas independentes, sem alterar tabelas legadas.
create table if not exists public.loyalty_accounts (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null unique references public.clients(id) on delete restrict,
 points_balance integer not null default 0 check(points_balance >= 0),
 vip_tier text not null default 'regular' check(vip_tier in ('regular','prata','ouro','diamante')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.loyalty_transactions (
 id uuid primary key default gen_random_uuid(),
 account_id uuid not null references public.loyalty_accounts(id) on delete restrict,
 points_delta integer not null check(points_delta <> 0),
 reason text not null,
 created_at timestamptz not null default now()
);
create index if not exists loyalty_transactions_account_date_idx
 on public.loyalty_transactions(account_id,created_at desc);

create table if not exists public.inventory_items (
 id uuid primary key default gen_random_uuid(),
 sku text unique,
 name text not null,
 unit text not null default 'unidade',
 min_quantity numeric(14,3) not null default 0 check(min_quantity >= 0),
 current_quantity numeric(14,3) not null default 0 check(current_quantity >= 0),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.inventory_movements (
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.inventory_items(id) on delete restrict,
 quantity_delta numeric(14,3) not null check(quantity_delta <> 0),
 reason text not null,
 service_order_id uuid references public.service_orders(id) on delete set null,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now()
);
create index if not exists inventory_movements_item_date_idx
 on public.inventory_movements(item_id,created_at desc);

-- Sem permissoes de API ate definirmos politicas por perfil.
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
revoke all on public.loyalty_accounts,public.loyalty_transactions,
 public.inventory_items,public.inventory_movements from anon,authenticated;
-- Nao ha politicas permissivas por padrao.
