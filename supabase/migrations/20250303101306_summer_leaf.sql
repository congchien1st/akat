-- Add page_type column to facebook_page_details if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'facebook_page_details' AND column_name = 'page_type'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE facebook_page_details ADD COLUMN page_type text;
  END IF;
END $$;

-- Create a function to handle null values in Facebook page data
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

-- Create a trigger to handle null values in facebook_page_details if it doesn't exist
DROP TRIGGER IF EXISTS handle_null_page_data_trigger ON facebook_page_details;
CREATE TRIGGER handle_null_page_data_trigger
  BEFORE INSERT OR UPDATE ON facebook_page_details
  FOR EACH ROW
  EXECUTE FUNCTION handle_null_page_data();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_null_page_data TO authenticated, anon;