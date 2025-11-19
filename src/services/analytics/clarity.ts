// src/services/analytics/clarity.ts

/**
 * Microsoft Clarity Analytics Service
 * Initializes Clarity tracking with user consent
 */

export interface ClarityConfig {
  projectId: string;
  enabled: boolean;
}

class ClarityService {
  private initialized = false;

  /**
   * Initialize Microsoft Clarity
   * @param projectId - Your Clarity project ID
   */
  init(projectId: string): void {
    if (this.initialized) {
      console.warn('Clarity already initialized');
      return;
    }

    if (!projectId) {
      console.error('Clarity project ID is required');
      return;
    }

    // Load Clarity script
    // The IIFE takes 5 arguments, and declares 2 local variables (t, y) inside
    (function(c: any, l: Document, a: string, r: string, i: string) {
      c[a] = c[a] || function() {
        (c[a].q = c[a].q || []).push(arguments);
      };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0] as HTMLScriptElement;
      y.parentNode!.insertBefore(t, y);
    })(window, document, "clarity", "script", projectId);

    this.initialized = true;
    console.log('✅ Microsoft Clarity initialized');
  }

  /**
   * Check if Clarity is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Set custom tag (useful for tracking user segments)
   * @param key - Tag key
   * @param value - Tag value
   */
  setTag(key: string, value: string): void {
    if (!this.initialized) {
      console.warn('Clarity not initialized');
      return;
    }

    if (typeof (window as any).clarity === 'function') {
      (window as any).clarity('set', key, value);
    }
  }

  /**
   * Identify user (use anonymous ID, never PII)
   * @param userId - Anonymous user ID
   */
  identify(userId: string): void {
    if (!this.initialized) {
      console.warn('Clarity not initialized');
      return;
    }

    if (typeof (window as any).clarity === 'function') {
      (window as any).clarity('identify', userId);
    }
  }

  /**
   * Track custom event
   * @param eventName - Event name
   */
  event(eventName: string): void {
    if (!this.initialized) {
      console.warn('Clarity not initialized');
      return;
    }

    if (typeof (window as any).clarity === 'function') {
      (window as any).clarity('event', eventName);
    }
  }
}

// Singleton instance
export const clarity = new ClarityService();
