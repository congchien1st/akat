/*
  # Create Automation System Tables

  1. New Tables
    - automation_types: Defines automation types and schemas
    - automation_configs: Stores automation configurations per page
    - automation_tasks: Tracks automation task execution
    - automation_logs: Logs automation activity
    - automation_templates: Stores reusable templates

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS automation_logs CASCADE;
DROP TABLE IF EXISTS automation_tasks CASCADE;
DROP TABLE IF EXISTS automation_templates CASCADE;
DROP TABLE IF EXISTS automation_configs CASCADE;
DROP TABLE IF EXISTS automation_types CASCADE;

-- Create automation_types table first since it's referenced by others
CREATE TABLE automation_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  config_schema jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create automation_configs table
CREATE TABLE automation_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL,
  type_id uuid REFERENCES automation_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (page_id, type_id)
);

-- Create automation_tasks table
CREATE TABLE automation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES automation_configs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 0,
  scheduled_for timestamptz NOT NULL,
  input_data jsonb NOT NULL DEFAULT '{}',
  output_data jsonb,
  error text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT automation_tasks_status_check CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'cancelled')
  )
);

-- Create automation_templates table
CREATE TABLE automation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id uuid REFERENCES automation_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  content text NOT NULL,
  variables jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create automation_logs table last since it references automation_tasks
CREATE TABLE automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_task_id uuid REFERENCES automation_tasks(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT automation_logs_level_check CHECK (
    level IN ('debug', 'info', 'warning', 'error')
  )
);

-- Enable RLS
ALTER TABLE automation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to automation types"
  ON automation_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own page automation configs"
  ON automation_configs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_connections
      WHERE facebook_connections.page_id = automation_configs.page_id
      AND facebook_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage tasks for own configs"
  ON automation_tasks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM automation_configs ac
      JOIN facebook_connections fc ON fc.page_id = ac.page_id
      WHERE ac.id = automation_tasks.config_id
      AND fc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read logs for own tasks"
  ON automation_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM automation_tasks at
      JOIN automation_configs ac ON ac.id = at.config_id
      JOIN facebook_connections fc ON fc.page_id = ac.page_id
      WHERE at.id = automation_logs.automation_task_id
      AND fc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage templates for own types"
  ON automation_templates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM automation_types at
      WHERE at.id = automation_templates.type_id
    )
  );

-- Create indexes
CREATE INDEX idx_automation_configs_page_id ON automation_configs(page_id);
CREATE INDEX idx_automation_configs_type_id ON automation_configs(type_id);
CREATE INDEX idx_automation_tasks_config_id ON automation_tasks(config_id);
CREATE INDEX idx_automation_tasks_status ON automation_tasks(status);
CREATE INDEX idx_automation_tasks_scheduled_for ON automation_tasks(scheduled_for);
CREATE INDEX idx_automation_logs_task_id ON automation_logs(automation_task_id);
CREATE INDEX idx_automation_logs_level ON automation_logs(level);
CREATE INDEX idx_automation_templates_type_id ON automation_templates(type_id);

-- Insert default automation types
INSERT INTO automation_types (name, code, description, config_schema) VALUES
('Content Moderation', 'moderation', 'Automated content moderation for Facebook posts', '{
  "required": ["autoHide", "autoCorrect", "confidenceThreshold", "prompt"],
  "properties": {
    "autoHide": {"type": "boolean"},
    "autoCorrect": {"type": "boolean"}, 
    "confidenceThreshold": {"type": "number"},
    "prompt": {"type": "string"}
  }
}'::jsonb),
('Auto Reply', 'reply', 'Automated comment and message replies', '{
  "required": ["templates", "conditions"],
  "properties": {
    "templates": {"type": "array"},
    "conditions": {"type": "array"}
  }
}'::jsonb),
('Auto Seeding', 'seeding', 'Automated engagement seeding', '{
  "required": ["minDelay", "maxDelay", "maxDailyActions"],
  "properties": {
    "minDelay": {"type": "number"},
    "maxDelay": {"type": "number"},
    "maxDailyActions": {"type": "number"}
  }
}'::jsonb);