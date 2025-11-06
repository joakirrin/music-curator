// src/utils/linkValidator.ts
// Validates Spotify and YouTube URLs before API calls

export type ValidationResult = {
  isValid: boolean;
  platform?: 'spotify' | 'youtube';
  trackId?: string;
  error?: string;
  normalizedUrl?: string;
};

/**
 * Validates a Spotify URL and extracts the track ID
 * 
 * Accepted formats:
 * - https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
 * - https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp?si=...
 * - spotify:track:3n3Ppam7vgaVa1iaRUc9Lp
 * - Just the ID: 3n3Ppam7vgaVa1iaRUc9Lp (22 characters)
 */
export function validateSpotifyUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is empty or invalid',
    };
  }

  const trimmed = url.trim();

  // Format 1: Full Spotify URL
  const urlMatch = trimmed.match(/(?:https?:\/\/)?open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/);
  if (urlMatch) {
    const trackId = urlMatch[1];
    return {
      isValid: true,
      platform: 'spotify',
      trackId,
      normalizedUrl: `https://open.spotify.com/track/${trackId}`,
    };
  }

  // Format 2: Spotify URI (spotify:track:ID)
  const uriMatch = trimmed.match(/^spotify:track:([a-zA-Z0-9]{22})$/);
  if (uriMatch) {
    const trackId = uriMatch[1];
    return {
      isValid: true,
      platform: 'spotify',
      trackId,
      normalizedUrl: `https://open.spotify.com/track/${trackId}`,
    };
  }

  // Format 3: Just the track ID (22 alphanumeric characters)
  const idMatch = trimmed.match(/^([a-zA-Z0-9]{22})$/);
  if (idMatch) {
    const trackId = idMatch[1];
    return {
      isValid: true,
      platform: 'spotify',
      trackId,
      normalizedUrl: `https://open.spotify.com/track/${trackId}`,
    };
  }

  // Invalid format
  return {
    isValid: false,
    error: 'Invalid Spotify URL format. Expected: https://open.spotify.com/track/[ID] or spotify:track:[ID]',
  };
}

/**
 * Validates a YouTube URL and extracts the video ID
 * 
 * Accepted formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://m.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 */
export function validateYouTubeUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is empty or invalid',
    };
  }

  const trimmed = url.trim();

  // Format 1: youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    const videoId = watchMatch[1];
    return {
      isValid: true,
      platform: 'youtube',
      trackId: videoId,
      normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  // Format 2: youtu.be/ID (short URL)
  const shortMatch = trimmed.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    const videoId = shortMatch[1];
    return {
      isValid: true,
      platform: 'youtube',
      trackId: videoId,
      normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  // Format 3: youtube.com/embed/ID
  const embedMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    const videoId = embedMatch[1];
    return {
      isValid: true,
      platform: 'youtube',
      trackId: videoId,
      normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  // Invalid format
  return {
    isValid: false,
    error: 'Invalid YouTube URL format. Expected: https://www.youtube.com/watch?v=[ID] or https://youtu.be/[ID]',
  };
}

/**
 * Auto-detects platform and validates URL
 * Returns validation result with platform detection
 */
export function validateMusicUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is empty or invalid',
    };
  }

  const trimmed = url.trim();

  // Try Spotify first
  if (trimmed.includes('spotify') || trimmed.match(/^[a-zA-Z0-9]{22}$/)) {
    return validateSpotifyUrl(trimmed);
  }

  // Try YouTube
  if (trimmed.includes('youtube') || trimmed.includes('youtu.be')) {
    return validateYouTubeUrl(trimmed);
  }

  // Unknown platform
  return {
    isValid: false,
    error: 'Unknown platform. Supported: Spotify, YouTube',
  };
}

/**
 * Batch validate multiple URLs
 * Returns array of results in same order as input
 */
export function validateMultipleUrls(urls: string[]): ValidationResult[] {
  return urls.map(url => validateMusicUrl(url));
}

/**
 * Extract Spotify track ID from various formats
 * Returns null if invalid
 */
export function extractSpotifyId(input: string): string | null {
  const result = validateSpotifyUrl(input);
  return result.isValid ? result.trackId || null : null;
}

/**
 * Extract YouTube video ID from various formats
 * Returns null if invalid
 */
export function extractYouTubeId(input: string): string | null {
  const result = validateYouTubeUrl(input);
  return result.isValid ? result.trackId || null : null;
}

/**
 * Check if URL looks suspicious (common hallucination patterns)
 */
export function isSuspiciousUrl(url: string): boolean {
  if (!url) return false;

  const suspicious = [
    // Placeholder text
    /example\.com/i,
    /placeholder/i,
    /\[.*\]/,  // [placeholder]
    
    // Common hallucination patterns
    /undefined/i,
    /null/i,
    /test/i,
    
    // Too short/long
    url.length < 10,
    url.length > 500,
  ];

  return suspicious.some(pattern => {
    if (typeof pattern === 'boolean') return pattern;
    return pattern.test(url);
  });
}
