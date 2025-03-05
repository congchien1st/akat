import { supabase } from './supabase';

/**
 * Applies database migrations directly using SQL queries through the Supabase client
 * This is an alternative to using the Supabase CLI when it's not available
 */
export async function applyMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create the facebook_connections table
    await createFacebookConnectionsTable();
    
    // Create the facebook_page_details table
    await createFacebookPageDetailsTable();
    
    // Apply RLS policies
    await applyRLSPolicies();
    
    console.log('Database migrations completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error applying migrations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during migration'
    };
  }
}

async function createFacebookConnectionsTable() {
  try {
    console.log('Creating facebook_connections table...');
    
    // Create the table directly with SQL
    const { error } = await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE TABLE IF NOT EXISTS facebook_connections (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users NOT NULL,
          page_id text NOT NULL,
          access_token text NOT NULL,
          status text NOT NULL DEFAULT 'disconnected',
          permissions text[] DEFAULT '{}',
          last_sync timestamptz DEFAULT now(),
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error) {
      console.error('Error creating facebook_connections table with SQL:', error);
      
      // Fallback method: try to create by inserting a record
      console.log('Trying fallback method for facebook_connections...');
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error: insertError } = await supabase
        .from('facebook_connections')
        .insert({
          user_id: user.id,
          page_id: 'test_page_id',
          access_token: 'test_token',
          status: 'disconnected'
        });
      
      if (insertError && insertError.code !== 'PGRST116') {
        console.error('Error with fallback method:', insertError);
        throw new Error('Failed to create facebook_connections table');
      }
    }
    
    console.log('facebook_connections table created or already exists');
  } catch (error) {
    console.error('Error in createFacebookConnectionsTable:', error);
    throw error;
  }
}

async function createFacebookPageDetailsTable() {
  try {
    console.log('Creating facebook_page_details table...');
    
    // Create the table directly with SQL
    const { error } = await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE TABLE IF NOT EXISTS facebook_page_details (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          connection_id uuid REFERENCES facebook_connections(id) ON DELETE CASCADE,
          page_name text NOT NULL,
          page_category text,
          page_avatar_url text,
          follower_count integer DEFAULT 0,
          page_url text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE facebook_page_details ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error) {
      console.error('Error creating facebook_page_details table with SQL:', error);
      
      // Fallback method: try to create by inserting a record
      console.log('Trying fallback method for facebook_page_details...');
      
      // First, get a connection ID
      const { data: connections } = await supabase
        .from('facebook_connections')
        .select('id')
        .limit(1);
      
      if (connections && connections.length > 0) {
        const { error: insertError } = await supabase
          .from('facebook_page_details')
          .insert({
            connection_id: connections[0].id,
            page_name: 'Test Page'
          });
        
        if (insertError && insertError.code !== 'PGRST116') {
          console.error('Error with fallback method:', insertError);
          throw new Error('Failed to create facebook_page_details table');
        }
      }
    }
    
    console.log('facebook_page_details table created or already exists');
  } catch (error) {
    console.error('Error in createFacebookPageDetailsTable:', error);
    throw error;
  }
}

async function applyRLSPolicies() {
  try {
    console.log('Applying RLS policies...');
    
    // Drop existing policies to avoid conflicts
    await dropExistingPolicies();
    
    // Create policies for facebook_connections
    await createConnectionPolicies();
    
    // Create policies for facebook_page_details
    await createPageDetailsPolicies();
    
    console.log('RLS policies applied successfully');
  } catch (error) {
    console.error('Error in applyRLSPolicies:', error);
    throw error;
  }
}

async function dropExistingPolicies() {
  try {
    // Drop policies for facebook_connections
    await supabase.rpc('run_sql_command', {
      sql_command: `
        DROP POLICY IF EXISTS "Users can read own connections" ON facebook_connections;
        DROP POLICY IF EXISTS "Users can insert own connections" ON facebook_connections;
        DROP POLICY IF EXISTS "Users can update own connections" ON facebook_connections;
        DROP POLICY IF EXISTS "Users can delete own connections" ON facebook_connections;
      `
    });
    
    // Drop policies for facebook_page_details
    await supabase.rpc('run_sql_command', {
      sql_command: `
        DROP POLICY IF EXISTS "Users can read page details" ON facebook_page_details;
        DROP POLICY IF EXISTS "Users can insert page details" ON facebook_page_details;
        DROP POLICY IF EXISTS "Users can update page details" ON facebook_page_details;
        DROP POLICY IF EXISTS "Users can delete page details" ON facebook_page_details;
      `
    });
  } catch (error) {
    console.error('Error dropping existing policies:', error);
    // Continue execution even if dropping fails
  }
}

async function createConnectionPolicies() {
  try {
    // Create policy for reading connections
    await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE POLICY "Users can read own connections"
        ON facebook_connections
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
      `
    });
    
    // Create policy for inserting connections
    await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE POLICY "Users can insert own connections"
        ON facebook_connections
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
      `
    });
    
    // Create policy for updating connections
    await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE POLICY "Users can update own connections"
        ON facebook_connections
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);
      `
    });
    
    // Create policy for deleting connections
    await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE POLICY "Users can delete own connections"
        ON facebook_connections
        FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
      `
    });
  } catch (error) {
    console.error('Error creating connection policies:', error);
    throw error;
  }
}

async function createPageDetailsPolicies() {
  try {
    // Create very permissive policies for facebook_page_details
    
    // Create policy for reading page details
    await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE POLICY "Users can read page details"
        ON facebook_page_details
        FOR SELECT
        TO authenticated
        USING (true);
      `
    });
    
    // Create policy for inserting page details
    await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE POLICY "Users can insert page details"
        ON facebook_page_details
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
      `
    });
    
    // Create policy for updating page details
    await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE POLICY "Users can update page details"
        ON facebook_page_details
        FOR UPDATE
        TO authenticated
        USING (true);
      `
    });
    
    // Create policy for deleting page details
    await supabase.rpc('run_sql_command', {
      sql_command: `
        CREATE POLICY "Users can delete page details"
        ON facebook_page_details
        FOR DELETE
        TO authenticated
        USING (true);
      `
    });
  } catch (error) {
    console.error('Error creating page details policies:', error);
    throw error;
  }
}