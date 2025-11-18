# 🌱 SEED PROMPT - Continue Fonea Development

**Copy everything below and paste at the start of a new Claude conversation:**

---

## Project Context

**Project**: Fonea Sound Curator  
**Repository**: https://github.com/joakirrin/music-curator/  
**Tech Stack**: React, TypeScript, Tailwind CSS, Radix UI, localStorage  
**Current Phase**: Phase 3 - Local Playlist Management (40% complete)  
**Current Task**: Chunk 3A - Drawer + Add to Playlist (50% complete)

## What Fonea Does

A web app where users:
1. Get music recommendations from ChatGPT (JSON import)
2. Review songs (Keep/Skip/Pending)
3. Verify tracks via Spotify API (album art, metadata)
4. Organize Keep songs into playlists
5. (Future) Push playlists to Spotify

**Key Philosophy**: Fast gut reactions (Keep/Skip), then thoughtful organization (playlists)

---

## Completed Work ✅

### Phase 1 & 2 (100% Complete)
- ✅ ChatGPT JSON import with round tracking
- ✅ Keep/Skip/Pending feedback system
- ✅ Spotify verification (search API, not Web API)
- ✅ Filter by status, round, verification
- ✅ Export feedback back to ChatGPT
- ✅ Replacement suggestions for failed tracks
- ✅ Feedback FAB (Google Form link)
- ✅ Album art display (128×128px, left side)
- ✅ Service-agnostic architecture (ready for YouTube, Apple Music)

### Phase 3: Playlist Management (40% Complete)

**Chunk 1 - Foundation ✅ (100%)**
- ✅ Playlist type definitions (`src/types/playlist.ts`)
- ✅ localStorage persistence (`src/utils/playlistStorage.ts`)
- ✅ State management hook (`src/hooks/usePlaylistsState.ts`)
- ✅ CRUD operations: create, update, delete, add/remove songs
- ✅ Validation: duplicate names, auto-save, quota handling

**Chunk 2 - Creation UI ✅ (100%)**
- ✅ CreatePlaylistModal with 3 modes:
  - Keep Songs (auto-select Keep songs)
  - Select Songs (manual checkboxes)
  - Start Empty (add later)
- ✅ Toolbar with "Create Playlist" button + Keep count badge
- ✅ Playlist counter badge (shows total playlists)
- ✅ Warning: "⚠️ Playlists saved locally. Clear cache deletes them."


---

## Key Architectural Decisions

### Workflow
1. **Keep/Skip is FAST** (gut reaction)
2. **Playlist assignment is THOUGHTFUL** (separate step)
3. **After clicking Keep** → "Add to Playlist" button appears
4. **Feedback to ChatGPT** does NOT include playlist info

### Data Model
- Songs stored separately from playlists
- Playlists reference song IDs (many-to-many)
- One song can be in multiple playlists
- **CRITICAL**: Deleting song from library does NOT remove from playlists

### UI/UX
- Right drawer for playlists (keeps context)
- Dropdown only appears after Keep is clicked
- Checkmarks show which playlists song is already in
- Checkboxes always visible on song rows (for bulk actions)

### Storage
- localStorage with versioning: `fonea.playlists.v1`
- Auto-save on every state change
- Handle quota exceeded gracefully
- Songs: `fonea.songs.v1`

---

## Current File Structure

```
src/
├── types/
│   ├── song.ts
│   └── playlist.ts ✅
├── utils/
│   └── playlistStorage.ts ✅
├── hooks/
│   └── usePlaylistsState.ts ✅
├── services/
│   ├── spotifyAuth.ts (OAuth PKCE)
│   └── spotifyVerification.ts (metadata fetching)
└── components/
    ├── Header.tsx
    ├── Toolbar.tsx ✅ (has Create Playlist button)
    ├── FilterBar.tsx
    ├── ChatGPTSongRow.tsx ⏳ (needs AddToPlaylistDropdown integration)
    ├── ImportChatGPTModal.tsx
    ├── CreatePlaylistModal.tsx ✅
    ├── PlaylistsDrawer.tsx ✅ (needs wiring to Toolbar)
    ├── AddToPlaylistDropdown.tsx ✅ (needs wiring to SongRow)
    ├── PlaylistsView.tsx (optional, not used yet)
    └── FeedbackFAB.tsx
```

---

## Immediate Next Steps (Finish Chunk 3A)

**Chunk 3A - Drawer + Dropdown 🚧 (0%)**
- ⏳ PlaylistsDrawer component (right-side drawer)
  - Shows all playlists in cards
  - Delete button, sync status, Spotify links
  - Empty state + "Create Playlist" CTA
- ⏳ AddToPlaylistDropdown component
  - Shows all playlists with checkmarks
  - Toggle add/remove song
  - "Create New Playlist" option
- ⏳ Need to integrate into ChatGPTSongRow
- ⏳ Need to wire up Toolbar to open drawer

Other tasks that need to be done after PlaylistsDrawer Component and AddtoPlaylistDropdown

### 1. Update ChatGPTSongRow.tsx
**Goal**: Show AddToPlaylistDropdown when Keep is clicked

**Changes needed**:
```typescript
// Import
import { AddToPlaylistDropdown } from "./AddToPlaylistDropdown";
import { usePlaylistsState } from "../hooks/usePlaylistsState";

// In component:
const { playlists, addSongsToPlaylist, removeSongsFromPlaylist } = usePlaylistsState();
const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);

// Keep button onClick:
const handleKeep = () => {
  onFeedbackChange('keep');
  setShowPlaylistDropdown(true);  // Show dropdown
};

// After Keep button:
{feedback === 'keep' && showPlaylistDropdown && (
  <AddToPlaylistDropdown
    songId={song.id}
    playlists={playlists}
    onTogglePlaylist={(playlistId, add) => {
      if (add) {
        addSongsToPlaylist(playlistId, [song.id]);
      } else {
        removeSongsFromPlaylist(playlistId, [song.id]);
      }
    }}
    onCreateNewPlaylist={() => {
      // Open CreatePlaylistModal
    }}
  />
)}
```

### 2. Update Toolbar.tsx
**Goal**: Make playlist counter button open drawer

**Changes needed**:
```typescript
// Import
import { PlaylistsDrawer } from "./PlaylistsDrawer";

// Add state:
const [isPlaylistsDrawerOpen, setIsPlaylistsDrawerOpen] = useState(false);

// Playlist counter button:
{playlists.length > 0 && (
  <button
    onClick={() => setIsPlaylistsDrawerOpen(true)}  // Open drawer
    className="..."
  >
    📚 {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
  </button>
)}

// At end of return:
<PlaylistsDrawer
  open={isPlaylistsDrawerOpen}
  onOpenChange={setIsPlaylistsDrawerOpen}
  playlists={playlists}
  songs={songs}  // Pass from props
  onDeletePlaylist={deletePlaylist}
  onOpenCreatePlaylist={() => {
    setIsCreatePlaylistModalOpen(true);
    setIsPlaylistsDrawerOpen(false);
  }}
/>
```

### 3. Test Full Flow
- [ ] Click "Keep" on song → Dropdown appears
- [ ] Select playlist → Song added (check localStorage)
- [ ] Click playlist counter → Drawer opens
- [ ] View playlist card → Shows song count increased
- [ ] Click dropdown again → Checkmark on selected playlist
- [ ] Click again → Remove from playlist
- [ ] Delete playlist → Confirm song stays in library

---

## Next After Chunk 3A (Chunk 3B)

### Bulk Actions
- [ ] Selection checkboxes on left side of song rows
- [ ] Track selected songs in App.tsx state
- [ ] "Add X selected to playlist" button (only shows when 2+ selected)
- [ ] Bulk add functionality

### Delete Protection
- [ ] Update "Delete All" button with warning modal
- [ ] Clarify that songs stay in playlists
- [ ] Handle "missing songs" gracefully (show count in playlist cards)

---

## Common Issues & Solutions

**Modal/Drawer not opening?**
- Check Radix UI Dialog is installed: `npm install @radix-ui/react-dialog`
- Check z-index values (drawer should be 50, overlay 40)

**Dropdown not closing?**
- Check click outside listener is working
- Verify dropdownRef is on the right element

**Songs not adding to playlist?**
- Check usePlaylistsState hook is being called
- Verify addSongsToPlaylist is being called with correct params
- Check localStorage: `localStorage.getItem('fonea.playlists.v1')`

**Playlist counter not updating?**
- Check playlists state is being passed to Toolbar
- Verify auto-save is working (useEffect in usePlaylistsState)

---

## Testing Commands

```javascript
// In browser console:

// Check playlists
JSON.parse(localStorage.getItem('fonea.playlists.v1'))

// Check songs
JSON.parse(localStorage.getItem('fonea.songs.v1'))

// Clear playlists (careful!)
localStorage.removeItem('fonea.playlists.v1')

// Clear everything (very careful!)
localStorage.clear()
```

---

## Important Notes

- ⚠️ Songs in playlists stay even if deleted from library
- ⚠️ Playlists stored locally (clear cache = delete playlists)
- ✅ Already have Spotify OAuth working (PKCE flow)
- ✅ Service-agnostic (ready for YouTube Music, Apple Music)
- ✅ Multi-playlist support (one song → many playlists)
- 📋 Feedback export does NOT include playlist info

---

## Reference Documents

See repository for:
- `TASK_LIST_v7.md` - Full task breakdown with progress
- `CHUNK_1_SETUP.md` - Foundation setup
- `CHUNK_2_SETUP.md` - Creation UI setup
- `SESSION_SUMMARY.md` - Previous session work

---

**Please continue with Chunk 3A completion: Integrate PlaylistsDrawer and AddToPlaylistDropdown into the app.**

---

END OF SEED PROMPT - Paste everything above to continue! 🚀
