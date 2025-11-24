import type { Song } from "@/types/song";
import { verifyWithMusicBrainz } from "@/services/verification/musicBrainzVerification";
import { resolveAppleMusic } from "@/services/appleMusicResolver";
import { resolveSpotifyByISRC } from "@/services/spotifyIsrcResolver";
import { spotifyAuth } from "@/services/spotifyAuth";

export type VerificationSummary = {
  total: number;
  verified: number;
  failed: number;
  skipped: number;
  failedSongs: Array<{ title: string; artist: string; error: string }>;
};

export type VerificationProgress = {
  total: number;
  current: number;
  verified: number;
  failed: number;
  currentSong?: string;
};

/**
 * Verifies a batch of songs using the 3-tier verification system:
 * Tier 1: MusicBrainz (ISRC, metadata, platform IDs)
 * Tier 2: Apple Music (no auth required)
 * Optional: Spotify ISRC resolution (requires auth)
 * 
 * Extracted from ImportChatGPTModal for reusability
 */
export async function verifySongsInBatch(
  songs: Song[],
  onProgress?: (progress: VerificationProgress) => void
): Promise<{ verifiedSongs: Song[]; summary: VerificationSummary }> {
  
  const summary: VerificationSummary = {
    total: songs.length,
    verified: 0,
    failed: 0,
    skipped: 0,
    failedSongs: [],
  };

  const verifiedSongs: Song[] = [];

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    
    // Report progress
    onProgress?.({
      total: songs.length,
      current: i + 1,
      verified: summary.verified,
      failed: summary.failed,
      currentSong: `${song.artist} - ${song.title}`,
    });

    // Skip songs without required fields
    if (!song.artist || !song.title) {
      summary.skipped++;
      verifiedSongs.push({
        ...song,
        verificationStatus: 'unverified',
      });
      continue;
    }

    try {
      let isVerified = false;
      
      // TIER 1: Try MusicBrainz first (best source - has ISRCs, metadata)
      const mbResult = await verifyWithMusicBrainz(song.artist, song.title);
      
      if (mbResult.verified) {
        // MusicBrainz success! Update song with all the data
        verifiedSongs.push({
          ...song,
          verificationStatus: 'verified',
          verificationSource: 'musicbrainz',
          musicBrainzId: mbResult.musicBrainzId,
          isrc: mbResult.isrc,
          albumArtUrl: mbResult.albumArtUrl,
          releaseId: mbResult.releaseId,
          previewUrl: mbResult.previewUrl,
          previewSource: mbResult.previewSource,
          artist: mbResult.artist,
          title: mbResult.title,
          album: mbResult.album || song.album,
          year: mbResult.year || song.year,
          duration: mbResult.duration,
          durationMs: mbResult.durationMs,
          platformIds: mbResult.platformIds,
        });
        
        isVerified = true;
        
        // Try to enhance with Spotify ISRC resolution (if user is logged in and ISRC exists)
        if (mbResult.isrc && !mbResult.platformIds?.spotify) {
          const spotifyToken = await spotifyAuth.getAccessToken();
          if (spotifyToken) {
            const spotifyData = await resolveSpotifyByISRC(mbResult.isrc, spotifyToken);
            if (spotifyData) {
              const lastSong = verifiedSongs[verifiedSongs.length - 1];
              if (!lastSong.platformIds) lastSong.platformIds = {};
              lastSong.platformIds.spotify = spotifyData;
            }
          }
        }
        
        // Try to enhance with Apple Music resolution (always try - no auth needed)
        const appleMusicData = await resolveAppleMusic(mbResult.artist, mbResult.title);
        if (appleMusicData) {
          const lastSong = verifiedSongs[verifiedSongs.length - 1];
          if (!lastSong.platformIds) lastSong.platformIds = {};
          lastSong.platformIds.apple = appleMusicData;
          if (!lastSong.albumArtUrl && appleMusicData.artworkUrl) {
            lastSong.albumArtUrl = appleMusicData.artworkUrl;
          }
        }
      } else {
        // TIER 2: MusicBrainz failed → Try Apple Music (no auth required!)
        const appleMusicData = await resolveAppleMusic(song.artist, song.title);
        
        if (appleMusicData) {
          // Apple Music success!
          verifiedSongs.push({
            ...song,
            verificationStatus: 'verified',
            verificationSource: 'apple',
            platformIds: {
              apple: appleMusicData,
            },
            albumArtUrl: appleMusicData.artworkUrl,
            artist: song.artist,
            title: song.title,
            album: song.album,
            year: song.year,
          });
          
          isVerified = true;
        } else {
          // TIER 3: Both failed → Mark as failed
          verifiedSongs.push({
            ...song,
            verificationStatus: 'failed',
            verificationSource: 'multi',
            verificationError: `Not found in MusicBrainz or Apple Music. ${mbResult.error || 'No details available.'}`,
          });
        }
      }
      
      // Update summary
      if (isVerified) {
        summary.verified++;
      } else {
        summary.failed++;
        summary.failedSongs.push({
          title: song.title,
          artist: song.artist,
          error: verifiedSongs[verifiedSongs.length - 1].verificationError || 'Verification failed',
        });
      }
      
    } catch (err) {
      // Catch-all error handler
      summary.failed++;
      summary.failedSongs.push({
        title: song.title,
        artist: song.artist,
        error: err instanceof Error ? err.message : 'Verification failed',
      });
      verifiedSongs.push({
        ...song,
        verificationStatus: 'failed',
        verificationSource: 'multi',
        verificationError: err instanceof Error ? err.message : 'Verification failed',
      });
    }

    // Small delay to avoid hammering the API
    if (i < songs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { verifiedSongs, summary };
}