/*
  # Fix ambiguous column reference in get_latest_moderation_status

  1. Changes
    - Add table alias to fix ambiguous column reference
    - Qualify column references with table alias
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_latest_moderation_status();

-- Recreate function with fixed column references
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
    ORDER BY ae.page_id, ae.created_at DESC
  )
  SELECT * FROM latest_engines;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_moderation_status TO authenticated;