// api/beta-request.ts
// Vercel serverless function to handle Spotify beta access requests
// Sends notifications via Telegram + Email

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

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

  // Log to console (visible in Vercel logs)
  console.log('=== 🎵 NEW SPOTIFY BETA REQUEST ===');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Timestamp:', timestamp);
  console.log('=====================================');

  // Track success/failures
  const results = {
    telegram: false,
    email: false,
  };

  // 1. Send Telegram notification
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const message = `
🎵 *NEW SPOTIFY BETA REQUEST*

👤 *Name:* ${name}
📧 *Email:* \`${email}\`
🕐 *Time:* ${new Date(timestamp).toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        dateStyle: 'medium',
        timeStyle: 'short'
      })}

*Action Required:*
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your Fonea app
3. Go to Settings → User Management
4. Add \`${email}\` to the allowlist
5. Reply here when done ✅
      `.trim();

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
        }
      );

      if (telegramResponse.ok) {
        results.telegram = true;
        console.log('✅ Telegram notification sent');
      } else {
        const error = await telegramResponse.text();
        console.error('❌ Telegram failed:', error);
      }
    } catch (error) {
      console.error('❌ Telegram error:', error);
    }
  } else {
    console.warn('⚠️ Telegram credentials not configured');
  }

  // 2. Send Email notification via Resend
  if (RESEND_API_KEY) {
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Fonea Beta <onboarding@resend.dev>',
          to: 'foneamusiccurator@gmail.com',
          subject: `🎵 New Spotify Beta Request from ${name}`,
          html: `
            <h2>New Spotify Beta Access Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
            
            <hr />
            
            <h3>Action Required:</h3>
            <ol>
              <li>Go to <a href="https://developer.spotify.com/dashboard">Spotify Developer Dashboard</a></li>
              <li>Click on your Fonea app</li>
              <li>Go to Settings → User Management</li>
              <li>Add <code>${email}</code> to the allowlist</li>
              <li>Send confirmation email to user</li>
            </ol>
          `,
        }),
      });

      if (emailResponse.ok) {
        results.email = true;
        console.log('✅ Email notification sent');
      } else {
        const error = await emailResponse.text();
        console.error('❌ Email failed:', error);
      }
    } catch (error) {
      console.error('❌ Email error:', error);
    }
  } else {
    console.warn('⚠️ Resend API key not configured');
  }

  // Return success if at least one notification worked
  const success = results.telegram || results.email;

  if (success) {
    return res.status(200).json({ 
      success: true,
      message: 'Beta request received. You will be notified within 24 hours.',
      notifications: results,
    });
  } else {
    // Both failed, but still accept the request (logged to console)
    return res.status(200).json({ 
      success: true,
      message: 'Beta request received and logged. You will be notified within 24 hours.',
      notifications: results,
      warning: 'Notifications may be delayed',
    });
  }
}
