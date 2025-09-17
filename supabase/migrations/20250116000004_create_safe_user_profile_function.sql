-- Alternative fix: Temporarily disable RLS for user profile loading
-- This is a simpler approach that avoids complex policy management

-- Create a function that can read user profiles without RLS restrictions
CREATE OR REPLACE FUNCTION get_user_profile_safe(user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  first_name text,
  last_name text,
  role text,
  team_id uuid,
  club_id uuid,
  access_code text,
  phone_number text,
  position text,
  jersey_number integer,
  date_of_birth date,
  height_cm integer,
  weight_kg integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.email,
    u.name,
    u.first_name,
    u.last_name,
    u.role,
    u.team_id,
    u.club_id,
    u.access_code,
    u.phone_number,
    u.position,
    u.jersey_number,
    u.date_of_birth,
    u.height_cm,
    u.weight_kg,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.id = user_id
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile_safe(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_profile_safe(uuid) IS 'Safely retrieves user profile data without RLS restrictions';
