// api/test-notifications.ts
// Test endpoint to verify Telegram and Resend are working

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results = {
    telegram: { configured: false, tested: false, error: null as string | null },
    resend: { configured: false, tested: false, error: null as string | null },
  };

  // Check environment variables
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  console.log('=== TESTING NOTIFICATIONS ===');
  console.log('Telegram token present:', !!TELEGRAM_BOT_TOKEN);
  console.log('Telegram chat ID present:', !!TELEGRAM_CHAT_ID);
  console.log('Resend API key present:', !!RESEND_API_KEY);

  // Test Telegram
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    results.telegram.configured = true;
    
    try {
      console.log('Testing Telegram...');
      console.log('Token (first 20 chars):', TELEGRAM_BOT_TOKEN.substring(0, 20));
      console.log('Chat ID:', TELEGRAM_CHAT_ID);
      
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: '✅ TEST: Telegram is working from Vercel!',
          }),
        }
      );

      const telegramData = await telegramResponse.json();
      console.log('Telegram response:', telegramData);

      if (telegramResponse.ok) {
        results.telegram.tested = true;
        console.log('✅ Telegram test successful');
      } else {
        results.telegram.error = JSON.stringify(telegramData);
        console.error('❌ Telegram test failed:', telegramData);
      }
    } catch (error) {
      results.telegram.error = String(error);
      console.error('❌ Telegram error:', error);
    }
  } else {
    console.warn('⚠️ Telegram not configured');
  }

  // Test Resend
  if (RESEND_API_KEY) {
    results.resend.configured = true;
    
    try {
      console.log('Testing Resend...');
      console.log('API Key (first 10 chars):', RESEND_API_KEY.substring(0, 10));
      
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Fonea Test <onboarding@resend.dev>',
          to: 'foneamusiccurator@gmail.com',
          subject: '✅ TEST: Resend Email Working',
          html: '<h1>Test Successful!</h1><p>Resend is working from Vercel.</p>',
        }),
      });

      const emailData = await emailResponse.json();
      console.log('Resend response:', emailData);

      if (emailResponse.ok) {
        results.resend.tested = true;
        console.log('✅ Resend test successful');
      } else {
        results.resend.error = JSON.stringify(emailData);
        console.error('❌ Resend test failed:', emailData);
      }
    } catch (error) {
      results.resend.error = String(error);
      console.error('❌ Resend error:', error);
    }
  } else {
    console.warn('⚠️ Resend not configured');
  }

  console.log('=== TEST RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  return res.status(200).json({
    message: 'Notification test complete. Check Telegram and email for test messages.',
    results,
  });
}
