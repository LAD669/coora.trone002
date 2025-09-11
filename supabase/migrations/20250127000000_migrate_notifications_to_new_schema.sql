-- Migration: Update notifications table to new schema with sent column
-- This migration transforms the old notifications table structure to the new one

-- First, backup existing data if needed
CREATE TABLE IF NOT EXISTS notifications_backup AS 
SELECT * FROM notifications;

-- Drop the old notifications table and recreate with new schema
DROP TABLE IF EXISTS notifications CASCADE;

-- Create the new notifications table with the correct schema
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL CHECK (notification_type IN ('post_match', 'event_reminder', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  read_by jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_team_id ON notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add comments to document the table
COMMENT ON TABLE notifications IS 'Team notifications with scheduling and read tracking';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: post_match, event_reminder, or general';
COMMENT ON COLUMN notifications.title IS 'Notification title';
COMMENT ON COLUMN notifications.message IS 'Notification message content';
COMMENT ON COLUMN notifications.event_id IS 'Associated event ID (nullable)';
COMMENT ON COLUMN notifications.team_id IS 'Team that receives the notification';
COMMENT ON COLUMN notifications.scheduled_for IS 'When the notification should be sent';
COMMENT ON COLUMN notifications.sent IS 'Whether the notification has been sent';
COMMENT ON COLUMN notifications.read_by IS 'JSON array of user IDs who have read this notification';
COMMENT ON COLUMN notifications.created_at IS 'When the notification was created';

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view team notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins and trainers can insert team notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "Admins and trainers can update team notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "Admins and trainers can delete team notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

-- Clean up backup table (optional - uncomment if you want to keep backup)
-- DROP TABLE IF EXISTS notifications_backup;
