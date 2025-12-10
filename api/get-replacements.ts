// api/get-replacements.ts
// 🔒 SECURE: Vercel serverless function to call OpenAI API
// This keeps your API key server-side and never exposes it to the client

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ✅ SECURE: Server-side only - NEVER exposed to client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type ChatGPTRecommendation = {
  title: string;
  artist: string;
  album?: string;
  year?: string;
  reason?: string;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key is configured
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: 'OpenAI API key not configured on server' 
    });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Valid prompt is required' });
    }

    console.log('[API] Requesting replacements from OpenAI...');

    // Call OpenAI API from server-side (secure)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are a music recommendation assistant. Always respond with valid JSON in the format: {"recommendations": [{"title": "...", "artist": "...", "reason": "..."}]}. Only suggest real, verified songs that exist on major streaming platforms.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from ChatGPT');
    }

    // Parse and validate recommendations
    const parsed = JSON.parse(content.trim());
    
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid response format from ChatGPT');
    }

    console.log(`[API] Successfully got ${parsed.recommendations.length} replacements`);

    return res.status(200).json({ 
      recommendations: parsed.recommendations 
    });

  } catch (error: any) {
    console.error('[API] Error getting replacements:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to get replacements' 
    });
  }
}
