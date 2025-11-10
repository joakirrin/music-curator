// src/services/spotifyVerification.ts
// Verifies songs using the *logged-in user's* Spotify access token (PKCE).
import type { Song } from '@/types/song';
import { spotifyAuth } from '@/services/spotifyAuth';

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
    const score = similarity(artist, ta) * 0.55 + similarity(title, tt) * 0.45;
    if (!best || score > best.score) best = { t, score };
  }
  return best && best.score >= 0.5 ? best.t : null;
}

async function searchWithUserToken(q: string, token: string): Promise<SpotifyTrack[]> {
  const url = `https://api.spotify.com/v1/search?type=track&limit=5&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error(`search failed ${res.status}`);
  const data = await res.json();
  return (data?.tracks?.items ?? []) as SpotifyTrack[];
}

export async function verifySong(input: Song): Promise<Partial<Song>> {
  const token = await spotifyAuth.getAccessToken?.();
  if (!token) {
    return {
      verificationStatus: 'unverified',
      verificationSource: 'spotify',
      verificationError: 'Login to Spotify to verify',
    };
  }

  const artist = input.artist ?? '';
  const title = input.title ?? '';
  const album = input.album;

  const queries: string[] = [
    `artist:"${artist}" track:"${title}"`,
    `${artist} ${title}`,
    `${normalize(artist)} ${normalize(title)}`
  ];
  if (album) queries.push(`artist:"${artist}" album:"${album}"`);

  for (const q of queries) {
    try {
      const items = await searchWithUserToken(q, token);
      if (!items.length) continue;
      const best = pickBestMatch(artist, title, items);
      if (!best) continue;

      return {
        verificationStatus: 'verified',
        verifiedAt: new Date().toISOString(),
        verificationSource: 'spotify',
        spotifyId: best.id,
        spotifyUri: best.uri,
        spotifyUrl: `https://open.spotify.com/track/${best.id}`,
        previewUrl: best.preview_url ?? input.previewUrl,
        albumArt: best.album?.images?.[0]?.url ?? input.albumArt,
        durationMs: input.durationMs,
        isPlayable: best.is_playable ?? input.isPlayable,
        popularity: best.popularity ?? input.popularity,
        album: input.album ?? best.album?.name,
        releaseDate: input.releaseDate ?? best.album?.release_date,
      };
    } catch (e: any) {
      if (e?.message === 'unauthorized') {
        return {
          verificationStatus: 'unverified',
          verificationSource: 'spotify',
          verificationError: 'Session expired. Please sign in again.',
        };
      }
      // try next query
    }
  }

  return {
    verificationStatus: 'failed',
    verifiedAt: new Date().toISOString(),
    verificationSource: 'spotify',
    verificationError: 'No confident match found on Spotify',
  };
}

export function applySongVerification(original: Song, patch: Partial<Song>): Song {
  return { ...original, ...patch };
}
