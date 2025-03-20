// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Hàm fetchPostsCount:
 * - Gọi Graph API để lấy bài viết của Page theo khoảng thời gian (since, until)
 * - Duyệt phân trang để tính tổng số bài viết
 */
const fetchPostsCount = async (since: number, until: number): Promise<number> => {
  let totalCount = 0;
  let page_id = 623567207496127;
  let token = "EAAOzncjdBccBO4DpICSUI493A8ZCKvZA0i4UGzsXZCo1zWHokbxZBYgZB37COntzJ1O2nIUMYaR05wNWwPbP5mvIHiO1EIxkZCMKHzfd0lcaHtqbxerzML09lLyEyiYJIEqV8CW29WE1VB88mrLgPpC6EZAZAEn3i1lnd0jSpaJBbpvtgqsjL2cHZCLdSgY70TOGR"
  // Graph API endpoint với tham số since và until (timestamp theo giây)
  let url = `https://graph.facebook.com/v22.0/${page_id}/posts?since=${since}&until=${until}&access_token=${token}`;


  while (url) {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (data.data && Array.isArray(data.data)) {
      totalCount += data.data.length;
    }

    // Nếu có phân trang, chuyển sang trang tiếp theo, nếu không dừng vòng lặp.
    url = data.paging && data.paging.next ? data.paging.next : "";
  }

  return totalCount;
};

Deno.serve(async (req) => {
  try {
    // Tính timestamp: 28 ngày qua
    const today = Math.floor(Date.now() / 1000);
    const since = today - 28 * 24 * 60 * 60;

    // Lấy tổng số bài viết trong 28 ngày qua
    const postsCount = await fetchPostsCount(since, today);

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
    const followersUrl = `https://graph.facebook.com/v22.0/${pageId}/insights?metric=page_daily_follows_unique&period=days_28&access_token=${data.access_token}`;
    const postsUrl = `https://graph.facebook.com/v22.0/${pageId}/posts?access_token=${data.access_token}`;
    const postRemain = `https://graph.facebook.com/v22.0/${pageId}/insights?metric=page_impressions_unique,page_post_engagements&period=month&period=month&access_token=${data.access_token}`;
    // const postRemain = `https://graph.facebook.com/v22.0/${pageId}/insights?page_views_total&period=day&since=${days28Ago}&until=${today}&access_token=${data.access_token}`;

    const [followersRes, postsRes, postRemainRes] = await Promise.all([
        fetch(followersUrl),
        fetch(postsUrl),
        fetch(postRemain)
    ]);

    const followersData = await followersRes.json();
    const postsData = await postsRes.json();
    const postRemainData = await postRemainRes.json();
    // console.log(postRemainData);

    if (!followersRes.ok || !postsRes.ok || !postRemainData) {
      return new Response(JSON.stringify({
        error: followersData.error || postsData.error || postRemainData.error
      }), { status: 400 });
    }

    // tong so bai viet
    const totalPosts = postsData.data ? postsData.data.length : 0;

    // tong so tiep can (page_impressions_unique), tuong tac(page_post_engagements => bi trung, 1 user co the tuong tac nhieu lan )
    const metrics = {};
    postRemainData.data.map((item) => {
      metrics[item.name] = item.values[1].value;
    });
    console.log(metrics);

    return new Response(JSON.stringify({
      followers_count: followersData.data[0].values[1].value,
      total_posts: postsCount,
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
