/*
  # Create tables for Facebook integration

  1. New Tables
    - `facebook_connections`: Stores Facebook page connections
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `page_id` (text)
      - `access_token` (text)
      - `status` (text)
      - `permissions` (text[])
      - `last_sync` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create facebook_connections table
CREATE TABLE IF NOT EXISTS facebook_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  page_id text NOT NULL,
  access_token text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  permissions text[] DEFAULT '{}',
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own connections"
  ON facebook_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON facebook_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON facebook_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);