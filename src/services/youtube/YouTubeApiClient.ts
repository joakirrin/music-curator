// src/services/youtube/YouTubeApiClient.ts
// YouTube Data API v3 Client
// Handles all interactions with YouTube: search, playlists, videos

import { youtubeAuth } from '../youtubeAuth';

const DEV = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEV) console.log('[YouTubeAPI]', ...args);
}

function logError(...args: unknown[]) {
  if (DEV) console.error('[YouTubeAPI]', ...args);
}

// ============================================
// TYPES
// ============================================

export type YouTubeVideo = {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
  };
  contentDetails?: {
    duration: string; // ISO 8601 format (e.g., "PT4M33S")
  };
};

export type YouTubeSearchResult = {
  id: { kind: string; videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
};

export type YouTubePlaylist = {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  contentDetails: {
    itemCount: number;
  };
  status?: {
    privacyStatus: 'public' | 'private' | 'unlisted';
  };
};

export type YouTubePlaylistItem = {
  id: string; // This is the playlistItem ID (needed for deletion)
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    publishedAt: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    resourceId: {
      kind: string;
      videoId: string;
    };
    position: number;
  };
  contentDetails?: {
    videoId: string;
  };
};

// ============================================
// YOUTUBE API CLIENT
// ============================================

export class YouTubeApiClient {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  /**
   * Get access token with automatic refresh
   */
  private async getToken(): Promise<string> {
    const token = await youtubeAuth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with YouTube. Please log in first.');
    }
    return token;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await this.getToken();
    
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logError(`API Error: ${response.status}`, errorText.substring(0, 500));
      
      // Parse YouTube API error if available
      try {
        const errorJson = JSON.parse(errorText);
        const errorMessage = errorJson.error?.message || errorText;
        throw new Error(`YouTube API Error (${response.status}): ${errorMessage}`);
      } catch {
        throw new Error(`YouTube API Error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    return data as T;
  }

  // ============================================
  // SEARCH API
  // ============================================

  /**
   * Search for music videos on YouTube
   * 
   * @param query - Search query (e.g., "The Beatles Hey Jude")
   * @param maxResults - Maximum results to return (default: 10, max: 50)
   * @returns Array of search results
   */
  async search(query: string, maxResults: number = 10): Promise<YouTubeSearchResult[]> {
    log(`Searching: "${query}" (maxResults: ${maxResults})`);

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10', // Music category
      maxResults: Math.min(maxResults, 50).toString(),
      q: query,
    });

    const data = await this.fetchAPI<{ items?: YouTubeSearchResult[] }>(
      `/search?${params.toString()}`
    );

    const results = data.items || [];
    log(`Found ${results.length} results`);
    
    return results;
  }

  // ============================================
  // VIDEOS API
  // ============================================

  /**
   * Get detailed information about specific videos
   * 
   * @param videoIds - Array of video IDs (max 50)
   * @returns Array of video details with duration
   */
  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
    if (videoIds.length === 0) {
      return [];
    }

    if (videoIds.length > 50) {
      throw new Error('Cannot fetch more than 50 videos at once');
    }

    log(`Getting details for ${videoIds.length} videos`);

    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      id: videoIds.join(','),
    });

    const data = await this.fetchAPI<{ items?: YouTubeVideo[] }>(
      `/videos?${params.toString()}`
    );

    const videos = data.items || [];
    log(`Retrieved details for ${videos.length} videos`);
    
    return videos;
  }

  /**
   * Get detailed information about a single video
   * 
   * @param videoId - Video ID
   * @returns Video details or null if not found
   */
  async getVideoById(videoId: string): Promise<YouTubeVideo | null> {
    const videos = await this.getVideoDetails([videoId]);
    return videos[0] || null;
  }

  // ============================================
  // PLAYLISTS API
  // ============================================

  /**
   * Get user's playlists
   * 
   * @param maxResults - Maximum results (default: 50)
   * @returns Array of user's playlists
   */
  async listUserPlaylists(maxResults: number = 50): Promise<YouTubePlaylist[]> {
    log('Listing user playlists...');

    const params = new URLSearchParams({
      part: 'snippet,contentDetails,status',
      mine: 'true',
      maxResults: maxResults.toString(),
    });

    const data = await this.fetchAPI<{ items?: YouTubePlaylist[] }>(
      `/playlists?${params.toString()}`
    );

    const playlists = data.items || [];
    log(`Found ${playlists.length} playlists`);
    
    return playlists;
  }

  /**
   * Get details of a specific playlist
   * 
   * @param playlistId - Playlist ID
   * @returns Playlist details or null if not found
   */
  async getPlaylistById(playlistId: string): Promise<YouTubePlaylist | null> {
    log(`Getting playlist: ${playlistId}`);

    const params = new URLSearchParams({
      part: 'snippet,contentDetails,status',
      id: playlistId,
    });

    const data = await this.fetchAPI<{ items?: YouTubePlaylist[] }>(
      `/playlists?${params.toString()}`
    );

    const playlist = data.items?.[0] || null;
    
    if (playlist) {
      log(`Found playlist: "${playlist.snippet.title}"`);
    } else {
      log(`Playlist not found: ${playlistId}`);
    }
    
    return playlist;
  }

  /**
   * Create a new playlist
   * 
   * @param name - Playlist name
   * @param description - Playlist description (optional)
   * @param isPublic - Privacy status (default: false = private)
   * @returns Created playlist details
   */
  async createPlaylist(
    name: string,
    description: string = '',
    isPublic: boolean = false
  ): Promise<YouTubePlaylist> {
    log(`Creating playlist: "${name}" (${isPublic ? 'public' : 'private'})`);

    const body = {
      snippet: {
        title: name,
        description: description || 'Created with Fonea Music Curator',
      },
      status: {
        privacyStatus: isPublic ? 'public' : 'private',
      },
    };

    const params = new URLSearchParams({
      part: 'snippet,status,contentDetails',
    });

    const playlist = await this.fetchAPI<YouTubePlaylist>(
      `/playlists?${params.toString()}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    log(`✅ Playlist created: ${playlist.id}`);
    
    return playlist;
  }

  /**
   * Update playlist metadata (name, description, privacy)
   * 
   * @param playlistId - Playlist ID to update
   * @param updates - Fields to update
   * @returns Updated playlist
   */
  async updatePlaylist(
    playlistId: string,
    updates: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    }
  ): Promise<YouTubePlaylist> {
    log(`Updating playlist: ${playlistId}`);

    const body: any = {
      id: playlistId,
    };

    if (updates.name || updates.description) {
      body.snippet = {};
      if (updates.name) body.snippet.title = updates.name;
      if (updates.description) body.snippet.description = updates.description;
    }

    if (updates.isPublic !== undefined) {
      body.status = {
        privacyStatus: updates.isPublic ? 'public' : 'private',
      };
    }

    const parts: string[] = [];
    if (body.snippet) parts.push('snippet');
    if (body.status) parts.push('status');

    const params = new URLSearchParams({
      part: parts.join(','),
    });

    const playlist = await this.fetchAPI<YouTubePlaylist>(
      `/playlists?${params.toString()}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );

    log(`✅ Playlist updated`);
    
    return playlist;
  }

  // ============================================
  // PLAYLIST ITEMS API
  // ============================================

  /**
   * Get all items in a playlist
   * Handles pagination automatically to fetch all items
   * 
   * @param playlistId - Playlist ID
   * @returns Array of playlist items
   */
  async getPlaylistItems(playlistId: string): Promise<YouTubePlaylistItem[]> {
    log(`Getting items from playlist: ${playlistId}`);

    const allItems: YouTubePlaylistItem[] = [];
    let nextPageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails',
        playlistId: playlistId,
        maxResults: '50', // Max per page
      });

      if (nextPageToken) {
        params.set('pageToken', nextPageToken);
      }

      const data = await this.fetchAPI<{
        items?: YouTubePlaylistItem[];
        nextPageToken?: string;
      }>(`/playlistItems?${params.toString()}`);

      if (data.items) {
        allItems.push(...data.items);
      }

      nextPageToken = data.nextPageToken;
      
      if (nextPageToken) {
        log(`Fetched ${allItems.length} items, continuing to next page...`);
      }
    } while (nextPageToken);

    log(`✅ Retrieved ${allItems.length} total items`);
    
    return allItems;
  }

  /**
   * Add a video to a playlist
   * 
   * @param playlistId - Target playlist ID
   * @param videoId - Video ID to add
   * @param position - Position in playlist (optional, default: end)
   * @returns Created playlist item
   */
  async addVideoToPlaylist(
    playlistId: string,
    videoId: string,
    position?: number
  ): Promise<YouTubePlaylistItem> {
    log(`Adding video ${videoId} to playlist ${playlistId}`);

    const body: any = {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId: videoId,
        },
      },
    };

    if (position !== undefined) {
      body.snippet.position = position;
    }

    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
    });

    const item = await this.fetchAPI<YouTubePlaylistItem>(
      `/playlistItems?${params.toString()}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    log(`✅ Video added to playlist`);
    
    return item;
  }

  /**
   * Add multiple videos to a playlist (batch operation)
   * Includes delay between requests to avoid rate limits
   * 
   * @param playlistId - Target playlist ID
   * @param videoIds - Array of video IDs to add
   * @param onProgress - Progress callback
   * @returns Number of successfully added videos
   */
  async addVideosToPlaylist(
    playlistId: string,
    videoIds: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<number> {
    if (videoIds.length === 0) {
      log('No videos to add');
      return 0;
    }

    log(`Adding ${videoIds.length} videos to playlist ${playlistId}...`);

    let successCount = 0;

    for (let i = 0; i < videoIds.length; i++) {
      try {
        await this.addVideoToPlaylist(playlistId, videoIds[i]);
        successCount++;

        if (onProgress) {
          onProgress(i + 1, videoIds.length);
        }

        // Small delay to avoid rate limiting (100ms between requests)
        if (i < videoIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (err) {
        logError(`Failed to add video ${videoIds[i]}:`, err);
        // Continue with next video instead of failing completely
      }
    }

    log(`✅ Added ${successCount}/${videoIds.length} videos successfully`);
    
    return successCount;
  }

  /**
   * Remove an item from a playlist
   * Note: Requires the playlist ITEM ID, not the video ID
   * 
   * @param playlistItemId - Playlist item ID (from getPlaylistItems)
   */
  async deletePlaylistItem(playlistItemId: string): Promise<void> {
    log(`Deleting playlist item: ${playlistItemId}`);

    const params = new URLSearchParams({
      id: playlistItemId,
    });

    await this.fetchAPI<void>(`/playlistItems?${params.toString()}`, {
      method: 'DELETE',
    });

    log(`✅ Playlist item deleted`);
  }

  /**
   * Remove multiple items from a playlist (batch operation)
   * 
   * @param playlistItemIds - Array of playlist item IDs
   * @param onProgress - Progress callback
   * @returns Number of successfully deleted items
   */
  async deletePlaylistItems(
    playlistItemIds: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<number> {
    if (playlistItemIds.length === 0) {
      log('No items to delete');
      return 0;
    }

    log(`Deleting ${playlistItemIds.length} items...`);

    let successCount = 0;

    for (let i = 0; i < playlistItemIds.length; i++) {
      try {
        await this.deletePlaylistItem(playlistItemIds[i]);
        successCount++;

        if (onProgress) {
          onProgress(i + 1, playlistItemIds.length);
        }

        // Small delay to avoid rate limiting
        if (i < playlistItemIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (err) {
        logError(`Failed to delete item ${playlistItemIds[i]}:`, err);
        // Continue with next item
      }
    }

    log(`✅ Deleted ${successCount}/${playlistItemIds.length} items successfully`);
    
    return successCount;
  }
}

// ============================================
// SINGLETON INSTANCE (optional, for convenience)
// ============================================

export const youtubeApiClient = new YouTubeApiClient();
