# 🔄 Smart Platform Resolver - Flow Diagram

**Visual Reference for Implementation**  
**Phase**: 4.5.1 | **Component**: smartPlatformResolver.ts

---

## 📊 Complete Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   USER CLICKS "PUSH TO SPOTIFY"              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              ITERATE THROUGH EACH SONG IN PLAYLIST           │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  CHECK SONG     │
                    │  VERIFICATION   │
                    │  STATUS         │
                    └─────────────────┘
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
    ┌─────────────────┐            ┌─────────────────┐
    │ Has MusicBrainz │            │   No Platform   │
    │  Platform URL?  │            │   URLs Found    │
    └─────────────────┘            └─────────────────┘
              ↓ YES                          ↓ NO
    ┌─────────────────┐                     │
    │   TIER 1:       │                     │
    │  DIRECT LINK    │                     │
    │ ✅ 100% CONF    │                     │
    └─────────────────┘                     │
              ↓                              ↓
         ADD TO                    ┌─────────────────┐
       SUCCESSFUL                  │  MusicBrainz    │
         LIST                      │  verified song? │
                                   └─────────────────┘
                                            ↓
                              ┌─────────────┴─────────────┐
                              ↓ YES                       ↓ NO
                    ┌─────────────────┐         ┌─────────────────┐
                    │   TIER 2:       │         │   TIER 3:       │
                    │  SOFT SEARCH    │         │  HARD SEARCH    │
                    │                 │         │                 │
                    │ Search:         │         │ Search:         │
                    │ "title artist"  │         │ artist:"name"   │
                    │                 │         │ track:"title"   │
                    │ Take 1st result │         │                 │
                    │ ⚡ 85% CONF     │         │ Validate match  │
                    └─────────────────┘         │ (fuzzy ≥85%)    │
                              ↓                 │ 🎯 85-95% CONF  │
                         FOUND?                 └─────────────────┘
                              ↓                          ↓
                    ┌─────────┴─────────┐           FOUND?
                    ↓ YES               ↓ NO            ↓
          ┌─────────────────┐   ┌─────────────────┐    │
          │  ADD TO         │   │  TRY TIER 3     │    │
          │  SUCCESSFUL     │   │  (Hard Search)  │    │
          │  (Tier 2)       │   └─────────────────┘    │
          └─────────────────┘            ↓              │
                                    FOUND?              │
                                         ↓              │
                              ┌──────────┴──────┐      │
                              ↓ YES             ↓ NO   │
                    ┌─────────────────┐  ┌──────────────────┐
                    │  ADD TO         │  │   TIER 4:        │
                    │  SUCCESSFUL     │  │   NOT AVAILABLE  │
                    │  (Tier 3)       │  │                  │
                    └─────────────────┘  │  ❌ 0% CONF      │
                                         │                  │
                                         │  ADD TO FAILED   │
                                         │  LIST            │
                                         └──────────────────┘
                                                  ↓
┌─────────────────────────────────────────────────────────────┐
│                   GENERATE EXPORT REPORT                     │
│                                                              │
│  Total: 25 songs                                            │
│  ✅ Successful: 23 (92%)                                    │
│     - Direct (Tier 1): 18 songs                             │
│     - Soft Search (Tier 2): 3 songs                         │
│     - Hard Search (Tier 3): 2 songs                         │
│  ❌ Failed: 2 (8%)                                          │
│     - "Unknown Track" by Obscure Artist                     │
│     - "Fake Song" by Made Up Band                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              CREATE PLAYLIST ON SPOTIFY                      │
│              WITH SUCCESSFUL SONGS                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              SHOW EXPORT REPORT MODAL TO USER                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tier Breakdown

### 🟢 TIER 1: Direct Link (Best)
```typescript
// Input: Song with MusicBrainz platform URL
{
  title: "Hey Jude",
  artist: "The Beatles",
  platformIds: {
    spotify: {
      url: "https://open.spotify.com/track/xyz",
      uri: "spotify:track:xyz",
      id: "xyz"
    }
  }
}

// Action: Use directly
// Confidence: 100%
// Success Rate: ~70% of songs (if ISRC resolvers worked)
```

**Implementation**:
```typescript
if (song.platformIds?.spotify?.uri) {
  return {
    success: true,
    tier: 'direct',
    spotifyUri: song.platformIds.spotify.uri,
    confidence: 100,
  };
}
```

---

### 🟡 TIER 2: Soft Search (Good)
```typescript
// Input: Song verified by MusicBrainz (exists) but no Spotify URL
{
  title: "Time (You and I)",
  artist: "Khruangbin",
  verificationSource: "musicbrainz",
  musicBrainzId: "abc-123",
  platformIds: {} // No Spotify URL
}

// Query: Simple search
const query = `${song.title} ${song.artist}`;
// "Time (You and I) Khruangbin"

// Action: Take first result
// Confidence: 85%
// Rationale: MusicBrainz confirmed song exists, so first Spotify 
//            result is likely correct
```

**Implementation**:
```typescript
if (song.verificationSource === 'musicbrainz' && !song.platformIds?.spotify) {
  const results = await spotifyApi.search(`${song.title} ${song.artist}`, 'track', { limit: 1 });
  
  if (results.tracks.items.length > 0) {
    return {
      success: true,
      tier: 'soft',
      spotifyUri: results.tracks.items[0].uri,
      confidence: 85,
    };
  }
}
```

---

### 🟠 TIER 3: Hard Search (Strict)
```typescript
// Input: Song NOT verified by MusicBrainz (doesn't exist in MB database)
//        OR Tier 2 soft search failed
{
  title: "Thriller",
  artist: "Michael Jackson",
  verificationSource: "failed", // or null
  musicBrainzId: null
}

// Query: Exact field search
const query = `artist:"${song.artist}" track:"${song.title}"`;
// artist:"Michael Jackson" track:"Thriller"

// Action: 
// 1. Get up to 5 results
// 2. Calculate similarity score for each (Levenshtein distance)
// 3. Take best match if score ≥ 85%

// Confidence: 85-95% (based on similarity score)
// Rationale: We're not sure song exists, so we need exact validation
```

**Implementation**:
```typescript
// If MusicBrainz didn't find it OR soft search failed
const query = `artist:"${song.artist}" track:"${song.title}"`;
const results = await spotifyApi.search(query, 'track', { limit: 5 });

if (results.tracks.items.length > 0) {
  const matches = results.tracks.items.map(track => ({
    track,
    score: calculateSimilarity(track, song)
  }))
  .sort((a, b) => b.score - a.score);
  
  const bestMatch = matches[0];
  
  if (bestMatch.score >= 0.85) {
    return {
      success: true,
      tier: 'hard',
      spotifyUri: bestMatch.track.uri,
      confidence: Math.round(bestMatch.score * 100),
    };
  }
}
```

**Similarity Calculation**:
```typescript
function calculateSimilarity(spotifyTrack: SpotifyTrack, song: Song): number {
  // Calculate artist similarity
  const artistSimilarity = fuzzyMatch(
    spotifyTrack.artists[0].name.toLowerCase(),
    song.artist.toLowerCase()
  );
  
  // Calculate title similarity
  const titleSimilarity = fuzzyMatch(
    spotifyTrack.name.toLowerCase(),
    song.title.toLowerCase()
  );
  
  // Average of both (can be weighted if needed)
  return (artistSimilarity + titleSimilarity) / 2;
}

function fuzzyMatch(str1: string, str2: string): number {
  // Use Levenshtein distance or similar algorithm
  // Returns 0.0 to 1.0 (1.0 = perfect match)
  
  // Simple implementation (can be improved with library)
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return 1 - (distance / maxLength);
}
```

---

### 🔴 TIER 4: Not Available (Failed)
```typescript
// Input: Song that failed all search tiers
{
  title: "Fake Song Title",
  artist: "Non Existent Artist"
}

// Result: Add to failed list
{
  success: false,
  tier: 'failed',
  confidence: 0,
  reason: 'No match found on Spotify',
  attemptedTiers: ['soft', 'hard'] // or just ['hard'] if MB didn't verify
}

// This will be shown in Export Report
```

---

## 📊 Export Report Structure

```typescript
interface ExportReport {
  playlistName: string;
  platform: 'spotify' | 'apple' | 'tidal' | 'qobuz';
  timestamp: string;
  
  totalSongs: number;
  
  successful: {
    direct: number;      // Tier 1
    softSearch: number;  // Tier 2
    hardSearch: number;  // Tier 3
    total: number;
    songs: Array<{
      song: Song;
      tier: 'direct' | 'soft' | 'hard';
      confidence: number;
      platformUrl: string;
    }>;
  };
  
  failed: {
    count: number;
    songs: Array<{
      song: Song;
      reason: string;
      attemptedTiers: string[];
    }>;
  };
  
  statistics: {
    successRate: number;        // (successful / total) * 100
    averageConfidence: number;  // Average of all confidence scores
    exportDuration: number;     // milliseconds
  };
}
```

**Example Report**:
```json
{
  "playlistName": "Summer Vibes 2024",
  "platform": "spotify",
  "timestamp": "2025-11-19T10:30:00Z",
  "totalSongs": 25,
  "successful": {
    "direct": 18,
    "softSearch": 4,
    "hardSearch": 2,
    "total": 24,
    "songs": [
      {
        "song": { "title": "Hey Jude", "artist": "The Beatles" },
        "tier": "direct",
        "confidence": 100,
        "platformUrl": "https://open.spotify.com/track/xyz"
      },
      // ... more songs
    ]
  },
  "failed": {
    "count": 1,
    "songs": [
      {
        "song": { "title": "Unknown Track", "artist": "Obscure Artist" },
        "reason": "No match found on Spotify after all search attempts",
        "attemptedTiers": ["soft", "hard"]
      }
    ]
  },
  "statistics": {
    "successRate": 96,
    "averageConfidence": 94.5,
    "exportDuration": 12350
  }
}
```

---

## 🎨 UI: Export Report Modal

```tsx
┌──────────────────────────────────────────────────────────┐
│  ✅ Playlist Exported Successfully                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  "Summer Vibes 2024" → Spotify                          │
│                                                          │
│  📊 Export Summary                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Total songs: 25                                         │
│  ✅ Successfully added: 24 (96%)                        │
│     • Direct links: 18 songs                            │
│     • Smart search: 6 songs                             │
│  ❌ Not available: 1 (4%)                               │
│                                                          │
│  Average confidence: 94.5%                               │
│  Export time: 12.3 seconds                               │
│                                                          │
│  ⚠️ Songs not found on Spotify:                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ • "Unknown Track" by Obscure Artist            │    │
│  │   Attempted: Soft search ✗, Hard search ✗     │    │
│  │   Reason: No matches found                     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [📥 Download Full Report]  [✓ Close]                  │
└──────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Test 1: All Tier 1 (Best Case)
```typescript
Playlist: 10 songs, all with MusicBrainz Spotify URLs
Expected Result:
  - 10/10 successful (100%)
  - All via Tier 1 (direct)
  - Average confidence: 100%
  - Export time: <5 seconds
```

### Test 2: Mixed Tiers (Typical Case)
```typescript
Playlist: 20 songs
  - 12 with Spotify URLs (Tier 1)
  - 5 MusicBrainz verified, no URL (Tier 2)
  - 2 not in MusicBrainz but real songs (Tier 3)
  - 1 completely fake song (Tier 4)
  
Expected Result:
  - 19/20 successful (95%)
  - Tier 1: 12, Tier 2: 5, Tier 3: 2
  - Failed: 1
  - Average confidence: ~92%
  - Export time: <20 seconds
```

### Test 3: Worst Case (Challenging)
```typescript
Playlist: 15 songs
  - 3 with Spotify URLs (Tier 1)
  - 0 MusicBrainz verified (skip Tier 2)
  - 10 not in MusicBrainz but real (Tier 3)
  - 2 completely fake (Tier 4)
  
Expected Result:
  - 13/15 successful (87%)
  - Tier 1: 3, Tier 3: 10
  - Failed: 2
  - Average confidence: ~88%
  - Export time: <25 seconds
```

### Test 4: Performance Test
```typescript
Playlist: 50 songs (mixed)

Expected Result:
  - Complete in <30 seconds
  - No API rate limit errors
  - No memory issues
  - Proper error handling for network failures
```

### Test 5: Edge Cases
```typescript
// Test special characters
Song: title="Señorita", artist="Café Tacvba"
Expected: Handle UTF-8 correctly

// Test very long names
Song: title="The Song With An Extremely Long Title That...", artist="..."
Expected: Truncate if needed, still find match

// Test exact duplicates
Song 1: "Yesterday" by "The Beatles"
Song 2: "Yesterday" by "The Beatles" (same in playlist)
Expected: Both added successfully

// Test similar artists
Song: title="Hurt", artist="Johnny Cash"
(Multiple versions exist - Nine Inch Nails, Johnny Cash)
Expected: Get correct artist version
```

---

## 🚀 Implementation Checklist

### Phase 1: Core Resolver
- [ ] Create `src/services/export/` directory
- [ ] Implement `smartPlatformResolver.ts`
  - [ ] Tier 1: Direct link logic
  - [ ] Tier 2: Soft search logic
  - [ ] Tier 3: Hard search logic
  - [ ] Similarity calculation (Levenshtein)
  - [ ] TypeScript types
- [ ] Write unit tests for each tier
- [ ] Write integration tests

### Phase 2: Export Report
- [ ] Create `exportReport.ts`
  - [ ] Report generation logic
  - [ ] Statistics calculation
  - [ ] JSON export functionality
- [ ] Create `ExportReportModal.tsx`
  - [ ] Display summary
  - [ ] Show failed songs
  - [ ] Download button
- [ ] Style modal (Tailwind)

### Phase 3: Integration
- [ ] Update `spotifyPlaylistService.ts`
  - [ ] Integrate resolver before creating playlist
  - [ ] Pass songs through resolver
  - [ ] Generate report
- [ ] Add loading states
- [ ] Add progress tracking
- [ ] Error handling

### Phase 4: Testing
- [ ] Test all 5 scenarios above
- [ ] Performance testing (50+ songs)
- [ ] Edge case testing
- [ ] Cross-browser testing
- [ ] Mobile testing

### Phase 5: Documentation
- [ ] Add JSDoc comments
- [ ] Update README
- [ ] Add examples to docs
- [ ] Create developer guide

---

## 📝 Code Examples

### Main Resolver Function
```typescript
// src/services/export/smartPlatformResolver.ts

export interface ResolverResult {
  success: boolean;
  tier: 'direct' | 'soft' | 'hard' | 'failed';
  spotifyUri?: string;
  confidence: number;
  reason?: string;
  attemptedTiers: string[];
}

export async function resolveSpotifyTrack(
  song: Song,
  spotifyApi: SpotifyWebApi
): Promise<ResolverResult> {
  const attemptedTiers: string[] = [];
  
  // TIER 1: Direct link
  if (song.platformIds?.spotify?.uri) {
    return {
      success: true,
      tier: 'direct',
      spotifyUri: song.platformIds.spotify.uri,
      confidence: 100,
      attemptedTiers: ['direct'],
    };
  }
  
  // TIER 2: Soft search (if MusicBrainz verified)
  if (song.verificationSource === 'musicbrainz') {
    attemptedTiers.push('soft');
    
    const softResult = await softSearch(song, spotifyApi);
    if (softResult.success) {
      return { ...softResult, attemptedTiers };
    }
  }
  
  // TIER 3: Hard search
  attemptedTiers.push('hard');
  const hardResult = await hardSearch(song, spotifyApi);
  
  if (hardResult.success) {
    return { ...hardResult, attemptedTiers };
  }
  
  // TIER 4: Failed
  return {
    success: false,
    tier: 'failed',
    confidence: 0,
    reason: 'No match found on Spotify',
    attemptedTiers,
  };
}
```

---

## 🎯 Success Criteria

After implementation, verify:

✅ **Functionality**
- [ ] All 4 tiers work correctly
- [ ] Export report generates accurately
- [ ] Modal displays properly
- [ ] No errors in console

✅ **Performance**
- [ ] Export of 50 songs completes in <30s
- [ ] No API rate limit errors
- [ ] No memory leaks
- [ ] Smooth UI (no freezing)

✅ **User Experience**
- [ ] Clear feedback during export
- [ ] Report is easy to understand
- [ ] Failed songs clearly explained
- [ ] Download report works

✅ **Code Quality**
- [ ] All functions have TypeScript types
- [ ] JSDoc comments on public functions
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] No linting errors

---

**Ready to implement!** 🚀

Refer to `TASK_LIST_v9.md` for detailed specifications.
