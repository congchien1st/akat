import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { FacebookPageNameAndImage,FacebookFollowers,FacebookInsights,FacebookPageCategoryStatus } from "./FacebookGraphInterface.ts";
import FacebookGraphAdapter from "./FacebookGraphAdapter.ts";

Deno.serve(async (req) => {
  try {
    // body request POST
    // const { pageId } = await req.json();
    // if (!pageId) {
    //   return new Response(
    //       JSON.stringify({ error: "Missing page_id" }),
    //       { status: 400 }
    //   );
    // }

    const allowedOrigins = ["https://localhost:3000", "https://platform.omegaa.cloud"];
    const origin = req.headers.get("origin") ?? "";

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "",
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      'Content-Type': 'application/json',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseRoleKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROL_KEY");
    if (!supabaseUrl || !supabaseRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }
    const supabase = createClient(supabaseUrl, supabaseRoleKey);

    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    const { data: { user } } = await supabase.auth.getUser(token);

    const {data: pageData} = await supabase
        .from("facebook_connections")
        .select(`id, page_id, access_token`)
        .eq("user_id", user.id)


    let dataOutput = null;
    pageData.map(async (item) => {
      const pageId = item.page_id;
      const accessToken = item.access_token;

      // Tính timestamp: 28 ngày qua
      const today = Math.floor(Date.now() / 1000);
      const since = today - 28 * 24 * 60 * 60;

      // Lấy tổng số bài viết trong 28 ngày qua
      const postsCount = await fetchPostsCount(since, today, accessToken, pageId);

      // lấy các chỉ số graph api
      const nameAndImage = `https://graph.facebook.com/v22.0/${pageId}?fields=name,picture&access_token=${accessToken}`;
      const followersUrl = `https://graph.facebook.com/v22.0/${pageId}/insights?metric=page_daily_follows_unique&period=days_28&access_token=${accessToken}`;
      const postRemain = `https://graph.facebook.com/v22.0/${pageId}/insights?metric=page_impressions_unique,page_post_engagements&period=days_28&access_token=${accessToken}`;
      const categoryAndStatusPage = `https://graph.facebook.com/v22.0/${pageId}?fields=category%2Cis_published&access_token=${accessToken}`

      const [nameImageRes,followersRes, postRemainRes, categoryAndStatusRes] = await Promise.all([
        fetch(nameAndImage),
        fetch(followersUrl),
        fetch(postRemain),
        fetch(categoryAndStatusPage)
      ]);

      const nameAndImageData = await nameImageRes.json();
      const followersData = await followersRes.json();
      const postRemainData = await postRemainRes.json();
      const categoryAndStatusData = await categoryAndStatusRes.json();
      // console.log("test "+JSON.stringify(followersData));

      if (!followersRes.ok || !postRemainRes || !nameImageRes || !categoryAndStatusRes) {
        return new Response(JSON.stringify({
          error: "some error happened with fetch graph api"
        }), { status: 400 });
      }

      /**
       *  xu ly data response qua class FacebookGraphAdapter
       *  => de sau nay khi graph api update version moi (response bi thay doi) thi chi can update trong class FacebookGraphAdapter
       */
      const firstPageInfo: FacebookPageNameAndImage = FacebookGraphAdapter.transformNameAndImage(nameAndImageData);
      const secondPageInfo: FacebookFollowers = FacebookGraphAdapter.transformFollowers(followersData);
      const thirdPageInfo: FacebookInsights = FacebookGraphAdapter.transformPostRemain(postRemainData);
      const fourthPageInfo: FacebookPageCategoryStatus = FacebookGraphAdapter.transformCategoryAndStatusPage(categoryAndStatusData);
      // console.log("page info: " + JSON.stringify(thirdPageInfo));
      // process.exit();

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


      if (myData && myData.length > 0) {
        const resConnectionId = myData[0].id;
        try {
          // Kiểm tra row trùng tất cả cột
          const { data: existingData, error: existingError } = await supabase
              .from("facebook_page_insights")
              .select("*")
              .eq("posts", postsCount)
              .eq("approach", thirdPageInfo.impressions)
              .eq("interactions", thirdPageInfo.engagements)
              .eq("follows", secondPageInfo.followersCount)
              .eq("connection_id", resConnectionId)
              .eq("name", firstPageInfo.name)
              .eq("category", fourthPageInfo.category)

          if (existingError) {
            return new Response(JSON.stringify({ error: existingError.message }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          } else if (existingData && existingData.length > 0) {
            return new Response(
                JSON.stringify({ message: "Row đã tồn tại (trùng tất cả cột), không insert." }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
          } else {
            const { data: dataInserted, error } = await supabase
                .from("facebook_page_insights")
                .insert({
                  name: firstPageInfo.name,
                  image_url: firstPageInfo.pictureUrl,
                  posts: postsCount,
                  approach: thirdPageInfo.impressions,
                  interactions: thirdPageInfo.engagements,
                  follows: secondPageInfo.followersCount,
                  connection_id: resConnectionId,
                  category: fourthPageInfo.category,
                  status: fourthPageInfo.isPublished
                })
                .select();
            if (error) {
              console.error("Insert error:", error);
            } else {
              console.log("Insert success. Data:", dataInserted);
              dataOutput = dataInserted;
            }
          }
        } catch (error) {
          console.error("Catch error:", error);
        }

      } else {
        console.log("Error happened: " + errorOutScope);
      }
    })
    /**
     * responses
     */
    return new Response(JSON.stringify({
      data: dataOutput
    }), {
      headers: {...corsHeaders,"Content-Type": "application/json" },
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
 * - Gọi Graph API để lấy bài viết của Page theo khoảng thời gian (since, until)
 * - Duyệt phân trang để tính tổng số bài viết
 */
const fetchPostsCount = async (since: number, until: number, token:number, page_id:any): Promise<number> => {
  let totalCount = 0;
  // Graph API endpoint với tham số since và until (timestamp theo giây)
  let url = `https://graph.facebook.com/v22.0/${page_id}/posts?since=${since}&until=${until}&limit=25&access_token=${token}`;

  while (url) {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (data.data && Array.isArray(data.data)) {
      // console.log("data: " + data.data);
      totalCount += data.data.length;
    }

    // Nếu có phân trang, chuyển sang trang tiếp theo, nếu không dừng vòng lặp.
    url = data.paging && data.paging.next ? data.paging.next : "";
  }

  return totalCount;
};