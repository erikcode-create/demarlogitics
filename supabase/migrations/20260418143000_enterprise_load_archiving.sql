alter table public.loads
add column if not exists archived_at timestamptz,
add column if not exists archived_by_user_id uuid,
add column if not exists archive_reason text;

update public.loads
set archived_at = coalesce(archived_at, deleted_at),
    archive_reason = coalesce(archive_reason, 'Migrated from legacy soft delete')
where deleted_at is not null
  and archived_at is null;

update public.loads
set deleted_at = null
where archived_at is not null
  and deleted_at is not null;

create index if not exists idx_loads_archived_at on public.loads (archived_at);

drop view if exists public.active_loads;
create view public.active_loads with (security_invoker = true) as
select *
from public.loads
where archived_at is null;

alter table public.load_events
drop constraint if exists load_events_event_type_check;

alter table public.load_events
add constraint load_events_event_type_check
check (event_type in ('status_change', 'document_uploaded', 'note', 'archived', 'restored'));
