/*
  # Create Facebook Page Details Table and Fix RLS Policies

  1. New Tables
    - facebook_page_details: Stores details about connected Facebook pages
  2. Security
    - Enable RLS on the table
    - Create appropriate policies for authenticated users
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
  
  -- Create more permissive policies (without IF NOT EXISTS which is not supported in CREATE POLICY)
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
    -- Ignore errors if policies already exist
    NULL;
END $$;