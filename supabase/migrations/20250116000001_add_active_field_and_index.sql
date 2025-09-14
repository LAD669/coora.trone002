-- Add active field to users table and create necessary indexes
-- This migration fixes RBAC issues by adding proper filtering capabilities

-- Add active field to users table (for team membership status)
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Create index for efficient team member queries
CREATE INDEX IF NOT EXISTS idx_users_team_id_role ON users(team_id, role);

-- Create index for active team members
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE active = true;

-- Drop existing view if it exists
DROP VIEW IF EXISTS team_users_view;

-- Create team_users_view for efficient team member queries
CREATE VIEW team_users_view AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.position,
  u.jersey_number,
  u.phone_number,
  u.date_of_birth,
  u.height_cm,
  u.weight_kg,
  u.created_at,
  u.updated_at,
  u.id as team_member_id,
  u.role as team_role,
  u.created_at as joined_at,
  u.team_id,
  u.active
FROM users u
WHERE u.active = true AND u.team_id IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON team_users_view TO authenticated;
