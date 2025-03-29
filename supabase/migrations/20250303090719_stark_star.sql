/*
  # Fix database tables and policies

  1. Tables
    - Ensure facebook_connections table exists
    - Ensure facebook_page_details table exists
  
  2. Policies
    - Create RLS policies for both tables
    - Set up proper access control
*/

-- Create facebook_connections table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'facebook_connections'
  ) THEN
    CREATE TABLE facebook_connections (
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

    -- Enable RLS
    ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create facebook_page_details table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'facebook_page_details'
  ) THEN
    CREATE TABLE facebook_page_details (
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
    ALTER TABLE facebook_page_details ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies
DO $$ 
BEGIN
  -- Drop policies for facebook_connections if they exist
  DROP POLICY IF EXISTS "Users can read own connections" ON facebook_connections;
  DROP POLICY IF EXISTS "Users can insert own connections" ON facebook_connections;
  DROP POLICY IF EXISTS "Users can update own connections" ON facebook_connections;

  -- Drop policies for facebook_page_details if they exist
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
  CREATE POLICY "Users can read own connections"
    ON facebook_connections
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can insert own connections"
    ON facebook_connections
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can update own connections"
    ON facebook_connections
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create policies for facebook_page_details
DO $$ 
BEGIN
  CREATE POLICY "Users can read page details"
    ON facebook_page_details
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can insert page details"
    ON facebook_page_details
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can update page details"
    ON facebook_page_details
    FOR UPDATE
    TO authenticated
    USING (true);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_connections_user_id ON facebook_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_connections_page_id ON facebook_connections(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_page_details_connection_id ON facebook_page_details(connection_id);

-- Grant necessary permissions
GRANT ALL ON facebook_connections TO authenticated;
GRANT ALL ON facebook_page_details TO authenticated;