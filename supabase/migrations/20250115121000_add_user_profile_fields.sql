/*
  # Add Profile Fields to Users Table
  
  This migration adds user profile fields that were previously stored in the players table
  directly to the users table for easier access when fetching team members.
  
  1. New Fields
    - position: User's playing position
    - jersey_number: Jersey number for the user
    - phone_number: Contact phone number
    - date_of_birth: Date of birth
    - height_cm: Height in centimeters
    - weight_kg: Weight in kilograms
  
  2. Features
    - All fields are optional (nullable)
    - Proper data types and constraints
    - Indexes for better performance where needed
*/

-- Add profile fields to users table
DO $$
BEGIN
  -- Add position column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'position'
  ) THEN
    ALTER TABLE users ADD COLUMN position text;
  END IF;

  -- Add jersey_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'jersey_number'
  ) THEN
    ALTER TABLE users ADD COLUMN jersey_number integer;
  END IF;

  -- Add phone_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_number text;
  END IF;

  -- Add date_of_birth column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE users ADD COLUMN date_of_birth date;
  END IF;

  -- Add height_cm column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'height_cm'
  ) THEN
    ALTER TABLE users ADD COLUMN height_cm integer;
  END IF;

  -- Add weight_kg column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'weight_kg'
  ) THEN
    ALTER TABLE users ADD COLUMN weight_kg integer;
  END IF;
END $$;

-- Add constraints for data validation
ALTER TABLE users ADD CONSTRAINT users_jersey_number_positive 
  CHECK (jersey_number IS NULL OR jersey_number > 0);

ALTER TABLE users ADD CONSTRAINT users_height_cm_positive 
  CHECK (height_cm IS NULL OR height_cm > 0);

ALTER TABLE users ADD CONSTRAINT users_weight_kg_positive 
  CHECK (weight_kg IS NULL OR weight_kg > 0);

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_users_jersey_number ON users(jersey_number);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position); 