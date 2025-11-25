// api/beta-request.ts
// Vercel serverless function to handle Spotify beta access requests
// TODO: Wire up email to foneamusiccurator@gmail.com and Telegram notifications

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, timestamp } = req.body;

  // Validate input
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name required' });
  }

  // Log the request (visible in Vercel logs)
  console.log('=== 🎵 NEW SPOTIFY BETA REQUEST ===');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Timestamp:', timestamp);
  console.log('=====================================');

  // TODO: Send email to foneamusiccurator@gmail.com
  // TODO: Send Telegram notification
  
  // For now, just return success
  return res.status(200).json({ 
    success: true,
    message: 'Beta request received. You will be notified within 24 hours.',
  });
}
