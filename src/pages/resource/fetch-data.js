import {supabase} from "../../../src/lib/supabase.js";

export function getCurrentBaseUrl() {
    if (typeof window !== "undefined") {
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        return isLocal ? "http://127.0.0.1:54321" : "https://pmybhyeyienzwgthbfkh.supabase.co";
    } else {
        // fallback nếu chạy trong SSR hoặc Deno (không phải browser)
        return "https://pmybhyeyienzwgthbfkh.supabase.co";
    }
}


export async function fetchDataGraphApi() {
    try {
        /**
         * get session bang supabase or localStorage
         */
        const {data, error} = await supabase.auth.getSession();

        if (error || !data.session) {
            console.error("No session found", error);
            return [];
        }

        const baseUrl = getCurrentBaseUrl();
        const url = baseUrl + "/functions/v1/get-pages-data";
        const response = await fetch(`${url}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Error response:", text);
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}