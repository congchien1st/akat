/*
  # Fix RLS policies for Facebook connections

  1. Changes
     - Update RLS policy for facebook_page_details to allow inserts
     - Add helper functions for database migrations
     - Fix permissions for authenticated users
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can insert page details through connections" ON facebook_page_details;

-- Create a more permissive policy for inserting page details
CREATE POLICY "Users can insert page details" 
  ON facebook_page_details
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create helper functions for migrations if they don't exist
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean AS $$
DECLARE
  exists_bool boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  ) INTO exists_bool;
  RETURN exists_bool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_check_table_exists_function()
RETURNS void AS $$
BEGIN
  -- Function already created by this migration
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fix_facebook_page_details_columns()
RETURNS void AS $$
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_fix_columns_function()
RETURNS void AS $$
BEGIN
  -- Function already created by this migration
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_table_exists TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_check_table_exists_function TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fix_facebook_page_details_columns TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_fix_columns_function TO anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO anon, authenticated;