import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import nodemailer from 'nodemailer';
import axios from 'axios';
// import { verifyWebhook, processWebhookEvent } from './src/lib/webhookHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmybhyeyienzwgthbfkh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWJoeWV5aWVuendndGhiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODQ2MDAsImV4cCI6MjA1NjU2MDYwMH0.0OKhvJkCUaRmGK1ryttl7yprtltcldjPQ_5xGppxeSs';
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Missing Supabase environment variables');
  // Create a mock client that won't throw errors
  supabase = {
    from: () => ({
      insert: () => Promise.resolve({ data: null, error: null }),
      select: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        limit: () => Promise.resolve({ data: null, error: null }),
        select: () => Promise.resolve({ data: null, error: null }),
        order: () => ({
          limit: () => Promise.resolve({ data: null, error: null }),
          range: () => Promise.resolve({ data: null, error: null, count: 0 })
        })
      }),
      order: () => ({
        range: () => Promise.resolve({ data: null, error: null, count: 0 })
      })
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null })
    }
  };
}

// Initialize OpenAI client (if API key is available)
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} else {
  console.warn('Missing OpenAI API key');
  // Create a mock OpenAI client
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: '{"violates": false, "reason": null}' } }]
        })
      }
    }
  };
}

// Initialize Nodemailer transporter (if email credentials are available)
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  console.warn('Missing email credentials');
  // Create a mock transporter
  transporter = {
    sendMail: async () => ({ messageId: 'mock-message-id' })
  };
}

// Import API routes
import apiRoutes from './src/api/index.js';

// Facebook Webhook verification - MUST be defined BEFORE the static file middleware
app.get('/webhook', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request received:', { mode, token, challenge });

  // Check if a token and mode were sent
  if (mode && token) {
    try {
      // Check the mode and token
      if (mode === 'subscribe' && token === 'akamediaplatfrom9924') {
        // Respond with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        return res.status(200).type('text/plain').send(challenge);
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        console.log('WEBHOOK_VERIFICATION_FAILED');
        return res.sendStatus(403);
      }
    } catch (error) {
      console.error('Webhook verification error:', error);
      return res.sendStatus(500);
    }
  } else {
    console.log('WEBHOOK_MISSING_PARAMETERS');
    return res.sendStatus(400);
  }
});

// New dedicated Facebook webhook endpoint
app.get('/facebook-webhook', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Facebook webhook verification request received:', { mode, token, challenge });

  // Check if a token and mode were sent
  if (mode && token) {
    try {
      // Check the mode and token
      if (mode === 'subscribe' && token === 'akamediaplatfrom9924') {
        // Respond with the challenge token from the request
        console.log('FACEBOOK_WEBHOOK_VERIFIED');
        // Set appropriate headers
        res.set({
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store'
        });
        // Return only the challenge value
        return res.status(200).send(challenge);
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        console.log('FACEBOOK_WEBHOOK_VERIFICATION_FAILED');
        return res.sendStatus(403);
      }
    } catch (error) {
      console.error('Facebook webhook verification error:', error);
      return res.sendStatus(500);
    }
  } else {
    console.log('FACEBOOK_WEBHOOK_MISSING_PARAMETERS');
    return res.sendStatus(400);
  }
});

// Facebook Webhook for receiving updates
app.post('/webhook', async (req, res) => {
  const body = req.body;

  console.log('Webhook event received:', JSON.stringify(body));

  // Checks if this is an event from a page subscription
  if (body.object === 'page') {
    try {
      // Process the webhook event
      await processWebhookEvent(body);
      
      // Return a '200 OK' response to acknowledge receipt of the event
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still return 200 to acknowledge receipt (Facebook will retry otherwise)
      res.status(200).send('EVENT_RECEIVED');
      
      // Log the error to Supabase
      await supabase.from('error_logs').insert({
        error_type: 'webhook_processing',
        error_message: error.message,
        details: body
      });
    }
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    console.log('NOT_A_PAGE_EVENT');
    res.sendStatus(404);
  }
});

// Facebook Webhook for receiving updates (dedicated endpoint)
app.post('/facebook-webhook', async (req, res) => {
  const body = req.body;

  console.log('Facebook webhook event received:', JSON.stringify(body));

  // Checks if this is an event from a page subscription
  if (body.object === 'page') {
    try {
      // Process the webhook event
      await processWebhookEvent(body);
      
      // Return a '200 OK' response to acknowledge receipt of the event
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Error processing Facebook webhook:', error);
      // Still return 200 to acknowledge receipt (Facebook will retry otherwise)
      res.status(200).send('EVENT_RECEIVED');
      
      // Log the error to Supabase
      await supabase.from('error_logs').insert({
        error_type: 'webhook_processing',
        error_message: error.message,
        details: body
      });
    }
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    console.log('NOT_A_PAGE_EVENT');
    res.sendStatus(404);
  }
});

// Use API routes
app.use('/api', apiRoutes);

// Add a dedicated dmbug endpoint
app.get('/dmbug', (req, res) => {
  try {
    // Get all query parameters
    const params = req.query || {};
    
    console.log('dmbug endpoint called with params:', params);
    
    // Return the parameters as plain text
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(JSON.stringify(params, null, 2));
  } catch (error) {
    console.error('Error in dmbug endpoint:', error);
    res.status(500).send('Internal Server Error');
  }
});

// New endpoint for subscribing to Facebook objects
app.post('/api/subscribe-to-object', async (req, res) => {
  try {
    const { pageId, accessToken, object = 'page', fields = ['feed'] } = req.body;
    
    if (!pageId || !accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Page ID and access token are required' 
      });
    }
    
    // Call the Facebook Graph API to subscribe to the object
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
      { 
        subscribed_fields: fields.join(',')
      },
      { 
        params: { access_token: accessToken }
      }
    );
    
    if (response.data && response.data.success) {
      // Log successful subscription
      await supabase
        .from('automation_logs')
        .insert({
          event_type: 'webhook_subscription',
          payload: {
            page_id: pageId,
            object,
            fields,
            timestamp: new Date().toISOString()
          },
          status: 'success'
        });
      
      return res.json({ 
        success: true, 
        message: `Successfully subscribed to ${object} events for page ${pageId}`
      });
    } else {
      throw new Error('Facebook API returned unsuccessful response');
    }
  } catch (error) {
    console.error('Error subscribing to object:', error);
    
    // Log error
    await supabase.from('error_logs').insert({
      error_type: 'webhook_subscription',
      error_message: error.response?.data?.error?.message || error.message,
      details: req.body
    });
    
    return res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    });
  }
});

// Process new posts
async function processNewPost(pageId, postData) {
  try {
    // Save post to Supabase
    const { data: savedPost, error: saveError } = await supabase
      .from('facebook_posts')
      .insert({
        page_id: pageId,
        post_id: postData.post_id,
        message: postData.message || '',
        created_time: postData.created_time,
        status: 'pending'
      })
      .select()
      .single();
    
    if (saveError) {
      throw new Error(`Error saving post: ${saveError.message}`);
    }
    
    // Get moderation prompt from Supabase
    const { data: promptData, error: promptError } = await supabase
      .from('moderation_prompts')
      .select('prompt')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (promptError) {
      throw new Error(`Error fetching prompt: ${promptError.message}`);
    }
    
    const moderationPrompt = promptData.prompt;
    
    // Check content with OpenAI
    const moderationResult = await moderateContent(postData.message || '', moderationPrompt);
    
    // Update post with moderation result
    const { error: updateError } = await supabase
      .from('facebook_posts')
      .update({
        moderation_result: moderationResult,
        status: moderationResult.violates ? 'violated' : 'approved',
        moderated_at: new Date().toISOString()
      })
      .eq('id', savedPost.id);
    
    if (updateError) {
      throw new Error(`Error updating post: ${updateError.message}`);
    }
    
    // If post violates standards, hide it and send notification
    if (moderationResult.violates) {
      await hidePost(pageId, postData.post_id);
      await sendViolationEmail(savedPost, moderationResult);
    }
    
    console.log(`Post ${postData.post_id} processed successfully`);
  } catch (error) {
    console.error('Error processing post:', error);
    await supabase.from('error_logs').insert({
      error_type: 'post_processing',
      error_message: error.message,
      details: { pageId, postData }
    });
  }
}

// Moderate content using OpenAI
async function moderateContent(content, prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0].message.content);
    return {
      violates: result.violates,
      category: result.category || null,
      reason: result.reason || null,
      confidence: result.confidence || null,
      processed_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('OpenAI moderation error:', error);
    // Return a default response in case of error
    return {
      violates: false,
      category: null,
      reason: `Error: ${error.message}`,
      confidence: null,
      processed_at: new Date().toISOString()
    };
  }
}

// Hide post on Facebook
async function hidePost(pageId, postId) {
  try {
    // Get page access token from Supabase
    const { data: connection, error: connectionError } = await supabase
      .from('facebook_connections')
      .select('access_token')
      .eq('page_id', pageId)
      .single();
    
    if (connectionError) {
      throw new Error(`Error fetching page access token: ${connectionError.message}`);
    }
    
    // Hide the post using Facebook Graph API
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${postId}`,
      { is_hidden: true },
      { params: { access_token: connection.access_token } }
    );
    
    console.log(`Post ${postId} hidden successfully:`, response.data);
    return true;
  } catch (error) {
    console.error('Error hiding post:', error);
    await supabase.from('error_logs').insert({
      error_type: 'hide_post',
      error_message: error.message,
      details: { pageId, postId }
    });
    return false;
  }
}

// Send violation email
async function sendViolationEmail(post, moderationResult) {
  try {
    // Get admin email from environment variables or Supabase
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      throw new Error('Admin email not configured');
    }
    
    // Prepare email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: 'Facebook Post Violation Alert',
      html: `
        <h2>Facebook Post Violation Detected</h2>
        <p><strong>Post ID:</strong> ${post.post_id}</p>
        <p><strong>Page ID:</strong> ${post.page_id}</p>
        <p><strong>Created:</strong> ${new Date(post.created_time).toLocaleString()}</p>
        <p><strong>Content:</strong> ${post.message}</p>
        <h3>Violation Details:</h3>
        <p><strong>Category:</strong> ${moderationResult.category || 'Not specified'}</p>
        <p><strong>Reason:</strong> ${moderationResult.reason || 'Not specified'}</p>
        <p><strong>Confidence:</strong> ${moderationResult.confidence || 'Not specified'}</p>
        <p><strong>Action Taken:</strong> Post has been hidden</p>
        <p>Please review this post in the AKA Platform dashboard.</p>
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Violation email sent:', info.messageId);
    
    // Log email sent to Supabase
    await supabase
      .from('notification_logs')
      .insert({
        post_id: post.id,
        notification_type: 'email',
        recipient: adminEmail,
        status: 'sent',
        details: { messageId: info.messageId }
      });
    
    return true;
  } catch (error) {
    console.error('Error sending violation email:', error);
    await supabase.from('error_logs').insert({
      error_type: 'email_notification',
      error_message: error.message,
      details: { post, moderationResult }
    });
    return false;
  }
}

// Get webhook configuration
app.get('/api/webhook-config/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    
    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('page_id', pageId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }
    
    res.json(data || { page_id: pageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save webhook configuration
app.post('/api/webhook-config', async (req, res) => {
  try {
    const { page_id, verify_token, webhook_url } = req.body;
    
    if (!page_id || !verify_token || !webhook_url) {
      return res.status(400).json({ error: 'Page ID, verify token, and webhook URL are required' });
    }
    
    // Check if webhook config already exists
    const { data: existingConfig, error: checkError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('page_id', page_id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing webhook config:', checkError);
      return false;
    }
    
    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('webhook_configs')
        .update({
          verify_token,
          webhook_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      res.json(data);
    } else {
      // Insert new config
      const { data, error } = await supabase
        .from('webhook_configs')
        .insert({
          page_id,
          verify_token,
          webhook_url
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the dist directory AFTER defining API routes
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve the React app - MUST be defined AFTER all API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { 
  console.log(`Server running on port ${PORT}`);
});