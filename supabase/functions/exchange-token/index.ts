// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
    try {
        /**
         * lay user token access ngan han => call graph api de lay user token access dai han
         */
        //  call api, pass body. parse object ReadableStream thanh chuoi JSON
        const rawBody = await new Response(req.body).text();
        // parse chuoi JSON thanh Object JS
        const body = JSON.parse(rawBody);

        const { shortLivedToken } = body;
        if (!shortLivedToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing short-lived token" }),
            };
        }

        const APP_ID = "1041915191297479";
        const APP_SECRET = "1de790503c0a9f19ec3cd090d73290b1";

        const response = await fetch(
            `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`,
        );

        // lay dc response long life token
        const dataResponse = await response.json();
        // console.log("data response: "+JSON.stringify(dataResponse));

        /**
         * lay tat ca cac pages access token
         */
        const fetchAllPageAccessTokens = async (userToken) => {
            const url =
                `https://graph.facebook.com/v22.0/me/accounts?access_token=${userToken}`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                // console.log("DATA CURRENT:"+data.data);

                if (data.data && data.data.length > 0) {
                    // lay access token tung page
                    const pageTokens = data.data.map((page) => ({
                        page_id: page.id,
                        page_name: page.name,
                        access_token: page.access_token,
                    }));
                    // console.log("List of Page Access Tokens:", pageTokens);
                    return pageTokens;
                } else {
                    console.log("No pages found or invalid user token.");
                    return [];
                }
            } catch (error) {
                console.error("Error fetching Page Access Tokens:", error);
                return [];
            }
        };
        const allPageTokenLong = await fetchAllPageAccessTokens(
            dataResponse.access_token,
        );
        const allPagesToken = allPageTokenLong.map((page) => {
            return {
                page_id: page.page_id,
                page_name: page.page_name,
                access_token: page.access_token,
            };
        });

        /**
         * update pages access token dai han cho cac page tuong ung (dang dung page token ngan han)
         */
        //khoi tao supabase client de query db
        const supabaseUrl = "https://pmybhyeyienzwgthbfkh.supabase.co";
        const supabaseServiceKey =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDk4NDYwMCwiZXhwIjoyMDU2NTYwNjAwfQ.H7te0vAGIZMCqzDHEB4s194mvh_UZCJs8s94moL27Ag";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // cap nhat token tren supabase
        const updatePageAccessTokens = async (pageTokens) => {
            try {
                for (const page of pageTokens) {
                    const { error } = await supabase
                        .from("facebook_connections")
                        .update({ access_token: page.access_token })
                        .eq("page_id", page.page_id);

                    if (error) {
                        console.error(
                            `loi cap nhat page_id ${page.page_id}:`,
                            error,
                        );
                    } else {
                        console.log(
                            `da cap nhat access_token cho page_id ${page.page_id}`,
                        );
                    }
                }
            } catch (err) {
                console.error("loi khi cap nhat Supabase:", err);
            }
        };
        await updatePageAccessTokens(allPageTokenLong);

        return new Response(
            JSON.stringify(
                {
                    userTokenLong: dataResponse.access_token,
                    pagesTokenLong: allPagesToken,
                },
            ),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (e) {
        console.log(e);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/exchange-token' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
