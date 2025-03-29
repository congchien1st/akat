/*
  # Fix facebook_page_details table structure

  1. Changes
     - Add missing columns to facebook_page_details table
     - Ensure proper column naming consistency
*/

-- Check if the table exists and has the correct columns
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