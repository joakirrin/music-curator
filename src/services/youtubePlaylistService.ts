// src/services/youtubePlaylistService.ts
// YouTube playlist management service
// Handles creating playlists, adding songs, and managing YouTube Music playlists

import { youtubeAuth } from './youtubeAuth';
import { youtubeMusicService } from './youtubeMusicService';
import type { PlaylistMetadata, TrackMetadata } from '@/types/platformInterfaces';
import type { Song } from '@/types/song';

const DEV = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[YouTubePlaylist]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[YouTubePlaylist]', ...args);
}

/**
 * Get user's YouTube channel ID
 * NOTE: Currently unused but kept for future features
 */
async function _getChannelId(token: string): Promise<string> {
  log('Fetching user channel ID...');

  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    logError('Failed to get channel:', response.status, error);
    throw new Error(`Failed to get YouTube channel: ${response.status}`);
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('No YouTube channel found for this account');
  }

  const channelId = data.items[0].id;
  log('Got channel ID:', channelId);
  return channelId;
}

/**
 * Create a new YouTube playlist
 */
async function createYouTubePlaylist(
  token: string,
  title: string,
  description: string = '',
  isPublic: boolean = false
): Promise<{ id: string; url: string }> {
  log(`Creating YouTube playlist "${title}"...`);

  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: isPublic ? 'public' : 'private',
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    logError('Failed to create playlist:', response.status, error);
    throw new Error(`Failed to create YouTube playlist: ${response.status}`);
  }

  const playlist = await response.json();
  log('✅ Playlist created:', playlist.id);

  return {
    id: playlist.id,
    url: `https://www.youtube.com/playlist?list=${playlist.id}`,
  };
}

/**
 * Add videos to a YouTube playlist
 */
async function addVideosToPlaylist(
  token: string,
  playlistId: string,
  videoIds: string[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (videoIds.length === 0) {
    log('No videos to add');
    return 0;
  }

  log(`Adding ${videoIds.length} videos to playlist ${playlistId}...`);

  let totalAdded = 0;

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    log(`Adding video ${i + 1}/${videoIds.length}: ${videoId}`);

    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId,
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logError(`Failed to add video ${videoId}:`, response.status, error);
        // Continue with next video instead of failing completely
        continue;
      }

      totalAdded++;

      if (onProgress) {
        onProgress(totalAdded, videoIds.length);
      }

      // Small delay to avoid rate limiting
      if (i < videoIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (err) {
      logError(`Error adding video ${videoId}:`, err);
      // Continue with next video
    }
  }

  log(`✅ Added ${totalAdded}/${videoIds.length} videos successfully`);
  return totalAdded;
}

// ============================================
// PUBLIC API
// ============================================

export const youtubePlaylistService = {
  platform: 'youtube',

  /**
   * Get user's YouTube playlists
   */
  async getPlaylists(): Promise<PlaylistMetadata[]> {
    log('=== Getting YouTube playlists ===');

    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube. Please sign in first.');
    }

    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get playlists: ${response.status}`);
      }

      const data = await response.json();
      const items = data?.items ?? [];

      const playlists: PlaylistMetadata[] = items.map((item: any) => ({
        id: item.id,
        name: item.snippet.title,
        description: item.snippet.description,
        trackCount: item.contentDetails.itemCount,
        platform: 'youtube',
        url: `https://www.youtube.com/playlist?list=${item.id}`,
      }));

      log(`Found ${playlists.length} playlists`);
      return playlists;
    } catch (err) {
      logError('Failed to get playlists:', err);
      throw err;
    }
  },

  /**
   * Get tracks from a YouTube playlist
   */
  async getPlaylistTracks(playlistId: string): Promise<TrackMetadata[]> {
    log(`=== Getting tracks from playlist ${playlistId} ===`);

    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube.');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get playlist items: ${response.status}`);
      }

      const data = await response.json();
      const items = data?.items ?? [];

      const tracks: TrackMetadata[] = items
        .filter((item: any) => item.snippet.resourceId.kind === 'youtube#video')
        .map((item: any) => {
          const videoId = item.snippet.resourceId.videoId;
          const title = item.snippet.title;
          const channelTitle = item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle;

          return {
            id: videoId,
            title,
            artist: channelTitle,
            platform: 'youtube',
            platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
            albumArtUrl: item.snippet.thumbnails?.high?.url,
          };
        });

      log(`Found ${tracks.length} tracks`);
      return tracks;
    } catch (err) {
      logError('Failed to get playlist tracks:', err);
      throw err;
    }
  },

  /**
   * Create a new YouTube playlist
   */
  async createPlaylist(
    name: string,
    description: string = '',
    isPublic: boolean = false
  ): Promise<PlaylistMetadata> {
    log('=== Creating YouTube playlist ===');
    log(`Name: "${name}"`);

    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube. Please sign in first.');
    }

    try {
      const { id, url } = await createYouTubePlaylist(token, name, description, isPublic);

      return {
        id,
        name,
        description,
        trackCount: 0,
        platform: 'youtube',
        url,
        isPublic,
      };
    } catch (err) {
      logError('Failed to create playlist:', err);
      throw err;
    }
  },

  /**
   * Add tracks to a YouTube playlist
   */
  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    log(`=== Adding ${trackIds.length} tracks to playlist ${playlistId} ===`);

    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube.');
    }

    try {
      await addVideosToPlaylist(token, playlistId, trackIds);
      log('✅ Tracks added successfully');
    } catch (err) {
      logError('Failed to add tracks:', err);
      throw err;
    }
  },

  /**
   * Export a Fonea playlist to YouTube Music
   * Resolves songs and creates playlist
   */
  async exportPlaylist(
    playlist: { name: string; description?: string; songs: Song[]; isPublic?: boolean },
    onProgress?: (stage: string, current: number, total: number) => void
  ): Promise<{ playlistId: string; playlistUrl: string; addedCount: number; failedCount: number }> {
    log('=== Exporting playlist to YouTube Music ===');
    log(`Playlist: "${playlist.name}"`);
    log(`Songs: ${playlist.songs.length}`);

    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not logged in to YouTube. Please sign in first.');
    }

    try {
      // Step 1: Resolve songs to YouTube video IDs
      onProgress?.('resolving', 0, playlist.songs.length);

      const resolvedSongs: { videoId: string; song: Song }[] = [];
      const failedSongs: Song[] = [];

      for (let i = 0; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        log(`Resolving ${i + 1}/${playlist.songs.length}: ${song.artist} - ${song.title}`);

        try {
          const result = await youtubeMusicService.verifyTrack(song.title, song.artist);

          if (result) {
            resolvedSongs.push({ videoId: result.id, song });
          } else {
            failedSongs.push(song);
          }

          onProgress?.('resolving', i + 1, playlist.songs.length);

          // Small delay
          if (i < playlist.songs.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        } catch (err) {
          logError(`Failed to resolve song:`, err);
          failedSongs.push(song);
        }
      }

      log(`Resolved: ${resolvedSongs.length} found, ${failedSongs.length} failed`);

      if (resolvedSongs.length === 0) {
        throw new Error('No songs could be found on YouTube Music.');
      }

      // Step 2: Create playlist
      onProgress?.('creating', 0, 1);

      const description = playlist.description || `Created with Fonea Music Curator`;
      const { id: playlistId, url: playlistUrl } = await createYouTubePlaylist(
        token,
        playlist.name,
        description,
        playlist.isPublic ?? false
      );

      onProgress?.('creating', 1, 1);

      // Step 3: Add videos to playlist
      onProgress?.('adding', 0, resolvedSongs.length);

      const videoIds = resolvedSongs.map((s) => s.videoId);
      const addedCount = await addVideosToPlaylist(
        token,
        playlistId,
        videoIds,
        (current, total) => {
          onProgress?.('adding', current, total);
        }
      );

      log('=== ✅ Export complete ===');

      return {
        playlistId,
        playlistUrl,
        addedCount,
        failedCount: failedSongs.length,
      };
    } catch (err) {
      logError('=== ❌ Export failed ===');
      logError(err);
      throw err;
    }
  },
};
