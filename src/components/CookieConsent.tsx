// src/components/CookieConsent.tsx - GDPR COMPLIANT VERSION

import { useEffect, useRef } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import { clarity } from '../services/analytics/clarity';
import { ANALYTICS_CONFIG, setAnalyticsConsent } from '../config/analytics';

export function CookieConsentBanner() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      console.log('[CookieConsent] ⏭️ Already initialized, skipping');
      return;
    }

    console.log('[CookieConsent] 🚀 Initializing GDPR-compliant banner...');
    initialized.current = true;

    // Force clear in development
    if (import.meta.env.DEV) {
      console.log('[CookieConsent] 🧹 Force clearing consent data (DEV mode)');
      localStorage.removeItem('cc_cookie');
      localStorage.removeItem('cookie-consent');
    }

    try {
      CookieConsent.run({
        mode: 'opt-in',
        
        
        categories: {
          necessary: {
            enabled: true,
            readOnly: true,
          },
          analytics: {
            enabled: false,
            readOnly: false,
          },
        },

        guiOptions: {
          consentModal: {
            layout: 'cloud',
            position: 'bottom center',
            equalWeightButtons: true,
            flipButtons: false
          },
          preferencesModal: {
            layout: 'box',
            equalWeightButtons: true,
            flipButtons: false
          }
        },

        language: {
          default: 'en',
          translations: {
            en: {
              consentModal: {
                title: '🍪 Cookie Consent',
                description:
                  'Fonea processes personal data when you connect to Spotify and uses analytics to improve your experience. We need your consent for optional analytics cookies.',
                acceptAllBtn: 'Accept All',
                acceptNecessaryBtn: 'Only Essential',
                showPreferencesBtn: 'Customize',
              },
              preferencesModal: {
                title: 'Privacy Preferences',
                acceptAllBtn: 'Accept All',
                acceptNecessaryBtn: 'Only Essential',
                savePreferencesBtn: 'Save My Choices',
                closeIconLabel: 'Close',
                serviceCounterLabel: 'Service|Services',
                sections: [
                  {
                    title: '📋 How We Handle Your Data',
                    description: `
                      <div style="font-size: 14px; line-height: 1.6;">
                        <p><strong>Fonea Sound Curator</strong> is a music curation app that helps you organize playlists with AI assistance.</p>
                        
                        <p><strong>🔐 Data Processing:</strong></p>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                          <li><strong>Spotify Integration:</strong> When you connect Spotify, we process your access tokens and playlist data locally in your browser</li>
                          <li><strong>Local Storage:</strong> Your playlists and preferences are stored only in your browser's localStorage</li>
                          <li><strong>Analytics (Optional):</strong> Anonymous usage data to improve our service</li>
                        </ul>

                        <p><strong>🌍 International Transfers:</strong> Microsoft Clarity (analytics) may transfer data outside the EU with appropriate safeguards.</p>
                        
                        <p><strong>⚖️ Legal Basis:</strong> Consent (analytics), Legitimate Interest (core functionality), Contract Performance (Spotify integration).</p>

                        <p><strong>👥 Your Rights:</strong> Access, rectify, delete, port, or restrict processing of your data. <a href="/privacy" style="color: #10b981;">Full Privacy Policy</a></p>
                      </div>
                    `
                  },
                  {
                    title: '✅ Essential Cookies',
                    description: 'Required for Fonea to function. These cannot be disabled.',
                    linkedCategory: 'necessary',
                    cookieTable: {
                      headers: {
                        name: 'Purpose',
                        description: 'What We Store & Why',
                      },
                      body: [
                        {
                          name: '🎵 Music Data',
                          description: 'Your imported songs, playlists, and feedback stored locally in your browser',
                        },
                        {
                          name: '🔐 Spotify Authentication',
                          description: 'Access tokens to connect with your Spotify account (stored locally, never sent to our servers)',
                        },
                        {
                          name: '⚙️ App Preferences', 
                          description: 'Your settings and UI preferences (filters, display options, etc.)',
                        },
                        {
                          name: '🍪 Cookie Consent',
                          description: 'Remembers your privacy choices for this website',
                        }
                      ],
                    },
                  },
                  {
                    title: '📊 Analytics Cookies (Optional)',
                    description: `
                      <div style="font-size: 14px; line-height: 1.6;">
                        <p>Help us improve Fonea by understanding how you use the app.</p>
                        
                        <p><strong>🔍 What We Collect:</strong></p>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                          <li>Anonymous page views and clicks (heatmaps)</li>
                          <li>Session recordings (mouse movements, no text input)</li>
                          <li>Browser type, screen size, country</li>
                          <li>Time spent using features</li>
                        </ul>

                        <p><strong>🚫 What We DON'T Collect:</strong></p>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                          <li>Your name, email, or any personal identifiers</li>
                          <li>Your Spotify username or listening history</li>
                          <li>Text you type (passwords, song names, etc.)</li>
                          <li>Your actual playlist content or music taste</li>
                        </ul>

                        <p><strong>🔒 Privacy Safeguards:</strong> IP anonymization, 30-day retention, no cross-device tracking.</p>
                      </div>
                    `,
                    linkedCategory: 'analytics',
                    cookieTable: {
                      headers: {
                        name: 'Service',
                        description: 'Provider & Purpose',
                      },
                      body: [
                        {
                          name: '📈 Microsoft Clarity',
                          description: 'Anonymous analytics and heatmaps. Data processed by Microsoft with IP anonymization. <a href="https://privacy.microsoft.com/privacystatement" target="_blank" style="color: #10b981;">Microsoft Privacy Policy</a>',
                        },
                      ],
                    },
                  },
                  {
                    title: '🌍 Third-Party Services',
                    description: `
                      <div style="font-size: 14px; line-height: 1.6;">
                        <p><strong>When you use Fonea, you also interact with:</strong></p>
                        
                        <p><strong>🎵 Spotify:</strong></p>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                          <li>We use Spotify's API to verify songs and create playlists</li>
                          <li>Your Spotify data is processed according to <a href="https://www.spotify.com/privacy" target="_blank" style="color: #10b981;">Spotify's Privacy Policy</a></li>
                          <li>Fonea never stores your Spotify data on our servers</li>
                        </ul>

                        <p><strong>🎶 MusicBrainz:</strong></p>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                          <li>Public music database for song verification</li>
                          <li>No personal data sent, only song titles and artists</li>
                        </ul>

                        <p><strong>🤖 OpenAI ChatGPT:</strong></p>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                          <li>You provide song recommendations via ChatGPT separately</li>
                          <li>Fonea only receives the final JSON output you paste</li>
                        </ul>
                      </div>
                    `
                  },
                  {
                    title: '⚖️ Your Privacy Rights (GDPR)',
                    description: `
                      <div style="font-size: 14px; line-height: 1.6;">
                        <p><strong>You have the right to:</strong></p>
                        <ul style="margin: 8px 0; padding-left: 20px;">
                          <li><strong>Access:</strong> See what data we have about you</li>
                          <li><strong>Rectify:</strong> Correct incorrect data</li>
                          <li><strong>Delete:</strong> Remove your data (Right to be Forgotten)</li>
                          <li><strong>Port:</strong> Export your data in a readable format</li>
                          <li><strong>Restrict:</strong> Limit how we process your data</li>
                          <li><strong>Object:</strong> Opt-out of processing based on legitimate interest</li>
                          <li><strong>Withdraw Consent:</strong> Change your mind about analytics anytime</li>
                        </ul>

                        <p><strong>📧 Exercise Your Rights:</strong></p>
                        <p>Email us at: <a href="mailto:foneamusiccurator@gmail.com" style="color: #10b981;">foneamusiccurator@gmail.com</a></p>
                        <p>Or clear your browser data to delete everything locally stored.</p>

                        <p><strong>📍 EU Representative:</strong> For EU users, contact us at the email above.</p>

                        <p><strong>🏛️ Supervisory Authority:</strong> You can file a complaint with your local data protection authority.</p>
                      </div>
                    `
                  },
                  {
                    title: '📞 Contact & More Info',
                    description: `
                      <div style="font-size: 14px; line-height: 1.6;">
                        <p><strong>📧 Privacy Questions:</strong> <a href="mailto:foneamusiccurator@gmail.com" style="color: #10b981;">foneamusiccurator@gmail.com</a></p>
                        <p><strong>📄 Full Privacy Policy:</strong> <a href="/privacy" style="color: #10b981;">View Complete Policy</a></p>
                        <p><strong>🔧 Technical Support:</strong> <a href="mailto:foneamusiccurator@gmail.com" style="color: #10b981;">foneamusiccurator@gmail.com</a></p>
                        
                        <p style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                          Fonea Sound Curator • Last updated: ${new Date().toLocaleDateString()} • GDPR Compliant
                        </p>
                      </div>
                    `
                  }
                ],
              },
            },
          },
        },

        // Callbacks
        onFirstConsent: ({ cookie }) => {
          console.log('[CookieConsent] 🎉 FIRST CONSENT:', cookie);
        },

        onConsent: ({ cookie }) => {
          console.log('[CookieConsent] ✅ Consent given:', cookie);
          console.log('[CookieConsent] Categories accepted:', cookie.categories);

          if (cookie.categories.includes('analytics')) {
            console.log('[CookieConsent] 🎯 Analytics accepted - initializing Clarity');
            setAnalyticsConsent(true);
            
            if (ANALYTICS_CONFIG.clarity.enabled) {
              clarity.init(ANALYTICS_CONFIG.clarity.projectId);
              clarity.event('cookie_consent_accepted');
              console.log('[CookieConsent] ✅ Clarity initialized');
            }
          } else {
            console.log('[CookieConsent] ⏭️ Analytics declined - respecting choice');
            setAnalyticsConsent(false);
          }
        },

        onChange: ({ cookie, changedCategories }) => {
          console.log('[CookieConsent] 🔄 Consent changed:', cookie, changedCategories);

          if (changedCategories.includes('analytics')) {
            if (cookie.categories.includes('analytics')) {
              console.log('[CookieConsent] 🎯 Analytics NOW enabled');
              setAnalyticsConsent(true);
              
              if (ANALYTICS_CONFIG.clarity.enabled) {
                clarity.init(ANALYTICS_CONFIG.clarity.projectId);
                clarity.event('cookie_consent_changed_to_accept');
              }
            } else {
              console.log('[CookieConsent] ⏭️ Analytics NOW disabled');
              setAnalyticsConsent(false);
              // Reload to stop any active tracking
              window.location.reload();
            }
          }
        },
      });

      console.log('[CookieConsent] ✅ GDPR-compliant banner initialized');
      
    } catch (error) {
      console.error('[CookieConsent] ❌ Error initializing GDPR banner:', error);
    }

    return () => {
      console.log('[CookieConsent] 🧹 Cleanup');
      initialized.current = false;
    };
  }, []);

  return null;
}
