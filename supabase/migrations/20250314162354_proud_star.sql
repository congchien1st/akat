/*
  # Add functions for moderated posts management

  1. New Functions
    - get_moderated_posts: Fetch moderated posts with filters and pagination
    - get_moderated_posts_count: Get total count of filtered posts
    - get_violation_stats: Get violation statistics by type
  
  2. Indexes
    - Add indexes for better query performance
    - Optimize common filter patterns
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_facebook_posts_moderated_at ON facebook_posts(moderated_at);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_status_created ON facebook_posts(status, created_time);

-- Create function to get moderated posts with filters
CREATE OR REPLACE FUNCTION get_moderated_posts(
  p_page_ids text[],
  p_status text,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  page_id text,
  post_id text,
  message text,
  created_time timestamptz,
  status text,
  moderation_result jsonb,
  moderated_at timestamptz,
  page_name text,
  page_avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.page_id,
    fp.post_id,
    fp.message,
    fp.created_time,
    fp.status,
    fp.moderation_result,
    fp.moderated_at,
    fpd.page_name,
    fpd.page_avatar_url
  FROM facebook_posts fp
  LEFT JOIN facebook_connections fc ON fp.page_id = fc.page_id
  LEFT JOIN facebook_page_details fpd ON fc.id = fpd.connection_id
  WHERE
    (p_page_ids IS NULL OR fp.page_id = ANY(p_page_ids))
    AND (p_status IS NULL OR fp.status = p_status)
    AND (p_start_date IS NULL OR fp.created_time >= p_start_date)
    AND (p_end_date IS NULL OR fp.created_time <= p_end_date)
    AND EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = fp.page_id
      AND facebook_connections.user_id = auth.uid()
    )
  ORDER BY fp.created_time DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get moderated posts count
CREATE OR REPLACE FUNCTION get_moderated_posts_count(
  p_page_ids text[],
  p_status text,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM facebook_posts fp
  WHERE
    (p_page_ids IS NULL OR fp.page_id = ANY(p_page_ids))
    AND (p_status IS NULL OR fp.status = p_status)
    AND (p_start_date IS NULL OR fp.created_time >= p_start_date)
    AND (p_end_date IS NULL OR fp.created_time <= p_end_date)
    AND EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = fp.page_id
      AND facebook_connections.user_id = auth.uid()
    );
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get violation statistics
CREATE OR REPLACE FUNCTION get_violation_stats(
  p_page_ids text[],
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  violation_type text,
  count bigint,
  percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH violation_counts AS (
    SELECT
      v.violation_type,
      COUNT(*) as count
    FROM violations v
    WHERE
      (p_page_ids IS NULL OR v.page_id = ANY(p_page_ids))
      AND (p_start_date IS NULL OR v.created_at >= p_start_date)
      AND (p_end_date IS NULL OR v.created_at <= p_end_date)
      AND EXISTS (
        SELECT 1 FROM facebook_connections
        WHERE facebook_connections.page_id = v.page_id
        AND facebook_connections.user_id = auth.uid()
      )
    GROUP BY v.violation_type
  ),
  total AS (
    SELECT SUM(count) as total_count
    FROM violation_counts
  )
  SELECT
    vc.violation_type,
    vc.count,
    ROUND((vc.count::numeric / NULLIF(t.total_count, 0) * 100)::numeric, 2) as percentage
  FROM violation_counts vc
  CROSS JOIN total t
  ORDER BY vc.count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_moderated_posts TO authenticated;
GRANT EXECUTE ON FUNCTION get_moderated_posts_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_violation_stats TO authenticated;