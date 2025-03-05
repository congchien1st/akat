/*
  # Fix Database Functions

  1. New Functions
    - Properly named functions for database operations
    - Fixed parameter names to avoid conflicts
  2. Security
    - Enable proper permissions for authenticated users
*/

-- Drop existing functions to avoid parameter name conflicts
DROP FUNCTION IF EXISTS check_table_exists(text);
DROP FUNCTION IF EXISTS execute_sql(text);

-- Create helper functions with properly named parameters
CREATE OR REPLACE FUNCTION check_table_exists(p_table_name text)
RETURNS boolean AS $$
DECLARE
  exists_bool boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = p_table_name
  ) INTO exists_bool;
  RETURN exists_bool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION execute_sql(p_sql text)
RETURNS void AS $$
BEGIN
  EXECUTE p_sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_table_exists(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon, authenticated;