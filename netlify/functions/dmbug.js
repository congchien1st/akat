// Netlify serverless function to echo parameters
exports.default = async (event, context) => {
  try {
    // Get all query parameters
    const params = event.queryStringParameters || {};
    
    console.log('dmbug function called with params:', params);
    
    // Return the parameters as plain text
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(params, null, 2)
    };
  } catch (error) {
    console.error('Error in dmbug function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'Internal Server Error'
    };
  }
};