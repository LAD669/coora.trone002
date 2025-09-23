-- Fix getClubStats RPC function - Run this in Supabase SQL Editor
-- This script recreates the missing get_club_stats function

-- Drop the function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.get_club_stats(uuid);

-- Create/Replace the get_club_stats RPC function
-- Function counts only active entries (no deleted_at columns exist)
CREATE OR REPLACE FUNCTION public.get_club_stats(p_club_id uuid)
RETURNS TABLE (
  member_count bigint,
  team_count bigint,
  upcoming_events bigint
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  WITH members AS (
    SELECT count(*)::bigint AS c
    FROM public.users u
    WHERE u.club_id = p_club_id
      AND coalesce(u.active, true) = true
  ),
  teams AS (
    SELECT count(*)::bigint AS c
    FROM public.teams t
    WHERE t.club_id = p_club_id
  ),
  events AS (
    SELECT count(*)::bigint AS c
    FROM public.events e
    WHERE e.club_id = p_club_id
      AND e.event_date >= now()
      AND e.event_date < now() + interval '30 days'
  )
  SELECT m.c, t.c, e.c FROM members m, teams t, events e;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_club_stats(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_club_stats(uuid) IS 'Returns club statistics: member count, team count, and upcoming events (next 30 days)';

-- Test the function (replace with an actual club_id from your database)
-- SELECT * FROM public.get_club_stats('your-club-id-here');

-- Verify the function exists
SELECT 
  routine_name, 
  routine_type, 
  security_type
FROM information_schema.routines 
WHERE routine_name = 'get_club_stats' 
  AND routine_schema = 'public';
