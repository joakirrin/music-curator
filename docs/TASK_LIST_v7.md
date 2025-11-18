# 📋 FONEA SOUND CURATOR – UPDATED TASK LIST v7
Repository: https://github.com/joakirrin/music-curator/
Date: 2025-01-15
**Phase 3 Update**: Refined based on implementation decisions and workflow clarifications

---

## 🎯 PROJECT STATUS OVERVIEW

**Phase 1**: ✅ COMPLETE (Core Functionality)
**Phase 2**: ✅ COMPLETE (Feedback & Learning)
**Phase 3**: 🚧 IN PROGRESS (Playlist Management - 40% complete)
**Phase 4**: ⏳ PENDING (Advanced Features)
**Phase 5**: ⏳ PENDING (Multi-Platform)

---

## 🚧 PHASE 3: PLAYLIST MANAGEMENT (IN PROGRESS)

### **3.0: Foundation - Spotify OAuth** ✅ COMPLETE
Already implemented with PKCE flow in `spotifyAuth.ts`

---

### **3.1: Local Playlist Management** 🚧 IN PROGRESS

#### Task 3.1.1: Playlist Data Model & State Management ✅ COMPLETE
**Status**: ✅ Implemented in Chunk 1

**Completed**:
- [x] Playlist type definition with all required fields
- [x] CreatePlaylistInput and UpdatePlaylistInput helper types
- [x] localStorage persistence with versioning (`fonea.playlists.v1`)
- [x] usePlaylistsState hook with full CRUD operations:
  - [x] createPlaylist
  - [x] updatePlaylist (name, description, isPublic)
  - [x] deletePlaylist
  - [x] addSongsToPlaylist (with duplicate prevention)
  - [x] removeSongsFromPlaylist
  - [x] getPlaylist (by ID)
  - [x] playlistNameExists (duplicate name check)
  - [x] getPlaylistsForSong (find playlists containing a song)
  - [x] markAsSynced (after Spotify push)
  - [x] clearAllPlaylists (danger zone)
- [x] Auto-save on every state change
- [x] Storage quota exceeded handling

**Files**: 
- `src/types/playlist.ts` ✅
- `src/utils/playlistStorage.ts` ✅
- `src/hooks/usePlaylistsState.ts` ✅

---

#### Task 3.1.2: Playlist Creation UI ✅ COMPLETE
**Status**: ✅ Implemented in Chunk 2

**Completed**:
- [x] **Create Playlist Modal**:
  - [x] Three creation modes:
    - Keep Songs (auto-selects all Keep songs)
    - Select Songs (manual checkbox selection)
    - Start Empty (add songs later)
  - [x] Name input (required, 1-100 chars)
  - [x] Description input (optional, 300 chars)
  - [x] Public/Private toggle (for future Spotify push)
  - [x] Duplicate name validation
  - [x] Character counters
  - [x] Warning tooltip about local storage
  - [x] Success confirmation alert
  - [x] Filter out failed tracks from selection
  
- [x] **Toolbar Integration**:
  - [x] "Create Playlist" button with Keep count badge
  - [x] Playlist counter badge (shows total playlists)
  - [x] Opens CreatePlaylistModal on click

**Files**: 
- `src/components/CreatePlaylistModal.tsx` ✅
- `src/components/Toolbar.tsx` ✅ (updated)

**Decision Notes**:
- Keep/Skip feedback system stays SEPARATE from playlist assignment
- Users do fast Keep/Skip reactions, then organize into playlists later
- Warning users that playlists are saved locally

---

#### Task 3.1.3: View Playlists (Drawer) 🚧 IN PROGRESS
**Status**: 🚧 Chunk 3A - 50% complete

**In Progress**:
- [ ] **PlaylistsDrawer component**:
  - [ ] Slides in from right side
  - [ ] Shows all playlists in card grid
  - [ ] Each card shows: name, description, song count, duration, sync status
  - [ ] Delete button with confirmation
  - [ ] Spotify link (if synced)
  - [ ] Public/Private indicator
  - [ ] Created date
  - [ ] Empty state with "Create Playlist" CTA
  - [ ] "Create New Playlist" button in footer
  - [ ] Click outside or X to close


- [ ] Wire up drawer to Toolbar playlist counter button
- [ ] Test drawer opens/closes correctly

**Files**: 
- `src/components/PlaylistsDrawer.tsx` ✅ (created, needs integration)
- `src/components/Toolbar.tsx` (needs update to open drawer)

---

#### Task 3.1.4: Add Songs to Playlists (Individual) 🚧 IN PROGRESS
**Status**: 🚧 Chunk 3A - 50% complete

**Completed**:
- [x] **AddToPlaylistDropdown component**:
  - [x] Dropdown with all playlists
  - [x] Checkmarks on playlists song is already in
  - [x] Click to toggle add/remove
  - [x] Badge showing count of playlists song is in
  - [x] "Create New Playlist" option at bottom
  - [x] Click outside to close
  - [x] Multi-playlist support (one song → multiple playlists)

**In Progress**:
- [ ] Update ChatGPTSongRow to show dropdown when Keep is clicked
- [ ] Wire up add/remove functionality to usePlaylistsState
- [ ] Test add/remove songs from playlists

**Files**: 
- `src/components/AddToPlaylistDropdown.tsx` ✅ (created, needs integration)
- `src/components/ChatGPTSongRow.tsx` (needs update)

**Design Decision**:
- Dropdown only appears AFTER clicking "Keep" button
- Encourages fast Keep/Skip decisions, then thoughtful playlist assignment

---

#### Task 3.1.5: Bulk Actions (Add Multiple Songs) ⏳ NEXT
**Status**: ⏳ Planned for Chunk 3B

**Requirements**:
- [ ] Add selection checkboxes to left side of song rows (always visible)
- [ ] Track selected songs in state
- [ ] "Add X selected to playlist" button in toolbar/filter bar
  - Only appears when 2+ songs selected
  - Disappears when nothing selected
- [ ] Bulk dropdown shows all playlists
- [ ] Multi-select to add to multiple playlists at once
- [ ] Clear selection after adding
- [ ] Visual feedback (how many added to which playlists)

**Priority**: HIGH | **Dependencies**: 3.1.4  
**Files**: 
- `src/components/ChatGPTSongRow.tsx` (add checkbox)
- `src/components/Toolbar.tsx` or `FilterBar.tsx` (bulk action button)
- `src/App.tsx` (selection state management)

---

#### Task 3.1.6: Delete Protection & Warnings ⏳ NEXT
**Status**: ⏳ Planned for Chunk 3B

**Requirements**:
- [ ] **Individual Song Delete**:
  - Current behavior: Delete removes from song list
  - New behavior: Confirm that song stays in playlists
  - No modal needed, just behavior clarification
  
- [ ] **Delete All Modal**:
  - Warning message:
    ```
    ⚠️ Delete all songs from library?
    
    This will remove all songs from your song list.
    
    IMPORTANT: Songs will remain in your playlists.
    Playlists can be deleted separately from the playlists drawer.
    
    [Cancel] [Delete All Songs]
    ```
  - Emphasize that playlists are preserved
  
- [ ] **Delete Playlist**:
  - Already implemented with confirmation
  - Clarify: "This will NOT delete songs from your library"

**Priority**: HIGH | **Dependencies**: None (safety feature)  
**Files**: 
- `src/App.tsx` (update handleClearSongs)
- `src/components/PlaylistsDrawer.tsx` (already has delete confirmation)

**Critical Note**: 
Playlists reference song IDs. Deleting songs from library doesn't break playlists, but songs become "missing". Need to handle gracefully (show "X missing songs" in playlist cards).

---

#### Task 3.1.7: Edit Playlist Details ⏳ FUTURE
**Status**: ⏳ Deferred to later

**Requirements**:
- [ ] Edit playlist name, description, public/private
- [ ] View all songs in playlist
- [ ] Remove individual songs from playlist
- [ ] Reorder songs (drag & drop - optional)
- [ ] Playlist detail view/modal

**Priority**: MEDIUM | **Dependencies**: 3.1.3, 3.1.4  
**Files**: 
- `src/components/PlaylistDetailModal.tsx` (new)
- `src/components/PlaylistsDrawer.tsx` (add "Edit" button functionality)

---

### **3.2: Spotify Playlist Operations** ⏳ PENDING

#### Task 3.2.1: Push Playlist to Spotify
**Status**: ⏳ Not started (will begin after 3.1 complete)

**Requirements**:
- [ ] Implement `createSpotifyPlaylist()` service
- [ ] API: `POST /v1/users/{user_id}/playlists`
- [ ] Implement `addTracksToSpotifyPlaylist()` service
- [ ] API: `POST /v1/playlists/{playlist_id}/tracks`
- [ ] "Push to Spotify" button in playlist card/detail
- [ ] Progress modal with loading states
- [ ] Handle missing Spotify URIs (search first)
- [ ] Success: Update local playlist with spotifyPlaylistId and spotifyUrl
- [ ] Mark playlist as synced
- [ ] Show link to playlist on Spotify
- [ ] Error handling (rate limits, auth, network)

**Priority**: HIGH | **Dependencies**: 3.1.1, 3.1.2, 3.0.1  
**Files**: 
- `src/services/spotifyPlaylistService.ts` (new)
- `src/components/PushToSpotifyButton.tsx` (new)
- `src/components/PushPlaylistModal.tsx` (new)

---

#### Task 3.2.2: Add to Existing Spotify Playlists
**Status**: ⏳ Not started

**Requirements**:
- [ ] Fetch user's Spotify playlists
- [ ] API: `GET /v1/me/playlists`
- [ ] Filter: Only show playlists user owns
- [ ] "Add to Existing Spotify Playlist" option
- [ ] Check for duplicates before adding
- [ ] Option to save Spotify playlist to Fonea for future edits

**Priority**: MEDIUM | **Dependencies**: 3.2.1  
**Files**: 
- `src/services/spotifyPlaylistService.ts` (extend)
- `src/components/AddToExistingSpotifyPlaylistModal.tsx` (new)

---

#### Task 3.2.3: Sync Changes to Spotify
**Status**: ⏳ Not started

**Requirements**:
- [ ] Track local changes to synced playlists
- [ ] "Sync Changes" button (only if playlist already on Spotify)
- [ ] Show diff preview (songs added/removed, metadata changed)
- [ ] Implement update operations:
  - updatePlaylistDetails (name, description, public/private)
  - addTracksToPlaylist (new songs)
  - removeTracksFromPlaylist (deleted songs)
  - replacePlaylistTracks (full sync/reorder)
- [ ] Conflict detection (playlist changed on Spotify since last sync)
- [ ] Last synced timestamp

**Priority**: MEDIUM | **Dependencies**: 3.2.1  
**Files**: 
- `src/services/spotifyPlaylistService.ts` (extend)
- `src/components/SyncChangesButton.tsx` (new)

---

### **3.3: Audio Features & Analytics** ⏳ POSTPONED

**Status**: ⏳ Deferred to after core playlist functionality complete

#### Task 3.3.1: Fetch Audio Features
- [ ] Implement batch audio features fetching
- [ ] Cache results (30 days)
- [ ] Display in song rows or detail view

#### Task 3.4.1: Playlist Analytics Dashboard
- [ ] Average energy, danceability, valence
- [ ] Genre distribution
- [ ] Tempo range
- [ ] Interactive charts (Recharts)

**Priority**: LOW | **Dependencies**: Phase 3 core complete

---

### **3.5: Preview & Playback** ⏳ POSTPONED

**Status**: ⏳ Nice-to-have, not critical

#### Task 3.5.1: Track Previews
- [ ] 30-second preview player
- [ ] Play/pause controls in song row

#### Task 3.5.2: Web Playback SDK
- [ ] Full Spotify playback in Fonea
- [ ] Requires Premium account

**Priority**: LOW | **Dependencies**: Phase 3 core complete

---

### **3.6: Import & Auto-Sync** ⏳ POSTPONED

#### Task 3.6.1: Import Spotify Playlists
- [ ] Import existing Spotify playlists to Fonea
- [ ] Continue curating locally
- [ ] Push changes back

#### Task 3.6.2: Auto-Sync
- [ ] Automatic background sync to Spotify
- [ ] Configurable interval
- [ ] Sync on close/background

**Priority**: LOW | **Dependencies**: 3.2.3

---

## 🎯 PHASE 3 IMPLEMENTATION ROADMAP (REVISED)

### ✅ Week 1: Local Playlist Foundation (COMPLETE)
- [x] Chunk 1: Data model & state management
- [x] Chunk 2: Creation UI & modal

### 🚧 Week 2: Local Playlist Interactions (IN PROGRESS)
- [x] Chunk 3A (50%): Drawer + individual add to playlist
- [ ] Chunk 3A (50%): Complete integration
- [ ] Chunk 3B: Bulk actions + delete protection
- [ ] Test & polish

### ⏳ Week 3: Spotify Integration
- [ ] Task 3.2.1: Push playlists to Spotify
- [ ] Task 3.2.2: Add to existing Spotify playlists
- [ ] Test full Spotify workflow

### ⏳ Week 4: Sync & Polish
- [ ] Task 3.2.3: Sync changes back to Spotify
- [ ] Task 3.1.7: Edit playlist details
- [ ] Bug fixes & UX improvements
- [ ] Documentation

### ⏳ Optional/Future
- Audio features & analytics
- Preview & playback
- Import & auto-sync

---

## 📊 PHASE 3 PROGRESS TRACKER

### Local Playlist Management (3.1)
- [x] 3.1.1: Data Model ✅ 100%
- [x] 3.1.2: Creation UI ✅ 100%
- [ ] 3.1.3: View Playlists (Drawer) 🚧 50%
- [ ] 3.1.4: Add Songs (Individual) 🚧 50%
- [ ] 3.1.5: Bulk Actions ⏳ 0%
- [ ] 3.1.6: Delete Protection ⏳ 0%
- [ ] 3.1.7: Edit Playlists ⏳ 0%

**Overall**: 40% complete

### Spotify Integration (3.2)
- [ ] 3.2.1: Push to Spotify ⏳ 0%
- [ ] 3.2.2: Add to Existing ⏳ 0%
- [ ] 3.2.3: Sync Changes ⏳ 0%

**Overall**: 0% complete

---

## ✅ COMPLETED PHASES (HISTORICAL)

### **PHASE 2: FEEDBACK & LEARNING** ✅ COMPLETE

#### Task 2.1: Verification Status Filter ✅
- Completed with filter buttons and counts

#### Task 2.2: Smart Replacement Suggestions ✅
- Completed with ChatGPT prompt generation and failed tracks modal

### **PHASE 1: CORE FUNCTIONALITY** ✅ COMPLETE

#### All Phase 1 tasks completed ✅
- Song management, ChatGPT integration, review system, filtering, export, UI polish

**See original task list for full Phase 1 & 2 details**

---

## 🔮 FUTURE PHASES (UNCHANGED)

### **PHASE 4: ADVANCED FEATURES** ⏳ PENDING
- Local file analysis
- Embedded Companion GPT
- Advanced analytics

### **PHASE 5: MULTI-PLATFORM** ⏳ PENDING
- YouTube Music export
- Apple Music export

---

## 🎯 KEY ARCHITECTURAL DECISIONS

### Workflow Philosophy
1. **Fast Reactions**: Keep/Skip/Pending for gut decisions
2. **Thoughtful Organization**: Add to playlists after review
3. **Separation of Concerns**: Feedback ≠ Playlists
4. **Local First**: All playlists stored locally, then optionally pushed to Spotify

### Data Architecture
- **Songs** stored separately from **Playlists**
- Playlists reference song IDs (many-to-many relationship)
- One song can be in multiple playlists
- Deleting song from library doesn't remove from playlists
- Missing songs handled gracefully ("X missing" indicator)

### UI/UX Principles
- Drawer for playlists (keeps context, doesn't navigate away)
- Checkboxes always visible (no toggle mode)
- Dropdown only after Keep (encourages workflow)
- Warnings about local storage (educate users)
- Batch operations for power users

### Storage Strategy
- localStorage with versioning (`fonea.playlists.v1`)
- Auto-save on every change
- Quota exceeded handling
- Export/import for backup

### Spotify Integration Strategy
- Service-agnostic field names (ready for other platforms)
- Track sync status (local vs synced)
- Store Spotify IDs after push
- Conflict detection for bidirectional sync

---

## 📝 IMMEDIATE NEXT STEPS (Chunk 3A Completion)

1. **Update ChatGPTSongRow.tsx**:
   - Show AddToPlaylistDropdown when Keep is clicked
   - Pass song ID and playlists to dropdown
   - Wire up add/remove functionality

2. **Update Toolbar.tsx**:
   - Make playlist counter button clickable
   - Open PlaylistsDrawer when clicked
   - Pass all required props

3. **Update App.tsx**:
   - Import and use PlaylistsDrawer
   - Pass addSongsToPlaylist and removeSongsFromPlaylist handlers
   - Manage drawer open/close state

4. **Test Full Flow**:
   - Click "Keep" on song → Dropdown appears
   - Add to playlist → Song added successfully
   - Click playlist counter → Drawer opens
   - View playlist → See song in playlist
   - Remove song → Song removed successfully

---

**Last Updated**: 2025-01-15  
**Version**: 7.0 (Phase 3 Refinement - In Progress)  
**Current Status**: Phase 3 - 40% Complete | Chunk 3A - 50% Complete
