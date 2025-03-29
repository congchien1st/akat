/*
  # Create automations table

  1. New Tables
    - `automations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text)
      - `page_id` (text)
      - `workflow_id` (text)
      - `config` (jsonb)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `automations` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  page_id text NOT NULL,
  workflow_id text,
  config jsonb DEFAULT '{}',
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own automations"
  ON automations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = automations.page_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own automations"
  ON automations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = page_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own automations"
  ON automations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = automations.page_id
      AND facebook_connections.user_id = auth.uid()
    )
  );