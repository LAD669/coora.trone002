-- Create function to get dashboard counts for manager screens
CREATE OR REPLACE FUNCTION public.get_dashboard_counts(p_club_id uuid)
RETURNS TABLE (total_teams bigint, active_events bigint, upcoming_matches bigint)
LANGUAGE sql STABLE AS $$
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
GRANT EXECUTE ON FUNCTION public.get_dashboard_counts(uuid) TO authenticated;
