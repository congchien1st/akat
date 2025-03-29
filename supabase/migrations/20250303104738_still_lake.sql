-- Create webhook_configs table
CREATE TABLE IF NOT EXISTS webhook_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL UNIQUE,
  verify_token text NOT NULL,
  webhook_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create facebook_comments table
CREATE TABLE IF NOT EXISTS facebook_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL,
  post_id text NOT NULL,
  comment_id text NOT NULL UNIQUE,
  message text,
  created_time timestamptz NOT NULL,
  sender_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_configs
CREATE POLICY "Users can read webhook configs"
  ON webhook_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert webhook configs"
  ON webhook_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update webhook configs"
  ON webhook_configs
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for facebook_comments
CREATE POLICY "Users can read facebook comments"
  ON facebook_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert facebook comments"
  ON facebook_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_configs_page_id ON webhook_configs(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_comments_page_id ON facebook_comments(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_comments_post_id ON facebook_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_facebook_comments_comment_id ON facebook_comments(comment_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at column
CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_comments_updated_at
  BEFORE UPDATE ON facebook_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();