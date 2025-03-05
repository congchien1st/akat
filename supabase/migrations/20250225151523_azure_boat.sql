/*
  # Facebook Ad Manager Setup

  1. New Tables
    - `ad_manager_access`
      - Controls who can access the ad manager feature
      - Restricted to specific emails
    
    - `system_ad_accounts` 
      - System-owned Facebook ad accounts
      - Available for rent/usage

    - `ad_account_rentals`
      - Tracks which users are renting which accounts
      - Includes rental period and status

  2. Security
    - Enable RLS on all tables
    - Strict access control based on email
*/

-- Create table for controlling ad manager access
CREATE TABLE IF NOT EXISTS ad_manager_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create table for system ad accounts
CREATE TABLE IF NOT EXISTS system_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL,
  daily_budget numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table for ad account rentals
CREATE TABLE IF NOT EXISTS ad_account_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  account_id uuid REFERENCES system_ad_accounts NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ad_manager_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_account_rentals ENABLE ROW LEVEL SECURITY;

-- Insert allowed email
INSERT INTO ad_manager_access (email) 
VALUES ('congchienmamusk@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Create policies for ad_manager_access
CREATE POLICY "Allow select for authenticated users" ON ad_manager_access
  FOR SELECT TO authenticated
  USING (true);

-- Create policies for system_ad_accounts
CREATE POLICY "Allow select for authorized users only" ON system_ad_accounts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ad_manager_access 
    WHERE ad_manager_access.email = auth.jwt()->>'email'
  ));

-- Create policies for ad_account_rentals
CREATE POLICY "Users can view own rentals" ON ad_account_rentals
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM ad_manager_access 
      WHERE ad_manager_access.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Authorized users can create rentals" ON ad_account_rentals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ad_manager_access 
      WHERE ad_manager_access.email = auth.jwt()->>'email'
    )
  );

-- Create indexes
CREATE INDEX idx_ad_manager_access_email ON ad_manager_access(email);
CREATE INDEX idx_system_ad_accounts_status ON system_ad_accounts(status);
CREATE INDEX idx_ad_account_rentals_user ON ad_account_rentals(user_id);
CREATE INDEX idx_ad_account_rentals_dates ON ad_account_rentals(start_date, end_date);