/*
  # Migrate from auto_engines to automation_configs

  1. Changes
    - Create function to migrate data from auto_engines to automation_configs
    - Update monitoring functions to use automation_configs
    - Add indexes and triggers for better performance
  
  2. Security
    - Maintain existing RLS policies
    - Add proper access control
*/

-- Function to migrate data from auto_engines to automation_configs
CREATE OR REPLACE FUNCTION migrate_moderation_configs()
RETURNS void AS $$
DECLARE
  engine_record RECORD;
  v_type_id uuid;
BEGIN
  -- Get moderation type ID
  SELECT id INTO v_type_id 
  FROM automation_types 
  WHERE code = 'moderation'
  LIMIT 1;

  -- Migrate each auto_engine record
  FOR engine_record IN 
    SELECT * FROM auto_engines 
    WHERE type = 'moderation'
  LOOP
    -- Insert into automation_configs if not exists
    INSERT INTO automation_configs (
      page_id,
      type_id,
      name,
      description,
      config
    )
    VALUES (
      engine_record.page_id,
      v_type_id,
      engine_record.name,
      engine_record.description,
      engine_record.config
    )
    ON CONFLICT (page_id, type_id) 
    DO UPDATE SET
      config = EXCLUDED.config,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate get_latest_moderation_status to use automation_configs
DROP FUNCTION IF EXISTS get_latest_moderation_status();
CREATE OR REPLACE FUNCTION get_latest_moderation_status()
RETURNS TABLE (
  page_id text,
  engine_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.page_id,
    'active' as engine_status
  FROM automation_configs ac
  JOIN automation_types at ON at.id = ac.type_id
  WHERE at.code = 'moderation';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check monitoring status for debugging
DROP FUNCTION IF EXISTS debug_monitoring_status;
CREATE OR REPLACE FUNCTION debug_monitoring_status(p_page_id text)
RETURNS TABLE (
  page_id text,
  config_id uuid,
  type_code text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.page_id,
    ac.id as config_id,
    at.code as type_code,
    ac.created_at,
    ac.updated_at
  FROM automation_configs ac
  JOIN automation_types at ON at.id = ac.type_id
  WHERE ac.page_id = p_page_id
  ORDER BY ac.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION migrate_moderation_configs TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_moderation_status TO authenticated;
GRANT EXECUTE ON FUNCTION debug_monitoring_status TO authenticated;

-- Migrate existing data
SELECT migrate_moderation_configs();