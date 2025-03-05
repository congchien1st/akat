-- Add page_type column to facebook_page_details if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_page_details' AND column_name = 'page_type'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE facebook_page_details ADD COLUMN page_type text;
  END IF;
END $$;

-- Update the handle_null_page_data function to handle the page_type field
CREATE OR REPLACE FUNCTION handle_null_page_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle null values for avatar_url
  IF NEW.page_avatar_url IS NULL THEN
    NEW.page_avatar_url := NULL;
  END IF;
  
  -- Handle null values for follower_count
  IF NEW.follower_count IS NULL THEN
    NEW.follower_count := 0;
  END IF;
  
  -- Handle null values for page_url
  IF NEW.page_url IS NULL THEN
    NEW.page_url := NULL;
  END IF;
  
  -- Handle null values for page_type
  IF NEW.page_type IS NULL THEN
    NEW.page_type := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle different page types
CREATE OR REPLACE FUNCTION get_page_follower_count(page_data jsonb)
RETURNS integer AS $$
BEGIN
  -- Try to get followers_count first (for new pages)
  IF page_data ? 'followers_count' AND jsonb_typeof(page_data->'followers_count') = 'number' THEN
    RETURN (page_data->>'followers_count')::integer;
  END IF;
  
  -- Try to get fan_count (for classic pages)
  IF page_data ? 'fan_count' AND jsonb_typeof(page_data->'fan_count') = 'number' THEN
    RETURN (page_data->>'fan_count')::integer;
  END IF;
  
  -- Default to 0 if neither is available
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_page_follower_count TO authenticated, anon;