/*
  # Facebook Post Monitoring System

  1. New Tables
    - `facebook_posts` - Stores posts from Facebook pages
    - `moderation_prompts` - Stores prompts for OpenAI moderation
    - `notification_logs` - Logs of notifications sent
    - `error_logs` - Logs of errors that occur during processing
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create facebook_posts table
CREATE TABLE IF NOT EXISTS facebook_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL,
  post_id text NOT NULL UNIQUE,
  message text,
  created_time timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'violated')),
  moderation_result jsonb,
  moderated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create moderation_prompts table
CREATE TABLE IF NOT EXISTS moderation_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES facebook_posts(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE facebook_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for facebook_posts
CREATE POLICY "Users can read facebook posts"
  ON facebook_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert facebook posts"
  ON facebook_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update facebook posts"
  ON facebook_posts
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for moderation_prompts
CREATE POLICY "Users can read moderation prompts"
  ON moderation_prompts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert moderation prompts"
  ON moderation_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update moderation prompts"
  ON moderation_prompts
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for notification_logs
CREATE POLICY "Users can read notification logs"
  ON notification_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert notification logs"
  ON notification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for error_logs
CREATE POLICY "Users can read error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_posts_page_id ON facebook_posts(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_post_id ON facebook_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_status ON facebook_posts(status);
CREATE INDEX IF NOT EXISTS idx_moderation_prompts_active ON moderation_prompts(active);
CREATE INDEX IF NOT EXISTS idx_notification_logs_post_id ON notification_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);

-- Insert default moderation prompt
INSERT INTO moderation_prompts (prompt, active)
VALUES (
  'You are a content moderation system for Facebook posts. Your task is to analyze the content of posts and determine if they violate community standards.

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
    "violates": boolean,
    "category": string or null,
    "reason": string or null,
    "confidence": number between 0 and 1
  }

  Where:
  - "violates" is true if the post violates community standards, false otherwise
  - "category" is the category of violation (one of the 8 listed above), or null if no violation
  - "reason" is a brief explanation of why the post violates standards, or null if no violation
  - "confidence" is your confidence level in the assessment (0.0 to 1.0)

  Be thorough but fair in your assessment. If you are unsure, err on the side of caution.',
  true
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at column
CREATE TRIGGER update_facebook_posts_updated_at
  BEFORE UPDATE ON facebook_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_prompts_updated_at
  BEFORE UPDATE ON moderation_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();