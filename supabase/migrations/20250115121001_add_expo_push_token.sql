-- Add expo_push_token field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Add index for better performance when querying by push token
CREATE INDEX IF NOT EXISTS idx_users_expo_push_token ON users(expo_push_token);

-- Add comment to document the field
COMMENT ON COLUMN users.expo_push_token IS 'Expo Push Token for push notifications';
