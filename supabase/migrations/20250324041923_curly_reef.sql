/*
  # Update moderation function to use OpenAI Assistant v2
  
  1. Changes
    - Update moderate_facebook_post to use Assistant API v2
    - Add thread management
    - Add proper error handling
*/

-- Function to call OpenAI Assistant v2
CREATE OR REPLACE FUNCTION moderate_facebook_post(
  post_id text,
  content text,
  page_id text
)
RETURNS jsonb AS $$
DECLARE
  api_key text := current_setting('app.settings.openai_api_key', true);
  assistant_id text := 'asst_6HkmqiPpvSozJ075shC4CIUw';
  request jsonb;
  thread_response jsonb;
  thread_id text;
  run_response jsonb;
  run_id text;
  run_status text;
  messages_response jsonb;
  result jsonb;
  max_retries integer := 10;
  retry_count integer := 0;
  retry_delay integer := 1; -- seconds
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

  -- Create thread
  SELECT content INTO thread_response
  FROM http((
    'POST',
    'https://api.openai.com/v2/threads',
    ARRAY[
      http_header('Authorization', 'Bearer ' || api_key),
      http_header('Content-Type', 'application/json'),
      http_header('OpenAI-Beta', 'assistants=v1')
    ],
    'application/json',
    '{}'::text
  ));

  thread_id := thread_response->>'id';

  -- Add message to thread
  PERFORM http((
    'POST',
    'https://api.openai.com/v2/threads/' || thread_id || '/messages',
    ARRAY[
      http_header('Authorization', 'Bearer ' || api_key),
      http_header('Content-Type', 'application/json'),
      http_header('OpenAI-Beta', 'assistants=v1')
    ],
    'application/json',
    jsonb_build_object(
      'role', 'user',
      'content', request::text
    )::text
  ));

  -- Create run
  SELECT content INTO run_response
  FROM http((
    'POST',
    'https://api.openai.com/v2/threads/' || thread_id || '/runs',
    ARRAY[
      http_header('Authorization', 'Bearer ' || api_key),
      http_header('Content-Type', 'application/json'),
      http_header('OpenAI-Beta', 'assistants=v1')
    ],
    'application/json',
    jsonb_build_object(
      'assistant_id', assistant_id
    )::text
  ));

  run_id := run_response->>'id';

  -- Poll run status until completed
  LOOP
    -- Get run status
    SELECT content->>'status' INTO run_status
    FROM http((
      'GET',
      'https://api.openai.com/v2/threads/' || thread_id || '/runs/' || run_id,
      ARRAY[
        http_header('Authorization', 'Bearer ' || api_key),
        http_header('OpenAI-Beta', 'assistants=v1')
      ]
    ));

    EXIT WHEN run_status = 'completed' OR run_status = 'failed' OR retry_count >= max_retries;
    
    -- Wait before next retry
    PERFORM pg_sleep(retry_delay);
    retry_count := retry_count + 1;
  END LOOP;

  -- Get messages
  IF run_status = 'completed' THEN
    SELECT content INTO messages_response
    FROM http((
      'GET',
      'https://api.openai.com/v2/threads/' || thread_id || '/messages',
      ARRAY[
        http_header('Authorization', 'Bearer ' || api_key),
        http_header('OpenAI-Beta', 'assistants=v1')
      ]
    ));

    -- Parse assistant's response
    result := (messages_response->'data'->0->'content'->0->>'text')::jsonb;
  ELSE
    result := jsonb_build_object(
      'error', 'Run failed or timed out',
      'status', run_status,
      'retries', retry_count
    );
  END IF;

  -- Clean up thread
  PERFORM http((
    'DELETE',
    'https://api.openai.com/v2/threads/' || thread_id,
    ARRAY[
      http_header('Authorization', 'Bearer ' || api_key),
      http_header('OpenAI-Beta', 'assistants=v1')
    ]
  ));

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'request', request
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;