# 📋 FONEA SOUND CURATOR – COMPLETE TASK LIST v6 (Phase 3 Updated)
Repository: https://github.com/joakirrin/music-curator/
Date: 2025-11-08
**Phase 3 Update**: Refined based on playlist workflow decisions

---

## 🚧 PENDING TASKS (PHASES 3–5)

### **PHASE 3: SPOTIFY INTEGRATION & PLAYLISTS (P1)**

#### **3.0: Foundation - Spotify OAuth**
##### Task 3.0.1: Spotify OAuth PKCE Implementation
**Goal**: Secure user authentication with Spotify to access their account

**Requirements**:
- [ ] Implement PKCE (Proof Key for Code Exchange) OAuth flow
- [ ] Required Scopes:
  - `playlist-modify-public` - Create/modify public playlists
  - `playlist-modify-private` - Create/modify private playlists
  - `playlist-read-private` - Read user's playlists
  - `user-library-read` - Access saved tracks (for import feature)
  - `user-read-private` - Get user profile info
  - `user-read-email` - Get user email
- [ ] Generate and store code verifier/challenge securely
- [ ] Handle callback URL and authorization code exchange
- [ ] Store access token in localStorage with encryption wrapper
- [ ] Store refresh token securely
- [ ] Implement automatic token refresh before expiry
- [ ] Handle token refresh errors gracefully
- [ ] Add "Login with Spotify" button in UI
- [ ] Add "Logout" option that clears tokens and user state
- [ ] Show user profile info when logged in (name, avatar)
- [ ] Error handling:
  - User denies authorization
  - Token exchange fails
  - Network errors
  - Invalid/expired tokens
- [ ] Loading states during OAuth flow
- [ ] Redirect back to app after successful login

**Priority**: CRITICAL | **Dependencies**: None  
**Files**: `src/services/spotifyAuth.ts`, `src/components/SpotifyLoginButton.tsx`, `src/App.tsx`, `src/utils/tokenStorage.ts`

**Technical Notes**:
- Use `crypto.subtle` for generating secure random strings
- Store tokens in localStorage with encryption (simple XOR + base64 for basic security)
- Check token expiry on every API call
- Refresh automatically if < 5 minutes remaining
- Use environment variables for Client ID and redirect URI

---

#### **3.1: Local Playlist Management**
##### Task 3.1.1: Playlist Data Model & State Management
**Goal**: Create the foundation for managing playlists locally in Fonea

**Requirements**:
- [ ] Create Playlist type definition:
  ```typescript
  type Playlist = {
    id: string;                    // unique ID
    name: string;                  // user-defined name
    description?: string;          // optional description
    songIds: string[];             // references to Song.id
    spotifyPlaylistId?: string;    // ID once pushed to Spotify
    spotifyUrl?: string;           // URL once on Spotify
    createdAt: string;             // ISO 8601
    updatedAt: string;             // ISO 8601
    synced: boolean;               // is it synced with Spotify?
    isPublic: boolean;             // Spotify visibility setting
    coverImage?: string;           // playlist cover URL
  }
  ```
- [ ] Add playlist state management hook (`usePlaylistsState`)
- [ ] Store playlists in localStorage with versioning
- [ ] Implement playlist CRUD operations:
  - Create new playlist
  - Rename playlist
  - Update description
  - Delete playlist
  - Add songs to playlist
  - Remove songs from playlist
  - Reorder songs (optional for later)
- [ ] Add playlist count to song metadata (how many playlists contain this song)
- [ ] Validation: prevent duplicate playlist names

**Priority**: HIGH | **Dependencies**: None  
**Files**: `src/types/playlist.ts`, `src/hooks/usePlaylistsState.ts`, `src/utils/playlistStorage.ts`

---

##### Task 3.1.2: Playlist Management UI
**Goal**: Create UI for users to create and manage playlists in Fonea

**Requirements**:
- [ ] **Playlists Page/Section**:
  - List all created playlists (card grid or list view)
  - Show playlist name, description, song count
  - Show sync status badge (🟢 Synced / ⚠️ Not Synced / 🔄 Syncing)
  - Click to view/edit playlist details
  
- [ ] **Create Playlist Modal**:
  - Input: Playlist name (required)
  - Input: Description (optional)
  - Checkbox: Make public on Spotify (default: private)
  - Select songs from "Keep" list
  - Or start empty and add songs later
  
- [ ] **Playlist Detail View**:
  - Show all songs in playlist
  - Drag-and-drop to reorder (optional)
  - Remove songs from playlist
  - Edit playlist name/description
  - Show metadata summary (total duration, avg energy, etc.)
  - "Add More Songs" button
  
- [ ] **Add to Playlist Action** (in SongRow):
  - New button: "Add to Playlist" (📁)
  - Dropdown/Modal showing all playlists
  - Multi-select to add song to multiple playlists
  - Show checkmarks for playlists song is already in
  
- [ ] **Bulk Actions**:
  - Select multiple songs
  - Add selected songs to playlist(s)
  
- [ ] **Quick Create Flow**:
  - "Create Playlist from Keep Songs" button in Toolbar
  - Auto-adds all "Keep" songs to new playlist
  - User can name it and push to Spotify

**Priority**: HIGH | **Dependencies**: 3.1.1  
**Files**: `src/components/PlaylistsView.tsx`, `src/components/CreatePlaylistModal.tsx`, `src/components/PlaylistDetailView.tsx`, `src/components/AddToPlaylistButton.tsx`

---

#### **3.2: Spotify Playlist Operations**
##### Task 3.2.1: Create Playlist on Spotify
**Goal**: Push locally created playlists to user's Spotify account

**Requirements**:
- [ ] Implement `createSpotifyPlaylist()` service function
- [ ] API: `POST /v1/users/{user_id}/playlists`
- [ ] Parameters:
  - name (required)
  - description (optional)
  - public (boolean)
- [ ] Handle Spotify API response:
  - Save `spotifyPlaylistId` and `spotifyUrl` to local playlist
  - Mark playlist as synced
  - Show success notification
  
- [ ] Implement `addTracksToSpotifyPlaylist()` service function
- [ ] API: `POST /v1/playlists/{playlist_id}/tracks`
- [ ] Parameters:
  - uris (array of spotify:track:ID strings)
  - position (optional, for ordering)
- [ ] Handle missing Spotify URIs:
  - For songs without `spotifyUri`, search Spotify first (reuse verification logic)
  - Show warning if some songs can't be found
  - Give user option to exclude unverified songs or search manually
  
- [ ] **"Push to Spotify" Button** in Playlist Detail View:
  - Check if user is logged in (redirect to login if not)
  - Show progress modal:
    - "Creating playlist on Spotify..."
    - "Adding X songs..." with progress bar
    - Show any errors/warnings
  - Success: Show link to playlist on Spotify
  - Update local playlist with Spotify IDs
  
- [ ] Error handling:
  - Rate limiting (429)
  - Invalid tokens (refresh and retry)
  - Network errors
  - Duplicate playlist names (Spotify allows this, but warn user)
  - Songs not found on Spotify

**Priority**: HIGH | **Dependencies**: 3.0.1, 3.1.1, 3.1.2  
**Files**: `src/services/spotifyPlaylistService.ts`, `src/components/PushToSpotifyButton.tsx`, `src/components/PushPlaylistModal.tsx`

---

##### Task 3.2.2: Add Songs to Existing Spotify Playlists
**Goal**: Allow users to add songs to playlists they already have on Spotify

**Requirements**:
- [ ] Fetch user's existing Spotify playlists
- [ ] API: `GET /v1/me/playlists`
- [ ] Display in "Add to Existing Playlist" modal
- [ ] Filter: Show only playlists user owns (not followed playlists)
- [ ] Search/filter playlists by name
- [ ] Show playlist metadata (name, song count, cover image)
- [ ] Allow selecting songs to add
- [ ] Implement `addTracksToExistingPlaylist()`:
  - Check if songs already in playlist (avoid duplicates)
  - Warn user if duplicates found
  - Give option to add anyway or skip duplicates
- [ ] Show success confirmation with link to updated playlist
- [ ] Option to "sync" - save this Spotify playlist to Fonea for future edits

**Priority**: HIGH | **Dependencies**: 3.2.1  
**Files**: `src/services/spotifyPlaylistService.ts`, `src/components/AddToExistingPlaylistModal.tsx`

---

##### Task 3.2.3: Update Existing Playlists
**Goal**: Sync changes made in Fonea back to Spotify

**Requirements**:
- [ ] Track changes to synced playlists:
  - Songs added
  - Songs removed
  - Order changed (if we implement reordering)
  - Name/description changed
  
- [ ] "Sync Changes" button in Playlist Detail View:
  - Only show if playlist is already on Spotify
  - Show diff/preview of changes:
    - ➕ 5 songs will be added
    - ➖ 2 songs will be removed
    - ✏️ Name changed
  - Confirm before syncing
  
- [ ] Implement update operations:
  - `updatePlaylistDetails()` - name, description, public/private
    - API: `PUT /v1/playlists/{playlist_id}`
  - `addTracksToPlaylist()` - add new songs
    - API: `POST /v1/playlists/{playlist_id}/tracks`
  - `removeTracksFromPlaylist()` - remove songs
    - API: `DELETE /v1/playlists/{playlist_id}/tracks`
  - `reorderPlaylistTracks()` - change song order (optional)
    - API: `PUT /v1/playlists/{playlist_id}/tracks`
  
- [ ] Handle conflicts:
  - Playlist deleted on Spotify (mark as unsynced)
  - Playlist modified elsewhere (warn user)
  
- [ ] Auto-sync option (advanced):
  - Checkbox: "Auto-sync changes to Spotify"
  - Background sync every X minutes
  - Show sync status indicator

**Priority**: MEDIUM | **Dependencies**: 3.2.1  
**Files**: `src/services/spotifyPlaylistService.ts`, `src/components/SyncChangesButton.tsx`, `src/components/PlaylistSyncDiffModal.tsx`

---

##### Task 3.2.4: Collaborative Playlists Support (Optional - Phase 3.5)
**Goal**: Handle playlists with multiple contributors

**Requirements**:
- [ ] Detect collaborative playlists when importing
- [ ] Request additional scope: `playlist-modify-public` (already included)
- [ ] Show "Collaborative" badge on playlist
- [ ] Warn user when pushing to collaborative playlist:
  - "This playlist has other contributors. Your changes will be visible to them."
- [ ] Handle permissions:
  - Check if user can modify (owner or collaborator)
  - Disable sync if user doesn't have permissions
- [ ] Show collaborator list (if API provides it)

**Priority**: LOW (Postpone if complex) | **Dependencies**: 3.2.1, 3.2.3  
**Files**: `src/services/spotifyPlaylistService.ts`, `src/components/CollaborativePlaylistWarning.tsx`

**Note**: This can be postponed to Phase 3.5 or later if it adds too much complexity.

---

#### **3.3: Audio Features & Metadata**
##### Task 3.3.1: Fetch & Cache Audio Features
**Goal**: Get detailed audio analysis for songs from Spotify

**Requirements**:
- [ ] Implement `getAudioFeatures()` service function
- [ ] API: `GET /v1/audio-features/{id}` (single track)
- [ ] API: `GET /v1/audio-features?ids={ids}` (batch, up to 100)
- [ ] Audio features to fetch:
  - **Energy** (0-1): Intensity and activity level
  - **Valence** (0-1): Musical positiveness (happy/sad)
  - **Danceability** (0-1): How suitable for dancing
  - **Tempo** (BPM): Beats per minute
  - **Acousticness** (0-1): Acoustic vs electronic
  - **Instrumentalness** (0-1): Vocal vs instrumental
  - **Liveness** (0-1): Audience presence
  - **Speechiness** (0-1): Spoken words vs music
  - **Loudness** (dB): Overall loudness
  - **Key** (0-11): Musical key (C, C#, D, etc.)
  - **Mode** (0-1): Major vs minor
  - **Time Signature** (3-7): Beats per bar
  
- [ ] Add `audioFeatures` field to Song type:
  ```typescript
  audioFeatures?: {
    energy: number;
    valence: number;
    danceability: number;
    tempo: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
    loudness: number;
    key: number;
    mode: number;
    timeSignature: number;
    fetchedAt: string; // ISO 8601
  }
  ```
  
- [ ] Implement caching strategy:
  - Cache in localStorage with song ID as key
  - Cache duration: 30 days (audio features rarely change)
  - Background fetch: Don't block UI
  - Batch requests for efficiency (up to 100 tracks per call)
  
- [ ] **"Fetch Audio Features" Button**:
  - In Toolbar: "Analyze Songs" (🎵)
  - Show progress: "Analyzing X of Y songs..."
  - Skip songs already analyzed (check cache)
  - Skip songs without spotifyId
  - Show completion summary
  
- [ ] Error handling:
  - Songs without Spotify IDs (skip gracefully)
  - Rate limiting (batch with delays)
  - Network errors (retry with backoff)

**Priority**: MEDIUM | **Dependencies**: 3.0.1  
**Files**: `src/services/spotifyAudioFeatures.ts`, `src/types/song.ts` (update), `src/components/FetchAudioFeaturesButton.tsx`

---

##### Task 3.3.2: Additional Metadata Enrichment
**Goal**: Fetch more Spotify metadata to enhance song info

**Requirements**:
- [ ] Implement `getTrackDetails()` for additional metadata:
  - Genres (from artist data)
  - Artist popularity
  - Album type (album/single/compilation)
  - Release date precision (year/month/day)
  - Available markets
  - Copyright info
  
- [ ] Implement `getArtistInfo()`:
  - API: `GET /v1/artists/{id}`
  - Artist genres
  - Follower count
  - Popularity score
  - Artist images
  
- [ ] Add fields to Song type:
  ```typescript
  genres?: string[];
  artistPopularity?: number;
  albumType?: 'album' | 'single' | 'compilation';
  availableMarkets?: string[];
  ```
  
- [ ] Background enrichment:
  - Fetch when user views song details
  - Cache for 7 days
  - Don't block UI

**Priority**: LOW | **Dependencies**: 3.0.1  
**Files**: `src/services/spotifyMetadata.ts`, `src/types/song.ts` (update)

---

#### **3.4: Analytics & Insights Dashboard**
##### Task 3.4.1: Create Analytics Dashboard Component
**Goal**: Visualize playlist and song metadata with interactive charts

**Requirements**:
- [ ] Install and configure Recharts library
- [ ] Create AnalyticsDashboard component
- [ ] Dashboard sections:

  **A. Mood Quadrant (Energy × Valence)**:
  - [ ] Scatter plot with 4 quadrants:
    - High Energy + High Valence = "Energetic & Happy"
    - High Energy + Low Valence = "Energetic & Dark"
    - Low Energy + High Valence = "Calm & Happy"
    - Low Energy + Low Valence = "Calm & Sad"
  - [ ] Color-coded dots by playlist
  - [ ] Hover: Show song name + artist
  - [ ] Click: Jump to song
  
  **B. Tempo Distribution (BPM Histogram)**:
  - [ ] Bar chart of BPM ranges:
    - <90 BPM: Slow
    - 90-120: Moderate
    - 120-140: Upbeat
    - 140-160: Fast
    - 160+: Very Fast
  - [ ] Show song count per range
  
  **C. Year Distribution (Timeline)**:
  - [ ] Line or bar chart showing songs by year
  - [ ] Decade grouping option
  - [ ] Highlight which decades are most represented
  
  **D. Audio Features Radar Chart**:
  - [ ] Radar/spider chart showing average values:
    - Energy, Valence, Danceability, Acousticness, Instrumentalness
  - [ ] Compare playlists side-by-side
  
  **E. Genre Cloud (if available)**:
  - [ ] Word cloud or bar chart of genres
  - [ ] Based on artist genre tags
  
  **F. Popularity Distribution**:
  - [ ] Histogram of popularity scores (0-100)
  - [ ] Show how mainstream vs niche your taste is
  
  **G. Key & Mode Distribution**:
  - [ ] Pie chart of musical keys
  - [ ] Major vs minor mode split
  
  **H. Audio Characteristics Summary**:
  - [ ] Cards showing averages:
    - Avg Energy: 0.65
    - Avg Tempo: 125 BPM
    - Avg Danceability: 0.72
    - % Explicit: 15%
    - % Live recordings: 5%
    - % Instrumental: 10%

- [ ] **Filtering Options**:
  - [ ] Filter by playlist(s)
  - [ ] Filter by round
  - [ ] Filter by feedback status (keep/skip)
  - [ ] Date range filter
  
- [ ] **Export Options**:
  - [ ] Export charts as PNG
  - [ ] Export data as CSV
  - [ ] "Share Insights" feature (optional)

**Priority**: MEDIUM | **Dependencies**: 3.3.1  
**Files**: `src/components/AnalyticsDashboard.tsx`, `src/components/charts/MoodQuadrant.tsx`, `src/components/charts/TempoHistogram.tsx`, etc.

---

##### Task 3.4.2: Playlist-Specific Insights
**Goal**: Show insights for individual playlists

**Requirements**:
- [ ] Add "Insights" tab to Playlist Detail View
- [ ] Show mini versions of dashboard charts (scoped to playlist)
- [ ] Playlist summary stats:
  - Total duration (hours:minutes)
  - Average song length
  - Energy level (low/medium/high)
  - Mood (based on valence)
  - Best for: Dancing / Relaxing / Working / Party (based on features)
  - Era: Mostly 80s / 90s / 2000s / 2010s / 2020s
  
- [ ] **Smart Recommendations**:
  - "Similar songs" from your library based on audio features
  - "Fill gaps" - suggest songs to balance playlist (e.g., "Add some slower songs")
  - "Genre diversity" score
  
- [ ] **Playlist Comparison Tool**:
  - Select 2-3 playlists
  - Show side-by-side comparison
  - Highlight differences and similarities

**Priority**: LOW | **Dependencies**: 3.4.1  
**Files**: `src/components/PlaylistInsights.tsx`, `src/components/PlaylistComparison.tsx`

---

#### **3.5: In-App Track Previews**
##### Task 3.5.1: Audio Preview Player
**Goal**: Let users preview 30-second clips without leaving Fonea

**Requirements**:
- [ ] Add "Preview" button to SongRow (🔊)
- [ ] Only show if `previewUrl` is available (~70% of tracks have it)
- [ ] Create inline audio player:
  - Play/pause button
  - Progress bar (30s)
  - Volume control
  - Current time display
  
- [ ] **Player Behavior**:
  - Click preview on song A → starts playing
  - Click preview on song B → stops A, starts B
  - Close/navigate away → stop playback
  - Global player state (only one song playing at a time)
  
- [ ] **Fallback for missing previews**:
  - If no `previewUrl`, try Web Playback SDK (requires Premium)
  - Or show "Preview not available" + link to Spotify
  
- [ ] **Keyboard Shortcuts** (optional):
  - Space: Play/pause current preview
  - Esc: Stop playback

**Priority**: LOW | **Dependencies**: 3.0.1  
**Files**: `src/components/AudioPreviewPlayer.tsx`, `src/hooks/useAudioPlayer.ts`, `src/components/ChatGPTSongRow.tsx` (update)

---

##### Task 3.5.2: Web Playback SDK Integration (Optional)
**Goal**: Full 30-second previews or full track playback for Premium users

**Requirements**:
- [ ] Add Spotify Web Playback SDK
- [ ] Request additional scope: `streaming`, `user-read-playback-state`
- [ ] Detect if user has Spotify Premium (required for SDK)
- [ ] Initialize player:
  - Create device in Spotify
  - Connect to user's account
  - Handle device transfer
  
- [ ] Playback controls:
  - Play/pause
  - Seek within track
  - Volume control
  
- [ ] Show upgrade prompt for non-Premium users
- [ ] **Note**: This is complex and requires Premium. Consider low priority.

**Priority**: VERY LOW (Optional) | **Dependencies**: 3.5.1, Spotify Premium account  
**Files**: `src/services/spotifyWebPlayback.ts`, `src/components/SpotifyPlayer.tsx`

**Note**: This can be postponed or skipped if too complex. Most users will be fine with 30s previews.

---

#### **3.6: Import User Playlists**
##### Task 3.6.1: Import Existing Spotify Playlists
**Goal**: Bring user's existing Spotify playlists into Fonea as seed data

**Requirements**:
- [ ] "Import from Spotify" button in Playlists view
- [ ] Fetch user's playlists:
  - API: `GET /v1/me/playlists`
  - Paginate if user has many playlists
  
- [ ] Show selection modal:
  - List all user's playlists
  - Show playlist name, song count, cover image
  - Multi-select checkboxes
  - Search/filter by name
  
- [ ] For each selected playlist:
  - Fetch all tracks: `GET /v1/playlists/{playlist_id}/tracks`
  - Parse track metadata (artist, title, album, etc.)
  - Import as new songs in Fonea
  - Create corresponding Fonea playlist
  - Mark as synced with `spotifyPlaylistId`
  
- [ ] **Deduplication**:
  - Check if song already exists (by Spotify ID)
  - If duplicate, add to playlist without creating new song
  - Option to "Re-import" or "Skip duplicates"
  
- [ ] **Round Assignment**:
  - New round for imported playlists? Or mark as "Imported" source?
  - Let user choose or auto-assign to new round
  
- [ ] Progress feedback:
  - "Importing playlist X of Y..."
  - "Adding songs... (50/120)"
  - Show summary: "✅ Imported 3 playlists, 150 songs (20 new, 130 duplicates)"
  
- [ ] Error handling:
  - Playlists with no tracks
  - Private playlists user doesn't own
  - Deleted or unavailable tracks

**Priority**: MEDIUM | **Dependencies**: 3.0.1, 3.1.1  
**Files**: `src/services/spotifyPlaylistImport.ts`, `src/components/ImportSpotifyPlaylistsModal.tsx`

---

##### Task 3.6.2: Auto-Sync Imported Playlists (Optional)
**Goal**: Keep imported playlists in sync with Spotify automatically

**Requirements**:
- [ ] Option: "Sync this playlist automatically"
- [ ] Check for changes periodically (when user logs in or manually)
- [ ] API: `GET /v1/playlists/{playlist_id}`
  - Compare `snapshot_id` to detect changes
  
- [ ] If changes detected:
  - Fetch updated track list
  - Compute diff:
    - New tracks added on Spotify → add to Fonea
    - Tracks removed on Spotify → remove from Fonea (or mark as "removed on Spotify")
  - Show notification: "Playlist 'X' was updated on Spotify. 5 new songs added."
  
- [ ] Conflict resolution:
  - User edited in both Fonea and Spotify
  - Show diff and let user choose which version to keep

**Priority**: VERY LOW (Optional) | **Dependencies**: 3.6.1  
**Files**: `src/services/spotifyPlaylistSync.ts`

**Note**: This is a nice-to-have but adds significant complexity. Postpone unless there's strong user demand.

---

### **PHASE 4: CHATGPT API LOOP (P1)**
*[No changes from original task list - keeping as-is]*

#### Task 4.0.1: ChatGPT API Client
- [ ] API key handling (env)
- [ ] Rate limiting & error UX
- [ ] Token cost estimation UI
**Priority**: HIGH | **Dependencies**: Phase 3 completion
**Files**: gptService.ts, App.tsx

#### Task 4.0.2: One-Click Send & Auto-Import JSON
- [ ] Button to send feedback prompt
- [ ] Receive & parse JSON automatically
- [ ] Schema validation + confirm before import
- [ ] Diff view (old vs new)
**Priority**: HIGH | **Dependencies**: 4.0.1
**Files**: App.tsx, Toolbar.tsx

### **PHASE 4.1: EMBEDDED COMPANION GPT (P2)**
*[No changes from original task list - keeping as-is]*

#### Task 4.1.1: Chat Pane Integration
- [ ] Collapsible chat panel
- [ ] Maintain current round context
- [ ] Enforce JSON schema in replies
- [ ] "Use this selection" actions
**Priority**: MEDIUM | **Dependencies**: 4.0.1
**Files**: ChatPane.tsx, App.tsx

### **PHASE 5: SECONDARY PLATFORMS (P3)**
*[No changes from original task list - keeping as-is]*

#### Task 5.0.1: YouTube Playlist Export
- [ ] YouTube Data API v3 auth
- [ ] Track search/match policy
- [ ] Create playlist; progress + mismatch report
**Priority**: LOW | **Dependencies**: Phase 3 completion
**Files**: youtubeService.ts, Toolbar.tsx

#### Task 5.0.2: Apple Music Playlist Export
- [ ] MusicKit JS auth
- [ ] Track search/match policy
- [ ] Create playlist; progress + mismatch report
**Priority**: LOW | **Dependencies**: Phase 3 completion
**Files**: appleMusicService.ts, Toolbar.tsx

---

## ✅ COMPLETED TASKS (HISTORICAL)

### **PHASE 2: FEEDBACK & LEARNING** (Complete)
*[No changes - keeping as-is]*

#### Task 2.1: Verification Status Filter
- [x] Add filter buttons: All / Verified / Unverified / Failed
- [x] Show counts for each status
- [x] Integrate with existing FilterBar UI
- [x] Add new filter row
- [x] Update filtered songs logic in App.tsx
- [x] Style buttons with appropriate colors

#### Task 2.2: Smart Replacement Suggestions
- [x] Analyze failed verifications
- [x] Generate ChatGPT prompt for replacements
- [x] Copy prompt to clipboard
- [x] Preview replacements modal (FailedTracksModal)
- [x] Track which suggestions were accepted (via import-replace flow)
- [x] Toolbar button: "Get Replacements"

> Note: "gustos"/personalized-taste feature canceled during Phase 2.

### **PHASE 1.6: ENHANCED FEEDBACK LOOP** (100% Complete)
*[No changes - keeping as-is]*

#### Task 1.6.1: Fallback Search Strategies
- [x] normalizeString()
- [x] Handle accented characters
- [x] Strategies: Strict / Simple / Normalized / Album-based
- [x] Try strategies in order; log which worked

#### Task 1.6.2: Strict Artist Matching
- [x] stringSimilarity() (Levenshtein)
- [x] 60% threshold
- [x] Reject below threshold; log scores
- [x] Track rejected matches

#### Task 1.6.3: Smart Exclusion
- [x] "Hide unverified" checkbox (default ON)
- [x] Better summary messages
- [x] Educational text + export guidance

#### Task 1.6.4: Enhanced Export
- [x] Include unverified tracks section + errors
- [x] Add guiding questions for ChatGPT
- [x] Add instructions & improved alerts

### **PHASE 1.5: VERIFICATION LAYER** (100% Complete)
*[No changes - keeping as-is]*

#### Task 1.5.1: Spotify API (Client Credentials)
- [x] Token with auto-refresh
- [x] Search API (NOT link verification)
- [x] Artist+title search; parse metadata
- [x] Rate limiting (100ms delay)

#### Task 1.5.2: Verification UI
- [x] Badges: Verified / Failed / Unverified
- [x] Timestamps & source
- [x] Tooltips with details

#### Task 1.5.3: Auto-Verify on Import
- [x] Toggle (default ON)
- [x] Progress bar
- [x] Live counters & summary
- [x] Option to exclude unverified

#### Task 1.5.4: Modal Improvements
- [x] Better design & progress tracking
- [x] Summary statistics & success rate
- [x] Failed tracks expandable list
- [x] Auto-close after 5s

#### Task 1.5.5: Caching System
- [x] Cache results in localStorage
- [x] 7-day expiry
- [x] Cache key: artist+title
- [x] Avoid re-verification

### **PHASE 1: CORE FUNCTIONALITY** (100% Complete)
*[No changes - keeping as-is]*

#### Task 1.1: Basic Song Management
- [x] Song type; list view
- [x] Add/delete songs; delete all + confirm
- [x] LocalStorage persistence

#### Task 1.2: ChatGPT Integration
- [x] Import JSON from ChatGPT; parse recommendations
- [x] Support rounds; optional fields; schema validation

#### Task 1.3: Review System
- [x] Keep/Skip/Pending + visual badges
- [x] User feedback text; read-only GPT reason

#### Task 1.4: Filtering & Search
- [x] By status, round, and free text
- [x] Progress counter + clear indicators

#### Task 1.5: Export Feedback
- [x] Feedback JSON + copy to clipboard
- [x] Include decisions + user feedback
- [x] Ready to paste back to ChatGPT

#### Task 1.6: UI/UX Polish
- [x] Dark mode; professional styling; responsive
- [x] Smooth animations; clear button states
- [x] Helpful placeholder text

---

## 📊 PHASE 3 SUMMARY

**Total Tasks**: 15 main tasks (broken into sub-tasks)
**Estimated Duration**: 3-4 weeks
**Priority Breakdown**:
- 🔴 Critical: 1 task (OAuth)
- 🟠 High: 4 tasks (Playlist Management, Spotify Operations)
- 🟡 Medium: 5 tasks (Audio Features, Analytics, Import)
- 🟢 Low/Optional: 5 tasks (Previews, Advanced Features)

**Recommended Implementation Order**:
1. **Week 1**: OAuth (3.0.1) → Local Playlists (3.1.1, 3.1.2)
2. **Week 2**: Spotify Push (3.2.1) → Add to Existing (3.2.2)
3. **Week 3**: Audio Features (3.3.1) → Analytics (3.4.1, 3.4.2)
4. **Week 4**: Import Playlists (3.6.1) → Updates (3.2.3) → Polish

**Optional/Postpone**:
- Collaborative playlists (3.2.4)
- Web Playback SDK (3.5.2)
- Auto-sync (3.6.2)

---

## 🎯 KEY IMPROVEMENTS IN V6

**Phase 3 Refinements**:
1. ✅ Split "Create Playlist" into two logical tasks (local management + Spotify push)
2. ✅ Added detailed requirements for each task
3. ✅ Clarified OAuth scope requirements
4. ✅ Expanded analytics dashboard with specific chart types
5. ✅ Added playlist insights and comparison features
6. ✅ Defined clear data models for playlists
7. ✅ Separated preview features from core functionality
8. ✅ Added import playlist feature for reverse flow
9. ✅ Marked optional/postponable features clearly
10. ✅ Provided week-by-week implementation roadmap

**Technical Decisions**:
- Playlist model allows many-to-many song relationships
- OAuth uses PKCE for better security
- Audio features cached for 30 days
- Analytics use Recharts for interactive visualizations
- All Spotify operations include progress feedback
- Graceful degradation for missing data

---

## 📝 NOTES

- **Spotify API Rate Limits**: 
  - Most endpoints: No official limit, but be respectful
  - Recommended: Add 100ms delay between requests
  - Batch requests where possible (audio features, tracks)
  
- **OAuth Security**:
  - Never expose Client Secret in frontend
  - Use PKCE flow (more secure, no secret needed)
  - Refresh tokens before they expire
  - Clear tokens on logout
  
- **Data Consistency**:
  - Always validate Spotify responses
  - Handle missing/null fields gracefully
  - Keep local state in sync with Spotify state
  - Use `spotifyPlaylistId` as source of truth for synced playlists
  
- **User Experience**:
  - Show progress for all long operations
  - Provide clear error messages
  - Allow undo for destructive actions
  - Don't block UI during background fetches
  
- **Future Considerations**:
  - Mobile app (React Native)
  - Collaborative features
  - Social sharing
  - Machine learning recommendations
  - Integration with other music services (Apple Music, YouTube Music)

---

**Last Updated**: 2025-11-08
**Version**: 6.0 (Phase 3 Refinement)
**Status**: Phase 1-2 Complete ✅ | Phase 3 In Planning 📋
