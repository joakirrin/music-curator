// src/utils/tokenStorage.ts
// Secure token storage with basic encryption for localStorage

import type { SpotifyAuthState } from '../types/spotify';

const STORAGE_KEY = 'fonea_spotify_auth';

/**
 * Simple XOR encryption for token storage
 * Note: This is basic obfuscation, not cryptographic security
 * Real security comes from HTTPS, short token expiry, and PKCE flow
 */
export function encryptToken(token: string): string {
  const key = import.meta.env.VITE_ENCRYPTION_KEY || 'fonea-default-key-change-me';
  
  let encrypted = '';
  for (let i = 0; i < token.length; i++) {
    encrypted += String.fromCharCode(
      token.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  
  return btoa(encrypted); // Base64 encode
}

/**
 * Decrypt token from storage
 */
export function decryptToken(encrypted: string): string {
  const key = import.meta.env.VITE_ENCRYPTION_KEY || 'fonea-default-key-change-me';
  
  try {
    const decoded = atob(encrypted); // Base64 decode
    
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return '';
  }
}

/**
 * Store auth state in localStorage with encrypted tokens
 */
export function storeAuthState(state: SpotifyAuthState): void {
  try {
    const encrypted = {
      ...state,
      accessToken: state.accessToken ? encryptToken(state.accessToken) : null,
      refreshToken: state.refreshToken ? encryptToken(state.refreshToken) : null,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
  } catch (error) {
    console.error('Failed to store auth state:', error);
  }
}

/**
 * Load auth state from localStorage and decrypt tokens
 */
export function loadAuthState(): SpotifyAuthState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    return {
      ...parsed,
      accessToken: parsed.accessToken ? decryptToken(parsed.accessToken) : null,
      refreshToken: parsed.refreshToken ? decryptToken(parsed.refreshToken) : null,
    };
  } catch (error) {
    console.error('Failed to load auth state:', error);
    return null;
  }
}

/**
 * Clear all auth data from storage
 */
export function clearAuthState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear(); // Clear PKCE data too
  } catch (error) {
    console.error('Failed to clear auth state:', error);
  }
}

/**
 * Check if stored token is expired
 */
export function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  // Add 60 second buffer to refresh before actual expiry
  return Date.now() >= (expiresAt - 60000);
}