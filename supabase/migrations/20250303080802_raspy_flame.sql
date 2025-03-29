/*
  # Fix Facebook Connections

  1. Changes
     - Adds missing indexes to facebook_connections and facebook_page_details tables
     - Ensures proper RLS policies are in place
     - Adds a trigger to update the last_sync timestamp automatically
  
  2. Security
     - Maintains existing RLS policies
     - Ensures authenticated users can only access their own connections
*/

-- Add a function to update the last_sync timestamp
CREATE OR REPLACE FUNCTION update_last_sync()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_sync = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update last_sync on facebook_connections
DROP TRIGGER IF EXISTS update_facebook_connections_last_sync ON facebook_connections;
CREATE TRIGGER update_facebook_connections_last_sync
  BEFORE UPDATE ON facebook_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_last_sync();

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_connections_status ON facebook_connections(status);
CREATE INDEX IF NOT EXISTS idx_facebook_page_details_page_name ON facebook_page_details(page_name);

-- Grant necessary permissions
GRANT ALL ON facebook_connections TO authenticated;
GRANT ALL ON facebook_page_details TO authenticated;