// src/services/youtube/pkceHelper.ts
// PKCE helper utilities for OAuth 2.0 flows
// ✅ FIXED: Removed 10-minute expiry - params persist until explicitly cleared
// ✅ FIXED: Better error handling and logging

const DEV = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[PKCE]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[PKCE]', ...args);
}

// Base64 URL-safe encoding
function toB64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// SHA-256 hash
async function sha256(input: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(input);
  return await crypto.subtle.digest('SHA-256', data);
}

// Generate random hex string
function randHex(len = 64): string {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

// Storage key builder
function getStorageKey(platform: 'spotify' | 'youtube', type: 'verifier' | 'state'): string {
  return `fonea_pkce_${platform}_${type}`;
}

/**
 * Generate PKCE parameters (verifier, challenge, state)
 */
export async function generatePKCEParams(): Promise<{
  verifier: string;
  challenge: string;
  state: string;
}> {
  const verifier = randHex(64); // 128 hex chars = 64 bytes
  const state = randHex(32); // 64 hex chars = 32 bytes
  const challengeBuffer = await sha256(verifier);
  const challenge = toB64Url(challengeBuffer);

  log('Generated PKCE params:', {
    verifierLength: verifier.length,
    challengeLength: challenge.length,
    stateLength: state.length,
  });

  return { verifier, challenge, state };
}

/**
 * Store PKCE parameters in localStorage (NO EXPIRY - persists until cleared)
 */
export function storePKCEParams(
  platform: 'spotify' | 'youtube',
  verifier: string,
  state: string
): void {
  try {
    const verifierKey = getStorageKey(platform, 'verifier');
    const stateKey = getStorageKey(platform, 'state');

    localStorage.setItem(verifierKey, verifier);
    localStorage.setItem(stateKey, state);

    log(`Stored PKCE params for ${platform}:`, {
      verifierKey,
      stateKey,
      verifierLength: verifier.length,
      stateLength: state.length,
    });
  } catch (err) {
    logError(`Failed to store PKCE params for ${platform}:`, err);
    throw new Error(`Failed to store PKCE params: ${err}`);
  }
}

/**
 * Retrieve PKCE parameters from localStorage
 */
export function retrievePKCEParams(platform: 'spotify' | 'youtube'): {
  verifier: string | null;
  state: string | null;
} {
  try {
    const verifierKey = getStorageKey(platform, 'verifier');
    const stateKey = getStorageKey(platform, 'state');

    const verifier = localStorage.getItem(verifierKey);
    const state = localStorage.getItem(stateKey);

    log(`Retrieved PKCE params for ${platform}:`, {
      hasVerifier: !!verifier,
      hasState: !!state,
      verifierLength: verifier?.length,
      stateLength: state?.length,
    });

    return { verifier, state };
  } catch (err) {
    logError(`Failed to retrieve PKCE params for ${platform}:`, err);
    return { verifier: null, state: null };
  }
}

/**
 * Validate state parameter (CSRF protection)
 */
export function validateState(platform: 'spotify' | 'youtube', receivedState: string): boolean {
  const { state: storedState } = retrievePKCEParams(platform);

  if (!storedState) {
    logError(`❌ No stored state for ${platform}`);
    return false;
  }

  if (storedState !== receivedState) {
    logError(`❌ State mismatch for ${platform}:`, {
      stored: storedState.substring(0, 20) + '...',
      received: receivedState.substring(0, 20) + '...',
    });
    return false;
  }

  log(`✅ State validated for ${platform}`);
  return true;
}

/**
 * Clear PKCE parameters after successful auth
 */
export function clearPKCEParams(platform: 'spotify' | 'youtube'): void {
  try {
    const verifierKey = getStorageKey(platform, 'verifier');
    const stateKey = getStorageKey(platform, 'state');

    localStorage.removeItem(verifierKey);
    localStorage.removeItem(stateKey);

    log(`Cleared PKCE params for ${platform}`);
  } catch (err) {
    logError(`Failed to clear PKCE params for ${platform}:`, err);
  }
}
