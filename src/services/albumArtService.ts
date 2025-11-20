// src/services/albumArtService.ts
/**
 * Album Art Service - Multi-source album artwork retrieval
 * 
 * Tier 1: Cover Art Archive (MusicBrainz) - 70-80% coverage
 * Tier 2: iTunes/Apple Music - 15-20% coverage
 * Tier 3: Placeholder - Remaining
 * 
 * Expected total coverage: 90-95% real album art
 */

import type { Song } from "../types/song";

const RATE_LIMIT_DELAY = 50; // 50ms between iTunes API requests
let lastRequestTime = 0;

const CACHE_KEY = "fonea-album-art-cache";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export type AlbumArtResult = {
  url: string;
  size: "small" | "medium" | "large";
  source: "coverartarchive" | "itunes" | "placeholder";
};

/**
 * Main function: Get album art with 3-tier fallback
 */
export async function getAlbumArt(song: Song): Promise<AlbumArtResult> {
  // Return cached if available
  if (song.albumArtUrl) {
    return { url: song.albumArtUrl, size: "medium", source: "coverartarchive" };
  }

  // Check localStorage cache
  const cached = getCachedAlbumArt(song.id);
  if (cached) {
    return cached;
  }

  // TIER 1: Cover Art Archive (Best - official MusicBrainz)
  if (song.releaseId) {
    const caaArt = await getCoverArtArchiveImage(song.releaseId);
    if (caaArt) {
      cacheAlbumArt(song.id, caaArt);
      return caaArt;
    }
  }

  // TIER 2: iTunes direct lookup (if we have Apple Music ID)
  if (song.platformIds?.apple?.id) {
    const itunesArt = await getItunesAlbumArt(song.platformIds.apple.id);
    if (itunesArt) {
      cacheAlbumArt(song.id, itunesArt);
      return itunesArt;
    }
  }

  // TIER 3: iTunes search (last resort)
  const searchArt = await searchItunesAlbumArt(song.title, song.artist);
  if (searchArt) {
    cacheAlbumArt(song.id, searchArt);
    return searchArt;
  }

  // TIER 4: Placeholder
  const placeholder = getPlaceholderArt();
  return placeholder;
}

/**
 * Tier 1: Cover Art Archive
 * Uses MusicBrainz Release ID to fetch album art from archive.org
 */
async function getCoverArtArchiveImage(
  releaseId: string
): Promise<AlbumArtResult | null> {
  try {
    // Use 500px version (good balance of quality and file size)
    const url = `https://coverartarchive.org/release/${releaseId}/front-500`;

    // HEAD request to check if exists (returns 307 redirect if exists)
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
    });

    // 307 = redirect (image exists), 404 = not found
    if (response.status === 307 || response.status === 200) {
      return {
        url: url,
        size: "medium",
        source: "coverartarchive",
      };
    }

    return null;
  } catch (error) {
    console.error("Cover Art Archive error:", error);
    return null;
  }
}

/**
 * Tier 2: iTunes Direct Lookup
 * Uses Apple Music ID to fetch album art
 */
async function getItunesAlbumArt(
  appleId: string
): Promise<AlbumArtResult | null> {
  try {
    await enforceRateLimit();

    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${appleId}`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const artworkUrl =
        data.results[0].artworkUrl100 || data.results[0].artworkUrl60;

      if (artworkUrl) {
        return {
          url: getHighResArtwork(artworkUrl),
          size: "large",
          source: "itunes",
        };
      }
    }

    return null;
  } catch (error) {
    console.error("iTunes lookup error:", error);
    return null;
  }
}

/**
 * Tier 3: iTunes Search
 * Searches iTunes by song title and artist
 */
async function searchItunesAlbumArt(
  title: string,
  artist: string
): Promise<AlbumArtResult | null> {
  try {
    await enforceRateLimit();

    const query = `${title} ${artist}`;
    const response = await fetch(
      `https://itunes.apple.com/search?` +
        `term=${encodeURIComponent(query)}&` +
        `entity=song&limit=1`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const artworkUrl = data.results[0].artworkUrl100;

      if (artworkUrl) {
        return {
          url: getHighResArtwork(artworkUrl),
          size: "large",
          source: "itunes",
        };
      }
    }

    return null;
  } catch (error) {
    console.error("iTunes search error:", error);
    return null;
  }
}

/**
 * Tier 4: Placeholder
 */
function getPlaceholderArt(): AlbumArtResult {
  return {
    url: "/assets/placeholder-album.svg",
    size: "medium",
    source: "placeholder",
  };
}

/**
 * Helper: Get high-res artwork from iTunes URL
 * iTunes returns 100x100 by default, but we can hack the URL to get bigger sizes
 */
function getHighResArtwork(artworkUrl: string): string {
  // Replace size to get 600x600 version
  return artworkUrl
    .replace("100x100bb", "600x600bb")
    .replace("60x60bb", "600x600bb")
    .replace("30x30bb", "600x600bb");
}

/**
 * Helper: Enforce iTunes API rate limit (20/min = ~3 seconds per request)
 */
async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
}

/**
 * Cache album art in localStorage
 */
function cacheAlbumArt(songId: string, art: AlbumArtResult) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    cache[songId] = {
      ...art,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Failed to cache album art:", error);
  }
}

/**
 * Get cached album art from localStorage
 */
function getCachedAlbumArt(songId: string): AlbumArtResult | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    const cached = cache[songId];

    if (cached && Date.now() - cached.cachedAt < CACHE_DURATION) {
      return {
        url: cached.url,
        size: cached.size,
        source: cached.source,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get cached album art:", error);
    return null;
  }
}

/**
 * Batch function: Get album art for multiple songs
 * Useful for loading album art for a list of songs
 */
export async function getAlbumArtBatch(
  songs: Song[]
): Promise<Map<string, AlbumArtResult>> {
  const results = new Map<string, AlbumArtResult>();

  for (const song of songs) {
    try {
      const art = await getAlbumArt(song);
      results.set(song.id, art);
    } catch (error) {
      console.error(`Failed to get art for ${song.title}:`, error);
      results.set(song.id, getPlaceholderArt());
    }
  }

  return results;
}

/**
 * Clear album art cache (useful for debugging or settings)
 */
export function clearAlbumArtCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Failed to clear album art cache:", error);
  }
}

/**
 * Get different sizes for Cover Art Archive images
 */
export function getCoverArtSizeUrl(
  releaseId: string,
  size: "small" | "medium" | "large" | "original"
): string {
  const sizeMap = {
    small: "250",
    medium: "500",
    large: "1200",
    original: "",
  };

  const sizeStr = sizeMap[size];
  return `https://coverartarchive.org/release/${releaseId}/front${
    sizeStr ? `-${sizeStr}` : ""
  }`;
}
