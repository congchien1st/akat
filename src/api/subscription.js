import express from 'express';
import axios from 'axios';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Subscribe to Facebook objects
router.post('/', async (req, res) => {
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
    await supabase
      .from('error_logs')
      .insert({
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

// Get subscription status
router.get('/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    
    // Get page access token from database
    const { data: connection, error: connectionError } = await supabase
      .from('facebook_connections')
      .select('access_token')
      .eq('page_id', pageId)
      .single();
    
    if (connectionError) {
      throw new Error(`Error fetching page access token: ${connectionError.message}`);
    }
    
    // Call the Facebook Graph API to get subscription status
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
      { 
        params: { access_token: connection.access_token }
      }
    );
    
    return res.json({ 
      success: true, 
      data: response.data.data
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    });
  }
});

// Unsubscribe from Facebook objects
router.delete('/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    
    // Get page access token from database
    const { data: connection, error: connectionError } = await supabase
      .from('facebook_connections')
      .select('access_token')
      .eq('page_id', pageId)
      .single();
    
    if (connectionError) {
      throw new Error(`Error fetching page access token: ${connectionError.message}`);
    }
    
    // Call the Facebook Graph API to unsubscribe
    const response = await axios.delete(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
      { 
        params: { access_token: connection.access_token }
      }
    );
    
    if (response.data && response.data.success) {
      // Log successful unsubscription
      await supabase
        .from('automation_logs')
        .insert({
          event_type: 'webhook_unsubscription',
          payload: {
            page_id: pageId,
            timestamp: new Date().toISOString()
          },
          status: 'success'
        });
      
      return res.json({ 
        success: true, 
        message: `Successfully unsubscribed from events for page ${pageId}`
      });
    } else {
      throw new Error('Facebook API returned unsuccessful response');
    }
  } catch (error) {
    console.error('Error unsubscribing from object:', error);
    
    // Log error
    await supabase
      .from('error_logs')
      .insert({
        error_type: 'webhook_unsubscription',
        error_message: error.response?.data?.error?.message || error.message,
        details: { pageId: req.params.pageId }
      });
    
    return res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error?.message || error.message 
    });
  }
});

export default router;