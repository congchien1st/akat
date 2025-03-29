/*
# Add webhook comment processing

1. Changes
- Add trigger to process comments from webhook logs
- Store comments in facebook_comments table
- Keep existing post and violation processing

2. Details
- When a webhook log is received:
  - For posts: Add to new_posts table (existing)
  - For comments: Add to facebook_comments table (new)
  - For violations: Add to violations table (existing)
*/

-- Update the process_webhook_log function to handle comments
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS webhook_logs_after_insert_trigger ON webhook_logs;
CREATE TRIGGER webhook_logs_after_insert_trigger
  AFTER INSERT ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION process_webhook_log();