-- Ensure managers are club-level only (not team-level)
-- This migration ensures that managers don't have team_id set

-- Update any existing managers to remove team_id
UPDATE users 
SET team_id = NULL 
WHERE role = 'manager' AND team_id IS NOT NULL;

-- Add a constraint to prevent managers from having team_id
-- This ensures managers are always club-level only
ALTER TABLE users ADD CONSTRAINT users_manager_no_team 
CHECK (role != 'manager' OR team_id IS NULL);

-- Add comment for documentation
COMMENT ON CONSTRAINT users_manager_no_team ON users IS 'Managers cannot be assigned to specific teams - they are club-level only';
