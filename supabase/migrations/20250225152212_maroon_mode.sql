/*
  # Insert test ad accounts
  
  This migration adds test ad accounts to the system_ad_accounts table.
  
  1. Changes
    - Inserts test ad accounts with a single transaction
    - Uses DO block for better error handling
    - Includes conflict handling
*/

DO $$ 
BEGIN
  -- Insert test accounts in a single transaction
  INSERT INTO system_ad_accounts 
    (account_id, name, status, daily_budget, total_spent, available)
  VALUES
    ('123456789', 'Business Manager Pro', 'active', 50.00, 1250.00, true),
    ('987654321', 'E-commerce Ads', 'active', 100.00, 3500.00, true),
    ('456789123', 'Retail Promotions', 'active', 75.00, 2100.00, true)
  ON CONFLICT (account_id) DO NOTHING;
END $$;