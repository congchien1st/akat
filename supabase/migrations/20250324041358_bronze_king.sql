/*
  # Add moderation trigger
  
  1. New Functions
    - update_facebook_post: Updates post with moderation result
  
  2. Triggers
    - facebook_posts_moderation_trigger: Triggers moderation for new pending posts
*/

-- Function to update post with moderation result
CREATE OR REPLACE FUNCTION update_facebook_post()
RETURNS TRIGGER AS $$
DECLARE
  moderation_result jsonb;
  action_result jsonb;
  connection_record RECORD;
BEGIN
  -- Only process pending posts
  IF NEW.status = 'pending' THEN
    -- Get connection info for access token
    SELECT * INTO connection_record
    FROM facebook_connections
    WHERE id = NEW.connection_id;

    -- Call moderation
    moderation_result := moderate_facebook_post(
      NEW.post_id,
      NEW.message,
      NEW.page_id
    );

    -- Handle result and take action
    action_result := handle_moderation_result(
      moderation_result,
      NEW.page_id,
      NEW.post_id,
      connection_record.access_token
    );

    -- Update post status and result
    UPDATE facebook_posts
    SET
      status = CASE
        WHEN (moderation_result->'analysis'->>'violates')::boolean THEN 'violated'
        ELSE 'approved'
      END,
      moderation_result = moderation_result,
      moderated_at = now()
    WHERE id = NEW.id;

    -- Log the moderation
    INSERT INTO automation_logs (
      level,
      message,
      details
    ) VALUES (
      CASE WHEN action_result->>'success' THEN 'info' ELSE 'error' END,
      action_result->>'message',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'moderation_result', moderation_result,
        'action_result', action_result
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post moderation
DROP TRIGGER IF EXISTS facebook_posts_moderation_trigger ON facebook_posts;
CREATE TRIGGER facebook_posts_moderation_trigger
  AFTER INSERT OR UPDATE ON facebook_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_facebook_post();