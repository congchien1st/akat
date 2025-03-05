/*
  # Fix Database Schema and Helper Functions

  1. Changes
    - Drops existing functions to avoid parameter name conflicts
    - Creates helper functions with properly named parameters
    - Ensures the facebook_page_details table exists with correct columns
    - Fixes RLS policies to be more permissive for authenticated users
  
  2. Security
    - Enables RLS on facebook_page_details table
    - Creates policies for authenticated users
*/

-- Drop existing functions to avoid parameter name conflicts
DROP FUNCTION IF EXISTS check_table_exists(text);
DROP FUNCTION IF EXISTS execute_sql(text);

-- Create helper functions with properly named parameters
CREATE OR REPLACE FUNCTION check_table_exists(p_name text)
RETURNS boolean AS $$
DECLARE
  exists_bool boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = p_name
  ) INTO exists_bool;
  RETURN exists_bool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION execute_sql(p_sql_command text)
RETURNS void AS $$
BEGIN
  EXECUTE p_sql_command;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Fix columns if they don't exist
DO $$ 
BEGIN
  -- Check if page_avatar_url column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_page_details' AND column_name = 'page_avatar_url'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE facebook_page_details ADD COLUMN page_avatar_url text;
  END IF;
  
  -- Check if follower_count column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_page_details' AND column_name = 'follower_count'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE facebook_page_details ADD COLUMN follower_count integer DEFAULT 0;
  END IF;
  
  -- Check if page_url column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_page_details' AND column_name = 'page_url'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE facebook_page_details ADD COLUMN page_url text;
  END IF;
END $$;

-- Fix RLS policies
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_table_exists TO anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO anon, authenticated;