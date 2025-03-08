// Netlify serverless function to handle API requests
exports.handler = async (event, context) => {
  // Extract the path from the URL
  const path = event.path.replace('/.netlify/functions/api', '');
  
  // Handle different API endpoints
  if (path === '/prompt' && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'default',
        prompt: 'You are a content moderation system for Facebook posts. Your task is to analyze the content of posts and determine if they violate community standards.\n\nAnalyze the post for the following violations:\n1. Hate speech or discrimination\n2. Violence or threats\n3. Nudity or sexual content\n4. Harassment or bullying\n5. Spam or misleading content\n6. Illegal activities\n7. Self-harm or suicide\n8. Misinformation\n\nRespond with a JSON object in the following format:\n{\n  "violates": boolean,\n  "category": string or null,\n  "reason": string or null,\n  "confidence": number between 0 and 1\n}\n\nWhere:\n- "violates" is true if the post violates community standards, false otherwise\n- "category" is the category of violation (one of the 8 listed above), or null if no violation\n- "reason" is a brief explanation of why the post violates standards, or null if no violation\n- "confidence" is your confidence level in the assessment (0.0 to 1.0)\n\nBe thorough but fair in your assessment. If you are unsure, err on the side of caution.',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    };
  } else {
    return {
      statusCode: 500,
      body: JSON.stringify("sorry it had internal error")
    }
  }
  
  if (path === '/posts' && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        }
      })
    };
  }
  
  if (path === '/notification/test' && event.httpMethod === 'POST') {
    try {
      const { type, recipient } = JSON.parse(event.body);
      
      if (!type || !recipient) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Type and recipient are required' })
        };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          messageId: `test-${Date.now()}`
        })
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body' })
      };
    }
  }
  
  // Return 404 for unknown endpoints
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Not Found' })
  };
};