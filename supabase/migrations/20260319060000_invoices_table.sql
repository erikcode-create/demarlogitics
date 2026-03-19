-- Create invoices table for shipper invoice tracking
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  shipper_id uuid not null references public.shippers(id),
  load_ids uuid[] not null default '{}',
  amount numeric not null default 0,
  due_date date not null,
  status text not null default 'draft',
  notes text not null default '',
  pdf_path text not null default '',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Enable RLS
alter table public.invoices enable row level security;

-- Admin users can do everything
create policy "Admin full access on invoices"
  on public.invoices
  for all
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  );

-- Shipper portal users can view their own invoices
create policy "Shipper portal users can view own invoices"
  on public.invoices
  for select
  using (
    shipper_id in (
      select spu.shipper_id from public.shipper_portal_users spu
      where spu.user_id = auth.uid()
    )
  );
