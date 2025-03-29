/*
  # Add base moderation functions
  
  1. New Functions
    - moderate_facebook_post: Sends post content to OpenAI Assistant for moderation
    - handle_moderation_result: Processes moderation result and takes actions
*/

-- Function to call OpenAI Assistant
CREATE OR REPLACE FUNCTION moderate_facebook_post(
  post_id text,
  content text,
  page_id text
)
RETURNS jsonb AS $$
DECLARE
  api_key text := current_setting('app.settings.openai_api_key', true);
  assistant_id text := 'asst_6HkmqiPpvSozJ075shC4CIUw';
  vector_store_id text := 'vs_67e0d81d36c88191bcbebff029bab221';
  request jsonb;
  response jsonb;
BEGIN
  -- Get moderation config
  SELECT config INTO request
  FROM auto_engines
  WHERE page_id = page_id
    AND type = 'moderation'
    AND status = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Build request payload
  request := jsonb_build_object(
    'content', jsonb_build_object(
      'text', content,
      'type', 'post',
      'media', jsonb_build_object(
        'images', null,
        'videos', null
      ),
      'post_id', post_id
    ),
    'moderation_settings', jsonb_build_object(
      'auto_actions', jsonb_build_object(
        'autoHide', COALESCE((request->>'autoHide')::boolean, true),
        'autoCorrect', COALESCE((request->>'autoCorrect')::boolean, false)
      )
    ),
    'violation_thresholds', jsonb_build_object(
      'confidence_threshold', COALESCE((request->>'confidenceThreshold')::numeric / 100, 0.95)
    )
  );

  -- Call OpenAI Assistant
  SELECT content INTO response
  FROM http((
    'POST',
    'https://api.openai.com/v1/assistants/' || assistant_id || '/runs',
    ARRAY[
      http_header('Authorization', 'Bearer ' || api_key),
      http_header('Content-Type', 'application/json'),
      http_header('OpenAI-Beta', 'assistants=v1')
    ],
    'application/json',
    jsonb_build_object(
      'assistant_id', assistant_id,
      'model', 'gpt-4',
      'tools', ARRAY[
        jsonb_build_object(
          'type', 'retrieval',
          'id', vector_store_id
        )
      ],
      'messages', ARRAY[
        jsonb_build_object(
          'role', 'user',
          'content', request::text
        )
      ]
    )::text
  ));

  RETURN response;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'request', request
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle moderation result
CREATE OR REPLACE FUNCTION handle_moderation_result(
  result jsonb,
  page_id text,
  post_id text,
  access_token text
)
RETURNS jsonb AS $$
DECLARE
  analysis jsonb;
  actions jsonb;
  success boolean := false;
  message text;
BEGIN
  -- Extract analysis and actions
  analysis := result->'analysis';
  actions := result->'actions';
  
  -- Take action based on result
  IF (analysis->>'violates')::boolean THEN
    IF actions->>'action_taken' = 'fix' AND (actions->>'fixed_content') IS NOT NULL THEN
      -- Update post content
      PERFORM http((
        'POST',
        'https://graph.facebook.com/v19.0/' || post_id,
        ARRAY[http_header('Content-Type', 'application/json')],
        'application/json',
        jsonb_build_object(
          'message', actions->>'fixed_content',
          'access_token', access_token
        )::text
      ));
      success := true;
      message := 'Post content updated';
    ELSIF actions->>'action_taken' = 'hide' THEN
      -- Hide post
      PERFORM http((
        'POST',
        'https://graph.facebook.com/v19.0/' || post_id,
        ARRAY[http_header('Content-Type', 'application/json')],
        'application/json',
        jsonb_build_object(
          'is_hidden', true,
          'access_token', access_token
        )::text
      ));
      success := true;
      message := 'Post hidden';
    END IF;
  ELSE
    success := true;
    message := 'No violation detected';
  END IF;

  RETURN jsonb_build_object(
    'success', success,
    'message', message,
    'analysis', analysis,
    'actions', actions
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;