-- Create goals table for individual goal tracking
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minute integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_match_id ON goals(match_id);
CREATE INDEX IF NOT EXISTS idx_goals_player_id ON goals(player_id);
CREATE INDEX IF NOT EXISTS idx_goals_minute ON goals(minute);

-- Add unique constraint to prevent duplicate goals for the same player in the same match
-- (This allows multiple goals per player per match, but prevents duplicate entries)
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_match_player_unique ON goals(match_id, player_id, minute);

-- Add comment to document the table
COMMENT ON TABLE goals IS 'Individual goals scored by players in matches';
COMMENT ON COLUMN goals.match_id IS 'Reference to the match where the goal was scored';
COMMENT ON COLUMN goals.player_id IS 'Player who scored the goal';
COMMENT ON COLUMN goals.minute IS 'Minute when the goal was scored (optional)';

-- Create a view to easily query goals with player and match information
CREATE OR REPLACE VIEW goals_with_details AS
SELECT 
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
ORDER BY e.event_date DESC, g.minute ASC NULLS LAST;
