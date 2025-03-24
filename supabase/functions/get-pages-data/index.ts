import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  try {
    // This is needed if you're planning to invoke your function from a browser.
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROL_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // body request POST
    const { connection_id } = await req.json();
    if (!connection_id) {
      return new Response(
          JSON.stringify({ error: "Missing connection_id" }),
          { status: 400 }
      );
    }

    let data;
    try {
      /**
       * lay data cac page cua user
       */
      const token = req.headers.get("Authorization")?.split("Bearer ")[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      // console.log('MY USER: ', user);

      const { data: dataUser, error: errorUser } = await supabase
          .from('facebook_connections')
          .select(`
            *,
            facebook_page_details(*)
          `)
          .eq('user_id', user.id);

      if (errorUser) {
        console.error(errorUser);
      } else {
        console.log("dataUser: ",dataUser);
      }

      /**
       * lay data insights cua tung pages
       */
      const { data: dataSelected, error } = await supabase
          .from("facebook_page_insights")
          .select("*")
          .eq("connection_id", connection_id);
      if(error) {
        console.log("Error happened: " + error.message);
      } else {
        // console.log("data selected: " + JSON.stringify(dataSelected));
        data = dataSelected;
      }
    } catch (e) {
      console.log(e);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    } else {
      // Nếu không phải Error, ta có thể xử lý theo cách khác
      return new Response(
          JSON.stringify({ error: String(error) }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
      );
    }
  }
});