-- Tabla para histórico USDT/VES (Binance P2P vía CriptoYa)
create table if not exists public.usdt_prices (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null,
  bid numeric not null,
  ask numeric not null,
  avg numeric not null,
  source text not null default 'binancep2p',
  currency text not null default 'VES',
  created_at timestamptz not null default now()
);

create index if not exists usdt_prices_ts_idx on public.usdt_prices (ts desc);

-- Evita duplicados por timestamp exacto (si tu cron corre a intervalos fijos)
create unique index if not exists usdt_prices_ts_unique on public.usdt_prices (ts);

-- RLS
alter table public.usdt_prices enable row level security;

-- Lectura pública (puedes cambiar a solo usuarios autenticados si quieres)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'usdt_prices' and policyname = 'Allow read'
  ) then
    create policy "Allow read" on public.usdt_prices
      for select
      using (true);
  end if;
end $$;

-- Inserciones SOLO desde service role (edge function / backend). No creamos policy de insert.
