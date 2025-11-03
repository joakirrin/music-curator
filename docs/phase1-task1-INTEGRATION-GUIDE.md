# Phase 1 – Task 1: Data Model Enhancement for ChatGPT Integration

## Overview

This implementation adds production-ready TypeScript types and utilities to support ChatGPT integration in the Fonea music curation application. All changes maintain backward compatibility with existing data.

## What's New

### 1. Enhanced Types (`src/types/`)

#### `song.ts` - Core Types
- **Song** type: Extended with optional fields for multi-source support
  - `source`: Origin of the song ('chatgpt' | 'manual' | 'spotify')
  - `round`: Recommendation round number
  - `feedback`: User feedback status ('keep' | 'skip' | 'pending')
  - `playlistId`: Reference to parent playlist
  - `spotifyUri`: Spotify URI for direct integration
  - `previewUrl`: Audio preview URL
  - `addedAt`: ISO 8601 timestamp of addition

- **Playlist** type: Manages song collections
  - Core fields: id, name, songIds
  - Metadata: description, createdAt, updatedAt

- **RecommendationRound** type: Tracks recommendation sessions
  - Tracks round number, creation time, and notes

#### `index.ts` - Barrel Export
- Central export point for all types
- Simplifies imports: `import type { Song, Playlist, RecommendationRound } from '@/types'`

### 2. Robust Utilities (`src/utils/`)

#### `fileHandlers.ts` - Data Processing
- **normalizeSong()**: Safely normalizes song data
  - Preserves all new optional fields if present
  - Applies safe defaults only when needed:
    - `feedback`: defaults to 'pending' if missing
    - `addedAt`: defaults to current timestamp if missing
  - No breaking changes to existing data

- **normalizePlaylist()**: Normalizes playlist objects

- **parseSongsFromJson()**: Parses JSON with error handling
  - Works with both old (no new fields) and new (with integration fields) formats
  - Detailed error messages

- **serializeSongsToJson()**: Pretty-prints songs to JSON

- **File I/O Functions**:
  - `loadSongsFromFile(file)`: Load from File object
  - `downloadSongsAsJson(songs, filename)`: Export as JSON file
  - Similar functions for playlists

#### `demoData.ts` - Example Data
- Mix of old format (no new fields) and new format (with integration fields) songs
- Demonstrates backward compatibility
- Sample playlists and recommendation rounds for testing

## Backward Compatibility

✅ **No Breaking Changes**
- All new fields are optional (`?`)
- Old data without new fields loads without errors
- Utilities accept and preserve existing data as-is
- No required migrations needed

### Examples

**Old Format (Still Works)**
```typescript
const oldSong: Song = {
  id: 'song-1',
  title: 'Midnight Dreams',
  artist: 'Luna Echo',
  album: 'Whispers',
  duration: 243,
};
```

**New Format (Full Features)**
```typescript
const newSong: Song = {
  id: 'song-3',
  title: 'Cosmic Journey',
  artist: 'Star Traveler',
  album: 'Beyond the Stars',
  duration: 312,
  source: 'chatgpt',
  round: 1,
  feedback: 'pending',
  playlistId: 'playlist-alpha',
  addedAt: '2025-01-15T10:30:00Z',
};
```

## Integration Steps

### 1. Copy Files to Your Project

```bash
# Copy types
cp src/types/song.ts YOUR_PROJECT/src/types/
cp src/types/index.ts YOUR_PROJECT/src/types/

# Copy utilities
cp src/utils/fileHandlers.ts YOUR_PROJECT/src/utils/
cp src/utils/demoData.ts YOUR_PROJECT/src/utils/
```

### 2. Update Existing Type Imports (if applicable)

If you already have a `Song` type, replace it with the new one.

**Before:**
```typescript
import type { Song } from '@/types/song';
```

**After:** (same import, now enhanced)
```typescript
import type { Song, Playlist, RecommendationRound } from '@/types';
```

### 3. Update Utilities (if migrating from old handlers)

If you have custom parsing logic, replace with the new utilities:

**Before:**
```typescript
const song = JSON.parse(jsonString);
```

**After:**
```typescript
const songs = parseSongsFromJson(jsonString);
```

### 4. Verify Compilation

```bash
npm run dev
# Should compile with zero TypeScript errors
```

## API Reference

### Types

```typescript
// Core Song type with new optional fields
type Song = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  
  // New fields (all optional)
  source?: 'chatgpt' | 'manual' | 'spotify';
  round?: number;
  feedback?: 'keep' | 'skip' | 'pending';
  playlistId?: string;
  spotifyUri?: string;
  previewUrl?: string;
  addedAt?: string; // ISO 8601
};

// Playlist for managing song collections
type Playlist = {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt?: string; // ISO 8601
  updatedAt?: string; // ISO 8601
};

// Track recommendation sessions
type RecommendationRound = {
  id: string;
  round: number;
  createdAt: string; // ISO 8601
  notes?: string;
};
```

### Functions

```typescript
// Normalize and validate song data
normalizeSong(data: Partial<Song>): Song

// Normalize and validate playlist data
normalizePlaylist(data: Partial<Playlist>): Playlist

// Parse JSON string to Song array
parseSongsFromJson(jsonString: string): Song[]

// Parse JSON string to Playlist array
parsePlaylistsFromJson(jsonString: string): Playlist[]

// Serialize songs to formatted JSON
serializeSongsToJson(songs: Song[]): string

// Serialize playlists to formatted JSON
serializePlaylistsToJson(playlists: Playlist[]): string

// Load songs from File object
loadSongsFromFile(file: File): Promise<Song[]>

// Load playlists from File object
loadPlaylistsFromFile(file: File): Promise<Playlist[]>

// Download songs as JSON file
downloadSongsAsJson(songs: Song[], filename?: string): void

// Download playlists as JSON file
downloadPlaylistsAsJson(playlists: Playlist[], filename?: string): void
```

## Testing Considerations

The implementation includes comprehensive type checking and utilities that handle:

- ✅ Old data format (no new fields) – loads without modification
- ✅ New data format (all fields) – preserves all data
- ✅ Mixed formats – single array with both old and new songs
- ✅ JSON parsing/serialization – roundtrip conversion
- ✅ Error handling – invalid data throws meaningful errors
- ✅ File I/O – browser File API support

## Design Decisions

1. **Optional Fields**: All new fields are optional to maintain backward compatibility
2. **Safe Defaults**: Only `feedback` and `addedAt` get defaults; others remain undefined if not provided
3. **ISO 8601 Timestamps**: All date fields use standard ISO format for portability
4. **No Required Dependencies**: Pure TypeScript, no external libraries
5. **Separation of Concerns**: Types in `types/`, utilities in `utils/`
6. **Barrel Export**: Centralized type exports for cleaner imports

## Future Extensions

The schema is designed to support:
- Multiple recommendation engines (not just ChatGPT)
- Playlist versioning and history
- Round-based feedback workflows
- Spotify API integration
- Preview playback functionality

## File Structure

```
src/
├── types/
│   ├── song.ts          # Core type definitions
│   └── index.ts         # Barrel export
├── utils/
│   ├── fileHandlers.ts  # Data parsing and serialization
│   └── demoData.ts      # Demo data for development
```

## Compliance

- ✅ English-only identifiers and comments
- ✅ Backward compatible (all new fields optional)
- ✅ Maintains Fonea style (types only, no UI changes)
- ✅ No feature changes beyond schema
- ✅ Small, maintainable files
- ✅ No new npm dependencies
- ✅ Production-ready code with error handling
