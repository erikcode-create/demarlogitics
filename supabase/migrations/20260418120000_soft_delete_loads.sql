alter table public.loads
add column if not exists deleted_at timestamptz;

create index if not exists idx_loads_deleted_at on public.loads (deleted_at);
