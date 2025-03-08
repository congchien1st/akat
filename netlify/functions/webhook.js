// Netlify serverless function to handle webhook requests
exports.handler = async (event, context) => {
  // Log the incoming request
  console.log('Webhook request received:', event);
  console.log('Query parameters:', event.queryStringParameters);
  
  // Handle GET requests for webhook verification
  if (event.httpMethod === 'GET') {
    const queryParams = event.queryStringParameters;
    const mode = queryParams['hub.mode'];
    const token = queryParams['hub.verify_token'];
    const challenge = queryParams['hub.challenge'];
    
    console.log('Webhook verification request:', { mode, token, challenge });
    
    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token
      if (mode === 'subscribe' && token === 'akamediaplatfrom9924') {
        // Respond with only the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store'
          },
          body: challenge
        };
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        console.log('WEBHOOK_VERIFICATION_FAILED');
        return {
          statusCode: 403,
          body: 'Forbidden'
        };
      }
    } else {
      // Return a '400 Bad Request' if mode or token is missing
      return {
        statusCode: 400,
        body: 'Bad Request'
      };
    }
  }
  
  // Handle POST requests for webhook events
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      
      // Checks if this is an event from a page subscription
      if (body.object === 'page') {
        // Return a '200 OK' response to acknowledge receipt of the event
        return {
          statusCode: 200,
          body: 'EVENT_RECEIVED'
        };
      } else {
        // Return a '404 Not Found' if event is not from a page subscription
        return {
          statusCode: 404,
          body: 'Not Found'
        };
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      };
    }
  }
  
  // Return 405 Method Not Allowed for other HTTP methods
  return {
    statusCode: 405,
    body: 'Method Not Allowed'
  };
};