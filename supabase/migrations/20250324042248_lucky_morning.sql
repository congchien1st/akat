/*
  # Update moderation function to use prompts
  
  1. Changes
    - Update moderate_facebook_post to use prompts instead of Assistant
    - Add proper error handling and logging
    - Keep same response format for compatibility
*/

-- Function to call OpenAI with prompts
CREATE OR REPLACE FUNCTION moderate_facebook_post(
  post_id text,
  content text,
  page_id text
)
RETURNS jsonb AS $$
DECLARE
  api_key text := current_setting('app.settings.openai_api_key', true);
  request jsonb;
  response jsonb;
  prompt text;
  result jsonb;
BEGIN
  -- Get moderation config
  SELECT config INTO request
  FROM auto_engines
  WHERE page_id = page_id
    AND type = 'moderation'
    AND status = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Build system prompt
  prompt := COALESCE(request->>'prompt', 'You are a content moderation system for Facebook posts. Your task is to analyze the content of posts and determine if they violate community standards.

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
  "analysis": {
    "violates": boolean,
    "confidence": number between 0 and 1,
    "violation_type": string or null,
    "reason": string or null,
    "severity": "high" | "medium" | "low"
  },
  "actions": {
    "action_taken": "fix" | "hide",
    "recommendation": string,
    "fixed_content": string or null,
    "reason": string
  }
}

Where:
- "violates" is true if the post violates community standards, false otherwise
- "confidence" is your confidence level in the assessment (0.0 to 1.0)
- "violation_type" is the category of violation (one of the 8 listed above), or null if no violation
- "reason" is a brief explanation of why the post violates standards, or null if no violation
- "severity" indicates how serious the violation is
- "action_taken" should be "fix" if the content can be fixed, "hide" if it should be hidden
- "fixed_content" contains the corrected version if action is "fix"

Be thorough but fair in your assessment. If you are unsure, err on the side of caution.');

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

  -- Call OpenAI API
  SELECT content INTO response
  FROM http((
    'POST',
    'https://api.openai.com/v1/chat/completions',
    ARRAY[
      http_header('Authorization', 'Bearer ' || api_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    jsonb_build_object(
      'model', 'gpt-4',
      'messages', ARRAY[
        jsonb_build_object(
          'role', 'system',
          'content', prompt
        ),
        jsonb_build_object(
          'role', 'user',
          'content', request::text
        )
      ],
      'temperature', 0.1,
      'response_format', jsonb_build_object(
        'type', 'json_object'
      )
    )::text
  ));

  -- Parse response
  result := response->'choices'->0->'message'->>'content';

  -- Log the moderation attempt
  INSERT INTO automation_logs (
    level,
    message,
    details
  ) VALUES (
    'debug',
    'Content moderation completed',
    jsonb_build_object(
      'post_id', post_id,
      'request', request,
      'result', result
    )
  );

  RETURN result::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO automation_logs (
      level,
      message,
      details
    ) VALUES (
      'error',
      'Content moderation failed: ' || SQLERRM,
      jsonb_build_object(
        'post_id', post_id,
        'request', request,
        'error', SQLERRM,
        'error_detail', SQLSTATE
      )
    );

    -- Return error response
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'request', request
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;