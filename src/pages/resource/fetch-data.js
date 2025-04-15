import {supabase} from "../../../src/lib/supabase.js";

export async function fetchDataGraphApi() {
    try {
        /**
         * get session bang supabase or localStorage
         */
        const {data, error} = await supabase.auth.getSession();

        // http://127.0.0.1:54321/functions/v1/get-pages-data
        // https://pmybhyeyienzwgthbfkh.supabase.co/functions/v1/get-pages-data
        const response = await fetch('https://pmybhyeyienzwgthbfkh.supabase.co/functions/v1/get-pages-data', {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
            }
        });
        const res = await response.json();
        return res;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}