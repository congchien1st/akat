import {createClient} from "@supabase/supabase-js";

const initSupabaseNew = () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://pmybhyeyienzwgthbfkh.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs';
    return createClient(supabaseUrl, supabaseKey);

}

export default initSupabaseNew;