import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSong } from '@/test/factories';

const mbMock = vi.fn();
vi.mock('@/services/verification/musicBrainzVerification', () => ({
  verifyWithMusicBrainz: (...args: unknown[]) => mbMock(...args),
}));
vi.mock('@/services/appleMusicResolver', () => ({ resolveAppleMusic: async () => null }));
vi.mock('@/services/spotifyIsrcResolver', () => ({ resolveSpotifyByISRC: async () => null }));
vi.mock('@/services/spotifyAuth', () => ({ spotifyAuth: { getAccessToken: async () => null } }));
vi.mock('@/services/export/smartPlatformResolver', () => ({ resolveSpotifySong: async () => ({}) }));
vi.mock('@/services/appleMusicService', () => ({ getPreviewUrl: async () => null }));

const { verifySongsInBatch } = await import('./verificationOrchestrator');

beforeEach(() => {
  mbMock.mockReset();
  vi.useRealTimers();
});

describe('verifySongsInBatch', () => {
  it('si se cancela devuelve lo comprobado hasta ahí en vez de lanzar un error', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await verifySongsInBatch([makeSong({ verificationStatus: 'checking' })], undefined, controller.signal);

    expect(result.verifiedSongs).toEqual([]);
  });

  it('una canción que se atasca queda sin verificar y se sigue con la siguiente', async () => {
    vi.useFakeTimers();
    mbMock
      .mockImplementationOnce(() => new Promise(() => {})) // never answers
      .mockResolvedValueOnce({ verified: true, artist: 'B', title: 'Two' });

    const run = verifySongsInBatch([
      makeSong({ id: '1', artist: 'A', title: 'One', verificationStatus: 'checking' }),
      makeSong({ id: '2', artist: 'B', title: 'Two', verificationStatus: 'checking' }),
    ]);
    await vi.advanceTimersByTimeAsync(16000);
    const { verifiedSongs, summary } = await run;

    expect(verifiedSongs.map((s) => [s.id, s.verificationStatus])).toEqual([
      ['1', 'unverified'],
      ['2', 'verified'],
    ]);
    expect(summary.verified).toBe(1);
  });
});
