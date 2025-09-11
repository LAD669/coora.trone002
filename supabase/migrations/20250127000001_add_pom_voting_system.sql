-- Migration: Add Player of the Match (POM) voting system
-- This migration adds the pom_votes table and user_points field

-- Add user_points field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_points INTEGER DEFAULT 0;

-- Create pom_votes table
CREATE TABLE IF NOT EXISTS pom_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player1_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id uuid REFERENCES users(id) ON DELETE CASCADE,
  player3_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_vote_per_match UNIQUE(match_id, voter_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pom_votes_match_id ON pom_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_pom_votes_voter_id ON pom_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_pom_votes_player1_id ON pom_votes(player1_id);
CREATE INDEX IF NOT EXISTS idx_pom_votes_player2_id ON pom_votes(player2_id);
CREATE INDEX IF NOT EXISTS idx_pom_votes_player3_id ON pom_votes(player3_id);
CREATE INDEX IF NOT EXISTS idx_pom_votes_created_at ON pom_votes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_user_points ON users(user_points DESC);

-- Add comments to document the tables
COMMENT ON TABLE pom_votes IS 'Player of the Match voting records';
COMMENT ON COLUMN pom_votes.match_id IS 'Match/Event ID for which the vote is cast';
COMMENT ON COLUMN pom_votes.voter_id IS 'User who cast the vote';
COMMENT ON COLUMN pom_votes.player1_id IS 'Player voted for 1st place (1000 points)';
COMMENT ON COLUMN pom_votes.player2_id IS 'Player voted for 2nd place (500 points)';
COMMENT ON COLUMN pom_votes.player3_id IS 'Player voted for 3rd place (250 points)';
COMMENT ON COLUMN pom_votes.created_at IS 'When the vote was cast';
COMMENT ON COLUMN users.user_points IS 'Total points earned by the user from POM voting';

-- Enable Row Level Security
ALTER TABLE pom_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pom_votes
CREATE POLICY "Users can view team POM votes"
  ON pom_votes FOR SELECT
  TO authenticated
  USING (
    match_id IN (
      SELECT e.id FROM events e 
      JOIN users u ON e.team_id = u.team_id 
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own POM votes"
  ON pom_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = auth.uid() AND
    match_id IN (
      SELECT e.id FROM events e 
      JOIN users u ON e.team_id = u.team_id 
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own POM votes"
  ON pom_votes FOR UPDATE
  TO authenticated
  USING (voter_id = auth.uid())
  WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Users can delete their own POM votes"
  ON pom_votes FOR DELETE
  TO authenticated
  USING (voter_id = auth.uid());

-- Create a function to calculate POM points
CREATE OR REPLACE FUNCTION calculate_pom_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Add points for 1st place (1000 points)
  IF NEW.player1_id IS NOT NULL THEN
    UPDATE users 
    SET user_points = user_points + 1000 
    WHERE id = NEW.player1_id;
  END IF;
  
  -- Add points for 2nd place (500 points)
  IF NEW.player2_id IS NOT NULL THEN
    UPDATE users 
    SET user_points = user_points + 500 
    WHERE id = NEW.player2_id;
  END IF;
  
  -- Add points for 3rd place (250 points)
  IF NEW.player3_id IS NOT NULL THEN
    UPDATE users 
    SET user_points = user_points + 250 
    WHERE id = NEW.player3_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate POM points
CREATE TRIGGER pom_points_trigger
  AFTER INSERT ON pom_votes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_pom_points();

-- Create a view to easily query POM voting results
CREATE OR REPLACE VIEW pom_voting_results AS
SELECT 
  e.id as match_id,
  e.title as match_title,
  e.event_date,
  COUNT(pv.id) as total_votes,
  u1.name as player1_name,
  u1.user_points as player1_points,
  u2.name as player2_name,
  u2.user_points as player2_points,
  u3.name as player3_name,
  u3.user_points as player3_points
FROM events e
LEFT JOIN pom_votes pv ON e.id = pv.match_id
LEFT JOIN users u1 ON pv.player1_id = u1.id
LEFT JOIN users u2 ON pv.player2_id = u2.id
LEFT JOIN users u3 ON pv.player3_id = u3.id
WHERE e.event_type = 'match'
GROUP BY e.id, e.title, e.event_date, u1.name, u1.user_points, u2.name, u2.user_points, u3.name, u3.user_points
ORDER BY e.event_date DESC;

-- Add comment for the view
COMMENT ON VIEW pom_voting_results IS 'Aggregated POM voting results with player points';
