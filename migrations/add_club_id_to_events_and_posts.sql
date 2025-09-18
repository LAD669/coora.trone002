-- Add club_id to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS club_id UUID;

-- Update existing events with club_id from teams table
UPDATE events e
SET club_id = t.club_id
FROM teams t
WHERE e.team_id = t.id AND e.club_id IS NULL;

-- Make club_id NOT NULL
ALTER TABLE events ALTER COLUMN club_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE events ADD CONSTRAINT events_club_fk 
FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS events_club_id_idx ON events(club_id);

-- Add club_id to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS club_id UUID;

-- Update existing posts with club_id from teams table
UPDATE posts p
SET club_id = t.club_id
FROM teams t
WHERE p.team_id = t.id AND p.club_id IS NULL;

-- Make club_id NOT NULL
ALTER TABLE posts ALTER COLUMN club_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE posts ADD CONSTRAINT posts_club_fk 
FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS posts_club_id_idx ON posts(club_id);

-- RLS Policies for Manager club-wide access

-- Manager can read events from their club
CREATE POLICY IF NOT EXISTS "mgr_read_events"
ON events FOR SELECT
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'manager' 
    AND u.club_id = events.club_id
  )
);

-- Manager can read teams from their club
CREATE POLICY IF NOT EXISTS "mgr_read_teams"
ON teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'manager' 
    AND u.club_id = teams.club_id
  )
);

-- Manager can read players from their club
CREATE POLICY IF NOT EXISTS "mgr_read_players"
ON players FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'manager' 
    AND u.club_id = players.club_id
  )
);

-- Manager can read organization posts from their club
CREATE POLICY IF NOT EXISTS "mgr_read_posts"
ON posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'manager' 
    AND u.club_id = posts.club_id 
    AND posts.post_type = 'organization'
  )
);

-- Manager can read clubs they belong to
CREATE POLICY IF NOT EXISTS "mgr_read_clubs"
ON clubs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'manager' 
    AND u.club_id = clubs.id
  )
);
