# 🎧 Fonea — Production Roadmap v13 (Reordered)
_Last updated: 2025-12-09_

**Production Status:** Live at foneamusic.com  
**Users:** <20 (friends & family + Reddit)  
**Current State:** Spotify works (25 user limit), YouTube in progress  
**Storage:** Frontend only (localStorage + cookies, Vercel backendless)  
**Strategy:** YouTube first (universal access) → Template for other platforms

---

# ✅ COMPLETED WORK (YouTube Integration - 50%)

## Chunk 1: YouTube API Client ✅
- Search, videos, playlists, playlistItems APIs
- Rate limiting, pagination, error handling
- File: `src/services/youtube/YouTubeApiClient.ts`
- **Validation:** All endpoints tested and working

## Chunk 2: Smart Resolver (3-Tier System) ✅
- Tier 1 (Direct): 0 API calls - uses existing IDs
- Tier 2 (Soft): ~100 units - MusicBrainz verified songs
- Tier 3 (Hard): ~100 units - comprehensive search with scoring
- Files: `src/services/export/youtubeResolver.ts`, `src/services/export/types.ts`
- **Validation:** Tier 1 (0 quota) and Tier 3 (88.3% confidence) validated

## Chunk 3: Video → Song Mapper ✅
- Duration parsing, thumbnail selection, metadata extraction
- File: `src/utils/songMappers.ts` (updated)
- **Validation:** Correctly parsed test videos

## Chunk 4: Export Service ✅
- `exportPlaylistToYouTube()` with 4-phase process
- Progress tracking, comprehensive reporting
- File: `src/services/youtubePlaylistService.ts`
- **Validation:** 3 songs exported in 4.3s, 100% success rate, verified on YouTube

---

# 🔥 PHASE 0 — IMMEDIATE PRIORITIES (1-2 Weeks)
**Goal:** YouTube 100% functional + Core UX working smoothly

## 0.1 Complete YouTube Integration (Top Priority)
**Why:** Your #1 pain point. YouTube = universal access (no 25-user limit).  
**Status:** 50% complete (4/8 chunks done)

### 🚧 Chunk 5: Import Service (CURRENT - 45 min)
- `getUserYouTubePlaylists()` - List user's playlists
- `importPlaylistFromYouTube()` - Full import with progress tracking
- Create local Playlist with `youtubePlaylistId` reference
- **Next:** Start immediately

### Chunk 6: useYouTubeAuth Hook (20 min)
- Follow useSpotifyAuth pattern
- States: logged_out | ready | refreshing
- Auto-refresh on mount
- Error handling

### Chunk 7: UI Integration (30-40 min)
- Add "Export to YouTube" button in playlists
- Add "Import from YouTube" flow
- Progress indicators during operations
- Playlist state badges:
  - `local_only`: Never exported
  - `imported_from_youtube`: Imported from YouTube
  - `pushed_to_youtube`: Exported to YouTube
- Visual indicators in UI
- Error messages and retry flows

### Chunk 8: Append-Only Sync (30-40 min)
- Detect new songs in Fonea not in YouTube
- Add new songs to end of YouTube playlist
- Update `lastSyncedAt` timestamp
- Sync button in UI
- **Note:** NO deletion, NO reordering (deferred to future)

**Estimated Total:** 2-3 hours focused work  
**Impact:** CRITICAL - Enables unlimited users, removes Spotify bottleneck

---

## 0.2 Google OAuth for Universal Login
**Why:** Must-have. Anyone can login without approval.  
**Current:** YouTube/Spotify auth exists but not Google OAuth  
**Priority:** High (do after YouTube chunks 5-6, before 7-8)

**Tasks:**
- Implement Google OAuth flow (use existing YouTube auth as template)
- Store session securely (cookies/localStorage)
- Integrate into global auth context
- Update UI login button ("Sign in with Google")
- Works with Vercel backendless approach
- **Keep it simple:** Just Google for now, email/password later

**Estimated:** 2-3 hours  
**Impact:** HIGH - Anyone can use Fonea

---

## 0.3 GPT Conversational Mode (No JSON Errors)
**Why:** Pain point #3. Breaking user experience when GPT responds naturally.  
**Priority:** High (before mobile UX polish)

**Tasks:**
- Introduce `responseMode` ("chat", "playlist_json", etc.)
- Only require JSON when explicitly needed
- Soft warnings instead of hard errors
- Flexible parser: extract JSON from within text blocks
- Continue chat conversation even without JSON
- Show friendly message: "I can help with that, but let me know what playlist you'd like me to work on"

**Implementation Notes:**
- Update prompt to include mode indicator
- Parser should handle:
  ```
  Here are some great songs for you:
  ```json
  [{"title": "...", "artist": "..."}]
  ```
  ```
- If no JSON found and mode is "chat" → Just display response
- If no JSON found and mode is "playlist_json" → Soft retry prompt

**Estimated:** 3-4 hours  
**Impact:** HIGH - No more broken conversations

---

## 0.4 Keep/Skip UX Fixes (Critical)
**Why:** Pain point #2. Core interaction must be flawless.  
**Priority:** High (before mobile UX audit)

### 0.4.1 Remove Keep Modal
- Keep must **NOT** open modal
- Make Keep instant action (like Skip)
- Show brief toast notification: "✓ Song added to library"
- Remove modal component entirely

### 0.4.2 Keep/Skip Button Visibility
- Improve visual hierarchy (especially mobile)
- Larger touch targets (min 44x44px)
- High contrast colors
- Always prominent and accessible
- Consider bottom-fixed on mobile

### 0.4.3 Feedback Button Always Visible
- After Keep/Skip, feedback button must stay visible
- Add floating action button (FAB) for feedback
- Position: bottom-right, always accessible
- Remove old redundant floating button

### 0.4.4 Auto-Close Chat on Mobile
- After recommendations load into Library
- Auto-close chat panel to show Keep/Skip immediately
- Add "Open Chat" button to reopen if needed

**Estimated:** 2-3 hours  
**Impact:** HIGH - Core UX must work perfectly

---

## 0.5 Remove Redundant Buttons
**Why:** Cleaner UI, less confusion  
**Priority:** Quick win (30 min)

**Remove:**
- "Companion GPT" button (deprecated)
- "Replace invalid songs" button (deprecated by resolver)

**Estimated:** 30 minutes  
**Impact:** MEDIUM - Cleaner UI

---

## 0.6 Basic Analytics & User Visibility
**Why:** You mentioned zero visibility on who uses the app  
**Priority:** Important for growth tracking

**Quick Implementation (Vercel/Backendless):**
- Add Vercel Analytics (built-in, free)
- Add PostHog or Mixpanel (free tier)
- Track key events:
  - User login (platform)
  - Playlist export (platform, size)
  - Playlist import (platform)
  - GPT recommendations requested
  - Keep/Skip actions
  - Errors/failures

**No backend needed:** Client-side event tracking works fine initially

**Estimated:** 1-2 hours  
**Impact:** HIGH - Understand user behavior, track growth

---

# ⚡ PHASE 1 — MOBILE UX POLISH (Week 3)
**Goal:** Fonea feels native on mobile

## 1.1 Mobile-First UX Audit
**Why:** Most users likely on mobile  
**Priority:** After Phase 0 complete

**Tasks:**
- Test on real devices (iOS & Android)
- Fixed headers (don't scroll away)
- Bottom sheets for actions
- Larger touch targets everywhere (min 44x44px)
- Thumb-zone optimization
- Swipe gestures (swipe to skip?)
- Pull-to-refresh where appropriate

**Decision Point:** Unified responsive vs mobile-specific components?
- **Recommendation:** Start with responsive, branch only if needed

**Estimated:** 1 week  
**Impact:** HIGH - Better mobile experience

---

## 1.2 Toolbar Redesign
**Tasks:**
- Clear navigation hierarchy
- Add icons with labels
- Accessibility improvements (ARIA labels, keyboard nav)
- Active state indicators
- Responsive breakpoints

**Estimated:** 1-2 days  
**Impact:** MEDIUM - Better navigation

---

## 1.3 Card View vs Table View
**Why:** Flexibility for different use cases

**Tasks:**
- Implement card view mode (mobile-friendly)
- Implement table view mode (desktop power users)
- View switcher button
- Remember preference (localStorage)
- Smooth transitions

**Estimated:** 1-2 days  
**Impact:** MEDIUM - Better visualization options

---

## 1.4 Keyboard Shortcuts (Desktop)
**Why:** Power user efficiency

**Shortcuts:**
- `K` = Keep
- `S` = Skip
- `P` = Pending
- `Space` = Preview (play/pause)
- `/` = Focus search
- `?` = Show shortcuts help

**Tasks:**
- Keyboard event listener
- Shortcuts help modal
- Visual hints (tooltips)
- Disable when typing in inputs
- Works with screen readers

**Estimated:** 4-6 hours  
**Impact:** MEDIUM - Power users love it

---

# 🟨 PHASE 2 — QUALITY & POLISH (Week 4+)

## 2.1 Duplicates Management
**Why:** Pain point #4, but manageable for now  
**Priority:** After core UX is solid

**Implementation:**
- Global SongIdentity model based on:
  - Platform IDs (Spotify, YouTube, Apple Music)
  - MusicBrainz ID
  - Fuzzy match (title + artist)
- Prevent duplicates in:
  - GPT recommendations
  - Library
  - Keep flow
  - Playlist editor

**Tasks:**
- Create `SongIdentity` utility class
- Dedupe function with configurable strictness
- Apply to all add operations
- Show "Already in library" toast when detected
- Optional: "Show duplicates" cleanup tool

**Estimated:** 1 week  
**Impact:** HIGH - Better data quality

---

## 2.2 Playlist Editing Improvements

### 2.2.1 Song Preview in Playlist Details
- Add preview button in playlist view
- Use global `useAudioPlayer` hook
- Show currently playing state
- Keyboard controls (space)

### 2.2.2 Edit Playlists in Drawer
- Add songs to playlist
- Remove songs from playlist
- Reorder songs (drag & drop)
- Edit playlist name/description
- Bulk add/remove operations
- Undo/redo support
- Auto-save

**Estimated:** 1 week  
**Impact:** HIGH - Core functionality

---

## 2.3 Bulk Operations
**Why:** Efficient management

**Tasks:**
- Multi-select with checkboxes
- Bulk Keep/Skip
- Bulk add to playlist
- Bulk export
- Select all / Deselect all
- Status indicators during operations

**Estimated:** 3-4 days  
**Impact:** MEDIUM - Power user feature

---

## 2.4 Guided Onboarding System
**Why:** Replace SupaDemo with internal solution

**Tasks:**
- JSON-based guide definition
- Step-by-step walkthrough
- Highlight system for UI elements
- Progress tracking
- Skip/restart options
- Reusable on mobile/web

**Estimated:** 1 week  
**Impact:** MEDIUM - Better onboarding

---

# 🟩 PHASE 3 — GPT ARCHITECTURE IMPROVEMENTS

## 3.1 Distinct Prompt Templates
**Why:** More maintainable, better results

**Modules to Create:**
- `discovery.ts` - Finding new music
- `replacement.ts` - Replacing invalid songs
- `moods.ts` - Mood-based recommendations
- `safety.ts` - Content safety filtering
- `validation.ts` - Response validation
- `filtering.ts` - Genre/artist filtering
- `context.ts` - Context personalization

**Estimated:** 1 week  
**Impact:** MEDIUM - Better code organization

---

## 3.2 Mood-Based & Contextual Prompts
**Features:**
- "Make this playlist more energetic / darker / nostalgic"
- "Tone down pop, add more indie"
- "Regenerate with more emerging artists"
- "Add similar artists to [name]"
- Temperature/diversity controls

**Estimated:** 3-4 days  
**Impact:** MEDIUM - More powerful recommendations

---

# 🟦 PHASE 4 — MULTI-PLATFORM EXPANSION

## 4.1 Platform-Agnostic Architecture
**Goal:** YouTube patterns work for all platforms

**Tasks:**
- Create unified `PlatformService` interface
- Refactor YouTube code to use interface
- Document patterns for future platforms

**Platforms Roadmap:**
1. YouTube ✅ (in progress - 50%)
2. Spotify (exists but needs YouTube-style improvements)
3. Apple Music (when you get API key)
4. Tidal
5. Qobuz

**Strategy:** Everything built for YouTube should work for others with minimal changes

**Estimated:** 1 week refactoring  
**Impact:** HIGH - Scalable architecture

---

## 4.2 Complete Spotify Integration
**Current:** Basic export works, needs improvements

**Tasks:**
- Import playlists from Spotify
- Smart resolver for Spotify (3-tier system)
- Bidirectional sync
- Follow YouTube patterns exactly
- Better error handling

**Note:** Still limited to 25 users until Extended Quota Mode approved

**Estimated:** 1 week  
**Impact:** MEDIUM - Better Spotify support

---

## 4.3 Apple Music Integration
**When:** After you get API key ($99/year or test account)

**Tasks:**
- Apple Music API client
- OAuth flow (MusicKit JS)
- Import/export flows
- Smart resolver
- UI integration
- Follow YouTube template

**Estimated:** 1-2 weeks  
**Impact:** HIGH - Major platform support

---

# 🟪 PHASE 5 — BACKEND & PERSISTENCE (Future)
**When:** When frontend-only becomes infeasible

## Signs You Need Backend:
- User data too complex for localStorage
- Need cross-device sync
- Want social features (sharing, collaboration)
- Analytics needs server-side processing
- Hit Vercel function limits

## Backend Choice: Supabase (Recommended)
**Why:**
- Generous free tier
- PostgreSQL (powerful)
- Built-in auth (including Google OAuth)
- Real-time subscriptions
- Edge functions
- Easy migration from frontend-only

**Alternative:** NeonDB + Vercel Functions

---

## 5.1 Backend Foundation (When Needed)
**Tasks:**
- Set up Supabase project
- Database schema design
- Authentication migration (Google OAuth)
- API endpoints for CRUD operations

**Estimated:** 1 week  
**Impact:** HIGH - Unlocks many features

---

## 5.2 User Data Persistence
**What to Store:**
- Playlists (with songs)
- Feedback history (Keep/Skip)
- Chat preferences
- GPT conversation history
- User preferences
- Platform connections

**Estimated:** 1 week  
**Impact:** HIGH - No more data loss

---

## 5.3 Stats Engine (like stats.fm)
**Metrics:**
- BPM distribution
- Energy, valence
- Genre breakdown
- Decade distribution
- Artist diversity score
- Cohesion index
- "Playlist profile" radar chart

**Data Sources:**
- MusicBrainz
- Spotify API
- YouTube Music metadata

**Estimated:** 2 weeks  
**Impact:** HIGH - Engaging feature

---

# 🟫 PHASE 6 — MONETIZATION (Future)

## 6.1 Define Free vs Premium Tiers

### Proposed Free Tier:
- Google OAuth login
- GPT-4o-mini recommendations
- 10 exports/day per platform
- 5 imports/day
- Basic stats
- Single platform connection at a time
- 50 playlists max

### Proposed Premium Tier ($4.99/month or $49/year):
- GPT-4o recommendations
- Unlimited exports/imports
- Advanced stats & analytics
- Multiple platform connections simultaneously
- Unlimited playlists
- Priority support
- Early access to new features
- AI cover art generation

**Decision:** Finalize pricing and limits

---

## 6.2 Stripe Integration
**Tasks:**
- Stripe account setup
- Subscription products
- Checkout flow
- Customer portal (billing)
- Webhooks for subscription events
- Database sync for status
- Handle failed payments
- Cancellation flow

**Alternative:** Buy Me a Coffee (simpler, one-time)

**Estimated:** 1 week  
**Impact:** MEDIUM - Revenue stream

---

## 6.3 GPT Model Gating
**Implementation:**
- Check user tier before API calls
- Free → GPT-4o-mini
- Premium → GPT-4o
- Upgrade prompts in UI
- Usage tracking
- Rate limiting per tier

**Estimated:** 2-3 days  
**Impact:** MEDIUM - Monetization support

---

# 🌈 PHASE 7 — ADVANCED AI FEATURES ("Fun Features")

## 7.1 Playlist from Image (Flyers/Posters/Lineups)
**Use Case:** Festival lineup → instant playlist

**Tasks:**
- GPT-4o Vision integration
- Extract artist names from images
- Build playlist from artists
- Variants:
  - Headliners only
  - Discovery (emerging artists)
  - Per-day lineup
- UI: Upload image → Generate playlist

**Estimated:** 1 week  
**Impact:** HIGH - Viral potential

---

## 7.2 Playlist from Concert Setlists
**Use Case:** Practice before concerts

**Tasks:**
- Setlist.fm API integration
- Search artist + venue + date
- Generate playlist from setlist
- Include encore songs
- Preserve order
- UI: Search artist → Select concert → Generate

**Estimated:** 1 week  
**Impact:** MEDIUM - Niche but valuable

---

## 7.3 AI Cover Art Generator
**Modes:**
- Mood-based (energetic, chill, dark)
- User image → style transfer
- Themes: retro, minimal, neon, collage, vaporwave

**Tasks:**
- DALL-E or Midjourney API
- Image upload and processing
- Multiple style options
- Save/apply to playlists

**Estimated:** 1 week  
**Impact:** MEDIUM - Visual appeal

---

## 7.4 Boost Playlists
**Feature:** Improve existing playlists

**How it works:**
- Import playlist from any platform
- Analyze current vibe (GPT)
- Suggest improvements:
  - More obscure artists
  - Darker/lighter mood
  - More energetic/chill
  - Genre diversification
- Versioning: "Boost v2, v3..."

**Estimated:** 1 week  
**Impact:** MEDIUM - Unique feature

---

## 7.5 Playlists from Abstract Inputs
**Examples:**
- Room photo → playlist matching ambiance
- Outfit photo → playlist matching style
- Landscape → playlist matching mood
- Weather conditions → appropriate music
- Time of day → energy level match

**Tasks:**
- Vision API mood extraction
- Mood → music characteristics mapping
- Generate playlist based on analysis

**Estimated:** 1-2 weeks  
**Impact:** HIGH - Novel use case

---

# 🟦 PHASE 8 — SOCIAL & COLLABORATION (Future)

## 8.1 Playlist Collaboration
**Features:**
- Share playlist by link
- Permission levels (view/edit)
- Real-time co-editing
- Comment system
- Activity feed
- Conflict resolution

**Requires:** Backend

**Estimated:** 2 weeks  
**Impact:** HIGH - Social engagement

---

## 8.2 Shazam & Last.fm Integration

### Shazam:
- Identify songs on the fly
- Add identified songs to library
- "Shazam history" playlist

### Last.fm:
- Import scrobbles
- Analyze listening history
- Personalized recommendations
- Top artists/tracks/albums
- Listening trends over time

**Estimated:** 1 week each  
**Impact:** MEDIUM - Power user features

---

## 8.3 Public Playlist Gallery
**Features:**
- Public/private toggle
- Browse public playlists
- Like/follow playlists
- Clone playlists
- Trending section
- Genre/mood categories
- Search & filters

**Requires:** Backend

**Estimated:** 2 weeks  
**Impact:** HIGH - Discovery & growth

---

# 📱 PHASE 9 — MOBILE APPS (Future)

## 9.1 Technology Decision
**Options:**
- **React Native + Expo** (recommended)
  - Reuse React knowledge
  - Good performance
  - Easy deployment
  - Large ecosystem
- Capacitor (if web-first)
  - Literally wrap web app
  - Simpler but less native feel

**Decision:** React Native + Expo likely best

---

## 9.2 Native Mobile Features
**Features:**
- Offline mode (cached playlists)
- Push notifications (recommendations, updates)
- Camera integration (image → playlist)
- Share sheet integration
- Widget support (now playing)
- Background audio playback
- CarPlay / Android Auto (future)

**Estimated:** 2-3 months  
**Impact:** HIGH - Native experience

---

# 💎 UPDATED PRIORITY SUMMARY

## 🔥 DO FIRST (Weeks 1-2) - Phase 0
1. **Complete YouTube Integration** (chunks 5-8) → 2-3 hours
2. **Google OAuth** (universal login) → 2-3 hours
3. **GPT Conversational Mode** (no JSON errors) → 3-4 hours
4. **Keep/Skip UX Fixes** (remove modal, improve visibility) → 2-3 hours
5. **Remove Redundant Buttons** → 30 min
6. **Basic Analytics** (Vercel/PostHog) → 1-2 hours

**Total:** ~15-20 hours (2 weeks part-time)

---

## ⚡ DO NEXT (Week 3) - Phase 1
7. **Mobile-First UX Audit** → 1 week
8. **Toolbar Redesign** → 1-2 days
9. **Card/Table View Toggle** → 1-2 days
10. **Keyboard Shortcuts** → 4-6 hours

**Total:** 1 week full-time

---

## ⭐ DO AFTER (Week 4+) - Phase 2
11. **Duplicates Management** → 1 week
12. **Playlist Editing Improvements** → 1 week
13. **Bulk Operations** → 3-4 days
14. **Guided Onboarding** → 1 week

**Total:** 3-4 weeks

---

## 🌟 LATER - Phases 3-9
- GPT Architecture (Phase 3)
- Multi-Platform (Phase 4)
- Backend when needed (Phase 5)
- Monetization (Phase 6)
- Fun AI Features (Phase 7)
- Social (Phase 8)
- Mobile Apps (Phase 9)

---

# 📊 PROGRESS TRACKING

## Current Status:
- **Overall:** ~10% complete
- **YouTube Integration:** 50% complete (4/8 chunks)
- **Phase 0:** 17% complete (1/6 tasks)

## Next Milestone: YouTube 100% Functional
**ETA:** End of Week 2
**Blockers:** None (chunks 5-8 well-defined)

## Next Major Milestone: Phase 0 Complete
**ETA:** End of Week 2
**Impact:** Core product usable and reliable

---

# 🎯 KEY DECISIONS & RATIONALE

## Why This Order?

### 1. YouTube First (Momentum Strategy)
- Already 50% done → finish it
- Removes Spotify 25-user bottleneck
- Universal access (everyone has YouTube)
- Template for other platforms
- Quick win → confidence boost

### 2. Google OAuth Immediately After
- Must-have for unlimited users
- Leverages existing auth patterns
- Quick implementation (2-3 hours)
- High impact

### 3. GPT Fixes Before Mobile Polish
- Breaking user experience
- Affects all interactions
- Quick fix (3-4 hours)
- High impact on perception

### 4. Keep/Skip UX Fixes Next
- Core interaction must be perfect
- Higher priority than visual polish
- Quick fixes (2-3 hours total)
- Improves retention

### 5. Duplicates Later (Phase 2)
- Annoying but not breaking
- Manageable with current user base
- Can wait until after core UX solid

### 6. Backend Postponed
- Current solution works fine (<20 users)
- Vercel backendless scales well
- No data loss with cookie approach
- Export functionality prevents catastrophic loss
- Revisit when:
  - 100+ active users
  - Social features needed
  - Cross-device sync requested

---

# 📝 NOTES FOR EXECUTION

## Development Philosophy
- **"Vibe coding"** - Small chunks, validate before proceeding
- Test in production with real users
- Mobile-first thinking (most traffic)
- Progressive enhancement
- Ship fast, iterate

## Code Quality Standards
- TypeScript strict mode
- All comments/docs in English
- Comprehensive error handling
- Progress tracking for long operations
- Follow existing patterns (DRY)

## Testing Strategy
- Test in production (small user base)
- Real device testing (iOS + Android)
- Friends & family as beta testers
- Reddit for feedback
- Quick iteration cycles

## Deployment
- Vercel (current)
- Automatic deploys from main branch
- Preview branches for testing
- No backend needed yet

---

# 🚀 IMMEDIATE NEXT STEPS

**Right Now:**
1. ✅ Finish this conversation
2. 🚧 Continue Chunk 5 (Import Service) - CURRENT
3. → Complete Chunks 6-8 (YouTube UI + Sync)
4. → Google OAuth implementation
5. → GPT conversational mode fix

**This Week:**
- Complete all of Phase 0
- YouTube 100% functional
- Anyone can login
- GPT never breaks
- Keep/Skip smooth

**Next Week:**
- Mobile UX polish
- Analytics showing user behavior
- First 50-100 users possible

---

**Last Updated:** December 9, 2025  
**Current Focus:** YouTube Integration - Chunk 5 (Import Service)  
**Next Review:** After Phase 0 completion (~2 weeks)  
**Status:** Production (foneamusic.com) - <20 users - Growth mode
