import axios from "axios";
import { createClient } from '@supabase/supabase-js';

const exchangeToken = async (event) => {
    try {
        // Initialize Supabase client
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmybhyeyienzwgthbfkh.supabase.co';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs';
        let supabase;

        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
        }
        console.log(supabase);

        // parse object ReadableStream thanh chuoi JSON
        const rawBody =  await new Response(event.body).text();
        // parse chuoi JSON thanh Object JS
        const body = JSON.parse(rawBody);

        const { shortLivedToken } = body;
        if (!shortLivedToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing short-lived token" }),
            };
        }

        const APP_ID = process.env.VITE_FACEBOOK_APP_ID;
        const APP_SECRET = process.env.VITE_FACEBOOK_APP_SECRET;


        const response = await fetch(
            `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`
        );

        const data = await response.json();
        console.log(data);

        const { dataSaved } = await supabase
            .from('facebook_connections')
            .select('*')
            .eq('page_id', '623567207496127')
            .single();
        console.log(dataSaved);

        if (data.access_token) {
            // await supabase
            //     .from('facebook_connections')
            //     .update({
            //         access_token: data.access_token
            //     })
            //     .eq('page_id', '623567207496127')
            //     .select()
            //     .single();



            return new Response(
                JSON.stringify({ message: "Long life token received", token: data.access_token }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
        } else {
            return new Response(
                JSON.stringify({ error: data.error.message }),
                {
                    status: 500,
                    headers: {"Content-Type": "application/json"},
                }
            );
        }
    } catch(e) {
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