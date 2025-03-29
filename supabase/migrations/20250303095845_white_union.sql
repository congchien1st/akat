/*
  # Auto Engine Tables

  1. New Tables
    - `auto_engines` - Stores auto engine configurations
    - `auto_engine_executions` - Stores execution history for auto engines
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create auto_engines table
CREATE TABLE IF NOT EXISTS auto_engines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  page_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'paused', 'stopped')),
  schedule jsonb NOT NULL,
  actions jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create auto_engine_executions table
CREATE TABLE IF NOT EXISTS auto_engine_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id uuid REFERENCES auto_engines(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  results jsonb,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auto_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_engine_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for auto_engines
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

CREATE POLICY "Users can delete own auto engines"
  ON auto_engines
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = auto_engines.page_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

-- Create policies for auto_engine_executions
CREATE POLICY "Users can read own auto engine executions"
  ON auto_engine_executions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auto_engines
      JOIN facebook_connections ON auto_engines.page_id = facebook_connections.page_id
      WHERE auto_engines.id = auto_engine_executions.engine_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own auto engine executions"
  ON auto_engine_executions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auto_engines
      JOIN facebook_connections ON auto_engines.page_id = facebook_connections.page_id
      WHERE auto_engines.id = engine_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own auto engine executions"
  ON auto_engine_executions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auto_engines
      JOIN facebook_connections ON auto_engines.page_id = facebook_connections.page_id
      WHERE auto_engines.id = auto_engine_executions.engine_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auto_engines_page_id ON auto_engines(page_id);
CREATE INDEX IF NOT EXISTS idx_auto_engines_status ON auto_engines(status);
CREATE INDEX IF NOT EXISTS idx_auto_engine_executions_engine_id ON auto_engine_executions(engine_id);
CREATE INDEX IF NOT EXISTS idx_auto_engine_executions_status ON auto_engine_executions(status);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_auto_engines_updated_at
  BEFORE UPDATE ON auto_engines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();