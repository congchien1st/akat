-- Create a function to handle null values in Facebook page data
CREATE OR REPLACE FUNCTION handle_null_page_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle null values for avatar_url
  IF NEW.page_avatar_url IS NULL THEN
    NEW.page_avatar_url := NULL;
  END IF;
  
  -- Handle null values for follower_count
  IF NEW.follower_count IS NULL THEN
    NEW.follower_count := 0;
  END IF;
  
  -- Handle null values for page_url
  IF NEW.page_url IS NULL THEN
    NEW.page_url := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to handle null values in facebook_page_details
DROP TRIGGER IF EXISTS handle_null_page_data_trigger ON facebook_page_details;
CREATE TRIGGER handle_null_page_data_trigger
  BEFORE INSERT OR UPDATE ON facebook_page_details
  FOR EACH ROW
  EXECUTE FUNCTION handle_null_page_data();

-- Create a function to log connection activities
CREATE OR REPLACE FUNCTION log_connection_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO automation_logs (
    event_type,
    payload,
    status
  ) VALUES (
    CASE
      WHEN TG_OP = 'INSERT' THEN 'connection_created'
      WHEN TG_OP = 'UPDATE' AND NEW.status = 'connected' AND OLD.status = 'disconnected' THEN 'connection_activated'
      WHEN TG_OP = 'UPDATE' AND NEW.status = 'disconnected' AND OLD.status = 'connected' THEN 'connection_deactivated'
      ELSE 'connection_updated'
    END,
    jsonb_build_object(
      'connection_id', NEW.id,
      'page_id', NEW.page_id,
      'status', NEW.status,
      'user_id', NEW.user_id
    ),
    'success'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If logging fails, still allow the operation to succeed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to log connection activities
DROP TRIGGER IF EXISTS log_connection_activity_trigger ON facebook_connections;
CREATE TRIGGER log_connection_activity_trigger
  AFTER INSERT OR UPDATE ON facebook_connections
  FOR EACH ROW
  EXECUTE FUNCTION log_connection_activity();