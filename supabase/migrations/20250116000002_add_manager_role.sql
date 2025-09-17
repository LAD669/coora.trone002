-- Add manager role to the system
-- This migration adds the 'manager' role to the existing role enum

-- First, let's check if we need to alter the enum type
-- Add 'manager' to the role enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if 'manager' role already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'manager' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'user_role'
        )
    ) THEN
        -- Add 'manager' to the user_role enum
        ALTER TYPE user_role ADD VALUE 'manager';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an error, log it but don't fail the migration
        RAISE NOTICE 'Could not add manager role to enum: %', SQLERRM;
END $$;

-- Update any existing users that might need the manager role
-- (This is optional and can be customized based on your needs)

-- Add comments for documentation
COMMENT ON TYPE user_role IS 'User roles: admin, trainer, player, parent, manager - manager has club-wide access to all teams and organizational functions';

-- Create a view for manager-specific data access
CREATE OR REPLACE VIEW manager_club_overview AS
SELECT 
    c.id as club_id,
    c.name as club_name,
    c.description as club_description,
    c.logo_url as club_logo,
    COUNT(DISTINCT t.id) as total_teams,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.role = 'player' THEN u.id END) as total_players,
    COUNT(DISTINCT CASE WHEN u.role = 'trainer' THEN u.id END) as total_trainers,
    COUNT(DISTINCT CASE WHEN u.role = 'manager' THEN u.id END) as total_managers,
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT CASE WHEN e.event_type = 'match' THEN e.id END) as total_matches,
    COUNT(DISTINCT CASE WHEN e.event_type = 'training' THEN e.id END) as total_trainings
FROM clubs c
LEFT JOIN teams t ON t.club_id = c.id
LEFT JOIN users u ON u.club_id = c.id
LEFT JOIN events e ON e.team_id = t.id
GROUP BY c.id, c.name, c.description, c.logo_url;

-- Grant access to the view for authenticated users
GRANT SELECT ON manager_club_overview TO authenticated;

-- Create a function to check if a user is a manager
CREATE OR REPLACE FUNCTION is_manager(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND role = 'manager'
        AND active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_manager(UUID) TO authenticated;

-- Add RLS policy for manager access to club data
-- Managers can access all data within their club
CREATE POLICY "Managers can access club data" ON clubs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'manager' 
            AND users.club_id = clubs.id
            AND users.active = true
        )
    );

-- Managers can access all teams in their club
CREATE POLICY "Managers can access club teams" ON teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'manager' 
            AND users.club_id = teams.club_id
            AND users.active = true
        )
    );

-- Managers can access all users in their club
CREATE POLICY "Managers can access club users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.role = 'manager' 
            AND u.club_id = users.club_id
            AND u.active = true
        )
    );

-- Managers can access all events for teams in their club
CREATE POLICY "Managers can access club events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN teams t ON t.id = events.team_id
            WHERE u.id = auth.uid() 
            AND u.role = 'manager' 
            AND u.club_id = t.club_id
            AND u.active = true
        )
    );

-- Add index for better performance on manager queries
CREATE INDEX IF NOT EXISTS idx_users_manager_club ON users(club_id, role) WHERE role = 'manager' AND active = true;
