/*
  # Create tables for n8n integration

  1. New Tables
    - `automation_logs`: Stores automation execution history
      - `id` (uuid, primary key)
      - `event_type` (text)
      - `payload` (jsonb)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `message_queue`: Stores messages to be sent
      - `id` (uuid, primary key)
      - `recipient` (text)
      - `message` (text)
      - `scheduled_time` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)
      - `sent_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create automation_logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create message_queue table
CREATE TABLE IF NOT EXISTS message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  message text NOT NULL,
  scheduled_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Enable RLS
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for automation_logs
CREATE POLICY "Users can read automation logs"
  ON automation_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert automation logs"
  ON automation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for message_queue
CREATE POLICY "Users can read message queue"
  ON message_queue
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert messages"
  ON message_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (true);