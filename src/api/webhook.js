import express from 'express';
// import { verifyWebhook, processWebhookEvent } from '../lib/webhookHandler.js';

const router = express.Router();

// Facebook Webhook verification
router.get('/', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('API webhook verification request received:', { mode, token, challenge });

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
        res.sendStatus(403);
      }
    } catch (error) {
      console.error('Webhook verification error:', error);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
});

// Facebook Webhook for receiving updates
router.post('/', async (req, res) => {
  const body = req.body;

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
    }
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

export default router;