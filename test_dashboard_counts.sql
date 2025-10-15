-- Test queries for dashboard counts RPC function
-- Run these in Supabase SQL editor to verify the function works

-- 1. Test the RPC function directly (replace with actual club_id)
SELECT * FROM get_dashboard_counts('your-club-id-here');

-- 2. Test the bypass version
SELECT * FROM get_dashboard_counts_bypass_rls('your-club-id-here');

-- 3. Check if teams exist for the club
SELECT COUNT(*) as team_count FROM teams WHERE club_id = 'your-club-id-here';

-- 4. Check if events exist for the club
SELECT COUNT(*) as event_count FROM events WHERE club_id = 'your-club-id-here';

-- 5. Check if match events exist for the club
SELECT COUNT(*) as match_count FROM events 
WHERE club_id = 'your-club-id-here' 
AND event_type = 'match' 
AND event_date >= NOW() 
AND event_date < NOW() + INTERVAL '7 days';

-- 6. Check active events for the club
SELECT COUNT(*) as active_event_count FROM events 
WHERE club_id = 'your-club-id-here'
AND COALESCE(end_time, start_time, event_date) >= NOW();

-- 7. Get a sample of teams to verify data exists
SELECT id, name, club_id FROM teams WHERE club_id = 'your-club-id-here' LIMIT 5;

-- 8. Get a sample of events to verify data exists
SELECT id, title, event_type, club_id, event_date FROM events WHERE club_id = 'your-club-id-here' LIMIT 5;
