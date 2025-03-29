/*
  # Remove moderation_prompts table and update functions

  1. Changes
    - Drop moderation_prompts table
    - Update process_webhook_log function to use config from automations
    - Update check_content_violation function to use automation config
*/

-- Drop moderation_prompts table
DROP TABLE IF EXISTS moderation_prompts;

-- Update check_content_violation function to use automation config
CREATE OR REPLACE FUNCTION check_content_violation(content text, page_id text)
RETURNS jsonb AS $$
DECLARE
  api_key text := current_setting('app.settings.openai_api_key', true);
  automation_config jsonb;
  response jsonb;
  result jsonb;
BEGIN
  -- Get automation config for the page
  SELECT config INTO automation_config
  FROM auto_engines ae
  WHERE ae.page_id = page_id
  AND ae.status = 'active'
  AND ae.type = 'moderation'
  ORDER BY created_at DESC
  LIMIT 1;

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
            'content', COALESCE(
              automation_config->>'prompt',
              'You are a content moderation system. Analyze the following content for violations of community standards. Respond with a JSON object with the following fields: "violates" (boolean), "violation_type" (string or null), "confidence" (number between 0 and 1).'
            )
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

-- Update process_webhook_log function to use updated check_content_violation
CREATE OR REPLACE FUNCTION process_webhook_log()
RETURNS TRIGGER AS $$
DECLARE
  entry jsonb;
  change jsonb;
  page_id text;
  post_id text;
  comment_id text;
  message text;
  created_time timestamptz;
  violation_check jsonb;
  sender_info jsonb;
BEGIN
  -- Mark the webhook as processed
  UPDATE webhook_logs
  SET processed = true, processed_at = now()
  WHERE id = NEW.id;

  -- Process only Facebook page webhooks
  IF NEW.source = 'facebook' AND NEW.event_type = 'page' THEN
    -- Loop through each entry in the webhook
    FOR entry IN SELECT jsonb_array_elements(NEW.payload->'entry')
    LOOP
      page_id := entry->>'id';
      
      -- Loop through each change in the entry
      FOR change IN SELECT jsonb_array_elements(entry->'changes')
      LOOP
        -- Handle feed changes (posts, comments)
        IF change->'field' = '"feed"' THEN
          -- Handle new posts
          IF change->'value'->'item' = '"post"' AND change->'value'->'verb' = '"add"' THEN
            post_id := change->'value'->>'post_id';
            message := change->'value'->>'message';
            
            -- Try to parse created_time, default to current time if it fails
            BEGIN
              created_time := (change->'value'->>'created_time')::timestamptz;
            EXCEPTION WHEN OTHERS THEN
              created_time := now();
            END;
            
            -- Insert into new_posts table
            INSERT INTO new_posts (page_id, post_id, message, created_time, webhook_log_id)
            VALUES (page_id, post_id, message, created_time, NEW.id)
            ON CONFLICT (post_id) DO NOTHING;
          
          -- Handle new comments
          ELSIF change->'value'->'item' = '"comment"' AND change->'value'->'verb' = '"add"' THEN
            post_id := change->'value'->>'post_id';
            comment_id := change->'value'->>'comment_id';
            message := change->'value'->>'message';
            
            -- Try to parse created_time
            BEGIN
              created_time := (change->'value'->>'created_time')::timestamptz;
            EXCEPTION WHEN OTHERS THEN
              created_time := now();
            END;

            -- Build sender info
            sender_info := jsonb_build_object(
              'id', change->'value'->'from'->>'id',
              'name', change->'value'->'from'->>'name'
            );

            -- Insert into facebook_comments table
            INSERT INTO facebook_comments (
              page_id,
              post_id,
              comment_id,
              message,
              created_time,
              sender_info
            )
            VALUES (
              page_id,
              post_id,
              comment_id,
              message,
              created_time,
              sender_info
            )
            ON CONFLICT (comment_id) DO NOTHING;
            
            -- Check for content violations using page-specific config
            violation_check := check_content_violation(message, page_id);
            
            -- If content violates standards, insert into violations table
            IF (violation_check->>'violates')::boolean = true THEN
              INSERT INTO violations (
                page_id, 
                post_id, 
                comment_id, 
                content, 
                violation_type, 
                confidence, 
                webhook_log_id
              )
              VALUES (
                page_id,
                post_id,
                comment_id,
                message,
                violation_check->>'violation_type',
                (violation_check->>'confidence')::numeric,
                NEW.id
              );
              
              -- Notify through Supabase Realtime
              PERFORM pg_notify(
                'new_violation',
                jsonb_build_object(
                  'page_id', page_id,
                  'post_id', post_id,
                  'comment_id', comment_id,
                  'content', message,
                  'violation_type', violation_check->>'violation_type',
                  'confidence', (violation_check->>'confidence')::numeric
                )::text
              );
            END IF;
          END IF;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;