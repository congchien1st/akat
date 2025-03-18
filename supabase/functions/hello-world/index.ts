import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// import { supabase } from "../../../src/lib/supabase.ts";
// import { supabase } from '../lib/supabase';
// import initSupabaseNew from "./init-supabase-new.js";

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * lay cac chi so cua page
 */
// lay cac page
const fetchPages = async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pmybhyeyienzwgthbfkh.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDk4NDYwMCwiZXhwIjoyMDU2NTYwNjAwfQ.H7te0vAGIZMCqzDHEB4s194mvh_UZCJs8s94moL27Ag';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // const { data } = await supabase.auth.signInWithPassword({
    //   email: 'test1234@gmail.com',
    //   password: 'test1234'
    // });
    // console.log("USERR: "+data.session.access_token);

    // const supabase = initSupabaseNew();
    const { data: { user },error } = await supabase.auth.getUser()
    console.log('MY USER: ', user);
    if(!user) {
      console.error("can't login with user ",error);
    } else {
      const {data} = await supabase
          .from('facebook_page_details')
          .select('page_name,page_category,follower_count,page_avatar_url')
          .eq("user_id", user.id);
    return data;
    }

  } catch (e) {
    console.log(e);
  }
}
fetchPages();

Deno.serve(async (req:Request) => {
  /**
   * example auth with edge-functions
   */
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const supabaseClient = createClient(
        // Supabase API URL - env var exported by default.
        Deno.env.get('SUPABASE_URL') ?? 'http://127.0.0.1:54321',
        // Supabase API ANON KEY - env var exported by default.
        Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs',
        // Create client with Auth context of the user that called the function.
        // This way your row-level-security (RLS) policies are applied.
        {
          global: {
            headers: { Authorization: req.headers.get('Authorization')! },
          },
        }
    )



    // First get the token from the Authorization header
    const token = req.headers.get('Authorization').replace('Bearer ', '')
    // console.log("TOKEN: "+token);
    // Now we can get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser(token)
    // console.log('MY USER: ', user);

    // And we can run queries in the context of our authenticated user
    const { data, error } = await supabaseClient.from('users').select('*')
    if (error) throw error

    return new Response(JSON.stringify({ user, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
  



  // const result = {
  //   message: fetchPages(),
  // }

  // return new Response(
  //     JSON.stringify(result),
  //     { headers: { "Content-Type": "application/json" } },
  // )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
