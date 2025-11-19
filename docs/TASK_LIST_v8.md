# 📋 FONEA SOUND CURATOR — TASK LIST v8
Repository: https://github.com/joakirrin/music-curator/
Date: 2025-11-18
**Phase 3 Update**: Added Universal Verification System (Multi-Platform)

---

## 🎯 PROJECT STATUS OVERVIEW

**Phase 1**: ✅ COMPLETE (Core Functionality)
**Phase 2**: ✅ COMPLETE (Feedback & Learning)
**Phase 3**: ✅ COMPLETE (Playlist Management & Spotify Push)
**Phase 4**: 🚧 IN PROGRESS (Universal Verification System)
**Phase 5**: ⏳ PENDING (Multi-Platform Sync)
**Phase 6**: ⏳ PENDING (Advanced Features)

---

## 🚧 PHASE 4: UNIVERSAL VERIFICATION SYSTEM (IN PROGRESS)

### **Goal**: Enable song verification without requiring Spotify login
**Target**: Support testing by users without Spotify accounts, prepare for multi-platform (Tidal, Qobuz, Apple Music)

### **Architecture Decision**:
- **Level 1**: Universal verification (MusicBrainz + iTunes) - NO LOGIN REQUIRED
- **Level 2**: Platform-specific verification (Spotify, Qobuz, Apple, Tidal) - OPTIONAL, ON-DEMAND

---

### **4.1: MusicBrainz Verification Service** 🚧 CHUNK 1
**Status**: ⏳ Not started

**Requirements**:
- [ ] Create `src/services/verification/` directory
- [ ] Implement `musicBrainzVerification.ts`
  - [ ] Search MusicBrainz API (artist + title)
  - [ ] Parse metadata (album, year, ISRC)
  - [ ] Extract platform links (Spotify, Apple, Tidal, Qobuz IDs)
  - [ ] Handle rate limits (1 request/second)
  - [ ] Return unified VerificationResult type
- [ ] Create `verificationTypes.ts` with shared types
- [ ] Add error handling for API failures
- [ ] Add retry logic with exponential backoff

**API Endpoints**:
- Search: `https://musicbrainz.org/ws/2/recording/?query=artist:{artist}+AND+recording:{title}`
- Lookup: `https://musicbrainz.org/ws/2/recording/{mbid}?inc=url-rels+artist-rels`

**Testing**:
```typescript
// Test cases
✓ Mainstream song: "Daft Punk" + "Get Lucky" → Should find + return platform IDs
✓ Indie song: "Khruangbin" + "Time (You and I)" → Should find + return metadata
✗ Fake song: "Unknown Artist" + "Fake Song" → Should return verification failed
```

**Priority**: HIGH | **Time**: 2 hours | **Dependencies**: None  
**Files**: 
- `src/services/verification/musicBrainzVerification.ts` (new)
- `src/services/verification/verificationTypes.ts` (new)
- `src/services/verification/README.md` (new - API docs)

---

### **4.2: iTunes Fallback + Preview URLs** 🚧 CHUNK 2
**Status**: ⏳ Not started

**Requirements**:
- [ ] Implement `itunesVerification.ts`
  - [ ] Search iTunes API (artist + title)
  - [ ] Get 30-second preview URLs
  - [ ] Get high-resolution album artwork (1400x1400)
  - [ ] Parse results into VerificationResult
- [ ] Use as fallback when MusicBrainz fails
- [ ] No rate limits (super fast)
- [ ] Handle regional availability

**API Endpoint**:
- Search: `https://itunes.apple.com/search?term={query}&entity=song&limit=5`

**Testing**:
```typescript
// Test: iTunes as fallback
MusicBrainz fails → iTunes search → Returns preview URL + artwork
```

**Priority**: HIGH | **Time**: 1 hour | **Dependencies**: Chunk 1  
**Files**: 
- `src/services/verification/itunesVerification.ts` (new)

---

### **4.3: Verification Orchestrator** 🚧 CHUNK 3
**Status**: ⏳ Not started

**Requirements**:
- [ ] Implement `verificationOrchestrator.ts`
  - [ ] Try MusicBrainz first (has platform links)
  - [ ] Also fetch iTunes data (for previews + artwork)
  - [ ] Merge results intelligently
  - [ ] Fallback to iTunes if MusicBrainz fails
  - [ ] Return comprehensive VerificationResult
- [ ] Handle partial successes (MB metadata + iTunes preview)
- [ ] Cache results to avoid duplicate API calls
- [ ] Log verification sources for transparency

**Flow**:
```typescript
verifySong(artist, title) {
  1. MusicBrainz search → metadata + platform IDs
  2. iTunes search → preview URL + artwork
  3. Merge data (best of both)
  4. Return unified result
}
```

**Testing**:
```typescript
// Test: Both sources
"Tame Impala" + "The Less I Know The Better"
  → MusicBrainz: metadata + Spotify/Apple IDs
  → iTunes: preview URL + artwork
  → Result: Combined data ✓

// Test: iTunes only
"Obscure Indie Artist" + "Deep Cut"
  → MusicBrainz: not found
  → iTunes: found
  → Result: iTunes data only ✓

// Test: Both fail
"asdflkj" + "zxcvbnm"
  → Result: verification failed ✗
```

**Priority**: HIGH | **Time**: 1 hour | **Dependencies**: Chunks 1 & 2  
**Files**: 
- `src/services/verification/verificationOrchestrator.ts` (new)

---

### **4.4: Update Import Flow** 🚧 CHUNK 4
**Status**: ⏳ Not started

**Requirements**:
- [ ] Update `ImportChatGPTModal.tsx`
  - [ ] Remove "Spotify login required" messaging
  - [ ] Use universal verification by default
  - [ ] Show "Verifying with MusicBrainz + iTunes" message
  - [ ] Keep Spotify verification as optional toggle
  - [ ] Update progress messages
- [ ] Update verification badge display
  - [ ] Show source: "✓ Verified (MusicBrainz)"
  - [ ] Show source: "✓ Verified (iTunes)"
  - [ ] Show source: "✓ Verified (Spotify)" (if user opted in)
- [ ] Keep `spotifyVerification.ts` for backwards compatibility
- [ ] Update `ChatGPTSongRow.tsx` to show verification source

**UI Changes**:
```tsx
// Import Modal
┌─────────────────────────────────────┐
│ Import from ChatGPT                 │
├─────────────────────────────────────┤
│ ✅ Auto-verify (No login required) │ ← Default
│ ⚠️ Songs saved locally in browser   │
│                                     │
│ Optional:                           │
│ □ Also verify with Spotify         │ ← Only if logged in
│                                     │
│ [Paste JSON here...]                │
└─────────────────────────────────────┘

// Song Row Badge
┌─────────────────────────────────────┐
│ ✓ Verified (MusicBrainz)  Round 1  │ ← Shows source
├─────────────────────────────────────┤
│ Song Title                          │
│ Artist · Album · 2024               │
└─────────────────────────────────────┘
```

**Testing**:
- [ ] Import 10 songs WITHOUT Spotify login → All verify ✓
- [ ] Import 10 songs WITH Spotify login → Option to verify both ✓
- [ ] Check badge shows correct source ✓
- [ ] Verify songs added to library with correct metadata ✓

**Priority**: HIGH | **Time**: 2 hours | **Dependencies**: Chunk 3  
**Files**: 
- `src/components/ImportChatGPTModal.tsx` (update)
- `src/components/ChatGPTSongRow.tsx` (update)
- `src/services/spotifyVerification.ts` (keep for backwards compat)

---

### **4.5: Qobuz Integration (Optional)** 🚧 CHUNK 5
**Status**: ⏳ Not started (research needed)

**Research First**:
- [ ] Review Qobuz API documentation
- [ ] Check if search requires authentication
- [ ] Check preview URL availability (60s previews!)
- [ ] Check rate limits
- [ ] Determine complexity: Easy/Medium/Hard

**If Easy (Clean REST API, no auth for search)**:
- [ ] Implement `qobuzVerification.ts`
  - [ ] Search Qobuz catalog
  - [ ] Get 60-second preview URLs (no auth!)
  - [ ] Get hi-res artwork
  - [ ] Get Qobuz track IDs
- [ ] Add to orchestrator as additional source
- [ ] Prioritize Qobuz previews (longer, better quality)

**If Medium (OAuth required but straightforward)**:
- [ ] Your decision: Add now or defer?

**If Hard (Complex SDK required)**:
- [ ] Defer to Phase 5

**Priority**: MEDIUM | **Time**: 2-4 hours (TBD) | **Dependencies**: Chunk 3  
**Files**: 
- `src/services/verification/qobuzVerification.ts` (new, if easy)

**Decision Point**: Research API complexity before committing

---

### **4.6: Preview Player Component** 🚧 CHUNK 6
**Status**: ⏳ Not started

**Requirements**:
- [ ] Create `SongPreviewPlayer.tsx` component
  - [ ] Play/pause button with icon toggle
  - [ ] Progress bar with seeking
  - [ ] Volume control (optional)
  - [ ] Display preview source and duration
  - [ ] Auto-stop when playing another preview
  - [ ] Keyboard shortcut (spacebar)
  - [ ] Loading state while buffering
- [ ] Integrate into `ChatGPTSongRow.tsx`
- [ ] Handle missing preview URLs gracefully
- [ ] Add event tracking (preview_played)

**UI Design**:
```tsx
┌─────────────────────────────────────┐
│ Song Title                          │
│ Artist Name · Album · 2024          │
│                                     │
│ [▶️ Preview (30s · iTunes)] 🔊 ━━◉━ │ ← New!
│ [🎵 Spotify] [📺 YouTube]          │
└─────────────────────────────────────┘
```

**Features**:
- Play/pause toggle
- Progress bar shows elapsed/total time
- Shows source: "iTunes", "Qobuz", "Spotify"
- Shows duration: "30s", "60s", "90s"
- Volume slider (click speaker icon)
- Disabled state if no preview URL

**Testing**:
- [ ] Play preview → Audio plays ✓
- [ ] Pause → Audio pauses ✓
- [ ] Seek → Jumps to position ✓
- [ ] Play another song → First one stops ✓
- [ ] No preview URL → Button disabled ✓
- [ ] Keyboard shortcuts work ✓

**Priority**: MEDIUM | **Time**: 2 hours | **Dependencies**: Chunks 1-4  
**Files**: 
- `src/components/SongPreviewPlayer.tsx` (new)
- `src/components/ChatGPTSongRow.tsx` (update)

---

### **4.7: Update GPT System Prompt** 🚧 CHUNK 7
**Status**: ⏳ Not started

**Requirements**:
- [ ] Update system prompt to reflect new verification system
- [ ] Remove Spotify login requirement
- [ ] Add MusicBrainz verification instructions
- [ ] Update verification rules
- [ ] Test with new prompt

**Changes Needed**:

**OLD**:
```
STEP #1 – The user must be logged into Spotify
Otherwise verification and feedback flows will not work.
```

**NEW**:
```
STEP #1 – Fonea works with multiple music platforms
The user can verify songs without logging in.
All songs are verified via MusicBrainz (open music database).
Logging into Spotify/Qobuz/Apple Music is optional for pushing playlists.
```

**OLD**:
```
Search Spotify's public catalog
Use: site:open.spotify.com "track title" "artist name"
```

**NEW**:
```
Verification via MusicBrainz:
1. Ensure track exists in MusicBrainz database
2. Confirm metadata matches: title, artist, year, album
3. If you cannot verify with 100% certainty, mark as [NEEDS VERIFICATION]
4. Never fabricate songs, titles, or artist names
5. If unsure, omit the track and suggest alternatives
```

**Testing**:
- [ ] Generate 10 recommendations with new prompt
- [ ] Import into Fonea
- [ ] All songs should verify successfully
- [ ] No hallucinations (fake songs/artists)

**Priority**: MEDIUM | **Time**: 30 minutes | **Dependencies**: All chunks complete  
**Files**: 
- GPT system prompt (external document)
- Test import flow end-to-end

---

## 📊 PHASE 4 PROGRESS TRACKER

### Universal Verification (4.1-4.7)
- [ ] 4.1: MusicBrainz Service ⏳ 0%
- [ ] 4.2: iTunes Fallback ⏳ 0%
- [ ] 4.3: Verification Orchestrator ⏳ 0%
- [ ] 4.4: Update Import Flow ⏳ 0%
- [ ] 4.5: Qobuz Integration ⏳ 0% (research first)
- [ ] 4.6: Preview Player ⏳ 0%
- [ ] 4.7: Update GPT Prompt ⏳ 0%

**Overall**: 0% complete | **Estimated Time**: ~15 hours

---

## ✅ PHASE 3: PLAYLIST MANAGEMENT & SPOTIFY PUSH (COMPLETE)

### **3.1: Local Playlist Management** ✅ COMPLETE
- [x] 3.1.1: Data Model & State Management ✅
- [x] 3.1.2: Creation UI ✅
- [x] 3.1.3: View Playlists (Drawer) ✅
- [x] 3.1.4: Add Songs (Individual) ✅

### **3.2: Spotify Playlist Operations** ✅ COMPLETE
- [x] 3.2.1: Push Playlist to Spotify ✅
  - [x] `spotifyPlaylistService.ts` - Create playlists, add tracks
  - [x] `PushPlaylistModal.tsx` - Progress tracking UI
  - [x] `PlaylistsDrawer.tsx` - Push button integration
  - [x] `App.tsx` - Sync state management

**Files Created**:
- `src/services/spotifyPlaylistService.ts` ✅
- `src/components/PushPlaylistModal.tsx` ✅
- `src/components/PlaylistsDrawer.tsx` (updated) ✅
- `src/App.tsx` (updated) ✅

---

## ✅ PHASE 2: FEEDBACK & LEARNING (COMPLETE)

### Task 2.1: Verification Status Filter ✅
- Completed with filter buttons and counts

### Task 2.2: Smart Replacement Suggestions ✅
- Completed with ChatGPT prompt generation and failed tracks modal

---

## ✅ PHASE 1: CORE FUNCTIONALITY (COMPLETE)

All Phase 1 tasks completed ✅
- Song management, ChatGPT integration, review system, filtering, export, UI polish

---

## 🔮 PHASE 5: MULTI-PLATFORM SYNC (PENDING)

### **5.1: Platform-Specific Verification on Demand**
**Status**: ⏳ Planned for after Phase 4

**Concept**: When user wants to push to a platform, auto-upgrade verification

**Flow**:
```
User has playlist with MusicBrainz-verified songs
    ↓
User clicks "Push to Spotify"
    ↓
Check: Do songs have Spotify IDs?
    ↓
Missing 5 songs → Auto-fetch from Spotify (takes ~5 seconds)
    ↓
Push playlist ✓
```

**Platforms to Support**:
- [ ] Spotify (already done for push)
- [ ] Qobuz (if API is good)
- [ ] Apple Music
- [ ] Tidal (unofficial API)

---

### **5.2: Apple Music Integration**
**Status**: ⏳ Not started

**Requirements**:
- [ ] MusicKit JS integration
- [ ] Apple Music OAuth
- [ ] Search and verify with Apple Music
- [ ] Get 90-second preview URLs (requires login)
- [ ] Push playlists to Apple Music

**Priority**: MEDIUM | **Dependencies**: Phase 4 complete

---

### **5.3: Tidal Integration**
**Status**: ⏳ Not started

**Requirements**:
- [ ] Research Tidal unofficial API
- [ ] Tidal OAuth (if possible)
- [ ] Search and verify with Tidal
- [ ] Push playlists to Tidal
- [ ] Handle HiFi/MQA metadata

**Priority**: LOW | **Dependencies**: Phase 4 complete  
**Note**: Unofficial API = risk of breaking changes

---

## 🎯 PHASE 6: ADVANCED FEATURES (PENDING)

### **6.1: Sync Changes to Existing Playlists**
- [ ] Track local changes
- [ ] Show diff preview
- [ ] Update existing Spotify/Qobuz playlists

### **6.2: Import Playlists from Platforms**
- [ ] Import from Spotify
- [ ] Import from Apple Music
- [ ] Import from Qobuz
- [ ] Continue curating in Fonea

### **6.3: Audio Features & Analytics**
- [ ] Fetch audio features (energy, tempo, etc.)
- [ ] Playlist analytics dashboard
- [ ] Genre distribution charts

### **6.4: Collaborative Features**
- [ ] Share playlists with friends
- [ ] Collaborative curation
- [ ] Export/import playlist files

---

## 🎯 KEY ARCHITECTURAL DECISIONS

### Multi-Platform Strategy
1. **Universal verification first** (MusicBrainz + iTunes) - NO LOGIN
2. **Platform-specific on-demand** (when pushing) - LOGIN REQUIRED
3. **Graceful degradation** (works without any platform login)
4. **Progressive enhancement** (better with platform logins)

### Data Model
```typescript
type Song = {
  // Core data
  id: string;
  title: string;
  artist: string;
  album?: string;
  
  // Universal verification (NO LOGIN)
  verificationStatus: "verified-universal" | "verified-spotify" | "verified-multi" | "failed";
  verificationSource: "musicbrainz" | "itunes" | "spotify" | "apple" | "qobuz" | "multi";
  musicBrainzId?: string;
  
  // Universal metadata (from MusicBrainz/iTunes)
  albumArtUrl?: string;
  previewUrl?: string;
  previewSource?: "itunes" | "qobuz" | "apple";
  releaseDate?: string;
  
  // Platform-specific IDs (lazy loaded on-demand)
  platformIds?: {
    spotify?: { id: string; uri: string; url: string; };
    apple?: { id: string; url: string; };
    tidal?: { id: string; url: string; };
    qobuz?: { id: string; url: string; };
  };
};
```

### Preview Strategy
- **Primary**: iTunes (30s, no auth)
- **Upgrade**: Qobuz (60s, no auth)
- **Future**: Apple Music (90s, requires auth), Tidal (full, requires auth)

### Service Priority (for push)
1. Spotify (largest userbase, done ✅)
2. Qobuz (audiophile focus, official API)
3. Apple Music (second largest, good API)
4. Tidal (unofficial API, higher risk)

---

## 📅 IMPLEMENTATION TIMELINE

### Phase 4 (Current - Universal Verification)
```
Week 1:
├── Day 1: Chunks 1 & 2 (MusicBrainz + iTunes)
├── Day 2: Chunk 3 (Orchestrator) + Testing
├── Day 3: Chunk 4 (Import Flow) + User Testing
├── Day 4: Chunk 5 (Qobuz research) + Chunk 6 (Preview Player)
└── Day 5: Chunk 7 (GPT Prompt) + End-to-end testing

Total: ~15 hours focused work
```

### Phase 5 (Future - Multi-Platform Sync)
- After Phase 4 complete
- Based on user feedback
- Prioritize most-requested platform

---

## 🧪 TESTING STRATEGY

### After Each Chunk:
1. ✅ Unit test (does the function work?)
2. ✅ Integration test (does it work with other chunks?)
3. ✅ User test (does the UI work?)

### Final Acceptance Test (Phase 4):
```
1. Open app (NO LOGIN)
2. Import 10 songs from ChatGPT
3. All songs verify successfully (MusicBrainz + iTunes)
4. Preview 3 songs (30s each)
5. Create playlist locally
6. Login to Spotify
7. Push playlist to Spotify
8. Verify playlist on Spotify
9. All songs present ✓
```

---

## 🎯 SUCCESS METRICS

### Phase 4 Goals:
- **Before**: 100% require Spotify login for verification
- **After**: 0% require login for verification

- **Before**: ~30% verification failures (hallucinations)
- **After**: <5% verification failures (real songs only)

- **Before**: No preview capability
- **After**: 30-60s previews for 90%+ of songs

- **Before**: Spotify-only
- **After**: Platform-agnostic, ready for multi-platform

---

## 📝 NOTES

### Rate Limits
- **MusicBrainz**: 1 request/second (enforced by User-Agent)
- **iTunes**: No rate limits
- **Qobuz**: TBD (research needed)
- **Spotify**: Handled by existing auth

### Backwards Compatibility
- Keep `spotifyVerification.ts` for users who prefer it
- Support both old and new Song data structures
- Migrate gradually, no breaking changes

### Future Considerations
- ISRC codes for cross-platform matching
- Acoustid fingerprinting for audio matching
- Local file analysis (Phase 6)

---

**Last Updated**: 2025-11-18  
**Version**: 8.0 (Phase 4 - Universal Verification System)  
**Current Status**: Phase 3 Complete | Phase 4 Ready to Start  
**Next Up**: Chunk 1 - MusicBrainz Verification Service
