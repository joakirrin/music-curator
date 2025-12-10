# 📋 FONEA SOUND CURATOR — TASK LIST v11

**Last Updated:** November 25, 2025  
**Project Repository:** https://github.com/joakirrin/music-curator  
**Live App:** https://fonea-music-curator.vercel.app

---

## 🎯 PROJECT STATUS OVERVIEW

**Current Phase:** Sprint 1 - Quick Wins & ChatGPT Excellence  
**Overall Progress:** Phase 4.5 Complete, Moving to Sprint-Based Development  
**Next Milestone:** Complete ChatGPT Integration + Spotify Import/Export Loop

---

## ✅ COMPLETED FEATURES (Summary)

<details>
<summary>📦 Phases 1-4.5: Foundation Complete (Click to expand)</summary>

### Core Features ✅
- Song import from ChatGPT (JSON format)
- Manual song entry
- MusicBrainz verification
- Platform ID extraction (Spotify, Apple Music, etc.)
- Spotify OAuth 2.0 (PKCE) authentication
- Basic playlist export to Spotify
- Smart platform search fallback (3-tier strategy)
- Local playlist management
- Album art service (3-tier)
- Round-based organization
- Advanced filtering & search
- GDPR-compliant analytics (Microsoft Clarity)
- Cookie consent system
- Privacy policy modal
- **Song preview mini-player** ✅ (30-second previews)
- **Cookie consent banner** ✅
- **Playlist export branding** ✅

</details>

---

## 🚀 SPRINT 1: QUICK WINS & CHATGPT EXCELLENCE

**Timeline:** Week 1  
**Total Estimated Effort:** 12-16 hours  
**Goal:** Polish UI, complete ChatGPT integration, set foundation for imports

---

### 1.1: Branding Fixes ⚡ QUICK WIN

**Status:** ⏳ PENDING  
**Priority:** HIGHEST  
**Estimated Effort:** 2-3 hours

#### **Objective:**
Update all branding elements to use Fonea logo instead of emoji and fix URL redirects.

#### **Tasks:**

**1.1.1: Replace Music Emojis with Fonea Logo**
- [ ] Replace all 🎵 emojis throughout the app with Fonea logo
- [ ] Update favicon to Fonea logo
- [ ] Ensure logo displays correctly at different sizes
- [ ] Test logo visibility on light/dark backgrounds
- [ ] Update loading states with logo
- [ ] Replace emoji in page titles

**Files to Modify:**
```
src/components/
├── Toolbar.tsx                    # Header logo
├── ChatPanel.tsx                  # Chat header
├── PushPlaylistModal.tsx          # Export modal
├── ImportChatGPTModal.tsx         # Import modal
├── GuideDrawer.tsx               # Guide section
└── Footer.tsx                     # Footer branding

src/assets/
└── logo.svg (or logo.png)        # Add Fonea logo if missing

public/
└── favicon.ico                    # Update favicon
```

**1.1.2: Fix Branding URL**
- [ ] Update playlist description branding
- [ ] Change `curator.fonea.app` → `fonea-music-curator.vercel.app`
- [ ] Update all external links
- [ ] Test URL clickability in Spotify
- [ ] Verify URL works on mobile

**Files to Modify:**
```
src/utils/formatters.ts           # formatPlaylistDescription()
src/config/constants.ts           # APP_URL constant (if exists)
```

**Current Implementation:**
```typescript
// src/utils/formatters.ts
const branding = "Made with Fonea Sound Curator 🎵 • curator.fonea.app";
```

**Target Implementation:**
```typescript
// src/utils/formatters.ts
import FoneaLogo from '@/assets/logo.svg';

const branding = "Made with Fonea Sound Curator • fonea-music-curator.vercel.app";

// For logo in components:
<img src={FoneaLogo} alt="Fonea" className="h-6 w-6" />
```

#### **Acceptance Criteria:**
- [ ] Zero 🎵 emojis remain in production code
- [ ] Fonea logo appears consistently throughout app
- [ ] Logo is responsive (mobile/desktop)
- [ ] URL redirects to correct Vercel app
- [ ] Branding in exported playlists shows new URL
- [ ] Favicon updated

#### **Testing Checklist:**
- [ ] Visual regression test (before/after screenshots)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile (iOS/Android)
- [ ] Export test playlist and verify branding in Spotify
- [ ] Click URL in Spotify description → verify redirect

---

### 1.2: Song Preview in Playlist Details ⚡ QUICK WIN

**Status:** ⏳ PENDING  
**Priority:** HIGH  
**Estimated Effort:** 2-3 hours

#### **Objective:**
Enable song preview functionality in playlist details view (already works in main song list).

#### **Current State:**
- ✅ Preview player works in `ChatGPTSongRow.tsx`
- ✅ `useAudioPlayer` hook is global
- ✅ 30-second previews from Apple Music API
- ⏳ Playlist details view exists but lacks preview

#### **Implementation:**

**Files to Modify:**
```
src/components/
├── PlaylistDetails.tsx           # Add preview player to song rows
└── PlaylistSongRow.tsx           # Create if doesn't exist, or modify existing
```

**Implementation Steps:**

1. **Locate Playlist Details Component:**
   - Find where individual playlist songs are rendered
   - Check if it's similar structure to `ChatGPTSongRow`

2. **Add Preview Button:**
   ```typescript
   // In PlaylistSongRow.tsx (or equivalent)
   import { useAudioPlayer } from '@/hooks/useAudioPlayer';
   
   function PlaylistSongRow({ song }: { song: Song }) {
     const { isPlaying, currentSongId, play, pause } = useAudioPlayer();
     const isCurrentlyPlaying = isPlaying && currentSongId === song.id;
     
     const handlePlayPreview = () => {
       if (isCurrentlyPlaying) {
         pause();
       } else {
         play(song.id, song.previewUrl);
       }
     };
     
     return (
       <div className="song-row">
         {/* Existing song info */}
         
         {song.previewUrl && (
           <button 
             onClick={handlePlayPreview}
             className="preview-button"
             aria-label={isCurrentlyPlaying ? "Pause preview" : "Play preview"}
           >
             {isCurrentlyPlaying ? <PauseIcon /> : <PlayIcon />}
           </button>
         )}
       </div>
     );
   }
   ```

3. **Add Visual Feedback:**
   - Show play/pause icon
   - Highlight currently playing song
   - Show loading state while preview loads

4. **Mobile Optimization:**
   - Ensure touch targets are large enough (44x44px minimum)
   - Prevent accidental clicks

#### **Acceptance Criteria:**
- [ ] Preview button appears on each song in playlist details
- [ ] Only one preview plays at a time (global state)
- [ ] Clicking another song stops current preview
- [ ] Play/pause icon toggles correctly
- [ ] Works on mobile (touch-friendly)
- [ ] Graceful fallback if preview unavailable
- [ ] Loading state shows while fetching

#### **Testing Checklist:**
- [ ] Test with playlists of different sizes (5, 50, 100+ songs)
- [ ] Test on slow network (3G simulation)
- [ ] Test rapid clicking between songs
- [ ] Verify only one audio plays at a time
- [ ] Test on iOS Safari (audio playback restrictions)
- [ ] Test on Android Chrome

---

### 1.3: Keep Button UX Fix ⚡ QUICK WIN

**Status:** ⏳ PENDING  
**Priority:** HIGH  
**Estimated Effort:** 2-3 hours

#### **Objective:**
Remove the confusing modal when clicking "Keep" button. Instead, just mark song as "Keep" and allow adding to playlist later from the playlist drawer.

#### **Current Behavior (Problem):**
```
User clicks "Keep" 
  ↓
Modal appears: "Add to playlist?"
  ↓
User must decide immediately
  ↓
Confusing and interrupts flow
```

#### **Target Behavior (Solution):**
```
User clicks "Keep"
  ↓
Song marked as "Keep" (visual feedback)
  ↓
Continue curating other songs
  ↓
Later: Add kept songs to playlist from playlist drawer
```

#### **Implementation:**

**Phase 1: Remove Keep Modal (This Sprint)**

**Files to Modify:**
```
src/components/
├── ChatGPTSongRow.tsx            # Remove modal trigger
├── SongFeedbackButtons.tsx       # Simplify Keep button
└── (Remove or deprecate AddToPlaylistModal.tsx if exists)

src/hooks/
└── useSongs.ts (or App.tsx)      # Update handleKeep function
```

**Implementation:**

```typescript
// src/components/SongFeedbackButtons.tsx (or similar)

function handleKeepClick() {
  // OLD: setShowAddToPlaylistModal(true);
  
  // NEW: Just mark as keep
  onFeedback('keep');
  
  // Optional: Show toast
  toast.success('Song marked as Keep! Add to playlist later from the drawer.', {
    duration: 2000
  });
}
```

**Visual Feedback:**
- Green checkmark or highlight on kept songs
- Badge showing "Kept"
- Filter to show only kept songs

**Phase 2: Edit Playlists from Drawer (Next task - 1.4)**

#### **Acceptance Criteria:**
- [ ] Clicking "Keep" no longer opens modal
- [ ] Song marked as "Keep" with visual feedback
- [ ] Toast notification confirms action
- [ ] Kept songs visually distinct (color/badge)
- [ ] Filter to view only kept songs works
- [ ] No regression in other feedback buttons (Skip, Pending)

#### **Testing Checklist:**
- [ ] Test rapid Keep clicking (multiple songs)
- [ ] Test Keep → Skip → Keep (state changes)
- [ ] Verify visual feedback is clear
- [ ] Test on mobile (no modal interference)
- [ ] Test filter: show only Kept songs
- [ ] Verify localStorage persists Keep status

---

### 1.4: Edit Playlists from Playlist Drawer

**Status:** ⏳ PENDING  
**Priority:** HIGH (Required for Keep button fix workflow)  
**Estimated Effort:** 4-6 hours  
**Note:** This is part of Sprint 1 to complete the Keep button UX fix

#### **Objective:**
Allow users to add/remove songs from playlists directly in the playlist drawer, completing the "Keep → Add to Playlist Later" workflow.

#### **User Flow:**
```
User marks songs as "Keep" (from 1.3)
  ↓
Open Playlist Drawer
  ↓
Select existing playlist or create new
  ↓
View kept songs not yet in playlists
  ↓
Click "+ Add" next to kept songs
  ↓
Songs added to selected playlist
  ↓
Visual confirmation (toast + playlist count updates)
```

#### **Features Needed:**

**1.4.1: Add Songs to Playlist from Drawer**
- [ ] Show "Kept Songs" section in drawer
- [ ] Display songs marked as Keep but not in any playlist
- [ ] "+ Add to Playlist" button next to each song
- [ ] Dropdown or quick-select for target playlist
- [ ] Bulk selection (add multiple songs at once)

**1.4.2: Remove Songs from Playlist**
- [ ] "✕ Remove" button on songs in playlist view
- [ ] Confirmation for bulk removal
- [ ] Undo functionality (optional but nice)

**1.4.3: Edit Playlist Metadata**
- [ ] Inline edit for playlist name
- [ ] Inline edit for description
- [ ] Save button with confirmation

**1.4.4: Reorder Songs (Optional - can be Phase 2)**
- [ ] Drag & drop to reorder (if time permits)
- [ ] Move up/down buttons as alternative

#### **Implementation:**

**Files to Modify:**
```
src/components/
├── PlaylistDrawer.tsx            # Main drawer component
├── PlaylistSongList.tsx          # Song list in drawer
├── KeptSongsList.tsx             # NEW: Show kept songs not in playlists
└── AddToPlaylistButton.tsx       # NEW: Quick add button

src/hooks/
└── usePlaylists.ts               # Add addSongToPlaylist(), removeSongFromPlaylist()

src/types/
└── playlist.ts                   # Ensure Song[] is mutable
```

**Component Structure:**
```typescript
// src/components/PlaylistDrawer.tsx

function PlaylistDrawer() {
  return (
    <Drawer>
      {/* Existing playlist list */}
      <PlaylistList playlists={playlists} />
      
      {/* NEW: Kept songs not in playlists */}
      <KeptSongsList 
        songs={keptSongsNotInPlaylists}
        onAddToPlaylist={handleAddToPlaylist}
      />
      
      {/* Selected playlist details */}
      {selectedPlaylist && (
        <PlaylistDetails 
          playlist={selectedPlaylist}
          onRemoveSong={handleRemoveSong}
          onEditMetadata={handleEditMetadata}
        />
      )}
    </Drawer>
  );
}
```

**Logic for Kept Songs Not in Playlists:**
```typescript
// src/hooks/usePlaylists.ts (or App.tsx)

function getKeptSongsNotInPlaylists(songs: Song[], playlists: Playlist[]): Song[] {
  const songsInPlaylists = new Set(
    playlists.flatMap(p => p.songs.map(s => s.id))
  );
  
  return songs.filter(song => 
    song.feedback === 'keep' && 
    !songsInPlaylists.has(song.id)
  );
}
```

#### **Acceptance Criteria:**
- [ ] Drawer shows kept songs not yet in playlists
- [ ] User can add songs to existing playlists
- [ ] User can remove songs from playlists
- [ ] User can edit playlist name/description inline
- [ ] Changes persist to localStorage
- [ ] Visual feedback on all actions (toasts)
- [ ] Bulk operations work (select multiple, add all)
- [ ] Mobile-friendly UI

#### **Testing Checklist:**
- [ ] Add song to playlist → verify it appears
- [ ] Remove song from playlist → verify it's gone
- [ ] Edit playlist name → verify it saves
- [ ] Add same song to multiple playlists (should work)
- [ ] Remove song from one playlist (should stay in others)
- [ ] Test with empty playlists
- [ ] Test with 100+ song playlists (performance)
- [ ] Test on mobile (drawer UX)

---

### 1.5: ChatGPT Auto-Replacements (Semi-Transparent) 🤖

**Status:** ⏳ PENDING  
**Priority:** HIGHEST  
**Estimated Effort:** 4-6 hours

#### **Objective:**
Automatically request replacements for songs that fail verification, with minimal user friction.

#### **Current State:**
- ✅ Backend ready: `getReplacementsForInvalidSongs()` exists
- ✅ Utilities ready: `mapSongToReplacementItem()` exists
- ⏳ UI automation needed (currently requires manual copy/paste)

#### **Target UX (Semi-Transparent with Opt-In):**
```
Verification fails for 3 songs
  ↓
Toast notification appears:
"3 songs failed verification. [Get Replacements] [Dismiss]"
  ↓
User clicks "Get Replacements"
  ↓
ChatPanel opens automatically
  ↓
Shows: "Finding alternatives for 3 failed tracks..."
  ↓
GPT-5-mini responds with 3 alternatives
  ↓
Songs auto-import + verification
  ↓
Success: "Found 3 alternatives!" (with list)
```

#### **Implementation:**

**Files to Create:**
```
src/components/
└── ReplacementToast.tsx          # NEW: Custom toast for failed tracks

src/hooks/
└── useAutoReplacements.ts        # NEW: Handles auto-replacement flow

src/utils/
└── replacementGenerator.ts       # NEW: Generate replacement payloads
```

**Files to Modify:**
```
src/utils/
└── verificationOrchestrator.ts   # Add onFailure callback

src/components/
├── ChatPanel.tsx                 # Add handleReplacementRequest()
└── FailedTracksModal.tsx         # Add auto-replacement button

src/App.tsx                       # Connect verification → toast → chat
```

**1.5.1: Create Replacement Generator Utility**

```typescript
// src/utils/replacementGenerator.ts

import { Song, ReplacementPayload, ReplacementItem } from '@/types';
import { mapSongToReplacementItem } from './songMappers';

export function generateReplacementPayload(
  failedSongs: Song[]
): ReplacementPayload {
  return {
    round: failedSongs[0]?.round || 1,
    requestedCount: failedSongs.length,
    replacementItems: failedSongs.map(mapSongToReplacementItem),
    context: "User's songs failed verification"
  };
}

export function generateReplacementSummary(failedSongs: Song[]): string {
  if (failedSongs.length === 0) return '';
  
  const count = failedSongs.length;
  const songList = failedSongs
    .map(s => `• ${s.title} by ${s.artist}`)
    .join('\n');
  
  return `${count} song${count > 1 ? 's' : ''} couldn't be verified:\n\n${songList}\n\nFinding alternatives...`;
}
```

**1.5.2: Add Failure Callback to Verification**

```typescript
// src/utils/verificationOrchestrator.ts

export async function verifySongsInBatch(
  songs: Song[],
  onProgress?: (progress: VerificationProgress) => void,
  onFailure?: (failedSongs: Song[]) => void  // NEW PARAMETER
): Promise<{ verifiedSongs: Song[]; summary: VerificationSummary }> {
  // ... existing verification logic ...
  
  // At the end, trigger failure callback
  if (summary.failed > 0 && onFailure) {
    const failedSongObjects = verifiedSongs.filter(
      s => s.verificationStatus === 'failed'
    );
    onFailure(failedSongObjects);
  }
  
  return { verifiedSongs, summary };
}
```

**1.5.3: Create Auto-Replacement Hook**

```typescript
// src/hooks/useAutoReplacements.ts

import { useState } from 'react';
import { Song, ReplacementPayload } from '@/types';
import { generateReplacementPayload, generateReplacementSummary } from '@/utils/replacementGenerator';
import { toast } from 'sonner'; // or your toast library

export function useAutoReplacements(
  onOpenChat: () => void,
  onRequestReplacement: (payload: ReplacementPayload) => void
) {
  const [failedSongs, setFailedSongs] = useState<Song[]>([]);
  
  const handleVerificationFailure = (songs: Song[]) => {
    setFailedSongs(songs);
    
    // Show toast with action
    toast.error(`${songs.length} songs failed verification`, {
      description: 'Would you like to find alternatives?',
      action: {
        label: 'Get Replacements',
        onClick: () => handleGetReplacements(songs)
      },
      cancel: {
        label: 'Dismiss',
        onClick: () => setFailedSongs([])
      },
      duration: 10000 // 10 seconds
    });
  };
  
  const handleGetReplacements = async (songs: Song[]) => {
    const payload = generateReplacementPayload(songs);
    
    // Open chat panel
    onOpenChat();
    
    // Trigger replacement request
    onRequestReplacement(payload);
    
    // Clear failed songs
    setFailedSongs([]);
  };
  
  return {
    handleVerificationFailure
  };
}
```

**1.5.4: Update ChatPanel for Replacements**

```typescript
// src/components/ChatPanel.tsx

// Add new function
async function handleReplacementRequest(
  replacementPayload: ReplacementPayload,
  autoTrigger: boolean = true
) {
  try {
    setIsLoading(true);
    
    // Add system message
    const summary = generateReplacementSummary(
      replacementPayload.replacementItems.map(item => ({
        title: item.originalTitle,
        artist: item.originalArtist,
        // ... other Song fields
      } as Song))
    );
    
    addMessage({
      role: 'system',
      content: summary,
      timestamp: new Date().toISOString()
    });
    
    // Call OpenAI service
    const response = await getReplacementsForInvalidSongs(replacementPayload);
    
    // Add GPT response
    addMessage({
      role: 'assistant',
      content: response.explanation || 'Here are some alternatives:',
      timestamp: new Date().toISOString()
    });
    
    // Parse and import songs
    const parsedSongs = parseFlexibleJSON(response.songs);
    const mappedSongs = parsedSongs.map(mapChatGPTSongToSong);
    
    // Trigger import + verification
    onImportSongs(mappedSongs);
    
  } catch (error) {
    console.error('Auto-replacement failed:', error);
    addMessage({
      role: 'assistant',
      content: 'Sorry, I had trouble finding alternatives. Please try again.',
      timestamp: new Date().toISOString()
    });
  } finally {
    setIsLoading(false);
  }
}

// Expose via ref or prop
React.useImperativeHandle(ref, () => ({
  handleReplacementRequest
}));
```

**1.5.5: Connect Everything in App.tsx**

```typescript
// src/App.tsx

function App() {
  const chatPanelRef = useRef<ChatPanelHandle>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Use the auto-replacement hook
  const { handleVerificationFailure } = useAutoReplacements(
    () => setIsChatOpen(true),
    (payload) => chatPanelRef.current?.handleReplacementRequest(payload)
  );
  
  // When importing songs...
  const handleImportSongs = async (songs: Song[]) => {
    // ... add songs to state ...
    
    // Run verification with failure callback
    const { verifiedSongs } = await verifySongsInBatch(
      songs,
      setVerificationProgress,
      handleVerificationFailure  // NEW: Pass failure handler
    );
    
    // ... update state with verified songs ...
  };
  
  return (
    <>
      {/* ... other components ... */}
      
      <ChatPanel 
        ref={chatPanelRef}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onImportSongs={handleImportSongs}
      />
    </>
  );
}
```

**1.5.6: Update FailedTracksModal (Optional Enhancement)**

```typescript
// src/components/FailedTracksModal.tsx

// Add auto-replacement button as alternative to manual copy
<Button onClick={handleAutoReplacement}>
  🤖 Get Replacements Automatically
</Button>

function handleAutoReplacement() {
  onClose(); // Close modal
  onAutoReplacement?.(failedSongs); // Trigger auto-replacement
}
```

#### **Acceptance Criteria:**
- [ ] Toast appears when verification fails
- [ ] Toast shows correct count of failed songs
- [ ] "Get Replacements" button works
- [ ] "Dismiss" button hides toast
- [ ] ChatPanel opens automatically when user clicks "Get Replacements"
- [ ] System message shows which songs failed
- [ ] GPT responds with alternatives
- [ ] Alternatives auto-import and verify
- [ ] Success message shows results
- [ ] Works with 1 failed song
- [ ] Works with multiple failed songs (3+)
- [ ] User can dismiss and retry later via FailedTracksModal
- [ ] No infinite loops (max 2 replacement attempts)

#### **Testing Checklist:**
- [ ] Force verification failure (invalid song data)
- [ ] Test toast appears immediately after failure
- [ ] Test "Get Replacements" button
- [ ] Test "Dismiss" button
- [ ] Test ChatPanel opens with correct context
- [ ] Test GPT returns valid alternatives
- [ ] Test alternatives verify successfully
- [ ] Test rapid repeated failures (edge case)
- [ ] Test offline scenario (graceful error)
- [ ] Test API rate limit scenario

#### **Edge Cases to Handle:**
- [ ] All alternatives also fail verification (show manual fallback)
- [ ] GPT returns no alternatives (error message)
- [ ] User closes chat mid-replacement (state cleanup)
- [ ] Network error during replacement (retry button)

---

### 1.6: ChatGPT Feedback Loop Automation UI 🤖

**Status:** ⏳ PENDING  
**Priority:** HIGH  
**Estimated Effort:** 1-2 hours (Backend already complete)

#### **Objective:**
Enable users to get refined recommendations based on Keep/Skip decisions without manual prompt generation.

#### **Current State:**
- ✅ Backend ready: `getRecommendationsFromFeedback()` function exists
- ✅ Utilities ready: `mapSongToFeedbackItem()` in songMappers.ts
- ⏳ UI integration needed

#### **Target UX:**
```
User marks songs:
- 3 Keep (with optional comments)
- 2 Skip
  ↓
Badge appears: "📊 Give me more (5)"
  ↓
User clicks button
  ↓
ChatPanel opens automatically
  ↓
Auto-generated message:
"Based on your feedback (3 kept, 2 skipped):
 - You preferred upbeat indie rock
 - You skipped slower tracks
 Getting 5 new recommendations..."
  ↓
GPT receives feedback payload
  ↓
GPT responds with refined recommendations
  ↓
Songs auto-import + verification
```

#### **Implementation:**

**Files to Create:**
```
src/components/
└── FeedbackButton.tsx            # NEW: Floating action button

src/utils/
└── feedbackGenerator.ts          # NEW: Generate feedback payloads
```

**Files to Modify:**
```
src/components/
├── Toolbar.tsx                   # Add FeedbackButton
└── ChatPanel.tsx                 # Add handleFeedbackRequest()

src/App.tsx                       # Connect feedback flow
```

**1.6.1: Create Feedback Generator Utility**

```typescript
// src/utils/feedbackGenerator.ts

import { Song, FeedbackPayload, FeedbackItem } from '@/types';
import { mapSongToFeedbackItem } from './songMappers';

export function generateFeedbackPayload(
  songs: Song[], 
  currentRound: number
): FeedbackPayload {
  const songsWithFeedback = songs.filter(
    s => s.feedback === 'keep' || s.feedback === 'skip'
  );
  
  return {
    round: currentRound,
    requestedCount: 5, // Default, can be customized
    feedbackItems: songsWithFeedback.map(mapSongToFeedbackItem)
  };
}

export function generateFeedbackSummary(songs: Song[]): string {
  const kept = songs.filter(s => s.feedback === 'keep');
  const skipped = songs.filter(s => s.feedback === 'skip');
  
  const patterns = analyzeFeedbackPatterns(kept, skipped);
  
  return `Based on your feedback (${kept.length} kept, ${skipped.length} skipped):
${patterns.preferences.map(p => `- ${p}`).join('\n')}

Getting 5 new recommendations...`;
}

function analyzeFeedbackPatterns(kept: Song[], skipped: Song[]): {
  preferences: string[];
} {
  // Simple pattern analysis
  const preferences: string[] = [];
  
  // Genre analysis
  const keptGenres = new Set(kept.map(s => s.genre).filter(Boolean));
  if (keptGenres.size > 0) {
    preferences.push(`You prefer ${Array.from(keptGenres).join(', ')}`);
  }
  
  // Era analysis
  const keptYears = kept.map(s => s.year).filter(Boolean);
  if (keptYears.length > 0) {
    const avgYear = Math.round(keptYears.reduce((a, b) => a + b, 0) / keptYears.length);
    const decade = Math.floor(avgYear / 10) * 10;
    preferences.push(`You like music from the ${decade}s era`);
  }
  
  // Tempo analysis (if available)
  // Artist analysis (if patterns emerge)
  
  return { preferences };
}
```

**1.6.2: Create Feedback Button Component**

```typescript
// src/components/FeedbackButton.tsx

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FeedbackButtonProps {
  songsWithFeedback: number;
  onClick: () => void;
  disabled?: boolean;
}

export function FeedbackButton({ 
  songsWithFeedback, 
  onClick, 
  disabled = false 
}: FeedbackButtonProps) {
  if (songsWithFeedback === 0) return null;
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="secondary"
      className="relative"
    >
      📊 Give me more
      <Badge 
        variant="secondary" 
        className="ml-2"
      >
        {songsWithFeedback}
      </Badge>
    </Button>
  );
}
```

**1.6.3: Add to Toolbar**

```typescript
// src/components/Toolbar.tsx

import { FeedbackButton } from './FeedbackButton';

function Toolbar({ 
  songs,
  onFeedbackClick,
  // ... other props
}: ToolbarProps) {
  const songsWithFeedback = songs.filter(
    s => s.feedback === 'keep' || s.feedback === 'skip'
  ).length;
  
  return (
    <div className="toolbar">
      {/* ... existing buttons ... */}
      
      <FeedbackButton
        songsWithFeedback={songsWithFeedback}
        onClick={onFeedbackClick}
      />
      
      <Button onClick={onOpenChat}>
        Open Chat
      </Button>
    </div>
  );
}
```

**1.6.4: Update ChatPanel**

```typescript
// src/components/ChatPanel.tsx

// Add new function
async function handleFeedbackRequest(feedbackPayload: FeedbackPayload) {
  try {
    setIsLoading(true);
    
    // Add user message with feedback summary
    const summary = generateFeedbackSummary(
      feedbackPayload.feedbackItems.map(item => ({
        title: item.title,
        artist: item.artist,
        feedback: item.userAction,
        // ... other Song fields
      } as Song))
    );
    
    addMessage({
      role: 'user',
      content: summary,
      timestamp: new Date().toISOString()
    });
    
    // Call OpenAI service
    const response = await getRecommendationsFromFeedback(feedbackPayload);
    
    // Add GPT response
    addMessage({
      role: 'assistant',
      content: response.explanation || 'Here are your refined recommendations:',
      timestamp: new Date().toISOString()
    });
    
    // Parse and import songs
    const parsedSongs = parseFlexibleJSON(response.songs);
    const mappedSongs = parsedSongs.map(mapChatGPTSongToSong);
    
    // Trigger import + verification
    onImportSongs(mappedSongs);
    
  } catch (error) {
    console.error('Feedback request failed:', error);
    addMessage({
      role: 'assistant',
      content: 'Sorry, I had trouble generating recommendations. Please try again.',
      timestamp: new Date().toISOString()
    });
  } finally {
    setIsLoading(false);
  }
}

// Expose via ref or prop
React.useImperativeHandle(ref, () => ({
  handleFeedbackRequest,
  handleReplacementRequest
}));
```

**1.6.5: Connect in App.tsx**

```typescript
// src/App.tsx

function App() {
  const chatPanelRef = useRef<ChatPanelHandle>(null);
  
  const handleFeedbackClick = () => {
    const feedbackPayload = generateFeedbackPayload(songs, currentRound);
    setIsChatOpen(true); // Auto-open chat
    chatPanelRef.current?.handleFeedbackRequest(feedbackPayload);
  };
  
  return (
    <>
      <Toolbar 
        songs={songs}
        onFeedbackClick={handleFeedbackClick}
        // ... other props
      />
      
      <ChatPanel 
        ref={chatPanelRef}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onImportSongs={handleImportSongs}
      />
    </>
  );
}
```

#### **Acceptance Criteria:**
- [ ] Button appears when feedback exists (Keep or Skip)
- [ ] Badge shows correct count
- [ ] Button disabled when no feedback
- [ ] Clicking button opens ChatPanel automatically
- [ ] Auto-generated message shows feedback summary
- [ ] Pattern analysis works (genres, eras, etc.)
- [ ] GPT receives and processes feedback correctly
- [ ] New recommendations reflect learning
- [ ] No duplicate songs from previous rounds
- [ ] Round number increments properly
- [ ] Works with partial feedback (only Keep, no Skip)

#### **Testing Checklist:**
- [ ] Test with 0 feedback (button hidden)
- [ ] Test with only Keep feedback
- [ ] Test with only Skip feedback
- [ ] Test with mixed feedback (Keep + Skip)
- [ ] Test with 1 song feedback
- [ ] Test with 20+ song feedback
- [ ] Verify pattern analysis accuracy
- [ ] Test GPT response quality
- [ ] Verify no duplicates in new recommendations
- [ ] Test on mobile (button placement)

---

## 🎯 SPRINT 1 SUCCESS METRICS

**Completion Criteria:**
- [ ] All 5 tasks complete (1.1 - 1.6)
- [ ] Zero regressions in existing features
- [ ] Manual testing on desktop (Chrome, Firefox, Safari)
- [ ] Manual testing on mobile (iOS Safari, Android Chrome)

**User Experience Goals:**
- ChatGPT integration feels seamless (no manual copy/paste)
- Branding is consistent (logo everywhere)
- Keep button workflow is intuitive
- Song previews work everywhere

**Quality Metrics:**
- Auto-replacement success rate: >80%
- Feedback loop generates relevant recommendations: >85%
- Zero console errors
- Performance: <2s for all interactions

---

## 🚀 SPRINT 2: CORE PLATFORM VALUE - SPOTIFY FIRST

**Timeline:** Week 2  
**Total Estimated Effort:** 20-26 hours  
**Goal:** Complete Spotify import/export loop, enable playlist editing

---

### 2.1: Playlist Import from Spotify 🚀

**Status:** ⏳ PENDING  
**Priority:** CRITICAL  
**Estimated Effort:** 8-10 hours

#### **Objective:**
Import user's Spotify playlists into Fonea for curation and management. Framework must be streaming-agnostic to support other platforms later.

#### **Strategic Decision:**
- **Import Feature:** FREE (to drive user acquisition)
- **Rate Limit:** 5 playlists per week for free users
- **Premium:** Unlimited imports (future)

#### **User Flow:**
```
User clicks "Import Playlist" button
  ↓
Select platform: [Spotify] [Apple Music] [YouTube Music] ...
  ↓
Authenticate with Spotify (if not already logged in)
  ↓
Browse user's playlists (with search/filter)
  ↓
Select playlist to import
  ↓
Progress modal: "Importing 50 songs... (10/50)"
  ↓
Auto-verify with MusicBrainz (background)
  ↓
Success: "Playlist 'Summer Vibes' imported with 48/50 songs verified"
  ↓
Playlist appears in Fonea, fully editable
```

#### **Technical Architecture (Streaming-Agnostic):**

**Files to Create:**
```
src/services/import/
├── types.ts                      # NEW: Platform-agnostic types
├── importService.ts              # NEW: Import orchestrator
├── platformRegistry.ts           # NEW: Register import services
└── spotify/
    └── spotifyImportService.ts   # NEW: Spotify implementation

src/components/
├── ImportPlaylistModal.tsx       # NEW: Main import UI
├── PlaylistBrowser.tsx           # NEW: Browse user playlists
└── ImportProgress.tsx            # NEW: Import progress indicator
```

**2.1.1: Define Platform-Agnostic Types**

```typescript
// src/services/import/types.ts

export interface PlatformPlaylistSummary {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  url: string;
  imageUrl?: string;
  isPublic: boolean;
  owner?: string;
  platform: 'spotify' | 'apple-music' | 'youtube-music' | 'tidal' | 'qobuz';
}

export interface ImportProgress {
  stage: 'fetching' | 'parsing' | 'verifying' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}

export interface ImportResult {
  playlist: Playlist;
  successCount: number;
  failedCount: number;
  failedSongs: Song[];
}

export interface PlatformImportService {
  // Get user's playlists
  getUserPlaylists(): Promise<PlatformPlaylistSummary[]>;
  
  // Get tracks from a specific playlist
  getPlaylistTracks(playlistId: string): Promise<Song[]>;
  
  // Optional: Get playlist metadata
  getPlaylistMetadata?(playlistId: string): Promise<PlatformPlaylistSummary>;
}
```

**2.1.2: Create Import Orchestrator**

```typescript
// src/services/import/importService.ts

import { PlatformImportService, ImportProgress, ImportResult } from './types';
import { platformRegistry } from './platformRegistry';
import { verifySongsInBatch } from '@/utils/verificationOrchestrator';
import { generatePlaylistId } from '@/utils/idGenerator';

export async function importPlaylistFromPlatform(
  platform: 'spotify' | 'apple-music' | 'youtube-music',
  playlistId: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  try {
    // Get platform service
    const service = platformRegistry.get(platform);
    if (!service) {
      throw new Error(`Platform ${platform} not registered`);
    }
    
    // Stage 1: Fetch playlist metadata
    onProgress?.({
      stage: 'fetching',
      current: 0,
      total: 100,
      message: 'Fetching playlist...'
    });
    
    const metadata = await service.getPlaylistMetadata?.(playlistId) || {
      id: playlistId,
      name: 'Imported Playlist',
      description: '',
      trackCount: 0,
      url: '',
      isPublic: true,
      platform
    };
    
    // Stage 2: Fetch tracks
    onProgress?.({
      stage: 'fetching',
      current: 30,
      total: 100,
      message: `Fetching ${metadata.trackCount} songs...`
    });
    
    const songs = await service.getPlaylistTracks(playlistId);
    
    // Stage 3: Verify songs with MusicBrainz
    onProgress?.({
      stage: 'verifying',
      current: 0,
      total: songs.length,
      message: 'Verifying songs...'
    });
    
    const { verifiedSongs, summary } = await verifySongsInBatch(
      songs,
      (verifyProgress) => {
        onProgress?.({
          stage: 'verifying',
          current: verifyProgress.current,
          total: verifyProgress.total,
          message: `Verifying ${verifyProgress.songTitle}...`
        });
      }
    );
    
    // Stage 4: Create local playlist
    const playlist: Playlist = {
      id: generatePlaylistId(),
      name: metadata.name,
      description: metadata.description || `Imported from ${platform}`,
      songs: verifiedSongs,
      synced: false,
      sourcePlatform: platform,
      sourcePlatformPlaylistId: playlistId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: metadata.isPublic,
      imageUrl: metadata.imageUrl
    };
    
    // Stage 5: Complete
    onProgress?.({
      stage: 'complete',
      current: songs.length,
      total: songs.length,
      message: 'Import complete!'
    });
    
    return {
      playlist,
      successCount: summary.verified,
      failedCount: summary.failed,
      failedSongs: verifiedSongs.filter(s => s.verificationStatus === 'failed')
    };
    
  } catch (error) {
    onProgress?.({
      stage: 'error',
      current: 0,
      total: 100,
      message: error instanceof Error ? error.message : 'Import failed'
    });
    throw error;
  }
}
```

**2.1.3: Create Platform Registry**

```typescript
// src/services/import/platformRegistry.ts

import { PlatformImportService } from './types';

class PlatformRegistry {
  private services = new Map<string, PlatformImportService>();
  
  register(platform: string, service: PlatformImportService) {
    this.services.set(platform, service);
  }
  
  get(platform: string): PlatformImportService | undefined {
    return this.services.get(platform);
  }
  
  getAll(): string[] {
    return Array.from(this.services.keys());
  }
}

export const platformRegistry = new PlatformRegistry();
```

**2.1.4: Implement Spotify Import Service**

```typescript
// src/services/import/spotify/spotifyImportService.ts

import { PlatformImportService, PlatformPlaylistSummary } from '../types';
import { spotifyAuth } from '@/services/spotifyAuth';
import { Song } from '@/types';
import { generateId } from '@/utils/idGenerator';

export class SpotifyImportService implements PlatformImportService {
  async getUserPlaylists(): Promise<PlatformPlaylistSummary[]> {
    const token = await spotifyAuth.getAccessToken();
    if (!token) throw new Error('Not authenticated with Spotify');
    
    const response = await fetch(
      'https://api.spotify.com/v1/me/playlists?limit=50',
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Spotify playlists');
    }
    
    const data = await response.json();
    
    return data.items.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || '',
      trackCount: playlist.tracks.total,
      url: playlist.external_urls.spotify,
      imageUrl: playlist.images?.[0]?.url,
      isPublic: playlist.public,
      owner: playlist.owner.display_name,
      platform: 'spotify' as const
    }));
  }
  
  async getPlaylistMetadata(playlistId: string): Promise<PlatformPlaylistSummary> {
    const token = await spotifyAuth.getAccessToken();
    if (!token) throw new Error('Not authenticated with Spotify');
    
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch playlist metadata');
    }
    
    const playlist = await response.json();
    
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || '',
      trackCount: playlist.tracks.total,
      url: playlist.external_urls.spotify,
      imageUrl: playlist.images?.[0]?.url,
      isPublic: playlist.public,
      owner: playlist.owner.display_name,
      platform: 'spotify'
    };
  }
  
  async getPlaylistTracks(playlistId: string): Promise<Song[]> {
    const token = await spotifyAuth.getAccessToken();
    if (!token) throw new Error('Not authenticated with Spotify');
    
    const tracks: Song[] = [];
    let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    
    // Handle pagination
    while (url) {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlist tracks');
      }
      
      const data = await response.json();
      
      // Map Spotify tracks to Song objects
      tracks.push(...data.items.map((item: any) => {
        const track = item.track;
        
        return {
          id: generateId(),
          title: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          year: track.album.release_date?.substring(0, 4),
          duration: Math.floor(track.duration_ms / 1000),
          durationMs: track.duration_ms,
          source: 'imported' as const,
          feedback: 'pending' as const,
          platforms: ['Spotify'],
          liked: false,
          toAdd: false,
          addedAt: new Date().toISOString(),
          
          // Spotify-specific data (already verified from Spotify)
          spotifyUri: track.uri,
          spotifyId: track.id,
          previewUrl: track.preview_url,
          albumArtUrl: track.album.images[0]?.url,
          popularity: track.popularity,
          isPlayable: track.is_playable,
          explicit: track.explicit,
          isrc: track.external_ids?.isrc,
          
          // Mark as verified (already from Spotify)
          verificationStatus: 'verified' as const,
          verificationSource: 'spotify' as const,
          verifiedAt: new Date().toISOString(),
          
          platformIds: {
            spotify: {
              id: track.id,
              url: track.external_urls.spotify
            }
          }
        } as Song;
      }));
      
      // Handle pagination
      url = data.next;
    }
    
    return tracks;
  }
}

// Register the service
import { platformRegistry } from '../platformRegistry';
platformRegistry.register('spotify', new SpotifyImportService());
```

**2.1.5: Create Import UI Components**

```typescript
// src/components/ImportPlaylistModal.tsx

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlaylistBrowser } from './PlaylistBrowser';
import { ImportProgress } from './ImportProgress';
import { importPlaylistFromPlatform } from '@/services/import/importService';
import { PlatformPlaylistSummary, ImportProgress as ImportProgressType } from '@/services/import/types';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (playlist: Playlist) => void;
}

export function ImportPlaylistModal({ 
  isOpen, 
  onClose, 
  onImportComplete 
}: ImportPlaylistModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'spotify' | null>(null);
  const [playlists, setPlaylists] = useState<PlatformPlaylistSummary[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlatformPlaylistSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressType | null>(null);
  
  // Fetch user's playlists when platform selected
  useEffect(() => {
    if (selectedPlatform) {
      fetchPlaylists();
    }
  }, [selectedPlatform]);
  
  const fetchPlaylists = async () => {
    try {
      const service = platformRegistry.get(selectedPlatform!);
      const userPlaylists = await service?.getUserPlaylists();
      setPlaylists(userPlaylists || []);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      toast.error('Failed to load playlists');
    }
  };
  
  const handleImport = async (playlist: PlatformPlaylistSummary) => {
    setSelectedPlaylist(playlist);
    setIsImporting(true);
    
    try {
      const result = await importPlaylistFromPlatform(
        playlist.platform,
        playlist.id,
        setImportProgress
      );
      
      toast.success(`Imported ${result.successCount} songs!`);
      if (result.failedCount > 0) {
        toast.warning(`${result.failedCount} songs failed verification`);
      }
      
      onImportComplete(result.playlist);
      onClose();
      
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import playlist');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Import Playlist</DialogTitle>
        </DialogHeader>
        
        {!selectedPlatform && (
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setSelectedPlatform('spotify')}>
              Import from Spotify
            </Button>
            <Button disabled>
              Import from Apple Music (Coming Soon)
            </Button>
            <Button disabled>
              Import from YouTube Music (Coming Soon)
            </Button>
          </div>
        )}
        
        {selectedPlatform && !isImporting && (
          <PlaylistBrowser
            playlists={playlists}
            onSelect={handleImport}
            onBack={() => setSelectedPlatform(null)}
          />
        )}
        
        {isImporting && importProgress && (
          <ImportProgress progress={importProgress} />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

```typescript
// src/components/PlaylistBrowser.tsx

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlatformPlaylistSummary } from '@/services/import/types';

interface PlaylistBrowserProps {
  playlists: PlatformPlaylistSummary[];
  onSelect: (playlist: PlatformPlaylistSummary) => void;
  onBack: () => void;
}

export function PlaylistBrowser({ playlists, onSelect, onBack }: PlaylistBrowserProps) {
  const [search, setSearch] = useState('');
  
  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Input
          placeholder="Search playlists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredPlaylists.map(playlist => (
          <div
            key={playlist.id}
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelect(playlist)}
          >
            {playlist.imageUrl && (
              <img
                src={playlist.imageUrl}
                alt={playlist.name}
                className="w-16 h-16 rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{playlist.name}</h3>
              <p className="text-sm text-gray-500">
                {playlist.trackCount} songs • {playlist.owner}
              </p>
            </div>
            <Button>Import</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```typescript
// src/components/ImportProgress.tsx

import { Progress } from '@/components/ui/progress';
import { ImportProgress as ImportProgressType } from '@/services/import/types';

interface ImportProgressProps {
  progress: ImportProgressType;
}

export function ImportProgress({ progress }: ImportProgressProps) {
  const percentage = (progress.current / progress.total) * 100;
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{progress.message}</h3>
        <p className="text-sm text-gray-500">
          {progress.current} / {progress.total}
        </p>
      </div>
      
      <Progress value={percentage} />
      
      {progress.stage === 'error' && (
        <p className="text-red-500 text-sm text-center">
          {progress.message}
        </p>
      )}
    </div>
  );
}
```

#### **Acceptance Criteria:**
- [ ] User can authenticate with Spotify
- [ ] User can browse their Spotify playlists
- [ ] Search/filter works for playlist browsing
- [ ] User can select a playlist to import
- [ ] Progress modal shows real-time status
- [ ] All songs imported with metadata
- [ ] Songs auto-verify with MusicBrainz
- [ ] Playlist appears in Fonea
- [ ] Imported playlist is editable
- [ ] Pagination handled (100+ track playlists)
- [ ] Framework is streaming-agnostic (ready for other platforms)

#### **Testing Checklist:**
- [ ] Test with small playlist (5 songs)
- [ ] Test with medium playlist (50 songs)
- [ ] Test with large playlist (500+ songs)
- [ ] Test with collaborative playlists
- [ ] Test with followed playlists (not owned)
- [ ] Test with empty playlist
- [ ] Test authentication flow
- [ ] Test network error handling
- [ ] Test cancellation mid-import
- [ ] Test on mobile

---

### 2.2: Edit Playlists from Playlist Drawer

**Status:** ⏳ PENDING (Moved from Sprint 1 for grouping)  
**Priority:** CRITICAL  
**Estimated Effort:** 6-8 hours

*See Sprint 1, Task 1.4 for full specifications*

---

### 2.3: Modify Imported Playlists & Sync to Spotify

**Status:** ⏳ PENDING  
**Priority:** HIGH  
**Estimated Effort:** 6-8 hours

#### **Objective:**
Allow users to edit imported playlists in Fonea and sync changes back to Spotify.

#### **User Flow:**
```
User imports playlist from Spotify
  ↓
Makes changes in Fonea:
- Adds new songs
- Removes songs
- Reorders tracks
- Edits name/description
  ↓
Clicks "Sync to Spotify" button
  ↓
Progress modal: "Syncing changes..."
  ↓
Success: "Playlist updated on Spotify!"
```

#### **Implementation:**

**Files to Create:**
```
src/services/import/spotify/
└── spotifySyncService.ts         # NEW: Sync logic

src/components/
└── SyncPlaylistButton.tsx        # NEW: Sync button with status
```

**Files to Modify:**
```
src/types/
└── playlist.ts                   # Add sync-related fields

src/components/
└── PlaylistDrawer.tsx            # Add sync button
```

**2.3.1: Add Sync Fields to Playlist Type**

```typescript
// src/types/playlist.ts

export interface Playlist {
  // ... existing fields ...
  
  // Sync-related fields
  synced: boolean;                      // Is playlist in sync with platform?
  sourcePlatform?: 'spotify' | 'apple-music' | 'youtube-music';
  sourcePlatformPlaylistId?: string;    // Original playlist ID on platform
  lastSyncedAt?: string;                // ISO timestamp
  localChanges?: {
    added: string[];                    // Song IDs added locally
    removed: string[];                  // Song IDs removed locally
    reordered: boolean;                 // Track order changed
    metadataChanged: boolean;           // Name/description changed
  };
}
```

**2.3.2: Create Spotify Sync Service**

```typescript
// src/services/import/spotify/spotifySyncService.ts

import { Playlist, Song } from '@/types';
import { spotifyAuth } from '@/services/spotifyAuth';

export async function syncPlaylistToSpotify(
  playlist: Playlist,
  onProgress?: (message: string) => void
): Promise<void> {
  const token = await spotifyAuth.getAccessToken();
  if (!token) throw new Error('Not authenticated with Spotify');
  
  if (!playlist.sourcePlatformPlaylistId) {
    throw new Error('Playlist not linked to Spotify');
  }
  
  const playlistId = playlist.sourcePlatformPlaylistId;
  
  try {
    // Step 1: Update playlist metadata (if changed)
    if (playlist.localChanges?.metadataChanged) {
      onProgress?.('Updating playlist metadata...');
      await updatePlaylistMetadata(token, playlistId, {
        name: playlist.name,
        description: playlist.description,
        public: playlist.isPublic
      });
    }
    
    // Step 2: Get current tracks on Spotify
    onProgress?.('Fetching current playlist state...');
    const currentSpotifyTracks = await getCurrentPlaylistTracks(token, playlistId);
    
    // Step 3: Calculate diff
    const desiredTracks = playlist.songs.map(s => s.spotifyUri).filter(Boolean);
    const toRemove = currentSpotifyTracks.filter(uri => !desiredTracks.includes(uri));
    const toAdd = desiredTracks.filter(uri => !currentSpotifyTracks.includes(uri));
    
    // Step 4: Remove tracks (if any)
    if (toRemove.length > 0) {
      onProgress?.(`Removing ${toRemove.length} tracks...`);
      await removeTracksFromPlaylist(token, playlistId, toRemove);
    }
    
    // Step 5: Add tracks (if any)
    if (toAdd.length > 0) {
      onProgress?.(`Adding ${toAdd.length} tracks...`);
      await addTracksToPlaylist(token, playlistId, toAdd);
    }
    
    // Step 6: Reorder tracks (if needed)
    if (playlist.localChanges?.reordered) {
      onProgress?.('Reordering tracks...');
      await reorderPlaylistTracks(token, playlistId, desiredTracks);
    }
    
    onProgress?.('Sync complete!');
    
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

async function updatePlaylistMetadata(
  token: string,
  playlistId: string,
  metadata: { name: string; description?: string; public?: boolean }
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to update playlist metadata');
  }
}

async function getCurrentPlaylistTracks(
  token: string,
  playlistId: string
): Promise<string[]> {
  const tracks: string[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  
  while (url) {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch current playlist tracks');
    }
    
    const data = await response.json();
    tracks.push(...data.items.map((item: any) => item.track.uri));
    url = data.next;
  }
  
  return tracks;
}

async function removeTracksFromPlaylist(
  token: string,
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  // Spotify API allows removing 100 tracks per request
  const batches = chunkArray(trackUris, 100);
  
  for (const batch of batches) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tracks: batch.map(uri => ({ uri }))
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to remove tracks');
    }
  }
}

async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  // Spotify API allows adding 100 tracks per request
  const batches = chunkArray(trackUris, 100);
  
  for (const batch of batches) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: batch
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to add tracks');
    }
  }
}

async function reorderPlaylistTracks(
  token: string,
  playlistId: string,
  desiredOrder: string[]
): Promise<void> {
  // This requires complex logic - may need to:
  // 1. Clear playlist
  // 2. Add tracks in desired order
  
  // For MVP, skip reordering (too complex)
  // Or implement simple swap-based approach
  console.warn('Track reordering not yet implemented');
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

**2.3.3: Create Sync Button Component**

```typescript
// src/components/SyncPlaylistButton.tsx

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { syncPlaylistToSpotify } from '@/services/import/spotify/spotifySyncService';
import { Playlist } from '@/types';
import { toast } from 'sonner';

interface SyncPlaylistButtonProps {
  playlist: Playlist;
  onSyncComplete: () => void;
}

export function SyncPlaylistButton({ 
  playlist, 
  onSyncComplete 
}: SyncPlaylistButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState('');
  
  if (!playlist.sourcePlatform || !playlist.sourcePlatformPlaylistId) {
    return null; // Only show for imported playlists
  }
  
  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      await syncPlaylistToSpotify(playlist, setProgress);
      toast.success('Playlist synced to Spotify!');
      onSyncComplete();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync playlist');
    } finally {
      setIsSyncing(false);
      setProgress('');
    }
  };
  
  return (
    <div className="space-y-2">
      <Button
        onClick={handleSync}
        disabled={isSyncing || playlist.synced}
        variant={playlist.synced ? 'ghost' : 'default'}
      >
        {isSyncing ? 'Syncing...' : playlist.synced ? '✓ Synced' : 'Sync to Spotify'}
      </Button>
      
      {isSyncing && progress && (
        <p className="text-sm text-gray-500">{progress}</p>
      )}
      
      {!playlist.synced && !isSyncing && (
        <p className="text-xs text-orange-500">
          Unsaved changes - click to sync
        </p>
      )}
    </div>
  );
}
```

**2.3.4: Integrate into Playlist Drawer**

```typescript
// src/components/PlaylistDrawer.tsx

import { SyncPlaylistButton } from './SyncPlaylistButton';

function PlaylistDrawer() {
  return (
    <Drawer>
      {selectedPlaylist && (
        <div>
          <h2>{selectedPlaylist.name}</h2>
          
          {/* Sync button for imported playlists */}
          <SyncPlaylistButton
            playlist={selectedPlaylist}
            onSyncComplete={() => {
              // Update playlist state
              updatePlaylistSyncStatus(selectedPlaylist.id, true);
            }}
          />
          
          {/* Rest of playlist details */}
        </div>
      )}
    </Drawer>
  );
}
```

**2.3.5: Track Local Changes**

```typescript
// src/hooks/usePlaylists.ts (or App.tsx)

function handleAddSongToPlaylist(playlistId: string, song: Song) {
  setPlaylists(prev => prev.map(playlist => {
    if (playlist.id !== playlistId) return playlist;
    
    return {
      ...playlist,
      songs: [...playlist.songs, song],
      synced: false, // Mark as unsynced
      localChanges: {
        ...playlist.localChanges,
        added: [...(playlist.localChanges?.added || []), song.id]
      }
    };
  }));
}

function handleRemoveSongFromPlaylist(playlistId: string, songId: string) {
  setPlaylists(prev => prev.map(playlist => {
    if (playlist.id !== playlistId) return playlist;
    
    return {
      ...playlist,
      songs: playlist.songs.filter(s => s.id !== songId),
      synced: false,
      localChanges: {
        ...playlist.localChanges,
        removed: [...(playlist.localChanges?.removed || []), songId]
      }
    };
  }));
}
```

#### **Acceptance Criteria:**
- [ ] User can edit imported playlists in Fonea
- [ ] Sync button appears for imported playlists
- [ ] Sync button shows correct status (synced/unsynced)
- [ ] Clicking sync updates playlist on Spotify
- [ ] Progress shows during sync
- [ ] Success toast confirms sync
- [ ] Playlist marked as synced after successful sync
- [ ] Local changes tracked correctly
- [ ] Handles add/remove/reorder operations
- [ ] Syncs metadata changes (name, description)

#### **Testing Checklist:**
- [ ] Test adding songs → sync
- [ ] Test removing songs → sync
- [ ] Test editing name → sync
- [ ] Test editing description → sync
- [ ] Test multiple changes → sync all
- [ ] Test sync with network error
- [ ] Test sync with expired token
- [ ] Test sync with large playlist (500+ songs)
- [ ] Test concurrent syncs (should queue)
- [ ] Test on mobile

---

## 🎯 SPRINT 2 SUCCESS METRICS

**Completion Criteria:**
- [ ] All 3 tasks complete (2.1 - 2.3)
- [ ] Spotify import/export loop fully functional
- [ ] Zero data loss during sync operations
- [ ] Manual testing on desktop and mobile

**User Experience Goals:**
- Import feels seamless (< 30s for 50-song playlist)
- Editing playlists is intuitive
- Sync status is always clear
- Errors handled gracefully

**Quality Metrics:**
- Import success rate: >95%
- Sync success rate: >98%
- No playlist corruption
- Performance: Import 100 songs in <60s

---

## 🚀 SPRINT 3: PLATFORM EXPANSION

**Timeline:** Week 3+  
**Goal:** Add Apple Music, research YouTube Music, prepare for more platforms

---

### 3.1: Apple Music Integration

**Status:** ⏳ PENDING  
**Priority:** MID-HIGH  
**Estimated Effort:** 10-12 hours

#### **Objective:**
Implement Apple Music import/export using friend's Apple Developer Program account.

#### **Prerequisites:**
- [ ] Apple Developer Program access (friend's account)
- [ ] Apple Music API key generated
- [ ] MusicKit JS configured

#### **Implementation Tasks:**

**3.1.1: Apple Music Authentication**
- [ ] Set up MusicKit JS
- [ ] Implement OAuth flow
- [ ] Store user music token
- [ ] Handle token refresh

**3.1.2: Apple Music Import Service**
- [ ] Implement `AppleMusicImportService` (similar to Spotify)
- [ ] Register in platform registry
- [ ] Handle Apple Music-specific metadata
- [ ] Map Apple Music IDs to Fonea Song format

**3.1.3: Apple Music Export Service**
- [ ] Create playlist on Apple Music
- [ ] Add tracks to playlist
- [ ] Handle Apple Music search (for missing tracks)
- [ ] Sync changes back to Apple Music

**Files to Create:**
```
src/services/import/apple-music/
├── appleMusicImportService.ts    # Import implementation
├── appleMusicExportService.ts    # Export implementation
└── appleMusicAuth.ts             # Authentication logic

src/config/
└── appleMusicConfig.ts           # API keys and config
```

#### **Acceptance Criteria:**
- [ ] User can authenticate with Apple Music
- [ ] User can import Apple Music playlists
- [ ] User can export playlists to Apple Music
- [ ] Metadata mapping works correctly
- [ ] Platform registry supports Apple Music

#### **Notes:**
- Apple Music API is more restrictive than Spotify
- May require additional user permissions
- Region restrictions apply
- Preview URLs may not always be available

---

### 3.2: YouTube Music Research & Implementation

**Status:** ⏳ PENDING (Research first)  
**Priority:** MEDIUM  
**Estimated Effort:** Research (4 hours) + Implementation (8-10 hours)

#### **Objective:**
Research YouTube Music API capabilities and decide on implementation approach.

#### **Research Questions:**
1. **Music vs Videos:**
   - Can we distinguish between music videos and songs?
   - Does YouTube Music have a separate API for music-only content?
   - How does YouTube Music handle playlists?

2. **API Access:**
   - Is there an official YouTube Music API?
   - Do we need to use YouTube Data API v3?
   - What are the quota limits?
   - Authentication requirements?

3. **Metadata:**
   - How accurate is metadata (artist, album, year)?
   - Can we extract ISRC codes?
   - Preview URLs availability?

4. **Playlist Management:**
   - Can we create playlists programmatically?
   - Can we modify existing playlists?
   - Sync capabilities?

#### **Research Deliverable:**
- [ ] Technical feasibility report
- [ ] API cost analysis
- [ ] Implementation complexity estimate
- [ ] Decision: Implement now vs later

#### **Implementation (If Feasible):**
- [ ] YouTube Music authentication
- [ ] Import service
- [ ] Export service
- [ ] Register in platform registry

---

### 3.3: Other Platforms (Tidal, Qobuz)

**Status:** ⏳ PENDING (Low priority, if traction grows)  
**Priority:** MEDIUM  
**Estimated Effort:** 8-10 hours per platform

#### **Objective:**
Add Tidal and Qobuz support if user base grows and demands it.

#### **Prerequisites:**
- User feedback showing demand
- API access for each platform
- Developer accounts

#### **Notes:**
- **Tidal:** Requires application approval, may have strict terms
- **Qobuz:** Smaller user base, niche audiophile market
- Both use standard OAuth 2.0 flows
- Can follow same pattern as Spotify/Apple Music

---

## 📋 FUTURE SPRINTS: STRATEGIC & INFRASTRUCTURE

---

### 4.1: Define Free vs Premium Features 📊

**Status:** ⏳ PENDING (Planning session)  
**Priority:** MEDIUM  
**Estimated Effort:** Planning (2-4 hours)

#### **Objective:**
Create clear feature matrix and pricing strategy.

#### **Deliverables:**
- [ ] Feature comparison table
- [ ] Pricing tiers defined
- [ ] Rate limits for free tier
- [ ] Premium value propositions
- [ ] Upgrade prompts designed

#### **Discussion Topics:**
- Optimal price point ($4.99, $6.99, $9.99?)
- Trial period (7 days, 14 days, 30 days?)
- Which features drive conversions?
- Competitor pricing analysis

---

### 4.2: UX Improvements Discussion & Planning 🎨

**Status:** ⏳ PENDING (Planning session)  
**Priority:** MEDIUM  
**Estimated Effort:** Planning (4-6 hours) + Implementation (TBD)

#### **Topics for Discussion:**

**1. Toolbar UX Redesign**
- Current pain points?
- Button organization
- Mobile optimization
- Accessibility improvements

**2. Card vs Table View**
- Use cases for each view
- Information density
- Mobile considerations
- Transition animations

**3. Bulk Operations**
- Select multiple songs
- Bulk Keep/Skip/Pending
- Bulk add to playlist
- Bulk export

**4. Mobile Experience**
- Touch-friendly targets
- Gesture controls
- Bottom sheet UI
- Performance optimization

**5. Advanced Filtering**
- Filter by feedback status
- Filter by platform
- Filter by verification status
- Filter by round
- Saved filter presets

**6. Keyboard Shortcuts**
- K = Keep
- S = Skip
- P = Pending
- Space = Preview
- / = Search
- ? = Show shortcuts help

#### **Deliverables:**
- [ ] Design mockups
- [ ] User flow diagrams
- [ ] Implementation plan
- [ ] Priority matrix

---

### 4.3: UX Improvements Implementation 🎨

**Status:** ⏳ PENDING (Depends on 4.2)  
**Priority:** MEDIUM  
**Estimated Effort:** TBD (Based on planning)

#### **Phased Implementation:**

**Phase 1: Quick Wins** (2-3 hours)
- Keyboard shortcuts
- Better touch targets on mobile
- Loading states

**Phase 2: Card/Table Toggle** (6-8 hours)
- Table view implementation
- View switching
- State persistence

**Phase 3: Bulk Operations** (8-10 hours)
- Multi-select UI
- Bulk action toolbar
- Confirmation dialogs

**Phase 4: Advanced Filtering** (6-8 hours)
- Filter UI
- Filter logic
- Saved presets

---

### 4.4: Authentication System 🔐

**Status:** ⏳ PENDING (Required before premium features)  
**Priority:** HIGH (When premium features ready)  
**Estimated Effort:** 8-10 hours

#### **Objective:**
Implement user accounts to enable premium features and personalization.

#### **Options:**

**Option A: Email/Password (Traditional)**
- Custom authentication system
- Password hashing (bcrypt)
- Email verification
- Password reset flow

**Option B: OAuth Only (Recommended)**
- Google Sign-In
- GitHub Sign-In
- Apple Sign-In (if iOS app)
- No password management

**Option C: Magic Links (Passwordless)**
- Email-based authentication
- Time-limited tokens
- No password required
- Simple UX

**Recommendation:** Option B (OAuth) + Option C (Magic Links) for flexibility

#### **Implementation:**

**Files to Create:**
```
src/services/auth/
├── authService.ts                # Authentication logic
├── authProvider.tsx              # React context
└── useAuth.ts                    # Custom hook

src/components/auth/
├── LoginModal.tsx                # Login UI
├── SignupModal.tsx               # Signup UI
└── AccountSettings.tsx           # User settings
```

**Backend Requirements:**
- Database for users (Supabase, Firebase, or custom)
- Session management
- Token refresh logic
- GDPR compliance (data export/deletion)

#### **Acceptance Criteria:**
- [ ] User can sign up
- [ ] User can log in
- [ ] User can log out
- [ ] Sessions persist across page reloads
- [ ] Token refresh works automatically
- [ ] User profile stored securely
- [ ] GDPR-compliant data handling

---

### 4.5: Payment Platform 💰

**Status:** ⏳ PENDING (Depends on 4.4)  
**Priority:** HIGH (When authentication ready)  
**Estimated Effort:** 12-16 hours

#### **Objective:**
Implement subscription management with Stripe.

#### **Stripe Integration:**

**4.5.1: Stripe Setup**
- [ ] Create Stripe account
- [ ] Configure products and pricing
- [ ] Set up webhooks
- [ ] Test mode configuration

**4.5.2: Frontend Integration**
- [ ] Stripe Checkout integration
- [ ] Pricing page
- [ ] Subscription management UI
- [ ] Invoice history

**4.5.3: Backend Integration**
- [ ] Webhook handlers (subscription created, canceled, etc.)
- [ ] Database schema for subscriptions
- [ ] Subscription status sync
- [ ] Failed payment handling

**Files to Create:**
```
src/services/payment/
├── stripeService.ts              # Stripe API wrapper
├── subscriptionService.ts        # Subscription logic
└── webhookHandler.ts             # Webhook processing

src/components/payment/
├── PricingPage.tsx               # Pricing tiers
├── CheckoutModal.tsx             # Stripe Checkout
└── SubscriptionSettings.tsx      # Manage subscription
```

**Stripe Products:**
```
Product: Fonea Premium
- Monthly: $6.99/month
- Annual: $69/year (save 17%)

Features:
- Unlimited playlists
- Export to all platforms
- Import from all platforms
- Unlimited ChatGPT recommendations (GPT-5)
- No branding
- Priority support
```

#### **Acceptance Criteria:**
- [ ] User can subscribe via Stripe Checkout
- [ ] Subscription status syncs correctly
- [ ] Premium features unlock immediately
- [ ] Failed payments handled gracefully
- [ ] User can cancel subscription
- [ ] User can update payment method
- [ ] Webhooks process reliably
- [ ] PCI compliance maintained

---

### 4.6: Premium Feature Gates

**Status:** ⏳ PENDING (Depends on 4.4 + 4.5)  
**Priority:** HIGH  
**Estimated Effort:** 4-6 hours

#### **Objective:**
Implement feature gating based on subscription status.

#### **Implementation:**

**Files to Create:**
```
src/hooks/
└── useFeatureAccess.ts           # Check feature access

src/components/
└── UpgradePrompt.tsx             # Prompt to upgrade
```

**Feature Gate Logic:**
```typescript
// src/hooks/useFeatureAccess.ts

export function useFeatureAccess() {
  const { user } = useAuth();
  
  const isPremium = user?.subscriptionStatus === 'active';
  
  return {
    canExportToAllPlatforms: isPremium,
    canImportUnlimited: isPremium,
    canUseGPT5: isPremium,
    canRemoveBranding: isPremium,
    canUseBulkOperations: isPremium,
    maxPlaylists: isPremium ? Infinity : 3,
    maxExportsPerDay: isPremium ? Infinity : 1,
    maxGPTRequests: isPremium ? Infinity : 5
  };
}
```

**Usage Example:**
```typescript
// In component:
const { canExportToAllPlatforms } = useFeatureAccess();

if (!canExportToAllPlatforms && platform !== 'spotify') {
  return <UpgradePrompt feature="Export to all platforms" />;
}
```

#### **Upgrade Prompts:**
- Soft gates (show locked features)
- Clear value proposition
- One-click upgrade path
- Trial offers

---

### 4.7: GPT-5 for Premium Users 🤖

**Status:** ⏳ PENDING (Depends on 4.6)  
**Priority:** MEDIUM  
**Estimated Effort:** 2-3 hours

#### **Objective:**
Switch premium users from GPT-5-mini to GPT-5 for better recommendations.

#### **Implementation:**

```typescript
// src/services/openai/config.ts

export function getModelForUser(isPremium: boolean): string {
  return isPremium ? 'gpt-5' : 'gpt-5-mini';
}

// In openaiService.ts:
const model = getModelForUser(user.isPremium);
```

**UI Changes:**
- Show "Powered by GPT-5" badge for premium users
- Explain benefits of GPT-5 in upgrade prompt
- A/B test quality difference

**Cost Analysis:**
- GPT-5: ~$0.03 per request
- GPT-5-mini: ~$0.003 per request
- 10x cost increase
- Need to ensure premium pricing covers it

---

## 📝 DISCUSSION LIST (For Later)

Items to discuss/plan before implementing:

### Product Strategy:
- [ ] Free vs Premium feature split (finalize)
- [ ] Pricing strategy ($4.99, $6.99, $9.99?)
- [ ] Trial period (7, 14, 30 days?)
- [ ] Annual discount (10%, 15%, 20%?)
- [ ] Student discount?
- [ ] Referral program?

### UX Improvements:
- [ ] Toolbar redesign
- [ ] Card vs Table view design
- [ ] Bulk operations UX flow
- [ ] Mobile experience optimization
- [ ] Advanced filtering design
- [ ] Keyboard shortcuts expansion
- [ ] Onboarding flow for new users
- [ ] Empty states design

### Technical:
- [ ] Database choice (Supabase, Firebase, custom?)
- [ ] Backend framework (Next.js API routes, Express, Fastify?)
- [ ] Caching strategy (Redis, in-memory?)
- [ ] Rate limiting approach
- [ ] Error tracking (Sentry, LogRocket?)
- [ ] Feature flags (LaunchDarkly, custom?)

### Future Features:
- [ ] Playlist collaboration (share with friends)
- [ ] Social features (follow users, share playlists)
- [ ] Desktop app (Electron, Tauri?)
- [ ] Mobile app (React Native, PWA?)
- [ ] AI-powered playlist generation (themes, moods)
- [ ] Smart recommendations based on listening history
- [ ] Integration with Last.fm, Shazam
- [ ] Export to MP3/FLAC (if legally possible)
- [ ] Offline mode (PWA)

---

## 🎯 SUCCESS METRICS

### Sprint 1 (Quick Wins & ChatGPT):
- ✅ All branding updated
- ✅ Keep button UX improved
- ✅ ChatGPT auto-replacements work seamlessly
- ✅ Feedback loop generates relevant recommendations
- ✅ Song preview works in all views

### Sprint 2 (Spotify Import/Export Loop):
- ✅ Import success rate: >95%
- ✅ Sync success rate: >98%
- ✅ Import 100-song playlist in <60s
- ✅ Zero data loss during sync
- ✅ Clear sync status at all times

### Sprint 3 (Platform Expansion):
- ✅ Apple Music import/export functional
- ✅ YouTube Music feasibility determined
- ✅ Framework supports 5+ platforms

### Future (Monetization):
- 🎯 100+ active users
- 🎯 10% conversion to premium
- 🎯 <5% churn rate
- 🎯 $500+ MRR in first quarter

---

## 📞 CONTACT & SUPPORT

- **Email:** foneamusiccurator@gmail.com
- **GitHub Issues:** https://github.com/joakirrin/music-curator/issues
- **Discussions:** https://github.com/joakirrin/music-curator/discussions
- **Live App:** https://fonea-music-curator.vercel.app

---

## 📚 DOCUMENTATION

### For Developers:
- README.md (setup instructions)
- CONTRIBUTING.md (contribution guidelines)
- API.md (service documentation)
- ARCHITECTURE.md (system design)

### For Users:
- In-app guide (GuideDrawer)
- FAQ page
- Video tutorials (YouTube)
- Blog posts (Medium?)

---

## 🔄 VERSION HISTORY

**v11 (November 25, 2025):**
- ✅ Reorganized into sprint-based structure
- ✅ Prioritized ChatGPT completion (highest)
- ✅ Grouped Spotify import/export/sync together
- ✅ Moved free/premium discussion to later phase
- ✅ Added detailed implementation specs for each task
- ✅ Created clear acceptance criteria
- ✅ Defined success metrics per sprint
- ✅ Added discussion list for future planning

**v10 (November 21, 2025):**
- Phase 4.5 completed (Smart Export + Branding)
- Added song preview and cookie consent
- Defined Phase 5 (Multi-Platform) structure

**v9 and earlier:**
- Foundation complete (Phases 1-4)
- Core features stable
- Spotify export working

---

**Last Updated:** November 25, 2025  
**Version:** 11.0  
**Status:** Sprint 1 Ready to Start

**Next Action:** Begin Sprint 1, Task 1.1 (Branding Fixes) 🚀
