-- Create assists table for individual assist tracking
CREATE TABLE IF NOT EXISTS assists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minute integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assists_match_id ON assists(match_id);
CREATE INDEX IF NOT EXISTS idx_assists_player_id ON assists(player_id);
CREATE INDEX IF NOT EXISTS idx_assists_minute ON assists(minute);

-- Add unique constraint to prevent duplicate assists for the same player in the same match
-- (This allows multiple assists per player per match, but prevents duplicate entries)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assists_match_player_unique ON assists(match_id, player_id, minute);

-- Add comment to document the table
COMMENT ON TABLE assists IS 'Individual assists provided by players in matches';
COMMENT ON COLUMN assists.match_id IS 'Reference to the match where the assist was provided';
COMMENT ON COLUMN assists.player_id IS 'Player who provided the assist';
COMMENT ON COLUMN assists.minute IS 'Minute when the assist was provided (optional)';

-- Create a view to easily query assists with player and match information
CREATE OR REPLACE VIEW assists_with_details AS
SELECT 
  a.id,
  a.match_id,
  a.player_id,
  a.minute,
  a.created_at,
  a.updated_at,
  u.name as player_name,
  u.first_name,
  u.last_name,
  mr.team_score,
  mr.opponent_score,
  mr.opponent_name,
  e.title as match_title,
  e.event_date as match_date,
  t.name as team_name
FROM assists a
JOIN users u ON a.player_id = u.id
JOIN match_results mr ON a.match_id = mr.id
JOIN events e ON mr.event_id = e.id
JOIN teams t ON mr.team_id = t.id
ORDER BY e.event_date DESC, a.minute ASC NULLS LAST;

-- Create a combined view for goals and assists
CREATE OR REPLACE VIEW match_contributions AS
SELECT 
  'goal' as contribution_type,
  g.id,
  g.match_id,
  g.player_id,
  g.minute,
  g.created_at,
  g.updated_at,
  u.name as player_name,
  u.first_name,
  u.last_name,
  mr.team_score,
  mr.opponent_score,
  mr.opponent_name,
  e.title as match_title,
  e.event_date as match_date,
  t.name as team_name
FROM goals g
JOIN users u ON g.player_id = u.id
JOIN match_results mr ON g.match_id = mr.id
JOIN events e ON mr.event_id = e.id
JOIN teams t ON mr.team_id = t.id

UNION ALL

SELECT 
  'assist' as contribution_type,
  a.id,
  a.match_id,
  a.player_id,
  a.minute,
  a.created_at,
  a.updated_at,
  u.name as player_name,
  u.first_name,
  u.last_name,
  mr.team_score,
  mr.opponent_score,
  mr.opponent_name,
  e.title as match_title,
  e.event_date as match_date,
  t.name as team_name
FROM assists a
JOIN users u ON a.player_id = u.id
JOIN match_results mr ON a.match_id = mr.id
JOIN events e ON mr.event_id = e.id
JOIN teams t ON mr.team_id = t.id
ORDER BY match_date DESC, minute ASC NULLS LAST;
