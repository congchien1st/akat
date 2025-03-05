import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Facebook verification token
const VERIFY_TOKEN = Deno.env.get('FB_VERIFY_TOKEN') || 'akamediaplatfrom9924';

// OpenAI API key (will be used by the PostgreSQL trigger)
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

// Seeding API URL (will be used by the PostgreSQL trigger)
const SEEDING_API_URL = Deno.env.get('SEEDING_API_URL') || 'https://platform.omegaa.cloud/api/auto-seed';

serve(async (req: Request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const url = new URL(req.url);
    
    // Handle GET request for webhook verification
    if (req.method === 'GET') {
      const hubMode = url.searchParams.get('hub.mode');
      const hubVerifyToken = url.searchParams.get('hub.verify_token');
      const hubChallenge = url.searchParams.get('hub.challenge');
      
      console.log('Webhook verification request:', { hubMode, hubVerifyToken, hubChallenge });
      
      // Check if a token and mode were sent
      if (hubMode && hubVerifyToken) {
        // Check the mode and token
        if (hubMode === 'subscribe' && hubVerifyToken === VERIFY_TOKEN) {
          // Respond with the challenge token from the request
          console.log('WEBHOOK_VERIFIED');
          return new Response(hubChallenge, {
            status: 200,
            headers: {
              'Content-Type': 'text/plain',
              'Cache-Control': 'no-store',
              ...headers
            }
          });
        } else {
          // Respond with '403 Forbidden' if verify tokens do not match
          console.log('WEBHOOK_VERIFICATION_FAILED');
          return new Response('Forbidden', { status: 403, headers });
        }
      } else {
        // Return a '400 Bad Request' if mode or token is missing
        return new Response('Bad Request', { status: 400, headers });
      }
    }
    
    // Handle POST request for webhook events
    if (req.method === 'POST') {
      // Parse the request body
      const body = await req.json();
      
      // Log the incoming webhook
      console.log('Webhook received:', JSON.stringify(body));
      
      // Check if this is an event from a page subscription
      if (body.object === 'page') {
        // Store the webhook data in the webhook_logs table
        const { data, error } = await supabase
          .from('webhook_logs')
          .insert({
            source: 'facebook',
            event_type: 'page',
            payload: body,
            processed: false
          });
        
        if (error) {
          console.error('Error storing webhook:', error);
          return new Response(JSON.stringify({ error: 'Failed to store webhook' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...headers }
          });
        }
        
        // Return a '200 OK' response to acknowledge receipt of the event
        return new Response(JSON.stringify({ success: true, message: 'EVENT_RECEIVED' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...headers }
        });
      } else {
        // Return a '404 Not Found' if event is not from a page subscription
        return new Response(JSON.stringify({ error: 'Not a page event' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...headers }
        });
      }
    }
    
    // Return 405 Method Not Allowed for other HTTP methods
    return new Response('Method Not Allowed', { status: 405, headers });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Log the error
    await supabase
      .from('error_logs')
      .insert({
        error_type: 'webhook_processing',
        error_message: error.message || 'Unknown error',
        details: { url: req.url, method: req.method }
      });
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...headers }
    });
  }
});