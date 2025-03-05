-- Create a function to safely execute SQL
CREATE OR REPLACE FUNCTION safe_execute_sql(sql_command text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_command;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error executing SQL: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION safe_execute_sql TO authenticated, anon;

-- Create a function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(schema_name text, table_name text)
RETURNS boolean AS $$
DECLARE
  exists_bool boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = schema_name
    AND table_name = table_name
  ) INTO exists_bool;
  RETURN exists_bool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION table_exists TO authenticated, anon;

-- Create a function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(table_name text, policy_name text)
RETURNS boolean AS $$
DECLARE
  exists_bool boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = table_name
    AND policyname = policy_name
  ) INTO exists_bool;
  RETURN exists_bool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION policy_exists TO authenticated, anon;

-- Create a function to safely create a policy
CREATE OR REPLACE FUNCTION safe_create_policy(
  p_table_name text,
  p_policy_name text,
  p_operation text,
  p_using_expr text,
  p_check_expr text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Drop the policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
  
  -- Create the policy
  IF p_check_expr IS NULL THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s TO authenticated USING (%s)',
      p_policy_name, p_table_name, p_operation, p_using_expr
    );
  ELSE
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s TO authenticated USING (%s) WITH CHECK (%s)',
      p_policy_name, p_table_name, p_operation, p_using_expr, p_check_expr
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy %I on %I: %', p_policy_name, p_table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION safe_create_policy TO authenticated, anon;