import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROL_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // body request POST
    const { page_id } = await req.json();
    if (!page_id) {
      return new Response(
          JSON.stringify({ error: "Missing page_id" }),
          { status: 400 }
      );
    }

    let data;
    try {
      const { data: dataSelected, error } = await supabase
          .from("facebook_page_insights")
          .select("*")
          .eq("page_id", page_id);
      if(error) {
        console.log("Error happened: " + error.message);
      } else {
        console.log("data selected: " + dataSelected);
        data = dataSelected;
      }
    } catch (e) {
      console.log(e);
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500 },
      );
    } else {
      // Nếu không phải Error, ta có thể xử lý theo cách khác
      return new Response(
          JSON.stringify({ error: String(error) }),
          { status: 500 },
      );
    }
  }
});