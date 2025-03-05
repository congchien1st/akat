-- Create function to manually process a webhook log
CREATE OR REPLACE FUNCTION manually_process_webhook_log(log_id uuid)
RETURNS boolean AS $$
DECLARE
  log_record webhook_logs%ROWTYPE;
BEGIN
  -- Get the webhook log
  SELECT * INTO log_record FROM webhook_logs WHERE id = log_id;
  
  -- If log not found, return false
  IF log_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- If log is already processed, return true
  IF log_record.processed THEN
    RETURN true;
  END IF;
  
  -- Trigger the process_webhook_log function manually
  PERFORM process_webhook_log_manually(log_record);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually process a webhook log (internal implementation)
CREATE OR REPLACE FUNCTION process_webhook_log_manually(log_record webhook_logs)
RETURNS void AS $$
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
  WHERE id = log_record.id;

  -- Process only Facebook page webhooks
  IF log_record.source = 'facebook' AND log_record.event_type = 'page' THEN
    -- Loop through each entry in the webhook
    FOR entry IN SELECT jsonb_array_elements(log_record.payload->'entry')
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
            VALUES (page_id, post_id, message, created_time, log_record.id)
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
                log_record.id
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
END;
$$ LANGUAGE plpgsql;