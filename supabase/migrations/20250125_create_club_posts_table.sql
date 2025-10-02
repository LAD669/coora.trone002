-- Create club_posts table for organization-wide posts
CREATE TABLE IF NOT EXISTS club_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  post_type text DEFAULT 'organization' CHECK (post_type IN ('organization', 'announcement')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS club_posts_club_id_idx ON club_posts(club_id);
CREATE INDEX IF NOT EXISTS club_posts_author_id_idx ON club_posts(author_id);
CREATE INDEX IF NOT EXISTS club_posts_created_at_idx ON club_posts(created_at);

-- Create club_post_reactions table for reactions to club posts
CREATE TABLE IF NOT EXISTS club_post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES club_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- RLS Policies for club_posts

-- Enable RLS
ALTER TABLE club_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_post_reactions ENABLE ROW LEVEL SECURITY;

-- Users can read club posts from their club
CREATE POLICY "users_read_club_posts"
ON club_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.club_id = club_posts.club_id
  )
);

-- Managers and admins can create club posts
CREATE POLICY "managers_create_club_posts"
ON club_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.club_id = club_posts.club_id
    AND u.role IN ('manager', 'admin')
  )
);

-- Authors can update their own club posts
CREATE POLICY "authors_update_club_posts"
ON club_posts FOR UPDATE
USING (
  author_id = auth.uid()
);

-- Authors can delete their own club posts
CREATE POLICY "authors_delete_club_posts"
ON club_posts FOR DELETE
USING (
  author_id = auth.uid()
);

-- RLS Policies for club_post_reactions

-- Users can read reactions on club posts from their club
CREATE POLICY "users_read_club_post_reactions"
ON club_post_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_posts cp
    JOIN users u ON u.club_id = cp.club_id
    WHERE cp.id = club_post_reactions.post_id
    AND u.id = auth.uid()
  )
);

-- Users can create reactions on club posts from their club
CREATE POLICY "users_create_club_post_reactions"
ON club_post_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM club_posts cp
    JOIN users u ON u.club_id = cp.club_id
    WHERE cp.id = club_post_reactions.post_id
    AND u.id = auth.uid()
  )
);

-- Users can delete their own reactions
CREATE POLICY "users_delete_club_post_reactions"
ON club_post_reactions FOR DELETE
USING (
  user_id = auth.uid()
);

-- Grant permissions
GRANT ALL ON club_posts TO authenticated;
GRANT ALL ON club_post_reactions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
