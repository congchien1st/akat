/*
  # Add debug functions for moderation system
  
  1. New Functions
    - debug_moderation: Logs detailed debug info for moderation process
    - test_moderation: Test function to simulate moderation
*/

-- Function to log debug info
CREATE OR REPLACE FUNCTION debug_moderation(
  debug_type text,
  message text,
  details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO automation_logs (
    level,
    message,
    details
  ) VALUES (
    'debug',
    debug_type || ': ' || message,
    details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test moderation
CREATE OR REPLACE FUNCTION test_moderation(
  p_post_id text,
  p_message text,
  p_page_id text
)
RETURNS jsonb AS $$
DECLARE
  moderation_result jsonb;
  config_record RECORD;
  request jsonb;
BEGIN
  -- Log start
  PERFORM debug_moderation('TEST_START', 'Starting moderation test', jsonb_build_object(
    'post_id', p_post_id,
    'message', p_message,
    'page_id', p_page_id
  ));

  -- Get config and log it
  SELECT * INTO config_record
  FROM auto_engines
  WHERE page_id = p_page_id
    AND type = 'moderation'
    AND status = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;

  PERFORM debug_moderation('CONFIG', 'Retrieved moderation config', jsonb_build_object(
    'config', config_record.config,
    'engine_id', config_record.id,
    'status', config_record.status
  ));

  -- Build request and log it
  request := jsonb_build_object(
    'content', jsonb_build_object(
      'text', p_message,
      'type', 'post',
      'media', jsonb_build_object(
        'images', null,
        'videos', null
      ),
      'post_id', p_post_id
    ),
    'moderation_settings', jsonb_build_object(
      'auto_actions', jsonb_build_object(
        'autoHide', COALESCE((config_record.config->>'autoHide')::boolean, true),
        'autoCorrect', COALESCE((config_record.config->>'autoCorrect')::boolean, false)
      )
    ),
    'violation_thresholds', jsonb_build_object(
      'confidence_threshold', COALESCE((config_record.config->>'confidenceThreshold')::numeric / 100, 0.95)
    )
  );

  PERFORM debug_moderation('REQUEST', 'Built moderation request', request);

  -- Call moderation
  moderation_result := moderate_facebook_post(
    p_post_id,
    p_message,
    p_page_id
  );

  -- Log result
  PERFORM debug_moderation('RESULT', 'Got moderation result', moderation_result);

  RETURN jsonb_build_object(
    'request', request,
    'config', config_record.config,
    'result', moderation_result
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    PERFORM debug_moderation('ERROR', SQLERRM, jsonb_build_object(
      'error_detail', SQLSTATE,
      'error_hint', SQLERRM,
      'error_context', SQLSTATE
    ));
    
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'state', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION debug_moderation TO authenticated;
GRANT EXECUTE ON FUNCTION test_moderation TO authenticated;