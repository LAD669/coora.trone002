-- Fix getClubStats RPC function that was missing after schema recreation
-- This migration recreates the get_club_stats function that was lost

-- Create/Replace the get_club_stats RPC function
-- Function counts only active entries (no deleted_at columns exist in current schema)
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
  ),
  teams as (
    select count(*)::bigint as c
    from public.teams t
    where t.club_id = p_club_id
  ),
  events as (
    select count(*)::bigint as c
    from public.events e
    where e.club_id = p_club_id
      and e.event_date >= now()
      and e.event_date < now() + interval '30 days'
  )
  select m.c, t.c, e.c from members m, teams t, events e;
$$;

-- Grant execution permission to authenticated users
grant execute on function public.get_club_stats(uuid) to authenticated;

-- Add comment for documentation
comment on function public.get_club_stats(uuid) is 'Returns club statistics: member count, team count, and upcoming events (next 30 days)';
