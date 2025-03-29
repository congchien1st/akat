/*
  # Add function to get latest moderation status

  1. New Functions
    - get_latest_moderation_status: Gets the latest moderation engine status for each page
  
  2. Details
    - Returns page_id and engine_status for the most recent moderation engine per page
    - Only considers engines with type = 'moderation'
*/

-- Create function to get latest moderation status for each page
CREATE OR REPLACE FUNCTION get_latest_moderation_status()
RETURNS TABLE (
  page_id text,
  engine_status text
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_engines AS (
    SELECT DISTINCT ON (page_id)
      page_id,
      status as engine_status
    FROM auto_engines
    WHERE type = 'moderation'
    ORDER BY page_id, created_at DESC
  )
  SELECT * FROM latest_engines;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_moderation_status TO authenticated;