/*
  # Fix auto_engines table configuration

  1. Changes
    - Drop and recreate auto_engines table with proper columns
    - Add default moderation config function
    - Set up RLS policies
    - Insert default engines for existing pages
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing auto_engines table and recreate it with all columns
DROP TABLE IF EXISTS auto_engines CASCADE;

CREATE TABLE auto_engines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  page_id text NOT NULL,
  engine_type text NOT NULL DEFAULT 'moderation',
  engine_status text NOT NULL DEFAULT 'active',
  schedule jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  engine_config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT auto_engines_status_check CHECK (engine_status IN ('active', 'paused', 'stopped')),
  CONSTRAINT auto_engines_type_check CHECK (engine_type IN ('comment', 'message', 'post', 'ads', 'seeding', 'moderation'))
);

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

-- Enable RLS
ALTER TABLE auto_engines ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can read own auto engines through facebook connections" ON auto_engines;
  DROP POLICY IF EXISTS "Users can insert own auto engines" ON auto_engines;
  DROP POLICY IF EXISTS "Users can update own auto engines" ON auto_engines;

  -- Create new policies
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
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auto_engines_page_id ON auto_engines(page_id);
CREATE INDEX IF NOT EXISTS idx_auto_engines_status ON auto_engines(engine_status);
CREATE INDEX IF NOT EXISTS idx_auto_engines_type ON auto_engines(engine_type);

-- Insert default moderation engines for existing pages
DO $$
DECLARE
  page_record RECORD;
BEGIN
  FOR page_record IN 
    SELECT DISTINCT fc.page_id 
    FROM facebook_connections fc
    WHERE NOT EXISTS (
      SELECT 1 FROM auto_engines ae 
      WHERE ae.page_id = fc.page_id 
      AND ae.engine_type = 'moderation'
    )
  LOOP
    INSERT INTO auto_engines (
      name,
      description,
      page_id,
      engine_type,
      engine_status,
      engine_config
    ) VALUES (
      'Content Moderation',
      'Automated content moderation for Facebook page',
      page_record.page_id,
      'moderation',
      'active',
      get_default_moderation_config()
    );
  END LOOP;
END $$;