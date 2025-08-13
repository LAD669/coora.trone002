-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add comment to document the table
COMMENT ON TABLE notifications IS 'User notifications with read status tracking';
COMMENT ON COLUMN notifications.user_id IS 'User who receives the notification';
COMMENT ON COLUMN notifications.title IS 'Notification title';
COMMENT ON COLUMN notifications.body IS 'Notification body text';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read';
COMMENT ON COLUMN notifications.created_at IS 'When the notification was created';
COMMENT ON COLUMN notifications.updated_at IS 'When the notification was last updated';

-- Create a view to easily query notifications with user information
CREATE OR REPLACE VIEW notifications_with_user_details AS
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.body,
  n.read,
  n.created_at,
  COALESCE(n.updated_at, n.created_at) as updated_at,
  u.name as user_name,
  u.first_name,
  u.last_name,
  u.email
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC;
