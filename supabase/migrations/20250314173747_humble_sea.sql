/*
  # Fix Facebook Posts Relationships

  1. Changes
    - Add missing columns to facebook_posts table
    - Create proper relationships between posts and connections
    - Add helper functions for post management
  
  2. Security
    - Maintain existing RLS policies
    - Add proper access control through relationships
*/

-- Add missing columns to facebook_posts if they don't exist
DO $$ 
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_posts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE facebook_posts ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Add connection_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_posts' AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE facebook_posts ADD COLUMN connection_id uuid REFERENCES facebook_connections(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_posts_user_id ON facebook_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_connection_id ON facebook_posts(connection_id);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_status_created ON facebook_posts(status, created_time);

-- Update existing posts to link with connections
DO $$
DECLARE
  post_record RECORD;
  conn_id uuid;
BEGIN
  FOR post_record IN SELECT fp.id, fp.page_id FROM facebook_posts fp WHERE fp.connection_id IS NULL
  LOOP
    -- Find matching connection
    SELECT fc.id INTO conn_id
    FROM facebook_connections fc
    WHERE fc.page_id = post_record.page_id
    LIMIT 1;

    -- Update post if connection found
    IF conn_id IS NOT NULL THEN
      UPDATE facebook_posts
      SET connection_id = conn_id
      WHERE id = post_record.id;
    END IF;
  END LOOP;
END $$;

-- Create function to get posts with page details
CREATE OR REPLACE FUNCTION get_posts_with_details(
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  page_id text,
  post_id text,
  message text,
  created_time timestamptz,
  status text,
  moderation_result jsonb,
  moderated_at timestamptz,
  page_name text,
  page_avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.page_id,
    fp.post_id,
    fp.message,
    fp.created_time,
    fp.status,
    fp.moderation_result,
    fp.moderated_at,
    fpd.page_name,
    fpd.page_avatar_url
  FROM facebook_posts fp
  LEFT JOIN facebook_connections fc ON fp.connection_id = fc.id
  LEFT JOIN facebook_page_details fpd ON fc.id = fpd.connection_id
  WHERE
    (p_status IS NULL OR fp.status = p_status)
    AND (
      fp.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM facebook_connections
        WHERE facebook_connections.id = fp.connection_id
        AND facebook_connections.user_id = auth.uid()
      )
    )
  ORDER BY fp.created_time DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;