import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const allowedOrigins = [
    "https://localhost:3000",
    "http://localhost:3000",
    "https://platform.omegaa.cloud"
  ];
  const origin = req.headers.get("origin") ?? "";

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "*",
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("Request origin:", origin);
  console.log("CORS headers being sent:", corsHeaders);
  try {
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

      // const { data: dataUser, error: errorUser } = await supabase
      //     .from('facebook_connections')
      //     .select(`
      //       id,
      //       user_id,
      //       page_id,
      //       access_token,
      //       status,
      //       facebook_page_details (
      //         page_name,
      //         page_category,
      //         page_avatar_url,
      //         page_url
      //       )
      //     `)
      //     .eq('user_id', user.id)
      //     .eq('status', 'connected')
      // console.log("HERE " + JSON.stringify(dataUser));

      // interface FacebookConnectionItem {
      //   id: string;
      //   user_id: string;
      //   page_id: string;
      //   page_name?: string;
      //   page_category?: string;
      //   page_avatar_url?: string;
      //   page_url?: string;
      //   permissions?: string;
      //   page_manage_posts?: boolean;
      //   page_manage_engagement?: boolean;
      //   page_manage_ads?: boolean;
      //   status?: string;
      // }
      // const filterConnection = dataUser.map((item:FacebookConnectionItem) => item.id);
      //
      // if (errorUser) {
      //   console.error("error: " + errorUser);
      // }

      /**
       * lay data insights cua tung pages
       */
      const { data:dataSelected, error } = await supabase
          .from("facebook_page_insights")
          .select("*")
          // .in("connection_id", filterConnection)
          .eq('user_id', user.id)
          .eq('status', 'Hoạt động')
          .order("created_at", { ascending: false });

      // console.log("data selected", JSON.stringify(dataSelected));
      if (error) {
        console.error("Lỗi Supabase:", error);
      }

    // Lọc bản ghi mới nhất cho mỗi connection_id (trên JS)
      const latestPerConnection: any[] = [];
      const seen = new Set();

      for (const row of dataSelected || []) {
        if (!seen.has(row.connection_id)) {
          seen.add(row.connection_id);
          latestPerConnection.push(row);
        }
      }
      data = latestPerConnection


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