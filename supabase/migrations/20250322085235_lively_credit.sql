/*
  # Fix auto engines table and configuration

  1. Changes
    - Drop and recreate auto_engines table with correct structure
    - Add RLS policies
    - Create indexes
    - Insert default configurations
*/

-- Enable http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Drop and recreate auto_engines table with correct columns
DROP TABLE IF EXISTS auto_engines CASCADE;

CREATE TABLE auto_engines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  page_id text NOT NULL,
  type text NOT NULL DEFAULT 'moderation',
  status text NOT NULL DEFAULT 'active',
  schedule jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT auto_engines_status_check CHECK (status IN ('active', 'paused', 'stopped')),
  CONSTRAINT auto_engines_type_check CHECK (type IN ('comment', 'message', 'post', 'ads', 'seeding', 'moderation'))
);

-- Enable RLS
ALTER TABLE auto_engines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own auto engines through facebook connections"
  ON auto_engines
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = auto_engines.page_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own auto engines"
  ON auto_engines
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = page_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own auto engines"
  ON auto_engines
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = auto_engines.page_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_auto_engines_page_id ON auto_engines(page_id);
CREATE INDEX idx_auto_engines_status ON auto_engines(status);
CREATE INDEX idx_auto_engines_type ON auto_engines(type);

-- Create function to get default moderation config
CREATE OR REPLACE FUNCTION get_default_moderation_config()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'autoHide', true,
    'autoCorrect', false,
    'confidenceThreshold', 90,
    'prompt', 'You are a content moderation system for Facebook posts. Your task is to analyze the content of posts and determine if they violate community standards.

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

Be thorough but fair in your assessment. If you are unsure, err on the side of caution.'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Insert default moderation engines for existing pages
INSERT INTO auto_engines (
  name,
  description,
  page_id,
  type,
  status,
  config
)
SELECT DISTINCT ON (fc.page_id)
  'Content Moderation',
  'Automated content moderation for Facebook page',
  fc.page_id,
  'moderation',
  'active',
  get_default_moderation_config()
FROM facebook_connections fc
WHERE NOT EXISTS (
  SELECT 1 FROM auto_engines ae 
  WHERE ae.page_id = fc.page_id 
  AND ae.type = 'moderation'
);