// API route for proxying requests to Anthropic's Claude API
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    
    // Get the API key from environment variables (server-side only)
    const apiKey = process.env.CLAUDE_API_KEY
      || process.env.ANTHROPIC_API_KEY
      || process.env.NEXT_PUBLIC_CLAUDE_API_KEY
      || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    const apiEndpoint = process.env.CLAUDE_API_ENDPOINT || process.env.NEXT_PUBLIC_CLAUDE_API_ENDPOINT || 'https://api.anthropic.com/v1/messages';
    const model = process.env.CLAUDE_MODEL || process.env.NEXT_PUBLIC_CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';
    
    if (!apiKey) {
      console.error('No Claude API key found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Make sure the model is set in the request
    if (body.model === undefined || body.model === null) {
      body.model = model;
    }

    console.log(`Proxying request to Claude API with model: ${body.model}`);
    
    // Forward the request to Anthropic's API
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
    
    // Get the response
    const data = await response.json();

    // Forward Anthropic's actual status so client-side error handling
    // (e.g. detecting an unconfigured/invalid key) sees real failures
    // instead of a false 200 wrapping an error payload.
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Claude API error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Claude API', details: error.message });
  }
} 