import {createClient} from '@supabase/supabase-js';

const exchangeToken = async (event) => {
    try {
        /**
         * lay user token access ngan han => call graph api de lay user token access dai han
         */
        //  call api, pass body. parse object ReadableStream thanh chuoi JSON
        const rawBody = await new Response(event.body).text();
        // parse chuoi JSON thanh Object JS
        const body = JSON.parse(rawBody);

        const {shortLivedToken} = body;
        if (!shortLivedToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({error: "Missing short-lived token"}),
            };
        }

        const APP_ID = process.env.VITE_FACEBOOK_APP_ID;
        const APP_SECRET = process.env.VITE_FACEBOOK_APP_SECRET;


        const response = await fetch(
            `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`
        );

        // lay dc response long life token
        const dataResponse = await response.json();
        // console.log("data response: "+dataResponse);

        /**
         * lay tat ca cac pages access token
         */
        const fetchAllPageAccessTokens = async (userToken) => {
            const url = `https://graph.facebook.com/v22.0/me/accounts?access_token=${userToken}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    // lay access token tung page
                    const pageTokens = data.data.map(page => ({
                        page_id: page.id,
                        page_name: page.name,
                        access_token: page.access_token
                    }));
                    console.log("List of Page Access Tokens:", pageTokens);
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
        let allPageTokenLong = await fetchAllPageAccessTokens(dataResponse.access_token);
        // console.log("all page"+allPageTokenLong.map(el => el.id).join(", "));

        /**
         * update pages access token dai han cho cac page tuong ung (dang dung page token ngan han)
         */
            //khoi tao supabase client de query db
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmybhyeyienzwgthbfkh.supabase.co';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs';
        let supabase;
        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
        }

        // cap nhat token tren supabase
        const updatePageAccessTokens = async (pageTokens) => {
            try {
                for (const page of pageTokens) {
                    const {error} = await supabase
                        .from('facebook_connections')
                        .update({access_token: page.access_token})
                        .eq('page_id', page.page_id);

                    if (error) {
                        console.error(`loi cap nhat page_id ${page.page_id}:`, error);
                    } else {
                        console.log(`da cap nhat access_token cho page_id ${page.page_id}`);
                    }
                }
            } catch (err) {
                console.error("loi khi cap nhat Supabase:", err);
            }
        };
        let updateSuccess = updatePageAccessTokens(allPageTokenLong);
        // console.log("updateSuccess: "+updateSuccess);

        if (updateSuccess) {
            return new Response(
                JSON.stringify(
                    {
                        message: "Long life token user received",
                        userTokenLong: dataResponse.access_token
                    }
                ),
                {
                    status: 200,
                    headers: {"Content-Type": "application/json"}
                });
        } else {
            return new Response(
                JSON.stringify({error: dataResponse.error.message}),
                {
                    status: 500,
                    headers: {"Content-Type": "application/json"},
                }
            );
        }
    } catch (e) {
        console.log(e);
        return new Response(
            JSON.stringify({error: "Internal Server Error"}),
            {
                status: 500,
                headers: {"Content-Type": "application/json"},
            }
        );
    }
}

export default exchangeToken;