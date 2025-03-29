/*
  # Fix auto_engines table schema

  1. Changes
    - Rename columns to match frontend expectations:
      - engine_config -> config
      - engine_type -> type 
      - engine_status -> status
    - Update constraints and indexes accordingly
  
  2. Security
    - Maintain existing RLS policies
*/

-- Rename columns to match frontend expectations
ALTER TABLE auto_engines 
  RENAME COLUMN engine_config TO config;

ALTER TABLE auto_engines 
  RENAME COLUMN engine_type TO type;

ALTER TABLE auto_engines 
  RENAME COLUMN engine_status TO status;

-- Drop old indexes
DROP INDEX IF EXISTS idx_auto_engines_status;
DROP INDEX IF EXISTS idx_auto_engines_type;

-- Create new indexes with updated column names
CREATE INDEX idx_auto_engines_status ON auto_engines(status);
CREATE INDEX idx_auto_engines_type ON auto_engines(type);

-- Drop old constraints
ALTER TABLE auto_engines
  DROP CONSTRAINT IF EXISTS auto_engines_status_check,
  DROP CONSTRAINT IF EXISTS auto_engines_type_check;

-- Add new constraints with updated column names
ALTER TABLE auto_engines
  ADD CONSTRAINT auto_engines_status_check 
    CHECK (status IN ('active', 'paused', 'stopped'));

ALTER TABLE auto_engines
  ADD CONSTRAINT auto_engines_type_check 
    CHECK (type IN ('comment', 'message', 'post', 'ads', 'seeding', 'moderation'));