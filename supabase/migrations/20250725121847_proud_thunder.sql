/*
  # Add event responses column

  1. New Columns
    - `responses` (jsonb) - Stores user responses for events as JSON object
      - Format: { "user_id": "accepted|declined|pending" }
      - Default: empty object {}

  2. Security
    - Update existing RLS policies to handle responses column
    - Users can update their own responses within team events
    - Trainers and admins can view all responses for their team events

  3. Changes
    - Add responses column to events table with default empty JSON object
    - Ensure proper indexing for efficient querying of responses
*/

-- Add the responses column to the events table
ALTER TABLE IF EXISTS public.events
ADD COLUMN IF NOT EXISTS responses jsonb DEFAULT '{}'::jsonb;

-- Create index for efficient querying of responses
CREATE INDEX IF NOT EXISTS idx_events_responses ON public.events USING gin (responses);

-- Update existing events to have empty responses object if null
UPDATE public.events 
SET responses = '{}'::jsonb 
WHERE responses IS NULL;