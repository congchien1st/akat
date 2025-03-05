/*
  # Create webhook processing tables and triggers

  1. New Tables
    - `webhook_logs` - Stores raw webhook data
    - `new_posts` - Stores new Facebook posts
    - `violations` - Stores content violations
  
  2. Functions
    - `process_webhook_log` - Processes webhook data
    - `check_content_violation` - Checks content for violations using OpenAI
    - `call_seeding_api` - Calls the seeding API for new posts
  
  3. Triggers
    - `webhook_logs_after_insert_trigger` - Processes webhooks after insertion
*/

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create new_posts table
CREATE TABLE IF NOT EXISTS new_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL,
  post_id text NOT NULL UNIQUE,
  message text,
  created_time timestamptz NOT NULL,
  webhook_log_id uuid REFERENCES webhook_logs(id),
  seeding_called boolean DEFAULT false,
  seeding_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create violations table
CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL,
  post_id text,
  comment_id text,
  content text NOT NULL,
  violation_type text NOT NULL,
  confidence numeric,
  webhook_log_id uuid REFERENCES webhook_logs(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to authenticated users for webhook_logs"
  ON webhook_logs
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow all access to authenticated users for new_posts"
  ON new_posts
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow all access to authenticated users for violations"
  ON violations
  FOR ALL
  TO authenticated
  USING (true);

-- Create function to check content for violations using OpenAI
CREATE OR REPLACE FUNCTION check_content_violation(content text)
RETURNS jsonb AS $$
DECLARE
  api_key text := current_setting('app.settings.openai_api_key', true);
  response jsonb;
  result jsonb;
BEGIN
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
            'content', 'You are a content moderation system. Analyze the following content for violations of community standards. Respond with a JSON object with the following fields: "violates" (boolean), "violation_type" (string or null), "confidence" (number between 0 and 1).'
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

-- Create function to call seeding API
CREATE OR REPLACE FUNCTION call_seeding_api(page_id text, post_id text, message text)
RETURNS jsonb AS $$
DECLARE
  seeding_url text := current_setting('app.settings.seeding_api_url', true);
  response jsonb;
BEGIN
  -- If no seeding URL is set, return a default response
  IF seeding_url IS NULL OR seeding_url = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No seeding API URL configured'
    );
  END IF;

  -- Call the seeding API
  SELECT
    content INTO response
  FROM
    http((
      'POST',
      seeding_url,
      ARRAY[http_header('Content-Type', 'application/json')],
      'application/json',
      jsonb_build_object(
        'page_id', page_id,
        'post_id', post_id,
        'message', message
      )::text
    ));

  RETURN response;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information in case of failure
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to call seeding API: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to process webhook logs
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
            ON CONFLICT (post_id) DO NOTHING
            RETURNING id INTO post_id;
            
            -- Call seeding API for the new post
            IF post_id IS NOT NULL THEN
              UPDATE new_posts
              SET 
                seeding_called = true,
                seeding_response = call_seeding_api(page_id, post_id, message)
              WHERE post_id = post_id;
            END IF;
          
          -- Handle new comments
          ELSIF change->'value'->'item' = '"comment"' AND change->'value'->'verb' = '"add"' THEN
            post_id := change->'value'->>'post_id';
            comment_id := change->'value'->>'comment_id';
            message := change->'value'->>'message';
            
            -- Check for content violations
            violation_check := check_content_violation(message);
            
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

-- Create trigger to process webhook logs after insertion
DROP TRIGGER IF EXISTS webhook_logs_after_insert_trigger ON webhook_logs;
CREATE TRIGGER webhook_logs_after_insert_trigger
  AFTER INSERT ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION process_webhook_log();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_new_posts_page_id ON new_posts(page_id);
CREATE INDEX IF NOT EXISTS idx_new_posts_post_id ON new_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_violations_page_id ON violations(page_id);
CREATE INDEX IF NOT EXISTS idx_violations_comment_id ON violations(comment_id);