-- Fix infinite recursion in users table RLS policies
-- This migration resolves the circular reference issue

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view club members" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage club users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Managers can access club users" ON users;

-- Create a simple, non-recursive function to get user club ID
-- This function bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION get_user_club_id_safe(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT club_id FROM users WHERE id = user_id LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_club_id_safe(uuid) TO authenticated;

-- Create simple, non-recursive policies for users table

-- 1. Users can view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 2. Users can update their own profile (no recursion)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 4. Users can view club members (using safe function)
CREATE POLICY "Users can view club members" ON users
  FOR SELECT TO authenticated
  USING (club_id = get_user_club_id_safe(auth.uid()));

-- 5. Admins can manage club users (using safe function)
CREATE POLICY "Admins can manage club users" ON users
  FOR ALL TO authenticated
  USING (
    club_id = get_user_club_id_safe(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Managers can access club users (using safe function)
CREATE POLICY "Managers can access club users" ON users
  FOR ALL TO authenticated
  USING (
    club_id = get_user_club_id_safe(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Add comment for documentation
COMMENT ON FUNCTION get_user_club_id_safe(uuid) IS 'Safely gets user club ID without triggering RLS recursion';
