/*
  # Fix monitoring status display

  1. Changes
    - Add logging to check actual data
    - Fix get_latest_moderation_status function
    - Add function to debug monitoring status
*/

-- Function to check monitoring status for debugging
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
  ORDER BY ae.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate get_latest_moderation_status with better ordering
DROP FUNCTION IF EXISTS get_latest_moderation_status();
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
      ae.status as engine_status
    FROM auto_engines ae
    WHERE ae.type = 'moderation'
    ORDER BY ae.page_id, ae.updated_at DESC, ae.created_at DESC
  )
  SELECT * FROM latest_engines;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION debug_monitoring_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_moderation_status TO authenticated;