## 📋 FONEA SOUND CURATOR — TASK LIST v10

**Last Updated:** November 21, 2025
**Project Repository:** https://github.com/joakirrin/music-curator

---

## 🎯 PROJECT STATUS OVERVIEW

**Phase 4.5**: 🔄 IN PROGRESS (40% Complete - Smart Export ✅, Branding ✅, Polish Pending)
**Phase 5**: ⏳ PENDING (Multi-Platform Import & Export)
**Phase 6**: 📋 PLANNED (Advanced Features & Premium)

---

## ✅ COMPLETED PHASES (Summary)

<details>
<summary>📦 Phase 1-4: Core Foundation (Click to expand)</summary>

### Phase 1: Basic Curation System
- ✅ Song import from ChatGPT (JSON format)
- ✅ Manual song entry
- ✅ Basic metadata (title, artist, album, year)
- ✅ CSV/JSON export for feedback loop

### Phase 2: Feedback & Verification
- ✅ Keep/Skip/Pending feedback system
- ✅ MusicBrainz verification (no login required)
- ✅ Platform ID extraction (Spotify, Apple Music, etc.)
- ✅ ISRC code support
- ✅ Failed tracks modal & replacement system

### Phase 3: Spotify Integration
- ✅ OAuth 2.0 (PKCE) authentication
- ✅ User profile display
- ✅ Basic playlist export to Spotify

### Phase 4: Advanced Features
- ✅ Local playlist management (with full Song objects)
- ✅ Album art service (3-tier: Cover Art Archive → iTunes → Placeholder)
- ✅ Round-based organization
- ✅ Advanced filtering & search
- ✅ GDPR-compliant analytics (Microsoft Clarity)
- ✅ Cookie consent system
- ✅ Privacy policy modal

</details>

---

## 🔄 PHASE 4.5: SMART EXPORT REFINEMENT & POLISH (Current Focus)

### ✅ 4.5.1: Smart Platform Search Fallback (3-Tier Strategy) — COMPLETED
**Status:** ✅ Implemented & Stable
**Files:**
- `src/services/export/smartPlatformResolver.ts`
- `src/services/export/types.ts`
- `src/services/spotifyPlaylistService.ts` (integrated)

**Implementation Details:**
- **Tier 1 (Direct):** Extracts existing Spotify IDs from `platformIds.spotify.id`, `serviceUri`, `spotifyUri`, etc.
- **Tier 2 (Soft Search):** Simple artist+title search for MusicBrainz-verified songs (85% confidence)
- **Tier 3 (Hard Search):** Flexible query with top 5 results, scoring algorithm (70% title + 30% artist), 50% threshold
- **Success Rate:** 90-95% URI resolution

**Achievements:**
- Zero false positives with the 3-tier approach
- Confidence scoring for each match
- Detailed logging for debugging

---

### ✅ 4.5.2: Playlist Export Branding — COMPLETED
**Status:** ✅ Implemented & Stable
**Files:**
- `src/utils/formatters.ts` (`formatPlaylistDescription()`)
- `src/config/features.ts` (feature flags)
- `src/components/PushPlaylistModal.tsx` (UI integration)

**Implementation Details:**
- Mandatory branding: `"Made with Fonea Sound Curator 🎵 • curator.fonea.app"`
- Single-line format (to avoid Spotify API 400 errors)
- User description + separator + branding
- Feature flag system for future Premium removal option

**Format:**
```
[User Description] --- Made with Fonea Sound Curator 🎵 • curator.fonea.app
```

---

### 🆕 4.5.3: Song Preview Mini-Player (Apple Music Public API)
**Status:** ✅ Implemented & Stable
**Priority:** HIGH (Core UX improvement)
**Estimated Effort:** 8-12 hours

**Goal:**
Implement a mini-player/waveform visualizer that plays 30-second previews of songs directly in the UI using Apple Music's public API (no authentication required).

**Technical Requirements:**

1. **Preview URL Source:**
   - Use `song.previewUrl` (already populated from iTunes Search API)
   - Fallback: Fetch from iTunes if missing
   - API: `https://itunes.apple.com/lookup?id={appleId}`

2. **UI Components:**
   - Mini-player controls (play/pause, progress bar)
   - Waveform visualization (optional, nice-to-have)
   - Integration in `ChatGPTSongRow.tsx`
   - Volume control
   - Loading states

3. **State Management:**
   - Single global audio instance (only one preview plays at a time)
   - Auto-stop when switching songs
   - Persist volume preference in localStorage

4. **Files to Create/Modify:**
   - `src/components/SongPreviewPlayer.tsx` (new)
   - `src/hooks/useAudioPlayer.ts` (new)
   - `src/services/previewService.ts` (new, handles preview URL fetching)
   - `src/components/ChatGPTSongRow.tsx` (integrate player)
   - `src/styles/preview-player.css` (new)

**User Flow:**
1. User clicks 🎵 icon on any song row
2. Preview starts playing (30 seconds)
3. Progress bar shows playback position
4. Click pause/play to control
5. Clicking another song stops current preview and starts new one

**Design Mockup:**
```
┌─────────────────────────────────────────────────┐
│ 🎵 Playing Preview...                  2:15/3:00│
│ ▶️ ═══════════════════════•─── 🔊              │
└─────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Preview plays when user clicks play button
- [ ] Only one preview plays at a time
- [ ] Preview auto-stops after 30 seconds
- [ ] Progress bar updates in real-time
- [ ] Volume control persists across sessions
- [ ] Loading state shows when fetching preview
- [ ] Graceful fallback if preview unavailable
- [ ] Mobile-friendly touch controls

**Technical Notes:**
- Use HTML5 `<audio>` element (not `<video>`)
- Preview URLs are public (no authentication needed)
- Consider adding skip forward/backward 5 seconds
- Optional: Add keyboard shortcuts (Space = pause/play)

---

### 🆕 4.5.4: Refinar Spotify Smart Fallback (Tier 2.5: User-Specific Search)
**Status:** ⏳ PENDING
**Priority:** MEDIUM (Incremental improvement)
**Estimated Effort:** 4-6 hours

**Goal:**
If the user is logged in to Spotify, refine the Tier 3 (Hard Search) by using their access token to perform a more contextual search that considers their library, listening history, and regional availability.

**Current Behavior:**
- Tier 3 searches with no user context (anonymous)
- Success rate: ~70-80% on hard searches

**Target Behavior:**
- If user logged in: Use authenticated search (Tier 2.5)
- Leverage Spotify's personalization algorithm
- Expected improvement: +10-15% success rate

**Technical Requirements:**

1. **Modify Smart Resolver:**
   - Add new tier: `tier: 'user-search'`
   - Check if `token` is available (user logged in)
   - If yes, insert between Tier 2 (Soft) and Tier 3 (Hard)

2. **Implementation:**
   ```typescript
   // In smartPlatformResolver.ts
   
   // After Tier 2 fails...
   if (token && song.verificationSource === "musicbrainz") {
     // Tier 2.5: User-Specific Search
     const userSearchResult = await searchWithUserContext(
       song.artist, 
       song.title,
       token
     );
     
     if (userSearchResult && confidence > 0.6) {
       return {
         song,
         spotifyUri: userSearchResult.uri,
         tier: 'user-search',
         confidence: 0.9
       };
     }
   }
   ```

3. **API Enhancement:**
   - Use Spotify Search API with user token
   - Add `market` parameter (user's country)
   - Consider `offset` for better matches
   - Leverage higher rate limits with auth

4. **Files to Modify:**
   - `src/services/export/smartPlatformResolver.ts`
   - `src/services/export/types.ts` (add 'user-search' tier)
   - `src/components/PushPlaylistModal.tsx` (update summary)

**Acceptance Criteria:**
- [ ] Tier 2.5 only runs when user is logged in
- [ ] Falls back gracefully to Tier 3 if user not logged in
- [ ] Success rate improves by 10%+ on logged-in users
- [ ] Export report shows breakdown of tier usage
- [ ] No performance degradation (same speed)

**Technical Notes:**
- Spotify's authenticated search considers user's market and library
- Rate limits are higher with authentication (more lenient)
- Consider caching results to avoid duplicate searches

---

### 4.5.5: Buy Me a Coffee Integration
**Status:** ⏳ PENDING
**Priority:** LOW (Monetization prep)
**Estimated Effort:** 2-3 hours

**Goal:**
Add a "Buy Me a Coffee" button in the UI to allow users to support the project with one-time donations.

**Requirements:**
1. Add button to:
   - About/Credits section (primary)
   - Footer (secondary)
   - Guide drawer (optional)

2. Integration:
   - Create Buy Me a Coffee account
   - Get widget/button code
   - Add to relevant components

3. Tracking (GDPR-compliant):
   - Track button clicks (no personal data)
   - Use Clarity events: `coffee_button_clicked`

**Files to Modify:**
- `src/components/Footer.tsx` (new or existing)
- `src/components/GuideDrawer.tsx` (add button)
- `src/components/AboutModal.tsx` (new, see 4.5.7)

**Design:**
```
┌────────────────────────────────────┐
│ ☕ Enjoying Fonea?                 │
│ Buy me a coffee to support dev!   │
│ [☕ Support on Ko-fi →]            │
└────────────────────────────────────┘
```

---

### 4.5.6: Premium Feature System (Framework Only)
**Status:** ⏳ PENDING
**Priority:** MEDIUM (Foundation for Phase 6)
**Estimated Effort:** 6-8 hours

**Goal:**
Build the framework for premium features (paid tier) without implementing actual payment processing. This is the **architecture** for future monetization.

**Features to Implement:**

1. **Premium Flag System:**
   ```typescript
   // src/types/user.ts (new)
   export type UserTier = 'free' | 'premium' | 'beta';
   
   export type UserProfile = {
     id: string;
     tier: UserTier;
     premiumExpiresAt?: string; // ISO timestamp
     betaAccess: boolean;
   };
   ```

2. **Feature Gating:**
   ```typescript
   // src/config/features.ts (update)
   export const FEATURES = {
     BRANDING_ON_EXPORT: {
       enabled: true,
       removable: false, // true for premium
       tier: 'free'
     },
     ADVANCED_ANALYTICS: {
       enabled: false,
       tier: 'premium'
     },
     // ... more features
   };
   ```

3. **Premium UI Components:**
   - Premium badge display
   - "Upgrade to Premium" banners (non-intrusive)
   - Feature comparison table (modal)

4. **LocalStorage Premium State:**
   - For beta testing: manual premium flag
   - `localStorage.setItem('fonea_premium_beta', 'true')`
   - Easy toggle for testing

**Files to Create/Modify:**
- `src/types/user.ts` (new)
- `src/hooks/usePremiumFeatures.ts` (new)
- `src/config/features.ts` (update)
- `src/components/PremiumBadge.tsx` (new)
- `src/components/UpgradeModal.tsx` (new)

**Acceptance Criteria:**
- [ ] Feature flags support `tier` property
- [ ] Premium badge shows for premium users
- [ ] Features are gated correctly (free vs premium)
- [ ] Easy to toggle premium status for testing
- [ ] No payment processing (framework only)

---

### 4.5.7: About/Credits Section
**Status:** ⏳ PENDING
**Priority:** MEDIUM (Transparency & Credits)
**Estimated Effort:** 3-4 hours

**Goal:**
Add an "About" section to the app that explains the project, credits APIs/services used, and provides legal/privacy links.

**Content to Include:**

1. **Project Description:**
   - What is Fonea Sound Curator?
   - Core features overview
   - Roadmap preview

2. **Credits:**
   - MusicBrainz API
   - iTunes/Apple Music Search API
   - Spotify Web API
   - Cover Art Archive
   - Microsoft Clarity (analytics)
   - shadcn/ui & Radix UI components

3. **Legal Links:**
   - Privacy Policy (link to modal)
   - Terms of Service (TBD)
   - Cookie Policy (link to banner settings)

4. **Developer Info:**
   - GitHub repository link
   - Contact email: foneamusiccurator@gmail.com
   - Buy Me a Coffee link (from 4.5.5)

**UI Design:**
- Modal (accessible from header "About" button)
- Clean, readable layout
- Links open in new tab
- Version number display

**Files to Create:**
- `src/components/AboutModal.tsx` (new)
- `src/components/Header.tsx` (add "About" button)

**Mockup:**
```
┌──────────────────────────────────────────┐ 
│ About Fonea Sound Curator                │
├──────────────────────────────────────────┤
│ 🎵 A smart music curation tool...        │
│                                          │
│ 📋 Credits:                              │
│  • MusicBrainz (verification)            │
│  • iTunes API (previews)                 │
│  • Spotify API (export)                  │
│                                          │
│ 📧 Contact: foneamusiccurator@gmail.com │
│ 💻 GitHub: [link]                        │
│ ☕ Support: [Buy Me a Coffee]            │
│                                          │
│ 🔒 Privacy Policy | Terms | Cookies     │
│                                          │
│ v1.0.0 • Made with ❤️ in Spain          │
└──────────────────────────────────────────┘
```

---

## ⏳ PHASE 5: MULTI-PLATFORM IMPORT & EXPORT

**Status:** 📋 PLANNED
**Start Date:** TBD (After Phase 4.5 completion)
**Estimated Duration:** 4-6 weeks

**Overview:**
Expand Fonea's export/import capabilities beyond Spotify to support Apple Music, Tidal, Qobuz, and other streaming platforms. This phase focuses on building an **abstraction layer** for multi-platform support.

---

### 🆕 5.1: Implement Core Multi-Platform Export Framework (Abstraction)
**Status:** ⏳ PENDING
**Priority:** HIGH (Foundation for all Phase 5)
**Estimated Effort:** 12-16 hours

**Goal:**
Create a platform-agnostic export system that can be extended to support any streaming service without duplicating code.

**Architecture Design:**

1. **Platform Service Interface:**
   ```typescript
   // src/services/export/platformService.ts (new)
   
   export type PlatformName = 'spotify' | 'apple' | 'tidal' | 'qobuz' | 'youtube';
   
   export interface PlatformService {
     name: PlatformName;
     displayName: string;
     icon: string; // URL or emoji
     
     // Authentication
     isAuthenticated(): Promise<boolean>;
     login(): Promise<void>;
     logout(): Promise<void>;
     
     // Playlist Operations
     createPlaylist(params: CreatePlaylistParams): Promise<PlatformPlaylist>;
     addTracksToPlaylist(playlistId: string, tracks: PlatformTrack[]): Promise<void>;
     
     // Track Resolution
     resolveTrack(song: Song): Promise<PlatformTrack | null>;
   }
   
   export type CreatePlaylistParams = {
     name: string;
     description?: string;
     isPublic: boolean;
   };
   
   export type PlatformPlaylist = {
     id: string;
     url: string;
     name: string;
   };
   
   export type PlatformTrack = {
     id: string;
     uri: string;
     url: string;
     confidence: number;
   };
   ```

2. **Platform Registry:**
   ```typescript
   // src/services/export/platformRegistry.ts (new)
   
   export class PlatformRegistry {
     private platforms = new Map<PlatformName, PlatformService>();
     
     register(platform: PlatformService): void {
       this.platforms.set(platform.name, platform);
     }
     
     get(name: PlatformName): PlatformService | undefined {
       return this.platforms.get(name);
     }
     
     getAll(): PlatformService[] {
       return Array.from(this.platforms.values());
     }
     
     getAuthenticated(): Promise<PlatformService[]> {
       return Promise.all(
         this.getAll().map(async p => 
           await p.isAuthenticated() ? p : null
         )
       ).then(results => results.filter(Boolean));
     }
   }
   
   // Global singleton
   export const platformRegistry = new PlatformRegistry();
   ```

3. **Unified Export Service:**
   ```typescript
   // src/services/export/exportService.ts (new)
   
   export async function exportPlaylist(
     playlist: Playlist,
     platform: PlatformName,
     onProgress?: ProgressCallback
   ): Promise<ExportReport> {
     const service = platformRegistry.get(platform);
     if (!service) throw new Error(`Platform ${platform} not registered`);
     
     // Check authentication
     if (!await service.isAuthenticated()) {
       throw new Error(`Not logged in to ${service.displayName}`);
     }
     
     // Resolve tracks
     const resolvedTracks: PlatformTrack[] = [];
     for (const song of playlist.songs) {
       const track = await service.resolveTrack(song);
       if (track) resolvedTracks.push(track);
     }
     
     // Create playlist
     const platformPlaylist = await service.createPlaylist({
       name: playlist.name,
       description: formatPlaylistDescription(playlist.description),
       isPublic: playlist.isPublic
     });
     
     // Add tracks
     await service.addTracksToPlaylist(platformPlaylist.id, resolvedTracks);
     
     // Build report
     return buildExportReport(playlist, platformPlaylist, resolvedTracks);
   }
   ```

**Files to Create:**
- `src/services/export/platformService.ts` (interface)
- `src/services/export/platformRegistry.ts` (registry)
- `src/services/export/exportService.ts` (unified export)
- `src/services/export/spotify/spotifyPlatformService.ts` (refactor existing)

**Refactoring Required:**
- Move Spotify-specific logic from `spotifyPlaylistService.ts` to `spotifyPlatformService.ts`
- Implement `PlatformService` interface for Spotify
- Update UI to use unified `exportService`

**Acceptance Criteria:**
- [ ] Platform service interface defined
- [ ] Registry system implemented
- [ ] Spotify refactored to use new interface
- [ ] Export service works with abstraction
- [ ] No breaking changes to existing Spotify export

---

### 🆕 5.2: Implement Apple Music Playlist Export Service
**Status:** ⏳ PENDING (Depends on 5.1)
**Priority:** HIGH (Second most popular platform)
**Estimated Effort:** 16-20 hours

**Goal:**
Enable users to export playlists to Apple Music using MusicKit JS API.

**Technical Requirements:**

1. **Apple Music Authentication:**
   - Use MusicKit JS (Apple's official library)
   - Developer token (server-side generation)
   - User music token (browser-based)
   - No OAuth needed (simpler than Spotify)

2. **Implementation:**
   ```typescript
   // src/services/export/apple/appleMusicService.ts (new)
   
   export class AppleMusicPlatformService implements PlatformService {
     name = 'apple' as const;
     displayName = 'Apple Music';
     icon = '🍎';
     
     private musicKit: MusicKit.MusicKitInstance | null = null;
     
     async initialize(): Promise<void> {
       await MusicKit.configure({
         developerToken: await this.getDeveloperToken(),
         app: {
           name: 'Fonea Sound Curator',
           build: '1.0.0'
         }
       });
       this.musicKit = MusicKit.getInstance();
     }
     
     async isAuthenticated(): Promise<boolean> {
       return this.musicKit?.isAuthorized ?? false;
     }
     
     async login(): Promise<void> {
       await this.musicKit?.authorize();
     }
     
     async resolveTrack(song: Song): Promise<PlatformTrack | null> {
       // Priority 1: Use existing Apple Music ID
       if (song.platformIds?.apple?.id) {
         return this.getTrackById(song.platformIds.apple.id);
       }
       
       // Priority 2: Search by ISRC
       if (song.isrc) {
         return this.searchByISRC(song.isrc);
       }
       
       // Priority 3: Search by artist + title
       return this.searchByArtistTitle(song.artist, song.title);
     }
     
     async createPlaylist(params: CreatePlaylistParams): Promise<PlatformPlaylist> {
       const playlist = await this.musicKit!.api.music(
         `/v1/me/library/playlists`,
         {
           method: 'POST',
           body: {
             attributes: {
               name: params.name,
               description: params.description
             }
           }
         }
       );
       
       return {
         id: playlist.id,
         url: `https://music.apple.com/library/playlist/${playlist.id}`,
         name: playlist.attributes.name
       };
     }
     
     // ... more methods
   }
   ```

3. **MusicKit JS Integration:**
   - Add script tag to `index.html`
   - Configure developer token endpoint
   - Handle token refresh

4. **Developer Token Server:**
   - Create Vercel serverless function
   - Sign JWT with Apple Music private key
   - Return token to client

**Files to Create:**
- `src/services/export/apple/appleMusicService.ts` (new)
- `src/services/export/apple/musicKitTypes.ts` (new, TypeScript definitions)
- `api/apple-music-token.ts` (Vercel function, new)

**Challenges:**
- Apple Music API has different track IDs than iTunes
- Search by ISRC not officially documented (may need workaround)
- Developer token requires Apple Developer account ($99/year)
- MusicKit JS only works in supported regions

**Acceptance Criteria:**
- [ ] User can authenticate with Apple Music
- [ ] Playlists are created successfully
- [ ] Track matching works (artist+title or ISRC)
- [ ] Export report shows success/failure breakdown
- [ ] Developer token refreshes automatically
- [ ] Works in all supported regions

**Resources:**
- [MusicKit JS Documentation](https://developer.apple.com/documentation/musickitjs)
- [Apple Music API](https://developer.apple.com/documentation/applemusicapi)

---

### 🆕 5.3: Implement Tidal/Qobuz Playlist Export Service (Framework)
**Status:** ⏳ PENDING (Depends on 5.1)
**Priority:** MEDIUM (Niche but high-quality platforms)
**Estimated Effort:** 20-24 hours (combined)

**Goal:**
Enable export to Tidal and Qobuz for audiophile users. Both platforms require more complex authentication and have limited public APIs.

**Tidal Implementation:**

1. **Authentication:**
   - OAuth 2.0 (similar to Spotify)
   - Requires Tidal API partnership (difficult to get)
   - Alternative: Use unofficial API (risky)

2. **Track Resolution:**
   - Search by ISRC (Tidal supports this)
   - Fallback to artist+title search

**Qobuz Implementation:**

1. **Authentication:**
   - OAuth 2.0
   - Public API available (easier than Tidal)

2. **Track Resolution:**
   - Search by artist+title
   - ISRC support limited

**Status Note:**
Both platforms have limited/restricted APIs. Implementation may be blocked by API access. Consider as **Phase 6** instead if API access is denied.

**Files to Create (if implemented):**
- `src/services/export/tidal/tidalService.ts` (new)
- `src/services/export/qobuz/qobuzService.ts` (new)

---

### 🆕 5.4: Failure Notification UI for Export (Display ExportReport.failed)
**Status:** ⏳ PENDING (Depends on 5.1)
**Priority:** HIGH (Critical UX)
**Estimated Effort:** 4-6 hours

**Goal:**
Show users which songs failed to export and why, with actionable next steps.

**Current Behavior:**
- Export report generated server-side
- No UI to display failures
- Users don't know what failed

**Target Behavior:**
- Clear visual feedback on export completion
- List of failed songs with reasons
- Suggestions for manual fixes

**UI Design:**

1. **Export Success Modal (Updated):**
   ```
   ┌─────────────────────────────────────────────┐
   │ ✅ Playlist Exported!                       │
   ├─────────────────────────────────────────────┤
   │ 📊 Export Summary:                          │
   │  • Total Songs: 50                          │
   │  • Successfully Added: 47 (94%)             │
   │  • Not Available: 3                         │
   │                                             │
   │ ⚠️ Songs Not Found:                         │
   │  1. "Track Name" by Artist                  │
   │     → Not available on Spotify              │
   │  2. "Another Track" by Artist               │
   │     → Search failed (low confidence)        │
   │  3. "Third Track" by Artist                 │
   │     → Not available in your region          │
   │                                             │
   │ 💡 What can you do?                         │
   │  • Search manually on platform              │
   │  • Find alternative versions                │
   │  • Request replacement from ChatGPT         │
   │                                             │
   │ [Copy Failed Tracks] [Download Report]     │
   │ [Open Playlist on Spotify] [Close]         │
   └─────────────────────────────────────────────┘
   ```

2. **Failed Tracks List Component:**
   ```typescript
   // src/components/ExportFailureList.tsx (new)
   
   type Props = {
     failedSongs: FailedSong[];
     platform: PlatformName;
   };
   
   export function ExportFailureList({ failedSongs, platform }: Props) {
     return (
       <div className="space-y-2">
         {failedSongs.map((item, idx) => (
           <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded">
             <div className="font-medium text-red-900">
               {idx + 1}. "{item.song.title}" by {item.song.artist}
             </div>
             <div className="text-sm text-red-600 mt-1">
               {item.reason}
             </div>
             <div className="mt-2 flex gap-2">
               <a
                 href={getPlatformSearchUrl(platform, item.song)}
                 target="_blank"
                 className="text-xs text-blue-600 underline"
               >
                 Search on {platformName}
               </a>
               <button
                 onClick={() => copyToClipboard(`${item.song.artist} - ${item.song.title}`)}
                 className="text-xs text-gray-600 underline"
               >
                 Copy Name
               </button>
             </div>
           </div>
         ))}
       </div>
     );
   }
   ```

**Files to Create/Modify:**
- `src/components/ExportFailureList.tsx` (new)
- `src/components/PushPlaylistModal.tsx` (update success stage)
- `src/utils/exportHelpers.ts` (new, helper functions)

**Acceptance Criteria:**
- [ ] Failed songs displayed clearly
- [ ] Reasons for failure shown
- [ ] Quick actions available (search, copy)
- [ ] Export report downloadable as JSON
- [ ] Works for all platforms (Spotify, Apple Music, etc.)

---

### 🆕 5.5: Implement Playlist Import Framework (Abstraction)
**Status:** ⏳ PENDING (Depends on 5.1)
**Priority:** HIGH (Reverse flow)
**Estimated Effort:** 8-12 hours

**Goal:**
Allow users to import existing playlists from Spotify, Apple Music, etc. into Fonea for curation and cross-platform export.

**Architecture Design:**

1. **Platform Service Interface (Update):**
   ```typescript
   // Add to PlatformService interface:
   
   export interface PlatformService {
     // ... existing methods
     
     // Import Operations
     getUserPlaylists(): Promise<PlatformPlaylistSummary[]>;
     getPlaylistTracks(playlistId: string): Promise<Song[]>;
   }
   
   export type PlatformPlaylistSummary = {
     id: string;
     name: string;
     description?: string;
     trackCount: number;
     url: string;
     imageUrl?: string;
     isPublic: boolean;
   };
   ```

2. **Import Service:**
   ```typescript
   // src/services/import/importService.ts (new)
   
   export async function importPlaylist(
     platform: PlatformName,
     playlistId: string,
     onProgress?: ProgressCallback
   ): Promise<Playlist> {
     const service = platformRegistry.get(platform);
     if (!service) throw new Error(`Platform ${platform} not registered`);
     
     // Fetch playlist metadata
     const playlists = await service.getUserPlaylists();
     const playlistMeta = playlists.find(p => p.id === playlistId);
     if (!playlistMeta) throw new Error('Playlist not found');
     
     // Fetch tracks
     const songs = await service.getPlaylistTracks(playlistId);
     
     // Verify songs with MusicBrainz (optional, but recommended)
     const verifiedSongs = await batchVerifyWithMusicBrainz(
       songs.map(s => ({ artist: s.artist, title: s.title })),
       (current, total) => onProgress?.({
         stage: 'verifying',
         current,
         total,
         message: `Verifying songs (${current}/${total})...`
       })
     );
     
     // Merge verification results
     const enrichedSongs = songs.map((song, idx) => ({
       ...song,
       ...verifiedSongs[idx]
     }));
     
     // Create local playlist
     return {
       id: generatePlaylistId(),
       name: playlistMeta.name,
       description: playlistMeta.description,
       songs: enrichedSongs,
       synced: false,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
       isPublic: playlistMeta.isPublic
     };
   }
   ```

**User Flow:**
1. User clicks "Import Playlist" button
2. Select platform (Spotify, Apple Music, etc.)
3. Authenticate if needed
4. Browse user's playlists
5. Select playlist to import
6. Progress modal shows verification status
7. Playlist added to Fonea with all songs

**Files to Create:**
- `src/services/import/importService.ts` (new)
- `src/components/ImportPlaylistModal.tsx` (new)
- `src/components/PlaylistBrowser.tsx` (new)

**Acceptance Criteria:**
- [ ] User can view their playlists from connected platforms
- [ ] Playlist import includes all tracks
- [ ] Songs are verified with MusicBrainz automatically
- [ ] Progress tracking during import
- [ ] Imported playlist is editable in Fonea
- [ ] Works for all registered platforms

---

### 🆕 5.6: Implement Spotify Playlist Import Service
**Status:** ⏳ PENDING (Depends on 5.5)
**Priority:** HIGH (Most requested feature)
**Estimated Effort:** 6-8 hours

**Goal:**
Implement the Spotify-specific import logic using the framework from 5.5.

**Implementation:**

1. **Spotify Import Service:**
   ```typescript
   // src/services/import/spotify/spotifyImportService.ts (new)
   
   export class SpotifyImportService implements PlatformService {
     // ... existing export methods
     
     async getUserPlaylists(): Promise<PlatformPlaylistSummary[]> {
       const token = await spotifyAuth.getAccessToken();
       if (!token) throw new Error('Not authenticated');
       
       const response = await fetch(
         'https://api.spotify.com/v1/me/playlists?limit=50',
         {
           headers: { 'Authorization': `Bearer ${token}` }
         }
       );
       
       const data = await response.json();
       
       return data.items.map(playlist => ({
         id: playlist.id,
         name: playlist.name,
         description: playlist.description,
         trackCount: playlist.tracks.total,
         url: playlist.external_urls.spotify,
         imageUrl: playlist.images?.[0]?.url,
         isPublic: playlist.public
       }));
     }
     
     async getPlaylistTracks(playlistId: string): Promise<Song[]> {
       const token = await spotifyAuth.getAccessToken();
       if (!token) throw new Error('Not authenticated');
       
       // Fetch all tracks (handle pagination)
       const tracks: Song[] = [];
       let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
       
       while (url) {
         const response = await fetch(url, {
           headers: { 'Authorization': `Bearer ${token}` }
         });
         
         const data = await response.json();
         
         tracks.push(...data.items.map(item => ({
           id: generateId(),
           title: item.track.name,
           artist: item.track.artists[0].name,
           album: item.track.album.name,
           year: item.track.album.release_date?.substring(0, 4),
           duration: Math.floor(item.track.duration_ms / 1000),
           durationMs: item.track.duration_ms,
           source: 'imported' as const,
           feedback: 'pending' as const,
           platforms: ['Spotify'] as Platform[],
           liked: false,
           toAdd: false,
           addedAt: new Date().toISOString(),
           spotifyUri: item.track.uri,
           spotifyId: item.track.id,
           previewUrl: item.track.preview_url,
           albumArtUrl: item.track.album.images[0]?.url,
           popularity: item.track.popularity,
           isPlayable: item.track.is_playable,
           explicit: item.track.explicit,
           isrc: item.track.external_ids?.isrc,
           verificationStatus: 'verified' as const,
           verificationSource: 'spotify' as const,
           verifiedAt: new Date().toISOString(),
           platformIds: {
             spotify: {
               id: item.track.id,
               url: item.track.external_urls.spotify
             }
           }
         })));
         
         url = data.next; // Pagination
       }
       
       return tracks;
     }
   }
   ```

**Files to Create:**
- `src/services/import/spotify/spotifyImportService.ts` (new)

**Acceptance Criteria:**
- [ ] User can view all their Spotify playlists
- [ ] Pagination handled (100+ track playlists)
- [ ] All metadata imported (album art, ISRC, etc.)
- [ ] Songs marked as verified immediately (already from Spotify)
- [ ] Import works for collaborative playlists
- [ ] Import works for followed playlists (not owned by user)

---

## 📋 PHASE 6: ADVANCED FEATURES & PREMIUM (Planned)

**Status:** 📋 PLANNED
**Timeline:** TBD (Q1 2026?)

**Potential Features:**
- Advanced analytics dashboard
- Playlist collaboration features
- Advanced search filters
- Batch operations
- Custom themes
- Desktop app (Electron/Tauri)
- Mobile app (React Native)
- Payment processing (Stripe)
- Remove branding for premium users

---

## 📝 DEVELOPMENT GUIDELINES

### Priorities for Next Sprint
1. **4.5.3** → Mini-player (high user value)
2. **4.5.7** → About section (transparency)
3. **5.1** → Multi-platform framework (foundation)
4. **5.2** → Apple Music export (second platform)

### Code Quality Standards
- TypeScript strict mode
- ESLint + Prettier
- Unit tests for services
- Integration tests for critical flows
- GDPR compliance for all features
- Accessibility (WCAG 2.1 AA)

### Documentation Requirements
- Update README.md after each phase
- API documentation for services
- User guide in app (GuideDrawer)
- Developer setup guide

### Testing Checklist
- [ ] Manual testing on desktop (Chrome, Firefox, Safari)
- [ ] Manual testing on mobile (iOS Safari, Android Chrome)
- [ ] Cross-browser verification
- [ ] Performance testing (large playlists >100 songs)
- [ ] Error handling (network failures, API errors)
- [ ] GDPR compliance verification

---

## 🎯 SUCCESS METRICS

**Phase 4.5 Success Criteria:**
- Export success rate: >95%
- User satisfaction: 4.5+ stars
- Preview functionality: >80% usage
- Zero data privacy violations

**Phase 5 Success Criteria:**
- Apple Music export success rate: >90%
- Import success rate: >95%
- Cross-platform workflow: seamless UX
- API reliability: 99%+ uptime

---

## 📞 CONTACT & SUPPORT

- **Email:** foneamusiccurator@gmail.com
- **GitHub Issues:** https://github.com/joakirrin/music-curator/issues
- **Discussions:** https://github.com/joakirrin/music-curator/discussions

---

**Last Updated:** November 21, 2025
**Version:** 10.0
**Status:** Phase 4.5 In Progress (40% Complete)
