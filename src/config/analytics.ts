// src/config/analytics.ts

export const ANALYTICS_CONFIG = {
  clarity: {
    projectId: 'u8jxovu86a', // Your Clarity project ID
    enabled: import.meta.env.PROD, // Only in production (change to `true` for testing in dev)
  },
} as const;

/**
 * Check if user has consented to analytics
 */
export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem('cookie-consent') === 'accepted';
}

/**
 * Set analytics consent
 */
export function setAnalyticsConsent(accepted: boolean): void {
  localStorage.setItem('cookie-consent', accepted ? 'accepted' : 'rejected');
}
