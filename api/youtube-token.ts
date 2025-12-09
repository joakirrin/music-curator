// api/youtube-token.ts
// Vercel Serverless Function for YouTube OAuth token exchange
// Keeps client_secret secure on the backend

import type { VercelRequest, VercelResponse } from '@vercel/node';

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID!;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers (allow your domain)
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
    console.error('Missing YouTube OAuth credentials in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { code, redirect_uri, code_verifier, grant_type, refresh_token } = req.body;

    // Handle token exchange (authorization_code)
    if (grant_type === 'authorization_code') {
      if (!code || !redirect_uri || !code_verifier) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing required parameters: code, redirect_uri, or code_verifier',
        });
      }

      console.log('[YouTube Token] Exchanging authorization code for tokens...');

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: YOUTUBE_CLIENT_ID,
          client_secret: YOUTUBE_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri,
          code_verifier,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('[YouTube Token] Exchange failed:', tokenData);
        return res.status(tokenResponse.status).json(tokenData);
      }

      console.log('[YouTube Token] ✅ Token exchange successful');
      return res.status(200).json(tokenData);
    }

    // Handle token refresh (refresh_token)
    if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing required parameter: refresh_token',
        });
      }

      console.log('[YouTube Token] Refreshing access token...');

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: YOUTUBE_CLIENT_ID,
          client_secret: YOUTUBE_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token,
        }),
      });

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        console.error('[YouTube Token] Refresh failed:', refreshData);
        return res.status(refreshResponse.status).json(refreshData);
      }

      console.log('[YouTube Token] ✅ Token refresh successful');
      return res.status(200).json(refreshData);
    }

    // Invalid grant_type
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Invalid grant_type. Expected "authorization_code" or "refresh_token"',
    });
  } catch (error) {
    console.error('[YouTube Token] Server error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}