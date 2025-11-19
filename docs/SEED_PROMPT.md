# 🎵 SEED PROMPT FOR NEXT CONVERSATION

## Context
I'm building **Fonea Sound Curator**, a music curation app that currently requires Spotify login for song verification. I need to implement **universal verification** so users can test the app without any platform login.

## What We're Working On
**Phase 4: Universal Verification System**

We're implementing a multi-platform verification system using:
- **MusicBrainz API** (primary - has platform links)
- **iTunes Search API** (fallback - has preview URLs)
- **Qobuz API** (optional - if easy)

Goal: Users can import and verify songs WITHOUT logging into Spotify (or any platform).

## Current State
- ✅ Phase 3 Complete: Spotify playlist push works
- ✅ OAuth with Spotify working
- 🚧 Phase 4 Starting: Need universal verification

## Task
Start with **CHUNK 1: MusicBrainz Verification Service**

Reference the task list (TASK_LIST_v8.md) for full details on all 7 chunks.

## Files to Attach

**REQUIRED:**
1. `TASK_LIST_v8.md` - Complete task breakdown with all chunks
2. `src/types/song.ts` - Song type definition (we'll update this)
3. `src/services/spotifyVerification.ts` - Current Spotify-only verification (for reference)
4. `src/components/ImportChatGPTModal.tsx` - Import flow (we'll update in Chunk 4)

**OPTIONAL (for context):**
5. `src/hooks/usePlaylistsState.ts` - How playlists work
6. `src/services/spotifyAuth.ts` - How auth works (for later platform integration)

## Instructions for Claude

1. **Read TASK_LIST_v8.md first** - Understand all 7 chunks
2. **Start with Chunk 1** - MusicBrainz verification service
3. **Follow the requirements** in section 4.1 exactly
4. **Create the new service** in `src/services/verification/`
5. **Test before moving on** - Make sure it works standalone

## Key Constraints

- ✅ NO login required for universal verification
- ✅ MusicBrainz API: 1 request/second (respect rate limits)
- ✅ Return unified `VerificationResult` type
- ✅ Extract platform IDs from MusicBrainz (Spotify, Apple, Tidal, Qobuz)
- ✅ Handle errors gracefully
- ✅ Add retry logic with exponential backoff

## Expected Output for Chunk 1

New files:
```
src/services/verification/
├── musicBrainzVerification.ts   # Main service
├── verificationTypes.ts          # Shared types
└── README.md                     # API documentation
```

## Testing Checklist (Chunk 1)

After implementation, test:
- [ ] Search "Daft Punk" + "Get Lucky" → Returns MusicBrainz ID + platform links
- [ ] Search "Khruangbin" + "Time (You and I)" → Returns metadata
- [ ] Search "Unknown Artist" + "Fake Song" → Returns verification failed
- [ ] Rate limiting works (1 req/sec)
- [ ] Retry logic works on network errors

## Architecture Notes

```typescript
// VerificationResult structure (define in verificationTypes.ts)
type VerificationResult = {
  verified: boolean;
  source: "musicbrainz" | "itunes" | "spotify" | "multi";
  
  // Core metadata
  artist: string;
  title: string;
  album?: string;
  year?: string;
  
  // Universal IDs
  musicBrainzId?: string;
  isrc?: string;
  
  // Platform-specific IDs (if available from MusicBrainz)
  platformIds?: {
    spotify?: { id: string; uri: string; };
    apple?: { id: string; };
    tidal?: { id: string; };
    qobuz?: { id: string; };
  };
  
  // Media
  albumArtUrl?: string;
  previewUrl?: string;
  
  // Error handling
  error?: string;
  confidence?: number; // 0-1 for match quality
};
```

## MusicBrainz API Reference

**Search Endpoint:**
```
GET https://musicbrainz.org/ws/2/recording
  ?query=artist:{artist}+AND+recording:{title}
  &fmt=json
  &limit=5
```

**Lookup Endpoint (for platform links):**
```
GET https://musicbrainz.org/ws/2/recording/{mbid}
  ?inc=url-rels+artist-rels
  &fmt=json
```

**Important:**
- Set User-Agent header (required by MusicBrainz)
- Respect 1 req/sec rate limit
- Parse URL relations for platform IDs

## Questions to Ask Me

If you need clarification on:
1. Data structure preferences
2. Error handling approach
3. Rate limiting implementation details
4. Testing strategy

Just ask before coding!

## After Chunk 1 Complete

We'll move to Chunk 2 (iTunes fallback), then Chunk 3 (orchestrator), etc.

Each chunk builds on the previous one. Don't skip ahead.

---

**Ready to start? Begin with Chunk 1!** 🚀
