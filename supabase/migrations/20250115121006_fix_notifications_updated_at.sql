-- Fix notifications table - add updated_at column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update existing records to have updated_at set to created_at
UPDATE notifications SET updated_at = created_at WHERE updated_at IS NULL;

-- Make sure the column is not nullable
ALTER TABLE notifications ALTER COLUMN updated_at SET NOT NULL;

-- Add comment for the updated_at column
COMMENT ON COLUMN notifications.updated_at IS 'When the notification was last updated';
