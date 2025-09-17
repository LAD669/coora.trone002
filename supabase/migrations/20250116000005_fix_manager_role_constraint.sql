-- Fix manager role in database
-- This migration properly adds manager role to the users table constraint

-- First, let's check the current constraint and update it
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint that includes manager role
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['admin'::text, 'trainer'::text, 'player'::text, 'parent'::text, 'manager'::text]));

-- Add comment for documentation
COMMENT ON CONSTRAINT users_role_check ON users IS 'User roles: admin, trainer, player, parent, manager - manager has club-wide access';
