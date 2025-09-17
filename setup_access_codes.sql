-- Setup script for access_codes table in your remote Supabase database
-- Run this in your Supabase SQL editor

-- Create access_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for access_codes
CREATE POLICY "Anyone can view active access codes" ON access_codes
  FOR SELECT TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active, expires_at);

-- Insert some default access codes for testing
INSERT INTO access_codes (code, description, is_active) VALUES
  ('TEAM2024', 'General team access code for 2024', true),
  ('CLUB2024', 'Club member access code for 2024', true),
  ('PLAYER2024', 'Player registration code for 2024', true),
  ('TEST123', 'Test access code', true)
ON CONFLICT (code) DO NOTHING;
