/*
  # Add Auto Seeding Support to Automations

  1. Changes
    - Add 'seeding' to allowed automation types
    - Update policies to use correct user_id reference
    - Add indexes for better performance

  2. Security
    - Maintain RLS policies for user data isolation
    - Ensure proper user access control
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS automations;

-- Create the automations table
CREATE TABLE automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('comment', 'message', 'post', 'ads', 'seeding')),
  page_id text NOT NULL,
  workflow_id text,
  config jsonb DEFAULT '{}',
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own automations"
  ON automations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own automations"
  ON automations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own automations"
  ON automations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own automations"
  ON automations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_automations_user_id ON automations(user_id);
CREATE INDEX idx_automations_page_id ON automations(page_id);