/*
  # Fix auto engines configuration

  1. Changes
    - Add default config for new engines
    - Update check_content_violation to use config
    - Add helper functions for config management
  
  2. Security
    - Maintain existing RLS policies
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

-- Create function to get engine config
CREATE OR REPLACE FUNCTION get_engine_config(p_page_id text, p_type text)
RETURNS jsonb AS $$
DECLARE
  v_config jsonb;
BEGIN
  -- Get the most recent active config for the page and type
  SELECT config INTO v_config
  FROM auto_engines
  WHERE page_id = p_page_id
    AND type = p_type
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Return default config if none exists
  IF v_config IS NULL THEN
    CASE p_type
      WHEN 'moderation' THEN
        RETURN get_default_moderation_config();
      ELSE
        RETURN '{}'::jsonb;
    END CASE;
  END IF;

  RETURN v_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update check_content_violation to use config
CREATE OR REPLACE FUNCTION check_content_violation(content text, page_id text)
RETURNS jsonb AS $$
DECLARE
  api_key text := current_setting('app.settings.openai_api_key', true);
  config jsonb;
  response jsonb;
  result jsonb;
BEGIN
  -- Get moderation config for the page
  config := get_engine_config(page_id, 'moderation');

  -- If no API key is set, return a default response
  IF api_key IS NULL OR api_key = '' THEN
    RETURN jsonb_build_object(
      'violates', false,
      'violation_type', null,
      'confidence', 0
    );
  END IF;

  -- Call OpenAI API to check for violations
  SELECT
    content INTO response
  FROM
    http((
      'POST',
      'https://api.openai.com/v1/chat/completions',
      ARRAY[
        http_header('Authorization', 'Bearer ' || api_key),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      jsonb_build_object(
        'model', 'gpt-4',
        'messages', jsonb_build_array(
          jsonb_build_object(
            'role', 'system',
            'content', COALESCE(config->>'prompt', get_default_moderation_config()->>'prompt')
          ),
          jsonb_build_object(
            'role', 'user',
            'content', content
          )
        ),
        'temperature', 0.1,
        'max_tokens', 150
      )::text
    ));

  -- Parse the response
  result := response->'choices'->0->'message'->'content';
  
  -- If the result is not valid JSON, return a default response
  BEGIN
    result := result::jsonb;
  EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
      'violates', false,
      'violation_type', null,
      'confidence', 0
    );
  END;

  -- Check if confidence meets threshold
  IF (result->>'confidence')::numeric < (config->>'confidenceThreshold')::numeric / 100.0 THEN
    result := jsonb_set(result, '{violates}', 'false');
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return a default response in case of error
    RETURN jsonb_build_object(
      'violates', false,
      'violation_type', null,
      'confidence', 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default moderation engines for existing pages
DO $$
DECLARE
  page_record RECORD;
BEGIN
  FOR page_record IN 
    SELECT DISTINCT fc.page_id 
    FROM facebook_connections fc
    WHERE NOT EXISTS (
      SELECT 1 FROM auto_engines ae 
      WHERE ae.page_id = fc.page_id 
      AND ae.type = 'moderation'
    )
  LOOP
    INSERT INTO auto_engines (
      name,
      description,
      page_id,
      type,
      status,
      config
    ) VALUES (
      'Content Moderation',
      'Automated content moderation for Facebook page',
      page_record.page_id,
      'moderation',
      'active',
      get_default_moderation_config()
    );
  END LOOP;
END $$;