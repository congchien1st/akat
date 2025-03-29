/*
  # Add relationship between facebook_posts and facebook_connections

  1. Changes
    - Add user_id column to facebook_posts table
    - Add foreign key relationship to facebook_connections
    - Update RLS policies
  
  2. Security
    - Maintain existing RLS policies
    - Add new policies based on user_id
*/

-- Add user_id column to facebook_posts
ALTER TABLE facebook_posts 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add foreign key to facebook_connections
ALTER TABLE facebook_posts 
ADD COLUMN IF NOT EXISTS connection_id uuid REFERENCES facebook_connections(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_posts_user_id ON facebook_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_connection_id ON facebook_posts(connection_id);

-- Update RLS policies
ALTER TABLE facebook_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read facebook posts" ON facebook_posts;
DROP POLICY IF EXISTS "Users can insert facebook posts" ON facebook_posts;
DROP POLICY IF EXISTS "Users can update facebook posts" ON facebook_posts;

-- Create new policies
CREATE POLICY "Users can read facebook posts"
  ON facebook_posts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.id = facebook_posts.connection_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert facebook posts"
  ON facebook_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.id = facebook_posts.connection_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update facebook posts"
  ON facebook_posts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.id = facebook_posts.connection_id
      AND facebook_connections.user_id = auth.uid()
    )
  );