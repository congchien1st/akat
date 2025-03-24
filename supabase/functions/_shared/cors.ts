/**
 * Access-Control-Allow-Origin => cho phep target page (https://localhost:3000) call api /get-pages-data
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://platform.omegaa.cloud/',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    'Content-Type': 'application/json',
}