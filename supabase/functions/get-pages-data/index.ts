// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

Deno.serve(async (req) => {
  try {
    // lay thong tin tu request
    const url = new URL(req.url);
    const pageId = url.searchParams.get("page_id");

    const supabaseUrl = 'https://pmybhyeyienzwgthbfkh.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDk4NDYwMCwiZXhwIjoyMDU2NTYwNjAwfQ.H7te0vAGIZMCqzDHEB4s194mvh_UZCJs8s94moL27Ag';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
        .from("facebook_connections")
        .select("access_token")
        .eq("page_id", pageId)
        .single();
    if (error || !data) {
      return new Response(JSON.stringify({ error: `Not found access_token for page_id: ${pageId}` }), { status: 404 });
    }

    if (!pageId) {
      return new Response(JSON.stringify({ error: `Not found page_id: ${pageId}` }), { status: 404 });
    }

    // lay cac chi so graph api
    const followersUrl = `https://graph.facebook.com/v22.0/${pageId}?fields=followers_count&access_token=${data.access_token}`;
    const postsUrl = `https://graph.facebook.com/v22.0/${pageId}/posts?access_token=${data.access_token}`;
    const postRemain = `https://graph.facebook.com/v22.0/${pageId}/insights?metric=page_impressions_unique,page_post_engagements&period=month&period=month&access_token=${data.access_token}`;


    const [followersRes, postsRes, postRemainRes] = await Promise.all([
        fetch(followersUrl),
        fetch(postsUrl),
        fetch(postRemain)
    ]);

    const followersData = await followersRes.json();
    const postsData = await postsRes.json();
    const postRemainData = await postRemainRes.json();
    // console.log(postRemainData.data);

    if (!followersRes.ok || !postsRes.ok || !postRemainData) {
      return new Response(JSON.stringify({
        error: followersData.error || postsData.error || postRemainData.error
      }), { status: 400 });
    }

    // tong so bai viet
    const totalPosts = postsData.data ? postsData.data.length : 0;

    // tong so tiep can (page_impressions_unique), tuong tac(page_post_engagements)
    const metrics = {};
    postRemainData.data.map((item) => {
      metrics[item.name] = item.values[1].value;
    });
    // console.log(metrics);

    return new Response(JSON.stringify({
      followers_count: followersData.followers_count,
      total_posts: totalPosts,
      metrics: metrics
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});



/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-pages-data' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
