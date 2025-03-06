import { createClient } from '@supabase/supabase-js';
import {supabase} from "../../src/lib/supabase.js";

const akaHook = async () => {
    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmybhyeyienzwgthbfkh.supabase.co';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs';
        let supabase;
        // console.log("Supabase URL:", supabaseUrl);
        // console.log("Supabase Key:", supabaseKey);
        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
        }


        const data = await supabase
            .from('facebook_connections')
            .select()
            .eq('page_id', '623567207496127')
        console.log('Connections data:', data);


        return new Response(
            JSON.stringify({ message: "here we are"}),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (e) {
        console.error(e);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

export default akaHook;