import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Lấy JWT secret (hoặc Service Role Key) từ biến môi trường
  const jwtSecret = Deno.env.get("VITE_JWT_SECRET");
  if (!jwtSecret) {
    return new Response(JSON.stringify({ error: "JWT secret not set" }), { status: 500 });
  }

  // Gọi API chính, truyền token ở header
  const response = await fetch("https://pmybhyeyienzwgthbfkh.supabase.co/functions/v1/get-pages-data", {
    headers: {
      Authorization: `Bearer ${jwtSecret}`,
    },
  });

  const data = await response.json();

  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROL_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: data2, error } = await supabase.auth.getSession()
  console.log("DATA:"+JSON.stringify(data2));

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
