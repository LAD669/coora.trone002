-- Fix RLS policies for dashboard counts RPC function
-- The issue is that RLS policies are too restrictive and prevent the RPC function from accessing data

-- Drop existing restrictive policies that might be causing issues
DROP POLICY IF EXISTS "Allow dashboard counts access to teams" ON teams;
DROP POLICY IF EXISTS "Allow dashboard counts access to events" ON events;

-- Create more permissive policies for dashboard counts
-- These policies allow authenticated users to read data when they have a valid club_id
CREATE POLICY "Allow dashboard counts access to teams" ON teams
  FOR SELECT TO authenticated
  USING (
    -- Allow if user has a club_id in their profile
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.club_id IS NOT NULL
    )
  );

CREATE POLICY "Allow dashboard counts access to events" ON events
  FOR SELECT TO authenticated
  USING (
    -- Allow if user has a club_id in their profile
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.club_id IS NOT NULL
    )
  );

-- Alternative approach: Create a SECURITY DEFINER function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_dashboard_counts_bypass_rls(p_club_id uuid)
RETURNS TABLE (total_teams bigint, active_events bigint, upcoming_matches bigint)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH t AS (
    SELECT COUNT(*)::bigint c
    FROM teams
    WHERE club_id = p_club_id
  ),
  e AS (
    SELECT COUNT(*)::bigint c
    FROM events
    WHERE club_id = p_club_id
      AND COALESCE(end_time, start_time, event_date) >= NOW()
  ),
  m AS (
    SELECT COUNT(*)::bigint c
    FROM events
    WHERE club_id = p_club_id
      AND event_type = 'match'
      AND event_date >= NOW()
      AND event_date < NOW() + INTERVAL '7 days'
  )
  SELECT t.c, e.c, m.c FROM t, e, m;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_counts_bypass_rls(uuid) TO authenticated;

-- Update the original function to use the bypass version
CREATE OR REPLACE FUNCTION public.get_dashboard_counts(p_club_id uuid)
RETURNS TABLE (total_teams bigint, active_events bigint, upcoming_matches bigint)
LANGUAGE sql STABLE AS $$
  SELECT * FROM public.get_dashboard_counts_bypass_rls(p_club_id);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_counts(uuid) TO authenticated;
