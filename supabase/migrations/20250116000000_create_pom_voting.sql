-- Create POM (Player of the Match) voting tables

-- POM votes table - stores individual votes
CREATE TABLE IF NOT EXISTS pom_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_place_player_id uuid REFERENCES users(id) ON DELETE CASCADE,
  second_place_player_id uuid REFERENCES users(id) ON DELETE CASCADE,
  third_place_player_id uuid REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, voter_id) -- One vote per user per match
);

-- POM results table - stores aggregated results for each match
CREATE TABLE IF NOT EXISTS pom_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  total_votes integer DEFAULT 0,
  voting_closed boolean DEFAULT false,
  closed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- POM player standings table - stores individual player results per match
CREATE TABLE IF NOT EXISTS pom_player_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  first_place_votes integer DEFAULT 0,
  second_place_votes integer DEFAULT 0,
  third_place_votes integer DEFAULT 0,
  total_points integer DEFAULT 0, -- Calculated: (first_place_votes * 100) + (second_place_votes * 50) + (third_place_votes * 25)
  final_position integer, -- 1, 2, 3 or null if not in top 3
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pom_votes_event_id ON pom_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_pom_votes_voter_id ON pom_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_pom_votes_team_id ON pom_votes(team_id);

CREATE INDEX IF NOT EXISTS idx_pom_results_event_id ON pom_results(event_id);
CREATE INDEX IF NOT EXISTS idx_pom_results_team_id ON pom_results(team_id);

CREATE INDEX IF NOT EXISTS idx_pom_player_standings_event_id ON pom_player_standings(event_id);
CREATE INDEX IF NOT EXISTS idx_pom_player_standings_player_id ON pom_player_standings(player_id);
CREATE INDEX IF NOT EXISTS idx_pom_player_standings_team_id ON pom_player_standings(team_id);

-- Function to calculate total points for a player
CREATE OR REPLACE FUNCTION calculate_pom_points(
  first_place_votes integer,
  second_place_votes integer,
  third_place_votes integer
) RETURNS integer AS $$
BEGIN
  RETURN (first_place_votes * 100) + (second_place_votes * 50) + (third_place_votes * 25);
END;
$$ LANGUAGE plpgsql;

-- Function to update POM player standings when votes are added/updated
CREATE OR REPLACE FUNCTION update_pom_player_standings()
RETURNS TRIGGER AS $$
DECLARE
  event_uuid uuid;
  team_uuid uuid;
BEGIN
  -- Get event_id and team_id from the vote
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    event_uuid := NEW.event_id;
    team_uuid := NEW.team_id;
  ELSE
    event_uuid := OLD.event_id;
    team_uuid := OLD.team_id;
  END IF;

  -- Update standings for all players in this team for this event
  INSERT INTO pom_player_standings (event_id, player_id, team_id, first_place_votes, second_place_votes, third_place_votes, total_points)
  SELECT 
    event_uuid,
    u.id as player_id,
    team_uuid,
    COALESCE(SUM(CASE WHEN pv.first_place_player_id = u.id THEN 1 ELSE 0 END), 0) as first_place_votes,
    COALESCE(SUM(CASE WHEN pv.second_place_player_id = u.id THEN 1 ELSE 0 END), 0) as second_place_votes,
    COALESCE(SUM(CASE WHEN pv.third_place_player_id = u.id THEN 1 ELSE 0 END), 0) as third_place_votes,
    calculate_pom_points(
      COALESCE(SUM(CASE WHEN pv.first_place_player_id = u.id THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN pv.second_place_player_id = u.id THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN pv.third_place_player_id = u.id THEN 1 ELSE 0 END), 0)
    ) as total_points
  FROM users u
  LEFT JOIN pom_votes pv ON pv.event_id = event_uuid
  WHERE u.team_id = team_uuid AND u.role = 'player'
  GROUP BY u.id, u.team_id
  ON CONFLICT (event_id, player_id) 
  DO UPDATE SET
    first_place_votes = EXCLUDED.first_place_votes,
    second_place_votes = EXCLUDED.second_place_votes,
    third_place_votes = EXCLUDED.third_place_votes,
    total_points = EXCLUDED.total_points,
    updated_at = now();

  -- Update final positions based on total points
  WITH ranked_players AS (
    SELECT 
      player_id,
      total_points,
      ROW_NUMBER() OVER (ORDER BY total_points DESC) as position
    FROM pom_player_standings 
    WHERE event_id = event_uuid AND team_id = team_uuid
  )
  UPDATE pom_player_standings 
  SET final_position = CASE WHEN rp.position <= 3 THEN rp.position ELSE NULL END,
      updated_at = now()
  FROM ranked_players rp
  WHERE pom_player_standings.player_id = rp.player_id 
    AND pom_player_standings.event_id = event_uuid
    AND pom_player_standings.team_id = team_uuid;

  -- Update total votes count in pom_results
  INSERT INTO pom_results (event_id, team_id, total_votes)
  SELECT event_uuid, team_uuid, COUNT(*)
  FROM pom_votes 
  WHERE event_id = event_uuid
  ON CONFLICT (event_id)
  DO UPDATE SET
    total_votes = EXCLUDED.total_votes,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update standings when votes change
CREATE TRIGGER pom_votes_update_standings
  AFTER INSERT OR UPDATE OR DELETE ON pom_votes
  FOR EACH ROW EXECUTE FUNCTION update_pom_player_standings();

-- Add RLS policies
ALTER TABLE pom_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pom_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE pom_player_standings ENABLE ROW LEVEL SECURITY;

-- Policies for pom_votes
CREATE POLICY "Users can view POM votes for their team" ON pom_votes
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert POM votes for their team" ON pom_votes
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    ) AND voter_id = auth.uid()
  );

CREATE POLICY "Users can update their own POM votes" ON pom_votes
  FOR UPDATE USING (
    voter_id = auth.uid() AND
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own POM votes" ON pom_votes
  FOR DELETE USING (
    voter_id = auth.uid() AND
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

-- Policies for pom_results
CREATE POLICY "Users can view POM results for their team" ON pom_results
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Trainers and admins can manage POM results" ON pom_results
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid() AND role IN ('trainer', 'admin')
    )
  );

-- Policies for pom_player_standings
CREATE POLICY "Users can view POM player standings for their team" ON pom_player_standings
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage POM player standings" ON pom_player_standings
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );
