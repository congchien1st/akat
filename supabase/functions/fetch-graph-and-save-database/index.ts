import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // lay thong tin tu request
    const url = new URL(req.url);
    const pageId = url.searchParams.get("page_id");

    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROL_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Tính timestamp: 28 ngày qua
    const today = Math.floor(Date.now() / 1000);
    const since = today - 28 * 24 * 60 * 60;

    // Lấy tổng số bài viết trong 28 ngày qua
    const postsCount = await fetchPostsCount(since, today, data.access_token, pageId);

    // lay cac chi so graph api
    const followersUrl = `https://graph.facebook.com/v22.0/${pageId}/insights?metric=page_daily_follows_unique&period=days_28&access_token=${data.access_token}`;
    const postsUrl = `https://graph.facebook.com/v22.0/${pageId}/posts?access_token=${data.access_token}`;
    const postRemain = `https://graph.facebook.com/v22.0/${pageId}/insights?metric=page_impressions_unique,page_post_engagements&period=days_28&access_token=${data.access_token}`;

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
        error: followersData.error || postsData.error
      }), { status: 400 });
    }
    // console.log("POST REMAIN:"+postRemainData.data);

    // tong so tiep can (page_impressions_unique), tuong tac(page_post_engagements => bi trung, 1 user co the tuong tac nhieu lan )
    interface PostRemainItem {
      name: string;
      values: { value: number }[];
    }
    // metrics là object: key: string, value: number
    const metrics: Record<string, number> = {};
    postRemainData.data.map((item:PostRemainItem) => {
      metrics[item.name] = item.values[1].value;
    });
    // console.log(metrics);

    const {data: myData, error: errorOutScope} = await supabase
        .from("facebook_connections")
        .select("id")
        .eq("page_id", pageId)

    let dataOutput = null;

    if (myData && myData.length > 0) {
      const resConnectionId = myData[0].id;

      try {
        const { data: dataInserted, error } = await supabase
            .from("facebook_page_insights")
            .insert({
              posts: postsCount,
              approach: metrics.page_impressions_unique,
              interactions: metrics.page_post_engagements,
              follows: followersData.data[0].values[1].value,
              connection_id: resConnectionId
            })
            .select();
        if (error) {
          console.error("Insert error:", error);
        } else {
          console.log("Insert success. Data:", dataInserted);
          dataOutput = dataInserted;
        }

      } catch (error) {
        console.error("Catch error:", error);
      }

    } else {
      console.log("Error happened: " + errorOutScope);
    }


    /**
     * responses
     */
    return new Response(JSON.stringify({
      data: dataOutput
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
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

/**
 * Hàm fetchPostsCount:
 * - Gọi Graph API để lấy bài viết của Page theo khoảng thời gian (since, until)
 * - Duyệt phân trang để tính tổng số bài viết
 */
const fetchPostsCount = async (since: number, until: number, token:number, page_id:any): Promise<number> => {
  let totalCount = 0;
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