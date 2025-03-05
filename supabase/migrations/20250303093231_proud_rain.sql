-- Create a helper function to run SQL commands
CREATE OR REPLACE FUNCTION run_sql_command(sql_command text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_command;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error executing SQL: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION run_sql_command TO authenticated, anon;

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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own connections" ON facebook_connections;
DROP POLICY IF EXISTS "Users can insert own connections" ON facebook_connections;
DROP POLICY IF EXISTS "Users can update own connections" ON facebook_connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON facebook_connections;

DROP POLICY IF EXISTS "Users can read page details" ON facebook_page_details;
DROP POLICY IF EXISTS "Users can insert page details" ON facebook_page_details;
DROP POLICY IF EXISTS "Users can update page details" ON facebook_page_details;
DROP POLICY IF EXISTS "Users can delete page details" ON facebook_page_details;

-- Create simplified policies for facebook_connections
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

CREATE POLICY "Users can delete own connections"
  ON facebook_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create very permissive policies for facebook_page_details
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

CREATE POLICY "Users can delete page details"
  ON facebook_page_details
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_connections_user_id ON facebook_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_connections_page_id ON facebook_connections(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_page_details_connection_id ON facebook_page_details(connection_id);

-- Grant necessary permissions
GRANT ALL ON facebook_connections TO authenticated;
GRANT ALL ON facebook_page_details TO authenticated;

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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to handle null values in facebook_page_details
DROP TRIGGER IF EXISTS handle_null_page_data_trigger ON facebook_page_details;
CREATE TRIGGER handle_null_page_data_trigger
  BEFORE INSERT OR UPDATE ON facebook_page_details
  FOR EACH ROW
  EXECUTE FUNCTION handle_null_page_data();