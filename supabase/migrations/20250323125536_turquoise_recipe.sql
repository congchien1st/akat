/*
  # Fix monitoring status tracking

  1. Changes
    - Drop and recreate get_latest_moderation_status function
    - Add proper ordering by updated_at and created_at
    - Add debug function for monitoring
    - Add index for better performance
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_latest_moderation_status();
DROP FUNCTION IF EXISTS debug_monitoring_status(text);

-- Create function to get latest moderation status
CREATE OR REPLACE FUNCTION get_latest_moderation_status()
RETURNS TABLE (
  page_id text,
  engine_status text
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_engines AS (
    SELECT DISTINCT ON (ae.page_id)
      ae.page_id,
      ae.status as engine_status,
      ae.updated_at,
      ae.created_at
    FROM auto_engines ae
    WHERE ae.type = 'moderation'
    ORDER BY ae.page_id, ae.updated_at DESC NULLS LAST, ae.created_at DESC
  )
  SELECT 
    le.page_id,
    le.engine_status
  FROM latest_engines le;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create debug function
CREATE OR REPLACE FUNCTION debug_monitoring_status(p_page_id text)
RETURNS TABLE (
  page_id text,
  engine_id uuid,
  engine_type text,
  engine_status text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.page_id,
    ae.id as engine_id,
    ae.type as engine_type,
    ae.status as engine_status,
    ae.created_at,
    ae.updated_at
  FROM auto_engines ae
  WHERE ae.page_id = p_page_id
  ORDER BY ae.updated_at DESC NULLS LAST, ae.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_auto_engines_type_status_updated 
ON auto_engines(type, status, updated_at DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_latest_moderation_status TO authenticated;
GRANT EXECUTE ON FUNCTION debug_monitoring_status TO authenticated;