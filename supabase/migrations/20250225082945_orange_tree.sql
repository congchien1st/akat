/*
  # Add Lark integration tables

  1. New Tables
    - `lark_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `app_id` (text)
      - `status` (text)
      - `last_sync` (timestamptz)
      - Timestamps (created_at, updated_at)

    - `lark_messages`
      - `id` (uuid, primary key)
      - `connection_id` (uuid, references lark_connections)
      - `message_id` (text)
      - `type` (text)
      - `content` (jsonb)
      - `sender_id` (text)
      - `sender_name` (text)
      - `timestamp` (timestamptz)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create lark_connections table
CREATE TABLE IF NOT EXISTS lark_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  app_id text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lark_messages table
CREATE TABLE IF NOT EXISTS lark_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES lark_connections ON DELETE CASCADE,
  message_id text NOT NULL,
  type text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  sender_id text NOT NULL,
  sender_name text,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lark_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lark_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for lark_connections
CREATE POLICY "Users can read own lark connections"
  ON lark_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lark connections"
  ON lark_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lark connections"
  ON lark_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for lark_messages
CREATE POLICY "Users can read messages through connections"
  ON lark_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lark_connections
      WHERE lark_connections.id = lark_messages.connection_id
      AND lark_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages through connections"
  ON lark_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lark_connections
      WHERE lark_connections.id = connection_id
      AND lark_connections.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lark_connections_user_id ON lark_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_lark_messages_connection_id ON lark_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_lark_messages_timestamp ON lark_messages(timestamp);