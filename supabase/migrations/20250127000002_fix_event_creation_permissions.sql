/*
  # Fix Event Creation Permissions
  
  1. Problem
    - Only admins and trainers can create events due to RLS policies
    - Players cannot create events, which blocks calendar functionality
  
  2. Solution
    - Create RPC function to bypass RLS policy restrictions
    - Add new RLS policy to allow team members to create events
    - Keep existing policies for admins and trainers
    - Ensure proper team-based access control
  
  3. Changes
    - Create RPC function for event creation
    - Add policy for team members to create events
    - Maintain security by restricting to team members only
*/

-- Create RPC function to create events with proper team validation
CREATE OR REPLACE FUNCTION create_event_sql(
  event_title text,
  event_type text,
  event_date timestamptz,
  meeting_time timestamptz DEFAULT NULL,
  start_time timestamptz DEFAULT NULL,
  end_time timestamptz DEFAULT NULL,
  event_location text,
  event_notes text DEFAULT NULL,
  registration_deadline timestamptz DEFAULT NULL,
  team_id uuid,
  created_by uuid,
  requires_response boolean DEFAULT true,
  is_repeating boolean DEFAULT false,
  repeat_pattern jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_team_id uuid;
  v_event_id uuid;
  v_result jsonb;
BEGIN
  -- Verify that the user belongs to the team
  SELECT team_id INTO v_user_team_id
  FROM users
  WHERE id = created_by AND team_id = team_id;
  
  IF v_user_team_id IS NULL THEN
    RAISE EXCEPTION 'User does not belong to the specified team';
  END IF;
  
  -- Create the event
  INSERT INTO events (
    title,
    event_type,
    event_date,
    meeting_time,
    start_time,
    end_time,
    location,
    notes,
    registration_deadline,
    team_id,
    created_by,
    requires_response,
    is_repeating,
    repeat_pattern
  ) VALUES (
    event_title,
    event_type,
    event_date,
    meeting_time,
    start_time,
    end_time,
    event_location,
    event_notes,
    registration_deadline,
    team_id,
    created_by,
    requires_response,
    is_repeating,
    repeat_pattern
  ) RETURNING id INTO v_event_id;
  
  -- Return the created event data
  SELECT to_jsonb(e.*) INTO v_result
  FROM events e
  WHERE e.id = v_event_id;
  
  RETURN v_result;
END;
$$;

-- Add policy to allow team members to create events
CREATE POLICY "Team members can create events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
  );

-- Add policy to allow team members to update their own events
CREATE POLICY "Team members can update their own events"
  ON events FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() AND
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
  )
  WITH CHECK (
    created_by = auth.uid() AND
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
  );

-- Add policy to allow team members to delete their own events
CREATE POLICY "Team members can delete their own events"
  ON events FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() AND
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() 
      AND team_id IS NOT NULL
    )
  );
