// src/services/analytics/clarity.ts

/**
 * Microsoft Clarity Analytics Service
 * Initializes Clarity tracking with user consent
 */

export interface ClarityConfig {
  projectId: string;
  enabled: boolean;
}

type ClarityFunction = ((...args: unknown[]) => void) & { q?: unknown[] };
type ClarityWindow = Window & { clarity?: ClarityFunction };

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

    const clarityWindow = window as ClarityWindow;
    if (!clarityWindow.clarity) {
      const clarityFn: ClarityFunction = (...args: unknown[]) => {
        (clarityFn.q = clarityFn.q || []).push(args);
      };
      clarityWindow.clarity = clarityFn;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${projectId}`;
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);

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

    const clarityApi = (window as ClarityWindow).clarity;
    if (typeof clarityApi === 'function') {
      clarityApi('set', key, value);
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

    const clarityApi = (window as ClarityWindow).clarity;
    if (typeof clarityApi === 'function') {
      clarityApi('identify', userId);
    }
  }

  /**
   * Track custom event
   * @param eventName - Event name
   * @param data - Optional payload
   */
  event(eventName: string, data?: unknown): void {
    if (!this.initialized) {
      console.warn('Clarity not initialized');
      return;
    }

    const clarityApi = (window as ClarityWindow).clarity;
    if (typeof clarityApi === 'function') {
      clarityApi('event', eventName, data);
    }
  }
}

// Singleton instance
export const clarity = new ClarityService();
