/*
  # Update webhook processing to use facebook_posts

  1. Changes
    - Modify process_webhook_log to insert into facebook_posts instead of new_posts
    - Add connection_id lookup for proper relationship tracking
    - Keep violation checking functionality unchanged
  
  2. Details
    - Insert new posts into facebook_posts with pending status
    - Link posts to facebook_connections via connection_id
    - Maintain existing comment and violation processing
*/

-- Create or replace the process_webhook_log function
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
  connection_record RECORD;
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

            -- Get connection_id for the page
            SELECT * INTO connection_record
            FROM facebook_connections
            WHERE page_id = page_id
            ORDER BY created_at DESC
            LIMIT 1;
            
            -- Insert into facebook_posts table
            INSERT INTO facebook_posts (
              page_id,
              post_id,
              message,
              created_time,
              status,
              connection_id,
              user_id
            )
            VALUES (
              page_id,
              post_id,
              message,
              created_time,
              'pending',
              connection_record.id,
              connection_record.user_id
            )
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS webhook_logs_after_insert_trigger ON webhook_logs;
CREATE TRIGGER webhook_logs_after_insert_trigger
  AFTER INSERT ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION process_webhook_log();