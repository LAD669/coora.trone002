-- Create messages table for team communication
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  message_type text DEFAULT 'general' CHECK (message_type IN ('general', 'announcement', 'reminder', 'question')),
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_team_id ON messages(team_id);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- Add comment to document the table
COMMENT ON TABLE messages IS 'Team communication messages with automatic push notifications';
COMMENT ON COLUMN messages.content IS 'The message content that will be sent as push notification body';
COMMENT ON COLUMN messages.author_id IS 'User who sent the message (will be excluded from push notifications)';
COMMENT ON COLUMN messages.team_id IS 'Team for which the message is intended';
COMMENT ON COLUMN messages.message_type IS 'Type of message for categorization';
COMMENT ON COLUMN messages.is_pinned IS 'Whether the message should be pinned to the top';
