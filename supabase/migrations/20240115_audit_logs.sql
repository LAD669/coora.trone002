-- Audit Logging System for Events, Posts, and Notifications
-- This migration creates a comprehensive audit system with RLS and manager access

-- 1.1 Audit-Tabelle
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid not null,
  club_id uuid not null,
  table_name text not null check (table_name in ('events','posts','notifications')),
  op text not null check (op in ('insert','update','delete')),
  row_id uuid not null,
  old_row jsonb,
  new_row jsonb
);

-- 1.2 Indizes
create index if not exists idx_audit_club_time on public.audit_logs (club_id, occurred_at desc);
create index if not exists idx_audit_table_op  on public.audit_logs (table_name, op);
create index if not exists idx_audit_actor     on public.audit_logs (actor_id);

-- 1.3 RLS + Policy (Manager darf club-weit lesen)
alter table public.audit_logs enable row level security;

drop policy if exists mgr_read_audit on public.audit_logs;
create policy mgr_read_audit on public.audit_logs
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role = 'manager'
      and u.club_id = public.audit_logs.club_id
  )
);

-- 1.4 RPC: Logs lesen (Zeitfenster + Paging)
create or replace function public.get_club_audit_logs(
  p_club_id uuid,
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now(),
  p_limit int default 100,
  p_offset int default 0
)
returns table (
  id uuid,
  occurred_at timestamptz,
  actor_id uuid,
  table_name text,
  op text,
  row_id uuid,
  old_row jsonb,
  new_row jsonb
)
language sql
security invoker
as $sql$
  select id, occurred_at, actor_id, table_name, op, row_id, old_row, new_row
  from public.audit_logs
  where club_id = $1
    and occurred_at >= $2
    and occurred_at <  $3
  order by occurred_at desc
  limit greatest($4,0) offset greatest($5,0);
$sql$;

grant execute on function public.get_club_audit_logs(uuid,timestamptz,timestamptz,int,int) to authenticated;

-- 1.5 Helper: Actor (auth.uid) in Trigger
create or replace function public.current_actor() returns uuid
language sql stable as $f$ select auth.uid() $f$;

-- 1.6 Trigger-Funktion (generic)
create or replace function public.audit_log_row()
returns trigger
language plpgsql
as $fn$
declare
  v_actor uuid := public.current_actor();
  v_club  uuid;
begin
  -- club_id aus betroffener Zeile bestimmen
  if TG_TABLE_NAME = 'events' then
    v_club := coalesce(NEW.club_id, OLD.club_id);
  elsif TG_TABLE_NAME = 'posts' then
    v_club := coalesce(NEW.club_id, OLD.club_id);
  elsif TG_TABLE_NAME = 'notifications' then
    -- notifications hat kein club_id: via team -> club
    select t.club_id into v_club
    from public.teams t
    where t.id = coalesce(NEW.team_id, OLD.team_id);
  else
    return null;
  end if;

  if TG_OP = 'INSERT' then
    insert into public.audit_logs(actor_id, club_id, table_name, op, row_id, new_row)
    values (v_actor, v_club, TG_TABLE_NAME, 'insert', NEW.id, to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_logs(actor_id, club_id, table_name, op, row_id, old_row, new_row)
    values (v_actor, v_club, TG_TABLE_NAME, 'update', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_logs(actor_id, club_id, table_name, op, row_id, old_row)
    values (v_actor, v_club, TG_TABLE_NAME, 'delete', OLD.id, to_jsonb(OLD));
    return OLD;
  end if;

  return null;
end
$fn$;

-- 1.7 Trigger auf Tabellen
drop trigger if exists trg_audit_events on public.events;
create trigger trg_audit_events
after insert or update or delete on public.events
for each row execute function public.audit_log_row();

drop trigger if exists trg_audit_posts on public.posts;
create trigger trg_audit_posts
after insert or update or delete on public.posts
for each row execute function public.audit_log_row();

drop trigger if exists trg_audit_notifications on public.notifications;
create trigger trg_audit_notifications
after insert or update or delete on public.notifications
for each row execute function public.audit_log_row();
