/*
  # Fix Facebook connection tables and policies

  1. Tables
    - Ensures `facebook_connections` table exists with proper structure
    - Ensures `facebook_page_details` table exists with proper structure
  2. Security
    - Enables RLS on both tables
    - Creates appropriate policies for authenticated users
*/

-- Create facebook_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS facebook_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  page_id text NOT NULL,
  access_token text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  permissions text[] DEFAULT '{}',
  last_sync timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create facebook_page_details table if it doesn't exist
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

-- Enable RLS
ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_page_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
BEGIN
  -- Drop policies for facebook_connections if they exist
  DROP POLICY IF EXISTS "Users can read own connections" ON facebook_connections;
  DROP POLICY IF EXISTS "Users can insert own connections" ON facebook_connections;
  DROP POLICY IF EXISTS "Users can update own connections" ON facebook_connections;

  -- Drop policies for facebook_page_details if they exist
  DROP POLICY IF EXISTS "Users can read page details through connections" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can insert page details through connections" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can update page details through connections" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can read page details" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can insert page details" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can update page details" ON facebook_page_details;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Create policies for facebook_connections
DO $$ 
BEGIN
  -- Create policy for reading connections
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'facebook_connections' AND policyname = 'Users can read own connections'
  ) THEN
    CREATE POLICY "Users can read own connections"
      ON facebook_connections
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Create policy for inserting connections
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'facebook_connections' AND policyname = 'Users can insert own connections'
  ) THEN
    CREATE POLICY "Users can insert own connections"
      ON facebook_connections
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Create policy for updating connections
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'facebook_connections' AND policyname = 'Users can update own connections'
  ) THEN
    CREATE POLICY "Users can update own connections"
      ON facebook_connections
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies already exist
    NULL;
END $$;

-- Create policies for facebook_page_details
DO $$ 
BEGIN
  -- Create policy for reading page details
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'facebook_page_details' AND policyname = 'Users can read page details'
  ) THEN
    CREATE POLICY "Users can read page details"
      ON facebook_page_details
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Create policy for inserting page details
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'facebook_page_details' AND policyname = 'Users can insert page details'
  ) THEN
    CREATE POLICY "Users can insert page details"
      ON facebook_page_details
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Create policy for updating page details
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'facebook_page_details' AND policyname = 'Users can update page details'
  ) THEN
    CREATE POLICY "Users can update page details"
      ON facebook_page_details
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies already exist
    NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_connections_user_id ON facebook_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_connections_page_id ON facebook_connections(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_page_details_connection_id ON facebook_page_details(connection_id);