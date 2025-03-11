import initSupabase  from './init-supabase.js';
import axios from 'axios';

const postArticleOnFb = async () => {
    try {
        // const supabase = initSupabase();
        // const {data} = await supabase
        //     .from('facebook_connections')
        //     select('page_id', 'access_token')
        //     .eq('page_id', page.page_id);

        const PAGE_ID = '623567207496127';
        const PAGE_ACCESS_TOKEN = 'EAAOzncjdBccBO7ydEO6wos0sW0PXT0ffCPQN1Y4ng6YcZChtAZC8HssSDGA2lxZAmL7nU1exG4uCJKFKHN22x6cfOXL63Vzdrm2iS6QMwTmwlwQCZB6cl0fbnwkYn0mFfuzFZC3wsWCcivqnjyGJYK5DXtD6IzfZCZAQRUwFRcnPQF0TJblksQMQVv5MAfw1IoK';

        async function postToFacebook() {
            try {
                const response = await axios.post(
                    `https://graph.facebook.com/v19.0/${PAGE_ID}/feed`,
                    {
                        message: "Chào buổi chiều cả nhà ạ, page đang test tính năng ạ",
                        access_token: PAGE_ACCESS_TOKEN,
                    }
                );
                console.log("Post successful:", response.data);
                return new Response(JSON.stringify({
                    status: 'success',
                    data: response.data,
                }));
            } catch (error) {
                return new Response(JSON.stringify({
                    error: "Sorry error occurred",
                }));
            }
        }

        postToFacebook();

    } catch (e) {
        return new Response(
            JSON.stringify({error: "Internal Server Error"}),
            {
                status: 500,
                headers: {"Content-Type": "application/json"},
            }
        );
    }
}

 export default postArticleOnFb;