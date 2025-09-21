-- Fix getClubStats RPC function and RLS policies for Manager Dashboard
-- This migration creates a robust get_club_stats function and proper RLS policies

-- 1. Create/Replace the get_club_stats RPC function
-- Function counts only active entries (deleted_at is null)
create or replace function public.get_club_stats(p_club_id uuid)
returns table (
  member_count bigint,
  team_count bigint,
  upcoming_events bigint
)
language sql
security invoker
as $$
  with members as (
    select count(*)::bigint as c
    from public.users u
    where u.club_id = p_club_id
      and coalesce(u.active, true) = true
      and u.deleted_at is null
  ),
  teams as (
    select count(*)::bigint as c
    from public.teams t
    where t.club_id = p_club_id
      and coalesce(t.deleted_at, null) is null
  ),
  events as (
    select count(*)::bigint as c
    from public.events e
    where e.club_id = p_club_id
      and e.deleted_at is null
      and e.event_date >= now()
      and e.event_date < now() + interval '30 days'
  )
  select m.c, t.c, e.c from members m, teams t, events e;
$$;

-- Grant execution permission to authenticated users
grant execute on function public.get_club_stats(uuid) to authenticated;

-- 2. RLS Policies for Manager access

-- USERS: Managers can read users within their club
drop policy if exists mgr_read_users on public.users;
create policy mgr_read_users on public.users
for select using (
  exists (select 1 from public.users me
          where me.id = auth.uid()
            and me.role = 'manager'
            and me.club_id = public.users.club_id)
);

-- TEAMS: Managers can read teams within their club
drop policy if exists mgr_read_teams on public.teams;
create policy mgr_read_teams on public.teams
for select using (
  coalesce(public.teams.deleted_at, null) is null
  and exists (select 1 from public.users me
              where me.id = auth.uid()
                and me.role = 'manager'
                and me.club_id = public.teams.club_id)
);

-- EVENTS: Managers can read events within their club
drop policy if exists mgr_read_events on public.events;
create policy mgr_read_events on public.events
for select using (
  public.events.deleted_at is null
  and exists (select 1 from public.users me
              where me.id = auth.uid()
                and me.role = 'manager'
                and me.club_id = public.events.club_id)
);

-- 3. Ensure RLS is enabled on all tables
alter table public.users enable row level security;
alter table public.teams enable row level security;
alter table public.events enable row level security;

-- 4. Add indexes for better performance (if they don't exist)
create index if not exists idx_users_club_id_active on public.users(club_id, active) where deleted_at is null;
create index if not exists idx_teams_club_id on public.teams(club_id) where deleted_at is null;
create index if not exists idx_events_club_id_date on public.events(club_id, event_date) where deleted_at is null;

-- 5. Add comments for documentation
comment on function public.get_club_stats(uuid) is 'Returns club statistics: member count, team count, and upcoming events (next 30 days)';
