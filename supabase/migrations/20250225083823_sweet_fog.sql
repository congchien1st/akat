/*
  # Add Ad Account Status Tracking

  1. New Tables
    - `ad_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `account_id` (text, Facebook Ad Account ID)
      - `name` (text, Ad Account Name)
      - `status` (text, Account Status)
      - `metrics` (jsonb, Account Metrics)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS on `ad_accounts` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  account_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN (
    'good',        -- Tốt
    'hold',        -- Tạm giữ
    'disabled',    -- Vô hiệu hóa
    'restricted',  -- Hạn chế quảng cáo
    'checkpoint',  -- Tài khoản checkpoint
    'limited'      -- Bị hạn chế phân phối quảng cáo
  )),
  metrics jsonb DEFAULT '{
    "monthlySpend": 0,
    "approvalTime": 0,
    "reach": 0,
    "revenue": 0
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own ad accounts"
  ON ad_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad accounts"
  ON ad_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ad accounts"
  ON ad_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user_id ON ad_accounts(user_id);