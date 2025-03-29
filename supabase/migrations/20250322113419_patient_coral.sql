/*
  # Remove is_active column from automation_configs

  1. Changes
    - Remove is_active column from automation_configs table
    - Update functions to use only status field from auto_engines
*/

-- Remove is_active column from automation_configs
ALTER TABLE automation_configs DROP COLUMN IF EXISTS is_active;

-- Update function to handle automation config updates
CREATE OR REPLACE FUNCTION handle_automation_config_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at := now();
  
  -- For moderation type, ensure config has required fields
  IF NEW.type = 'moderation' AND (NEW.config IS NULL OR NEW.config = '{}') THEN
    NEW.config := get_default_moderation_config();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;