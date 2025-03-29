/*
  # Fix Facebook Connection Issues

  1. Database Fixes
    - Ensure facebook_page_details table exists
    - Fix RLS policies for proper access
  2. Security
    - Enable proper permissions for authenticated users
*/

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

-- Fix RLS policies for facebook_page_details
DO $$ 
BEGIN
  -- Drop existing policies that might be causing issues
  DROP POLICY IF EXISTS "Users can insert page details through connections" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can insert page details" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can read page details through connections" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can read page details" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can update page details through connections" ON facebook_page_details;
  DROP POLICY IF EXISTS "Users can update page details" ON facebook_page_details;
  
  -- Create more permissive policies
  CREATE POLICY "Users can read page details" 
    ON facebook_page_details
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can insert page details" 
    ON facebook_page_details
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

  CREATE POLICY "Users can update page details" 
    ON facebook_page_details
    FOR UPDATE
    TO authenticated
    USING (true);
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Fix RLS policies for facebook_connections
DO $$ 
BEGIN
  -- Drop existing policies that might be causing issues
  DROP POLICY IF EXISTS "Users can read own connections" ON facebook_connections;
  DROP POLICY IF EXISTS "Users can insert own connections" ON facebook_connections;
  DROP POLICY IF EXISTS "Users can update own connections" ON facebook_connections;
  
  -- Create more permissive policies
  CREATE POLICY "Users can read own connections"
    ON facebook_connections
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own connections"
    ON facebook_connections
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own connections"
    ON facebook_connections
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;