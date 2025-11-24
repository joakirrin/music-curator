// src/services/spotifyVerification.ts
// Verifies songs using the *logged-in user's* Spotify access token (PKCE).
import type { Song } from '@/types/song';
import { spotifyAuth } from '@/services/spotifyAuth';

const DEV = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[SpotifyVerify]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[SpotifyVerify]', ...args);
}

type SpotifyTrack = {
  id: string;
  uri: string;
  name: string;
  preview_url?: string | null;
  popularity?: number;
  is_playable?: boolean;
  album?: { name?: string; release_date?: string; images?: { url: string }[] };
  artists?: { name: string }[];
};

function normalize(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function similarity(a: string, b: string): number {
  const A = new Set(normalize(a).split(' ').filter(Boolean));
  const B = new Set(normalize(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach(t => { if (B.has(t)) inter++; });
  return inter / Math.max(A.size, B.size);
}

function pickBestMatch(artist: string, title: string, items: SpotifyTrack[]) {
  let best: { t: SpotifyTrack; score: number } | null = null;
  
  for (const t of items) {
    const ta = t.artists?.[0]?.name ?? '';
    const tt = t.name ?? '';
    const artistSim = similarity(artist, ta);
    const titleSim = similarity(title, tt);
    const score = artistSim * 0.55 + titleSim * 0.45;
    
    if (DEV && score > 0.3) {
      log(`  Match candidate: "${tt}" by ${ta} (score: ${score.toFixed(2)})`);
    }
    
    if (!best || score > best.score) {
      best = { t, score };
    }
  }
  
  if (best) {
    log(`Best match score: ${best.score.toFixed(2)} (threshold: 0.5)`);
  }
  
  return best && best.score >= 0.5 ? best.t : null;
}

async function searchWithUserToken(
  q: string, 
  token: string,
  retryOnAuth = true
): Promise<SpotifyTrack[]> {
  const url = `https://api.spotify.com/v1/search?type=track&limit=5&q=${encodeURIComponent(q)}`;
  
  log(`Searching: "${q}"`);
  log(`Request URL: ${url.substring(0, 100)}...`);
  
  const res = await fetch(url, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  
  log(`Response status: ${res.status} ${res.statusText}`);
  
  // Handle 401 with retry logic
  if (res.status === 401) {
    if (retryOnAuth) {
      log('Got 401, attempting token refresh and retry...');
      const refreshed = await spotifyAuth.refreshAccessToken();
      
      if (refreshed) {
        const newToken = await spotifyAuth.getAccessToken();
        if (newToken) {
          log('Retrying search with refreshed token...');
          // Recursive call with retry disabled to prevent infinite loop
          return await searchWithUserToken(q, newToken, false);
        }
      }
      
      logError('Token refresh failed after 401');
      throw new Error('unauthorized');
    } else {
      logError('Got 401 on retry attempt');
      throw new Error('unauthorized');
    }
  }
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    logError(`Search failed: ${res.status}`, errorText.substring(0, 200));
    throw new Error(`search failed ${res.status}`);
  }
  
  const data = await res.json();
  const items = (data?.tracks?.items ?? []) as SpotifyTrack[];
  
  log(`Found ${items.length} results`);
  
  return items;
}

export async function verifySong(input: Song): Promise<Partial<Song>> {
  log('=== Verifying song ===');
  log(`Title: "${input.title}"`);
  log(`Artist: "${input.artist}"`);
  log(`Album: "${input.album ?? 'N/A'}"`);
  
  const token = await spotifyAuth.getAccessToken();
  
  if (!token) {
    logError('No access token available');
    return {
      verificationStatus: 'unverified',
      verificationSource: 'spotify',
      verificationError: 'Please sign in with Spotify to verify tracks',
    };
  }
  
  log('✅ Have valid access token');

  const artist = input.artist ?? '';
  const title = input.title ?? '';
  const album = input.album;

  // Build search queries from most specific to least specific
  const queries: string[] = [
    `artist:"${artist}" track:"${title}"`,
    `${artist} ${title}`,
  ];
  
  if (album) {
    queries.push(`artist:"${artist}" album:"${album}"`);
  }
  
  queries.push(`${normalize(artist)} ${normalize(title)}`);

  log(`Will try ${queries.length} search queries`);

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    log(`\nQuery ${i + 1}/${queries.length}: "${q}"`);
    
    try {
      const items = await searchWithUserToken(q, token);
      
      if (!items.length) {
        log('No results for this query, trying next...');
        continue;
      }
      
      const best = pickBestMatch(artist, title, items);
      
      if (!best) {
        log('No confident match in these results, trying next query...');
        continue;
      }

      log('=== ✅ Match found! ===');
      log(`Spotify Track: "${best.name}" by ${best.artists?.[0]?.name}`);
      log(`Track ID: ${best.id}`);
      log(`URI: ${best.uri}`);

      // ✅ Use service-agnostic field names and albumArtUrl
      return {
        verificationStatus: 'verified',
        verifiedAt: new Date().toISOString(),
        verificationSource: 'spotify',
        serviceId: best.id,
        serviceUri: best.uri,
        serviceUrl: `https://open.spotify.com/track/${best.id}`,
        previewUrl: best.preview_url ?? input.previewUrl,
        albumArtUrl: best.album?.images?.[0]?.url ?? input.albumArtUrl,
        durationMs: input.durationMs,
        isPlayable: best.is_playable ?? input.isPlayable,
        popularity: best.popularity ?? input.popularity,
        album: input.album ?? best.album?.name,
        releaseDate: input.releaseDate ?? best.album?.release_date,
      };
      
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'unauthorized') {
        logError('=== ❌ Authorization failed ===');
        return {
          verificationStatus: 'unverified',
          verificationSource: 'spotify',
          verificationError: 'Session expired. Please sign in again.',
        };
      }
      
      const message = e instanceof Error ? e.message : 'Unknown error';
      logError(`Query ${i + 1} failed:`, message);
      // Continue to next query
    }
  }

  log('=== ❌ No match found after all queries ===');
  
  return {
    verificationStatus: 'failed',
    verifiedAt: new Date().toISOString(),
    verificationSource: 'spotify',
    verificationError: 'Track not found on Spotify. Try editing title/artist or request a replacement.',
  };
}

export function applySongVerification(original: Song, patch: Partial<Song>): Song {
  return { ...original, ...patch };
}
