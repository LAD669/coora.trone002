/*
  # Add registration deadline to events

  1. Changes
    - Add `registration_deadline` column to events table
    - Allow null values (optional field)
    - Default to event_date if not specified

  2. Notes
    - This allows setting a separate deadline for player responses
    - If not set, the system will fall back to using event_date as deadline
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'registration_deadline'
  ) THEN
    ALTER TABLE events ADD COLUMN registration_deadline timestamptz;
  END IF;
END $$;