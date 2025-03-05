/*
  # Add Facebook Page Details

  1. New Tables
    - `facebook_page_details`
      - Stores additional information about connected Facebook pages
      - Includes page name, avatar, category, follower count, etc.
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS facebook_page_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES facebook_connections(id) ON DELETE CASCADE,
  page_name text NOT NULL,
  page_category text,
  page_avatar_url text,
  follower_count integer DEFAULT 0,
  page_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE facebook_page_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read page details through connections"
  ON facebook_page_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.id = facebook_page_details.connection_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert page details through connections"
  ON facebook_page_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.id = connection_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update page details through connections"
  ON facebook_page_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.id = facebook_page_details.connection_id
      AND facebook_connections.user_id = auth.uid()
    )
  );