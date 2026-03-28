-- Create saved locations table for reusable geofenced locations
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  lat numeric,
  lng numeric,
  geofence_type text not null default 'circle',
  geofence_radius_m numeric default 800,
  geofence_polygon jsonb,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.locations enable row level security;

-- Admin users can do everything
create policy "Admin full access on locations"
  on public.locations
  for all
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  );

-- Add polygon geofence columns to loads table
alter table public.loads add column if not exists pickup_location_id uuid references public.locations(id) on delete set null;
alter table public.loads add column if not exists delivery_location_id uuid references public.locations(id) on delete set null;
alter table public.loads add column if not exists pickup_geofence_type text default 'circle';
alter table public.loads add column if not exists pickup_geofence_polygon jsonb;
alter table public.loads add column if not exists delivery_geofence_type text default 'circle';
alter table public.loads add column if not exists delivery_geofence_polygon jsonb;
