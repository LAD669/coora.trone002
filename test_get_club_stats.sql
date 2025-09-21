-- Test script for get_club_stats function
-- Run this in Supabase SQL editor to verify the function works

-- Test the RPC function with a sample club ID
-- Replace '56ed0bf9-f629-47c6-92ff-fdda2108763c' with an actual club ID from your database
SELECT * FROM public.get_club_stats('56ed0bf9-f629-47c6-92ff-fdda2108763c');

-- Check if the function exists and has proper permissions
SELECT 
  routine_name, 
  routine_type, 
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_club_stats' 
  AND routine_schema = 'public';

-- Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'teams', 'events')
  AND policyname LIKE 'mgr_%';

-- Check if RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'teams', 'events');
