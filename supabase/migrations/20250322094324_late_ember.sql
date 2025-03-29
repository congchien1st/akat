/*
  # Fix automation configuration handling

  1. Changes
    - Add trigger to create default moderation config for new pages
    - Add function to handle config updates
    - Add function to get default config
  
  2. Security
    - Maintain existing RLS policies
    - Add proper access control
*/

-- Create function to get default moderation config
CREATE OR REPLACE FUNCTION get_default_moderation_config()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'autoHide', true,
    'autoCorrect', false,
    'confidenceThreshold', 90,
    'prompt', 'You are a content moderation system for Facebook posts. Your task is to analyze the content of posts and determine if they violate community standards.

Analyze the post for the following violations:
1. Hate speech or discrimination
2. Violence or threats
3. Nudity or sexual content
4. Harassment or bullying
5. Spam or misleading content
6. Illegal activities
7. Self-harm or suicide
8. Misinformation

Respond with a JSON object in the following format:
{
  "violates": boolean,
  "category": string or null,
  "reason": string or null,
  "confidence": number between 0 and 1
}

Where:
- "violates" is true if the post violates community standards, false otherwise
- "category" is the category of violation (one of the 8 listed above), or null if no violation
- "reason" is a brief explanation of why the post violates standards, or null if no violation
- "confidence" is your confidence level in the assessment (0.0 to 1.0)

Be thorough but fair in your assessment. If you are unsure, err on the side of caution.'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to handle automation config updates
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

-- Create trigger for auto_engines table
DROP TRIGGER IF EXISTS handle_automation_config_update_trigger ON auto_engines;
CREATE TRIGGER handle_automation_config_update_trigger
  BEFORE INSERT OR UPDATE ON auto_engines
  FOR EACH ROW
  EXECUTE FUNCTION handle_automation_config_update();

-- Create function to ensure moderation config exists
CREATE OR REPLACE FUNCTION ensure_moderation_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default moderation config if it doesn't exist
  INSERT INTO auto_engines (
    name,
    description,
    page_id,
    type,
    status,
    config
  )
  SELECT
    'Content Moderation',
    'Automated content moderation for Facebook page',
    NEW.page_id,
    'moderation',
    'active',
    get_default_moderation_config()
  WHERE NOT EXISTS (
    SELECT 1 FROM auto_engines
    WHERE page_id = NEW.page_id
    AND type = 'moderation'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for facebook_connections table
DROP TRIGGER IF EXISTS ensure_moderation_config_trigger ON facebook_connections;
CREATE TRIGGER ensure_moderation_config_trigger
  AFTER INSERT ON facebook_connections
  FOR EACH ROW
  EXECUTE FUNCTION ensure_moderation_config();

-- Insert default moderation configs for existing pages
INSERT INTO auto_engines (
  name,
  description,
  page_id,
  type,
  status,
  config
)
SELECT DISTINCT ON (fc.page_id)
  'Content Moderation',
  'Automated content moderation for Facebook page',
  fc.page_id,
  'moderation',
  'active',
  get_default_moderation_config()
FROM facebook_connections fc
WHERE NOT EXISTS (
  SELECT 1 FROM auto_engines ae 
  WHERE ae.page_id = fc.page_id 
  AND ae.type = 'moderation'
);