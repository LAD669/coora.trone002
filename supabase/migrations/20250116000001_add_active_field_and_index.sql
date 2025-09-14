-- Add active field to team_members table and create necessary indexes
-- This migration fixes RBAC issues by adding proper filtering capabilities

-- Add active field to team_members table
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Create index for efficient team member queries
CREATE INDEX IF NOT EXISTS idx_team_members_team_id_role ON team_members(team_id, team_role);

-- Create index for active team members
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active) WHERE active = true;

-- Create team_users_view for efficient team member queries
CREATE OR REPLACE VIEW team_users_view AS
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
  tm.id as team_member_id,
  tm.team_role,
  tm.joined_at,
  tm.team_id,
  tm.active
FROM users u
JOIN team_members tm ON tm.user_id = u.id
WHERE tm.active = true;

-- Grant access to the view
GRANT SELECT ON team_users_view TO authenticated;
