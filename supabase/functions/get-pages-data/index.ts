import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  try {
    /**
     * cho phep truy cap CORS o browser den api /get-pages-data
     */
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROL_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
            id,
            user_id,
            page_id,
            access_token,
            status,
            facebook_page_details (
              page_name,
              page_category,
              page_avatar_url,
              page_url
            )
          `)
          .eq('user_id', user.id);
      // console.log("HERE " + JSON.stringify(dataUser));

      interface FacebookConnectionItem {
        id: string;
        user_id: string;
        page_id: string;
        page_name?: string;
        page_category?: string;
        page_avatar_url?: string;
        page_url?: string;
        permissions?: string;
        page_manage_posts?: boolean;
        page_manage_engagement?: boolean;
        page_manage_ads?: boolean;
        status?: string;
      }
      const filterConnection = dataUser.map((item:FacebookConnectionItem) => item.id);

      if (errorUser) {
        console.error("error: " + errorUser);
      }

      /**
       * lay data insights cua tung pages
       */
      const { data: dataSelected, error } = await supabase
          .from("facebook_page_insights")
          .select("*")
          .in("connection_id", filterConnection);
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