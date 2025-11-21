# 📋 FONEA SOUND CURATOR — TASK LIST v9
Repository: https://github.com/joakirrin/music-curator/
Date: 2025-11-19
**Major Update**: Added Phase 4.5 - Smart Export + Branding + Monetization Prep

---

## 🎯 PROJECT STATUS OVERVIEW

**Phase 1**: ✅ COMPLETE (Core Functionality)
**Phase 2**: ✅ COMPLETE (Feedback & Learning)
**Phase 3**: ✅ COMPLETE (Playlist Management & Spotify Push)
**Phase 4**: ✅ COMPLETE (Universal Verification System + Platform Resolution)
**Phase 4.5**: ⏳ PENDING (Smart Export + Branding)
**Phase 5**: ⏳ PENDING (Multi-Platform Sync)
**Phase 6**: ⏳ PENDING (Advanced Features + Premium)

---

## ✅ RECENT ACHIEVEMENTS (Phase 4 Completion)

### 🎉 Feature: Automatic Platform Link Resolution
**Status**: ✅ COMPLETE

**What Was Built**:
Added intelligent platform URL resolution using ISRC codes from MusicBrainz verification.

**Services Implemented**:
- ✅ `spotifyIsrcResolver.ts`: Resolves Spotify track URLs using ISRC codes
  - Requires user authentication (uses existing OAuth)
  - ~60-80% success rate on verified tracks
- ✅ `appleMusicIsrcResolver.ts`: Resolves Apple Music track URLs using ISRC codes
  - No authentication required (public iTunes Search API)
  - ~70-90% success rate on verified tracks

**Integration Details**:
- Platform resolution happens automatically after MusicBrainz verification
- Spotify resolution only runs when user is logged in
- Apple Music resolution runs for all users
- Results stored in `song.platformIds.{platform}` structure

**User Experience Impact**:
- More songs now display direct "Open in Spotify" / "Open in Apple Music" buttons
- Fallback search buttons still available when direct links aren't found
- Combined with MusicBrainz URL data, most tracks now have 1-3 direct platform links

**Technical Architecture**:
- 100% serverless (client-side API calls)
- Rate-limited and error-handled
- Extensive logging in development mode
- Backward compatible with existing song structure

---

## 🚧 PHASE 4.5: SMART EXPORT + BRANDING (NEW)

### **Goal**: Maximize playlist completeness & prepare monetization
**Target**: Export as many songs as possible to platforms, add branding for future premium features

---

### **4.5.1: Smart Platform Search Fallback** 🆕 CHUNK 1
**Status**: ⏳ Not started

**Purpose**: When pushing to Spotify/Apple Music, maximize song matches using intelligent 3-tier fallback strategy

**Problem Statement**:
Currently, songs without MusicBrainz platform URLs show no "Open in Spotify" buttons. However, these songs may exist on Spotify. When exporting playlists, we want to include as many songs as possible by using intelligent search fallbacks.

**Requirements**:
- [ ] Create `src/services/export/smartPlatformResolver.ts`
  - [ ] Implement 3-tier search strategy (see flow below)
  - [ ] Support Spotify search (exact + soft + hard)
  - [ ] Support Apple Music search (same strategy)
  - [ ] Return confidence scores for matches
  - [ ] Log all search attempts for debugging
  - [ ] Cache results to avoid duplicate API calls
- [ ] Add to playlist push flow (before creating playlist)
- [ ] Track success rates per strategy
- [ ] Generate detailed export report

**3-Tier Search Flow**:
```typescript
/**
 * Smart Platform Resolver - 3-Tier Strategy
 * 
 * When pushing a song to Spotify/Apple Music:
 */

// TIER 1: Direct Link (Best - 100% confidence)
if (song.platformIds?.spotify?.url) {
  return {
    url: song.platformIds.spotify.url,
    tier: 'direct',
    confidence: 100
  };
}

// TIER 2: Soft Search (Good - MusicBrainz confirmed)
if (song.verificationSource === "musicbrainz" || song.musicBrainzId) {
  // MusicBrainz says song exists, but no direct Spotify link
  // Do soft search: "hey jude the beatles"
  const softResults = await spotifySearch(`${title} ${artist}`);
  if (softResults.length > 0) {
    return {
      url: softResults[0].uri,
      tier: 'soft',
      confidence: 85
    };
  }
}

// TIER 3: Hard Search (Strict - Last Resort)
// MusicBrainz didn't find it, but let's try exact match
// Search: artist:"michael jackson" track:"thriller"
const hardResults = await spotifySearchExact(artist, title);
if (hardResults.length > 0) {
  const match = findBestMatch(hardResults, song);
  if (match.score >= 0.85) { // 85% similarity threshold
    return {
      url: match.uri,
      tier: 'hard',
      confidence: match.score * 100
    };
  }
}

// TIER 4: Not Available
return {
  url: null,
  tier: 'failed',
  confidence: 0,
  reason: 'No match found on platform'
};
```

**API Queries**:
```typescript
// Soft search (Tier 2)
// Simple query: "title artist"
GET /v1/search?q=${encodeURIComponent(`${title} ${artist}`)}&type=track&limit=1

// Hard search (Tier 3)
// Exact field search with fuzzy matching
GET /v1/search?q=artist:"${artist}" track:"${title}"&type=track&limit=5

// Validation logic for hard search:
function findBestMatch(results: SpotifyTrack[], song: Song) {
  return results.map(track => ({
    track,
    score: calculateSimilarity(track, song) // Uses Levenshtein distance
  }))
  .sort((a, b) => b.score - a.score)[0];
}

function calculateSimilarity(track: SpotifyTrack, song: Song): number {
  const artistMatch = fuzzyMatch(track.artists[0].name, song.artist);
  const titleMatch = fuzzyMatch(track.name, song.title);
  return (artistMatch + titleMatch) / 2;
}
```

**Export Report Structure**:
```typescript
type ExportReport = {
  playlistName: string;
  platform: 'spotify' | 'apple' | 'tidal' | 'qobuz';
  timestamp: string;
  
  totalSongs: number;
  
  successful: {
    direct: number;      // Tier 1 (MusicBrainz URL)
    softSearch: number;  // Tier 2 (Soft search)
    hardSearch: number;  // Tier 3 (Hard search)
    total: number;
    songs: ExportedSong[];
  };
  
  failed: {
    count: number;
    songs: FailedSong[];
  };
  
  statistics: {
    successRate: number;        // percentage
    averageConfidence: number;  // 0-100
    exportDuration: number;     // milliseconds
  };
};

type ExportedSong = {
  song: Song;
  tier: 'direct' | 'soft' | 'hard';
  confidence: number;
  platformUrl: string;
};

type FailedSong = {
  song: Song;
  reason: string;
  attemptedTiers: string[];
};
```

**UI: Export Report Modal**:
```tsx
// Show after successful export
┌─────────────────────────────────────────────┐
│ ✅ Playlist Exported Successfully           │
├─────────────────────────────────────────────┤
│ "Summer Vibes 2024" → Spotify               │
│                                             │
│ 📊 Export Summary:                          │
│ • Total songs: 25                           │
│ • Successfully added: 23 (92%)              │
│   - Direct links: 18                        │
│   - Smart search: 5                         │
│ • Not available: 2                          │
│                                             │
│ ⚠️ Songs not found on Spotify:              │
│ • "Unknown Track" by Obscure Artist         │
│ • "Fake Song" by Made Up Band               │
│                                             │
│ [View Full Report] [Close]                  │
└─────────────────────────────────────────────┘
```

**Testing Scenarios**:
```typescript
// Test Tier 1: Direct link
✓ Song has MusicBrainz Spotify URL → Use directly
  Expected: confidence = 100, tier = 'direct'

// Test Tier 2: Soft search
✓ Song verified by MusicBrainz, no Spotify URL → Soft search → Found
  Expected: confidence = 85, tier = 'soft'
✗ Soft search returns no results → Continue to Tier 3

// Test Tier 3: Hard search
✓ Not in MusicBrainz → Hard search → Exact match found
  Expected: confidence = 85-95, tier = 'hard'
✗ Hard search → No exact match (score < 85%) → Mark as unavailable
  Expected: confidence = 0, tier = 'failed'

// Test edge cases
✓ Typo in artist name → Hard search catches it (fuzzy match)
✓ Song doesn't exist → All tiers fail → Proper error in report
✓ Multiple exact matches → Pick most popular (followers count)
✓ Special characters in title → URL encoding works correctly
✓ Very long artist/title names → Truncation handles correctly

// Performance tests
✓ Export 50 songs → Completes in < 30 seconds
✓ API rate limits respected → No errors
✓ Network failure → Graceful retry with exponential backoff
```

**Priority**: HIGH | **Time**: 4 hours | **Dependencies**: Phase 4 complete  
**Files**: 
- `src/services/export/smartPlatformResolver.ts` (new)
- `src/services/export/exportReport.ts` (new)
- `src/services/export/types.ts` (new)
- `src/services/spotifyPlaylistService.ts` (update - integrate resolver)
- `src/services/appleMusicExportService.ts` (future - same pattern)
- `src/components/ExportReportModal.tsx` (new)

---

### **4.5.2: Playlist Export Branding** 🆕 CHUNK 2
**Status**: ⏳ Not started

**Purpose**: Add Fonea branding to all exported playlists (mandatory for now, removable with future premium)

**Requirements**:
- [ ] Update `spotifyPlaylistService.ts`
  - [ ] Add branding to playlist description
  - [ ] Format: User description + separator + branding
  - [ ] Ensure branding always appears (non-removable in free version)
- [ ] Update Apple Music export (when implemented)
- [ ] Add feature flag: `ENABLE_BRANDING_REMOVAL` (default: false)
- [ ] In UI, show preview of final description before export
- [ ] Add disclaimer about branding in export modal

**Branding Format**:
```typescript
/**
 * Formats playlist description with Fonea branding
 * 
 * @param userDescription - User's custom description (optional)
 * @returns Formatted description with branding
 */
function formatPlaylistDescription(userDescription?: string): string {
  const branding = `Made with Fonea Sound Curator 🎵
curator.fonea.app`;

  if (!userDescription || userDescription.trim() === '') {
    return branding;
  }

  return `${userDescription.trim()}

---
${branding}`;
}

// Examples:
// Input: ""
// Output: "Made with Fonea Sound Curator 🎵\ncurator.fonea.app"

// Input: "My favorite summer tracks"
// Output: "My favorite summer tracks\n\n---\nMade with Fonea Sound Curator 🎵\ncurator.fonea.app"
```

**UI: Export Modal Preview**:
```tsx
// In PushPlaylistModal.tsx
┌─────────────────────────────────────────────┐
│ 🎵 Export to Spotify                        │
├─────────────────────────────────────────────┤
│ Playlist Name:                              │
│ [Summer Vibes 2024____________]             │
│                                             │
│ Description (optional):                     │
│ [My favorite tracks for beach days_____]    │
│                                             │
│ Preview:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ My favorite tracks for beach days       │ │
│ │                                         │ │
│ │ ---                                     │ │
│ │ Made with Fonea Sound Curator 🎵        │ │
│ │ curator.fonea.app                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ℹ️ Branding can be removed with Premium     │
│    (coming soon)                            │
│                                             │
│ [Cancel] [Export to Spotify]                │
└─────────────────────────────────────────────┘
```

**Feature Flag System**:
```typescript
// src/config/features.ts
export const FEATURES = {
  // Branding
  BRANDING_ON_EXPORT: {
    enabled: true,
    removable: false, // Will be true for premium users
  },
  
  // Future premium features
  REMOVE_BRANDING: {
    enabled: false,
    premium: true,
    betaFree: false,
  },
};

// Usage in code:
if (FEATURES.BRANDING_ON_EXPORT.enabled && !FEATURES.BRANDING_ON_EXPORT.removable) {
  // Always add branding
  description = formatPlaylistDescription(userDescription);
}
```

**Testing**:
- [ ] Export playlist with no description → Branding only ✓
- [ ] Export playlist with description → Description + branding ✓
- [ ] User edits description → Branding remains at bottom ✓
- [ ] Preview shows correct formatting ✓
- [ ] Multiple line breaks in user description → Handled correctly ✓
- [ ] Very long descriptions → Truncated if needed, branding preserved ✓
- [ ] Special characters in description → Encoded correctly ✓

**Priority**: HIGH | **Time**: 1.5 hours | **Dependencies**: Chunk 1  
**Files**: 
- `src/services/spotifyPlaylistService.ts` (update)
- `src/components/PushPlaylistModal.tsx` (update - add preview)
- `src/config/features.ts` (new)
- `src/utils/formatters.ts` (new - formatting utilities)

---

### **4.5.3: Buy Me a Coffee Integration** 🆕 CHUNK 3
**Status**: ⏳ Not started

**Purpose**: Add support link for users who want to contribute to the project

**Requirements**:
- [ ] Set up Buy Me a Coffee account (see setup guide below)
- [ ] Add configuration to project
- [ ] Create "Support" section in Settings
- [ ] Add "Buy Me a Coffee" button with link
- [ ] Add in About modal as well
- [ ] Optional: Track clicks with analytics

**Configuration**:
```typescript
// src/config/links.ts
export const EXTERNAL_LINKS = {
  // Support
  buyMeCoffee: "https://buymeacoffee.com/yourprofile", // TODO: Add your profile
  
  // Project links
  github: "https://github.com/joakirrin/music-curator",
  
  // Social (optional)
  twitter: "", // Add if you want
  linkedin: "", // Add if you want
  
  // Legal (future)
  privacyPolicy: "/privacy",
  termsOfService: "/terms",
};

// Validation on build
if (!EXTERNAL_LINKS.buyMeCoffee.includes('buymeacoffee.com')) {
  console.warn('⚠️ Buy Me a Coffee link not configured yet');
}
```

**UI: Settings Drawer - Support Section**:
```tsx
// In SettingsDrawer.tsx
┌─────────────────────────────────────────────┐
│ ⚙️ Settings                                  │
├─────────────────────────────────────────────┤
│ [User preferences...]                       │
│ [Display options...]                        │
│ [Data management...]                        │
│                                             │
│ ───────────────────────────────────────     │
│                                             │
│ ☕ Support Fonea                             │
│ Enjoying the app? Help keep it running!     │
│                                             │
│ [☕ Buy Me a Coffee]                        │
│                                             │
│ Your support helps cover:                   │
│ • ChatGPT API costs                         │
│ • Development time                          │
│ • Server hosting                            │
└─────────────────────────────────────────────┘
```

**UI: About Modal**:
```tsx
// src/components/AboutModal.tsx
┌─────────────────────────────────────────────┐
│ 🎵 Fonea Sound Curator                      │
│ Version 1.0.0-beta                          │
├─────────────────────────────────────────────┤
│ Your AI-powered music curator               │
│                                             │
│ Made with ❤️ by [Your Name]                │
│                                             │
│ Built with:                                 │
│ • React + TypeScript                        │
│ • Spotify API                               │
│ • MusicBrainz                               │
│ • OpenAI ChatGPT                            │
│                                             │
│ Links:                                      │
│ [🐙 GitHub]  [☕ Buy Me a Coffee]           │
│                                             │
│ [Close]                                     │
└─────────────────────────────────────────────┘
```

**Button Component**:
```tsx
// src/components/BuyMeCoffeeButton.tsx
import { Coffee } from 'lucide-react';
import { EXTERNAL_LINKS } from '@/config/links';

export function BuyMeCoffeeButton() {
  const handleClick = () => {
    window.open(EXTERNAL_LINKS.buyMeCoffee, '_blank', 'noopener,noreferrer');
    
    // Optional: Track click
    if (typeof window.analytics !== 'undefined') {
      window.analytics.track('Support Click', {
        platform: 'buymeacoffee',
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
    >
      <Coffee className="w-4 h-4" />
      Buy Me a Coffee
    </button>
  );
}
```

**Testing**:
- [ ] Click "Buy Me a Coffee" → Opens in new tab ✓
- [ ] Link includes noopener,noreferrer (security) ✓
- [ ] Button styling matches app theme ✓
- [ ] Button accessible (keyboard navigation) ✓
- [ ] Works on mobile ✓
- [ ] Settings section looks good ✓
- [ ] About modal displays correctly ✓

**Priority**: MEDIUM | **Time**: 1 hour | **Dependencies**: None  
**Files**: 
- `src/components/BuyMeCoffeeButton.tsx` (new)
- `src/components/SettingsDrawer.tsx` (update)
- `src/components/AboutModal.tsx` (new)
- `src/config/links.ts` (new)

**Setup Guide**: See separate document: `BUY_ME_A_COFFEE_SETUP.md`

---

### **4.5.4: Premium Feature System** 🆕 CHUNK 4
**Status**: ⏳ Not started

**Purpose**: Prepare UI/UX for future premium features (no payment integration yet - just the framework)

**Key Principle**: Build the framework now, implement payments later

**Requirements**:
- [ ] Create feature flag system
- [ ] Add "Premium" badges to future paid features
- [ ] Add "Free during beta" messaging
- [ ] Create Premium preview section in Settings
- [ ] Create reusable hooks for checking feature access
- [ ] Document feature flag architecture

**Feature Flag Architecture**:
```typescript
// src/config/features.ts
export type FeatureAccess = 'free' | 'premium' | 'beta-free';

export interface Feature {
  id: string;
  name: string;
  description: string;
  access: FeatureAccess;
  enabled: boolean;
  betaFreeUntil?: string; // ISO date string
}

export const FEATURES: Record<string, Feature> = {
  // Core features (always free)
  chatgptImport: {
    id: 'chatgpt-import',
    name: 'ChatGPT Import',
    description: 'Import song recommendations from ChatGPT',
    access: 'free',
    enabled: true,
  },
  
  spotifyExport: {
    id: 'spotify-export',
    name: 'Spotify Export',
    description: 'Push playlists to Spotify',
    access: 'free',
    enabled: true,
  },
  
  // Future premium features (currently free during beta)
  removeBranding: {
    id: 'remove-branding',
    name: 'Remove Branding',
    description: 'Remove "Made with Fonea" from exports',
    access: 'premium',
    enabled: false, // Not implemented yet
    betaFreeUntil: '2025-12-31',
  },
  
  gptCoverGenerator: {
    id: 'gpt-cover-generator',
    name: 'AI Cover Art',
    description: 'Generate custom playlist covers with AI',
    access: 'premium',
    enabled: false, // Not implemented yet
    betaFreeUntil: '2025-12-31',
  },
  
  advancedAnalytics: {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Detailed playlist analytics and insights',
    access: 'premium',
    enabled: false, // Not implemented yet
    betaFreeUntil: '2025-12-31',
  },
  
  // System flags
  betaMode: {
    id: 'beta-mode',
    name: 'Beta Mode',
    description: 'App is in beta - all premium features free',
    access: 'free',
    enabled: true,
  },
};

// Helper functions
export function isFeatureEnabled(featureId: string): boolean {
  return FEATURES[featureId]?.enabled ?? false;
}

export function isFeaturePremium(featureId: string): boolean {
  return FEATURES[featureId]?.access === 'premium';
}

export function isFeatureBetaFree(featureId: string): boolean {
  const feature = FEATURES[featureId];
  if (!feature || feature.access !== 'premium') return false;
  
  if (!feature.betaFreeUntil) return false;
  
  const betaEndDate = new Date(feature.betaFreeUntil);
  return new Date() < betaEndDate;
}
```

**Premium Badge Component**:
```tsx
// src/components/PremiumBadge.tsx
import { Star, Clock } from 'lucide-react';
import { isFeatureBetaFree, FEATURES } from '@/config/features';

interface PremiumBadgeProps {
  featureId: string;
  size?: 'sm' | 'md';
}

export function PremiumBadge({ featureId, size = 'md' }: PremiumBadgeProps) {
  const isBetaFree = isFeatureBetaFree(featureId);
  const feature = FEATURES[featureId];
  
  if (!feature || feature.access !== 'premium') return null;
  
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-3 py-1';
  
  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} bg-gradient-to-r from-amber-400 to-orange-500 text-white font-medium`}
      title={feature.description}
    >
      <Star className="w-3 h-3" />
      Premium
      {isBetaFree && (
        <>
          <span className="text-amber-100">·</span>
          <Clock className="w-3 h-3" />
          <span className="text-amber-100">Free in Beta</span>
        </>
      )}
    </span>
  );
}
```

**React Hook for Feature Access**:
```tsx
// src/hooks/useFeature.ts
import { useEffect, useState } from 'react';
import { FEATURES, isFeatureEnabled, isFeaturePremium, isFeatureBetaFree } from '@/config/features';

export function useFeature(featureId: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isBetaFree, setIsBetaFree] = useState(false);
  
  useEffect(() => {
    const feature = FEATURES[featureId];
    if (!feature) {
      setHasAccess(false);
      return;
    }
    
    const premium = isFeaturePremium(featureId);
    const betaFree = isFeatureBetaFree(featureId);
    
    setIsPremium(premium);
    setIsBetaFree(betaFree);
    
    // Check access
    if (feature.access === 'free') {
      setHasAccess(true);
    } else if (premium && betaFree) {
      setHasAccess(true); // Free during beta
    } else if (premium) {
      // TODO: Check if user has premium subscription
      setHasAccess(false);
    }
  }, [featureId]);
  
  return {
    hasAccess,
    isPremium,
    isBetaFree,
    feature: FEATURES[featureId],
  };
}

// Usage example:
function ExportModal() {
  const { hasAccess, isBetaFree } = useFeature('remove-branding');
  
  return (
    <div>
      {hasAccess ? (
        <label>
          <input type="checkbox" />
          Remove branding
          {isBetaFree && <span className="text-green-600 ml-2">Free in beta!</span>}
        </label>
      ) : (
        <div className="opacity-50">
          Remove branding <PremiumBadge featureId="remove-branding" size="sm" />
        </div>
      )}
    </div>
  );
}
```

**Settings: Premium Preview Section**:
```tsx
// In SettingsDrawer.tsx
┌─────────────────────────────────────────────┐
│ ⭐ Premium Features                          │
├─────────────────────────────────────────────┤
│ 🎉 Free during beta - Try them now!         │
│                                             │
│ Coming soon:                                │
│                                             │
│ ✨ Remove Fonea branding                    │
│    Export playlists without attribution     │
│                                             │
│ 🎨 AI Cover Art Generator                   │
│    Create custom covers with GPT            │
│                                             │
│ 📊 Advanced Analytics                       │
│    Deep insights into your music taste      │
│                                             │
│ 🎯 Priority Support                         │
│    Direct help when you need it             │
│                                             │
│ [🔔 Notify Me When Available]               │
│                                             │
│ ℹ️ All features currently free in beta      │
│    Help us test and give feedback!          │
└─────────────────────────────────────────────┘
```

**Documentation**:
```markdown
// src/config/FEATURES.md
# Feature Flag System

## Overview
Fonea uses a feature flag system to manage access to features, especially premium features that will require payment in the future.

## Feature Types

1. **Free Features**: Available to all users, always
   - ChatGPT import
   - Spotify export
   - Basic playlist management

2. **Premium Features**: Will require payment (free during beta)
   - Remove branding
   - AI cover art
   - Advanced analytics

3. **Beta Features**: Experimental features being tested

## Adding a New Feature

```typescript
// 1. Add to FEATURES object in features.ts
myNewFeature: {
  id: 'my-new-feature',
  name: 'My New Feature',
  description: 'What it does',
  access: 'premium', // or 'free'
  enabled: false, // true when ready
  betaFreeUntil: '2025-12-31', // optional
}

// 2. Use in components
import { useFeature } from '@/hooks/useFeature';

function MyComponent() {
  const { hasAccess } = useFeature('my-new-feature');
  
  if (!hasAccess) {
    return <PremiumBadge featureId="my-new-feature" />;
  }
  
  return <ActualFeature />;
}
```

## Future: Payment Integration
When ready to implement payments:
1. Add Stripe/other payment provider
2. Create user subscription model
3. Update `useFeature` to check subscription status
4. Set `betaMode` to false
5. Set individual features' `betaFreeUntil` to past dates
```

**Testing**:
- [ ] Feature flags work correctly ✓
- [ ] Badges show on correct features ✓
- [ ] "Free in beta" message displays when appropriate ✓
- [ ] useFeature hook returns correct values ✓
- [ ] Settings preview looks good ✓
- [ ] Can toggle features for testing ✓
- [ ] Beta expiration logic works ✓

**Priority**: MEDIUM | **Time**: 2.5 hours | **Dependencies**: None  
**Files**: 
- `src/config/features.ts` (new)
- `src/config/FEATURES.md` (new - documentation)
- `src/components/PremiumBadge.tsx` (new)
- `src/hooks/useFeature.ts` (new)
- `src/components/SettingsDrawer.tsx` (update - add premium preview)

---

### **4.5.5: About/Credits Section** 🆕 CHUNK 5
**Status**: ⏳ Not started

**Purpose**: Add app information, credits, version tracking, and useful links

**Requirements**:
- [ ] Create `AboutModal.tsx`
- [ ] Show app version (from package.json)
- [ ] Show credits (your name, contributors)
- [ ] Links to GitHub, Buy Me a Coffee, social
- [ ] Show tech stack
- [ ] Add keyboard shortcut to open (Cmd/Ctrl + ?)
- [ ] Future: Add privacy policy link when needed

**Version Management**:
```typescript
// src/config/version.ts
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;
export const APP_NAME = 'Fonea Sound Curator';
export const APP_STAGE = 'beta'; // 'alpha' | 'beta' | 'stable'

export function getFullVersion(): string {
  return `${APP_VERSION}-${APP_STAGE}`;
}

// Example: "1.0.0-beta"
```

**About Modal Component**:
```tsx
// src/components/AboutModal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { X, Github, Coffee, ExternalLink } from 'lucide-react';
import { APP_NAME, getFullVersion } from '@/config/version';
import { EXTERNAL_LINKS } from '@/config/links';

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                🎵 {APP_NAME}
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">
                Version {getFullVersion()}
              </p>
            </div>
            <Dialog.Close className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Your AI-powered music curator. Discover, organize, and share your perfect playlists.
          </p>

          {/* Credits */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Made with ❤️ by</h3>
            <p className="text-gray-600">[Your Name]</p>
            {/* Add contributors here when applicable */}
          </div>

          {/* Tech Stack */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Built with</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• React + TypeScript</li>
              <li>• Spotify Web API</li>
              <li>• MusicBrainz</li>
              <li>• OpenAI ChatGPT</li>
              <li>• Tailwind CSS</li>
            </ul>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-2 mb-6">
            <a
              href={EXTERNAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
            
            <a
              href={EXTERNAL_LINKS.buyMeCoffee}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm transition-colors"
            >
              <Coffee className="w-4 h-4" />
              Buy Me a Coffee
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Legal (future) */}
          <div className="text-xs text-gray-500 space-x-3">
            <a href="/privacy" className="hover:text-gray-700">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-gray-700">Terms of Service</a>
          </div>

          {/* Close button */}
          <Dialog.Close asChild>
            <button className="w-full mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

**Keyboard Shortcut**:
```tsx
// In App.tsx or layout component
import { useEffect, useState } from 'react';
import { AboutModal } from '@/components/AboutModal';

export function App() {
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + ? to open About
      if ((e.metaKey || e.ctrlKey) && e.key === '?') {
        e.preventDefault();
        setAboutOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* App content */}
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}
```

**Settings Integration**:
```tsx
// Add to SettingsDrawer.tsx
┌─────────────────────────────────────────────┐
│ ⚙️ Settings                                  │
├─────────────────────────────────────────────┤
│ [... other settings ...]                    │
│                                             │
│ ───────────────────────────────────────     │
│                                             │
│ ℹ️ About                                    │
│                                             │
│ [About Fonea Sound Curator]                 │
│                                             │
│ Keyboard shortcuts:                         │
│ • Cmd/Ctrl + ? : Open About                 │
│ • Cmd/Ctrl + , : Open Settings              │
└─────────────────────────────────────────────┘
```

**Testing**:
- [ ] Modal opens correctly ✓
- [ ] Version number displays from package.json ✓
- [ ] All links work and open in new tab ✓
- [ ] Links include security attributes (noopener, noreferrer) ✓
- [ ] Keyboard shortcut (Cmd/Ctrl + ?) works ✓
- [ ] Modal is accessible (keyboard navigation, screen readers) ✓
- [ ] Responsive on mobile ✓
- [ ] Can close with Escape key ✓

**Priority**: LOW | **Time**: 1.5 hours | **Dependencies**: Chunks 3 & 4  
**Files**: 
- `src/components/AboutModal.tsx` (new)
- `src/config/version.ts` (new)
- `src/components/SettingsDrawer.tsx` (update)
- `src/App.tsx` (update - add keyboard shortcut)

---

## 📊 PHASE 4.5 PROGRESS TRACKER

### Smart Export + Branding (4.5.1-4.5.5)
- [ ] 4.5.1: Smart Platform Search Fallback ⏳ 0%
- [ ] 4.5.2: Playlist Export Branding ⏳ 0%
- [ ] 4.5.3: Buy Me a Coffee Integration ⏳ 0%
- [ ] 4.5.4: Premium Feature System ⏳ 0%
- [ ] 4.5.5: About/Credits Section ⏳ 0%

**Overall**: 0% complete | **Estimated Time**: ~10.5 hours

---

## ✅ PHASE 4: UNIVERSAL VERIFICATION SYSTEM (COMPLETE)

### **4.1: MusicBrainz Verification Service** ✅ COMPLETE
- [x] Created `src/services/verification/musicBrainzVerification.ts`
- [x] Search MusicBrainz API (artist + title)
- [x] Parse metadata (album, year, ISRC)
- [x] Extract platform links
- [x] Handle rate limits (1 request/second)

### **4.2: iTunes Fallback + Preview URLs** ✅ COMPLETE
- [x] Implemented `itunesVerification.ts`
- [x] Get 30-second preview URLs
- [x] Get high-resolution album artwork
- [x] Use as fallback when MusicBrainz fails

### **4.3: Verification Orchestrator** ✅ COMPLETE
- [x] Implemented `verificationOrchestrator.ts`
- [x] Try MusicBrainz first
- [x] Fetch iTunes data for previews
- [x] Merge results intelligently
- [x] Return comprehensive VerificationResult

### **4.4: Platform ISRC Resolvers** ✅ COMPLETE
- [x] Implemented `spotifyIsrcResolver.ts`
  - Uses ISRC from MusicBrainz
  - ~60-80% success rate
  - OAuth required
- [x] Implemented `appleMusicIsrcResolver.ts`
  - Uses ISRC from MusicBrainz
  - ~70-90% success rate
  - No auth required
- [x] Automatic resolution after MusicBrainz verification
- [x] Platform buttons show when direct links available

### **4.5: Update Import Flow** ✅ COMPLETE
- [x] Universal verification by default (no login required)
- [x] Spotify verification as optional enhancement
- [x] Show verification source in badges
- [x] Updated progress messages

### **4.6: Preview Player Component** ✅ COMPLETE
- [x] Play/pause functionality
- [x] Progress bar with seeking
- [x] Shows preview source and duration
- [x] Auto-stop when playing another preview

---

## ✅ PHASE 3: PLAYLIST MANAGEMENT & SPOTIFY PUSH (COMPLETE)

### **3.1: Local Playlist Management** ✅ COMPLETE
- [x] Data model & state management
- [x] Creation UI
- [x] View playlists (drawer)
- [x] Add songs (individual)

### **3.2: Spotify Playlist Operations** ✅ COMPLETE
- [x] Push playlist to Spotify
- [x] `spotifyPlaylistService.ts` - Create playlists, add tracks
- [x] `PushPlaylistModal.tsx` - Progress tracking UI
- [x] `PlaylistsDrawer.tsx` - Push button integration

---

## ✅ PHASE 2: FEEDBACK & LEARNING (COMPLETE)

### Task 2.1: Verification Status Filter ✅
- Completed with filter buttons and counts

### Task 2.2: Smart Replacement Suggestions ✅
- Completed with ChatGPT prompt generation and failed tracks modal

---

## ✅ PHASE 1: CORE FUNCTIONALITY (COMPLETE)

All Phase 1 tasks completed ✅
- Song management
- ChatGPT integration
- Review system
- Filtering
- Export
- UI polish

---

## 🔮 PHASE 5: MULTI-PLATFORM SYNC (PENDING)

### **5.1: Platform-Specific Verification on Demand**
**Status**: ⏳ Planned for after Phase 4.5

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
Use Smart Platform Resolver (from Phase 4.5) for remaining songs
    ↓
Push playlist ✓
```

**Note**: Phase 4.5 (Smart Platform Resolver) already handles most of this! This phase may be simplified or merged.

---

### **5.2: Apple Music Full Integration**
**Status**: ⏳ Not started

**Requirements**:
- [ ] MusicKit JS integration
- [ ] Apple Music OAuth
- [ ] Push playlists to Apple Music (using Smart Resolver from 4.5.1)
- [ ] Get 90-second preview URLs (requires login)
- [ ] Import playlists from Apple Music

**Priority**: MEDIUM | **Dependencies**: Phase 4.5 complete

---

### **5.3: Tidal Integration**
**Status**: ⏳ Not started

**Requirements**:
- [ ] Research Tidal unofficial API
- [ ] Tidal OAuth (if possible)
- [ ] Search and verify with Tidal
- [ ] Push playlists to Tidal (using Smart Resolver pattern)
- [ ] Handle HiFi/MQA metadata

**Priority**: LOW | **Dependencies**: Phase 4.5 complete  
**Note**: Unofficial API = risk of breaking changes

---

### **5.4: Qobuz Integration**
**Status**: ⏳ Not started

**Requirements**:
- [ ] Review Qobuz API documentation
- [ ] Implement OAuth if required
- [ ] 60-second preview URLs
- [ ] Push playlists to Qobuz
- [ ] Hi-res artwork support

**Priority**: MEDIUM | **Dependencies**: Phase 4.5 complete

---

## 🎯 PHASE 6: ADVANCED FEATURES + PREMIUM (PENDING)

### **6.1: Premium Features - Full Implementation**
**Status**: ⏳ Roadmap only (Framework in Phase 4.5)

**Features to Implement**:

#### 6.1.1: Remove Branding (Premium)
- [ ] Implement checkbox in export modal
- [ ] Check premium status before allowing removal
- [ ] Update `formatPlaylistDescription()` to respect flag

#### 6.1.2: AI Cover Art Generator (Premium)
- [ ] Research best approach:
  - DALL-E 3 (OpenAI)
  - Midjourney API (if available)
  - Claude + Artifacts with image generation
  - Stable Diffusion
- [ ] Implement prompt generation based on:
  - Playlist name
  - Genre distribution
  - Mood/vibe of songs
  - User preferences
- [ ] Generate multiple options
- [ ] Allow user to select/download
- [ ] Upload directly to Spotify/Apple Music

**Example Prompt Engineering**:
```typescript
function generateCoverPrompt(playlist: Playlist): string {
  const genres = analyzeGenres(playlist.songs);
  const mood = analyzeMood(playlist.songs);
  const era = analyzeEra(playlist.songs);
  
  return `Create a modern, minimalist album cover for a playlist called "${playlist.name}". 
  Musical style: ${genres.join(', ')}. 
  Mood: ${mood}. 
  Era: ${era}. 
  Style: Abstract, vibrant colors, suitable for streaming platforms.`;
}
```

#### 6.1.3: Advanced Analytics (Premium)
- [ ] Fetch audio features from Spotify
  - Energy, valence, danceability, tempo
- [ ] Create analytics dashboard:
  - Genre distribution pie chart
  - Energy/mood scatter plot
  - Decade distribution timeline
  - Top artists/labels
- [ ] Export analytics as PDF report
- [ ] Compare playlists

#### 6.1.4: Priority Support (Premium)
- [ ] Set up support ticket system
  - Discord server with premium channel?
  - Email support with SLA?
  - In-app chat?
- [ ] Premium users get faster responses
- [ ] Direct feature requests

---

### **6.2: Payment Integration**
**Status**: ⏳ Not started (depends on user feedback & adoption)

**Options to Evaluate**:

#### Option A: Stripe Subscriptions (Recommended)
```
Pricing Ideas:
├── Free Tier
│   ├── All core features
│   ├── Unlimited imports
│   ├── Unlimited playlists
│   └── Branding on exports
│
├── Premium ($4.99/month or $49/year)
│   ├── Remove branding
│   ├── AI cover art (5/month)
│   ├── Advanced analytics
│   └── Priority support
│
└── Pro ($9.99/month or $99/year)
    ├── All Premium features
    ├── AI cover art (unlimited)
    ├── API access (future)
    └── Early access to new features
```

**Implementation**:
- [ ] Set up Stripe account
- [ ] Create subscription products
- [ ] Implement Stripe Checkout
- [ ] Webhook handling for events
- [ ] User subscription management
- [ ] Update `useFeature` hook to check Stripe status

#### Option B: One-Time Payment (Lifetime Access)
```
$29.99 - Lifetime Premium
├── All premium features
├── Forever access
└── All future updates
```

#### Option C: Freemium + Pay-Per-Feature
```
Free core app
├── Remove branding: $2.99 one-time
├── AI cover art: $0.99 per cover
└── Analytics: $4.99 one-time
```

**Decision Point**: Wait for user feedback during beta before committing to payment model

---

### **6.3: Sync Changes to Existing Playlists**
**Status**: ⏳ Not started

**Requirements**:
- [ ] Track local changes to playlists
- [ ] Show diff preview (additions/removals)
- [ ] "Sync" button on playlists already pushed to Spotify
- [ ] Handle conflicts (if edited on Spotify)
- [ ] Update existing playlists instead of creating new ones

---

### **6.4: Import Playlists from Platforms**
**Status**: ⏳ Not started

**Requirements**:
- [ ] Import from Spotify
  - OAuth → Get user's playlists
  - Select playlists to import
  - Import all songs with metadata
- [ ] Import from Apple Music
- [ ] Import from Qobuz
- [ ] Continue curating in Fonea
- [ ] Detect duplicates across platforms

**Use Case**: User wants to consolidate playlists from multiple platforms into Fonea for unified curation

---

### **6.5: Collaborative Features**
**Status**: ⏳ Not started (requires backend)

**Requirements**:
- [ ] Share playlists with friends (read-only link)
- [ ] Collaborative curation (multiple editors)
- [ ] Export/import playlist files (.json)
- [ ] Comments on songs
- [ ] Voting system for collaborative playlists

**Note**: Requires backend infrastructure (Firebase, Supabase, or custom)

---

### **6.6: Audio Features & Smart Recommendations**
**Status**: ⏳ Not started

**Requirements**:
- [ ] Fetch audio features from Spotify
- [ ] Analyze playlist cohesion
- [ ] Suggest reordering for better flow
- [ ] Recommend similar songs to fill gaps
- [ ] "Mood playlist" generator
- [ ] BPM-based workout playlists

---

## 🎯 KEY ARCHITECTURAL DECISIONS

### Multi-Platform Strategy
1. **Universal verification first** (MusicBrainz + iTunes) - NO LOGIN ✅
2. **Platform-specific on-demand** (when pushing) - LOGIN REQUIRED ✅
3. **Smart fallback strategy** (Phase 4.5) - 3-tier search 🚧
4. **Graceful degradation** (works without any platform login) ✅
5. **Progressive enhancement** (better with platform logins) ✅

### Data Model
```typescript
type Song = {
  // Core data
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
  
  // Universal verification (NO LOGIN)
  verificationStatus: "verified-universal" | "verified-spotify" | "verified-multi" | "failed";
  verificationSource: "musicbrainz" | "itunes" | "spotify" | "apple" | "qobuz" | "multi";
  musicBrainzId?: string;
  isrc?: string;
  
  // Universal metadata (from MusicBrainz/iTunes)
  albumArtUrl?: string;
  previewUrl?: string;
  previewSource?: "itunes" | "qobuz" | "apple";
  releaseDate?: string;
  
  // Platform-specific IDs (lazy loaded on-demand or via ISRC)
  platformIds?: {
    spotify?: { id: string; uri: string; url: string; };
    apple?: { id: string; url: string; };
    tidal?: { id: string; url: string; };
    qobuz?: { id: string; url: string; };
  };
  
  // Curation data
  source: "chatgpt" | "manual" | "import";
  round?: number;
  feedback: "pending" | "like" | "dislike" | "skip";
  comments?: string;
  addedAt: string;
  
  // Playlist data
  platforms: string[];
  liked: boolean;
  toAdd: boolean;
};
```

### Preview Strategy
- **Primary**: iTunes (30s, no auth) ✅
- **Upgrade**: Qobuz (60s, no auth) - Future
- **Future**: Apple Music (90s, requires auth), Tidal (full, requires auth)

### Export Strategy (Phase 4.5)
- **Tier 1**: Direct platform URLs from MusicBrainz ✅
- **Tier 2**: Soft search (MusicBrainz confirmed existence) 🚧
- **Tier 3**: Hard search (exact match validation) 🚧
- **Tier 4**: Mark as unavailable, report to user 🚧

### Service Priority (for push)
1. Spotify (largest userbase, done ✅)
2. Apple Music (second largest, ISRC resolver done ✅)
3. Qobuz (audiophile focus, official API) - Planned
4. Tidal (unofficial API, higher risk) - Planned

---

## 📅 IMPLEMENTATION TIMELINE

### Phase 4 (Complete) ✅
Week 1: Universal Verification System
- Days 1-2: MusicBrainz + iTunes services
- Days 3-4: Orchestrator + ISRC resolvers
- Day 5: Testing + Polish

### Phase 4.5 (Current - Smart Export + Branding)
Week 2:
```
Day 1-2: Chunk 1 (Smart Platform Resolver - 4h)
  - 3-tier search strategy
  - Spotify + Apple Music support
  - Export report generation
  - Integration testing

Day 2: Chunk 2 (Playlist Branding - 1.5h)
  - Description formatter
  - Export preview UI
  - Feature flag system

Day 3: Chunk 3 (Buy Me a Coffee - 1h)
  - Account setup
  - Integration in Settings
  - Button component

Day 3: Chunk 4 (Premium System - 2.5h)
  - Feature flags architecture
  - Premium badges
  - useFeature hook
  - Settings preview

Day 4: Chunk 5 (About Section - 1.5h)
  - About modal
  - Version management
  - Keyboard shortcuts

Day 4-5: Integration Testing + Polish
  - End-to-end export testing
  - UI/UX review
  - Documentation

Total: ~10.5 hours focused work
```

### Phase 5 (Future - Multi-Platform Sync)
After Phase 4.5 complete + user feedback
- Based on most-requested platform
- Estimated: 2-3 weeks per platform

### Phase 6 (Future - Advanced Features + Premium)
After Phase 5 or based on early monetization needs
- Payment integration: 1 week
- AI cover art: 1-2 weeks
- Advanced analytics: 1-2 weeks
- Collaborative features: 3-4 weeks (requires backend)

---

## 🧪 TESTING STRATEGY

### After Each Chunk:
1. ✅ Unit test (does the function work?)
2. ✅ Integration test (does it work with other chunks?)
3. ✅ User test (does the UI work?)
4. ✅ Performance test (is it fast enough?)

### Phase 4.5 Acceptance Tests:

#### Test 1: Smart Export (Tier 1 - Direct)
```
1. Open app, login to Spotify
2. Import 10 songs from ChatGPT
3. All songs verify with MusicBrainz
4. All songs get Spotify URLs via ISRC resolver
5. Create playlist "Test Playlist"
6. Push to Spotify
7. Expected: All 10 songs exported successfully (Tier 1: Direct)
8. Verify on Spotify app
9. Check playlist description includes branding ✓
```

#### Test 2: Smart Export (Tier 2 - Soft Search)
```
1. Open app
2. Manually add 5 songs that exist on Spotify but not in MusicBrainz database
3. Songs verify with MusicBrainz (existence confirmed)
4. Songs don't have Spotify URLs
5. Create playlist "Soft Search Test"
6. Push to Spotify
7. Expected: Songs found via soft search, report shows Tier 2
8. Verify songs match correctly ✓
```

#### Test 3: Smart Export (Tier 3 - Hard Search)
```
1. Open app
2. Add 3 songs that MusicBrainz can't find
3. Create playlist "Hard Search Test"
4. Push to Spotify
5. Expected: Hard search finds exact matches, report shows Tier 3
6. Verify high confidence scores (>85%) ✓
```

#### Test 4: Export Report
```
1. Create playlist with mixed verification statuses
2. Push to Spotify
3. Check export report shows:
   - Total songs attempted
   - Success breakdown by tier
   - Failed songs with reasons
4. Report UI is clear and helpful ✓
```

#### Test 5: Branding
```
1. Create playlist with description "My summer jams"
2. Push to Spotify
3. Check Spotify playlist description includes:
   - User description
   - Separator line
   - "Made with Fonea Sound Curator"
   - "curator.fonea.app"
4. Verify formatting is clean ✓
```

#### Test 6: Buy Me a Coffee
```
1. Open Settings
2. Navigate to Support section
3. Click "Buy Me a Coffee"
4. Opens in new tab with correct URL
5. Security attributes present (noopener, noreferrer) ✓
```

#### Test 7: Premium Badges
```
1. Navigate to Settings → Premium Preview
2. Verify all future premium features listed
3. Verify "Free in beta" badges show
4. Check badge styling matches design ✓
```

#### Test 8: About Modal
```
1. Press Cmd/Ctrl + ?
2. About modal opens
3. Version number displays correctly
4. All links work
5. Can close with Escape ✓
```

### Final Acceptance Test (Phase 4.5):
```
1. Open app (Spotify logged in)
2. Import 20 songs from ChatGPT
3. Songs verify with MusicBrainz + ISRC resolver
4. Create playlist "Phase 4.5 Test"
5. Add custom description
6. Push to Spotify
7. Smart resolver runs (uses all tiers as needed)
8. Export report shows results
9. Check Spotify playlist has branding
10. Open Settings → Support
11. Click Buy Me a Coffee (opens correctly)
12. Open Settings → Premium Preview
13. Badges show correctly
14. Press Cmd+? to open About
15. All info displays correctly ✓

Success criteria:
- ≥95% of songs exported successfully
- Export report is accurate
- Branding appears correctly
- All links work
- UI is polished
```

---

## 🎯 SUCCESS METRICS

### Phase 4 Goals (Achieved): ✅
- **Before**: 100% require Spotify login for verification
- **After**: 0% require login for verification ✅

- **Before**: ~30% verification failures (hallucinations)
- **After**: <5% verification failures (real songs only) ✅

- **Before**: No preview capability
- **After**: 30s previews for 90%+ of songs ✅

- **Before**: Spotify-only
- **After**: Platform-agnostic, ready for multi-platform ✅

### Phase 4.5 Goals:
- **Export Success Rate**: ≥95% of real songs successfully exported
- **Smart Resolver**: 
  - Tier 1 (Direct): 60-80% of songs
  - Tier 2 (Soft): 10-20% of songs
  - Tier 3 (Hard): 5-10% of songs
  - Failed: <5% of songs
- **Branding**: 100% of exports include branding
- **User Adoption**: 
  - ≥10 Beta testers by end of phase
  - ≥5 Buy Me a Coffee supporters
- **Bug Rate**: <3 critical bugs per week

---

## 📝 NOTES

### Rate Limits & Performance
- **MusicBrainz**: 1 request/second (enforced) ✅
- **iTunes**: No rate limits ✅
- **Spotify Search**: 
  - 10 requests/second (generous)
  - Smart resolver may use 1-3 searches per song
  - Batch exports should complete in <30 seconds for 50 songs
- **Apple Music Search**: 20 calls/minute (200/hour)

### Backwards Compatibility
- Keep `spotifyVerification.ts` for users who prefer it ✅
- Support both old and new Song data structures ✅
- Migrate gradually, no breaking changes ✅
- Old playlists without branding remain unchanged

### Security Best Practices
- All external links use `noopener,noreferrer`
- API keys never exposed in client
- OAuth tokens stored securely
- Rate limiting prevents abuse
- Input validation on all user data

### Future Considerations
- ISRC codes for cross-platform matching ✅ (Already implemented!)
- Acoustid fingerprinting for audio matching (Phase 6)
- Local file analysis (Phase 6)
- Cloud backup (Phase 6 - requires backend)
- Mobile apps (iOS/Android) - Post-MVP

---

## 🚀 GETTING STARTED WITH PHASE 4.5

### Developer Setup
```bash
# 1. Ensure Phase 4 is complete and tested
npm run test:phase4

# 2. Create feature branch
git checkout -b feature/phase-4.5-smart-export

# 3. Install any new dependencies (if needed)
npm install

# 4. Start development server
npm run dev

# 5. Follow chunks in order: 4.5.1 → 4.5.2 → 4.5.3 → 4.5.4 → 4.5.5
```

### First Steps (Chunk 4.5.1)
1. Read this entire task list
2. Review existing `spotifyPlaylistService.ts`
3. Create `src/services/export/` directory
4. Implement `smartPlatformResolver.ts` with 3-tier strategy
5. Write unit tests for each tier
6. Integrate with export flow
7. Test with real data

### Code Review Checklist
- [ ] All TypeScript types defined
- [ ] Error handling comprehensive
- [ ] Loading states for all async operations
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Mobile responsive
- [ ] Performance optimized (no unnecessary re-renders)
- [ ] Code documented with JSDoc comments
- [ ] Tests passing
- [ ] No console errors

---

## 📞 SUPPORT & RESOURCES

### Documentation
- Spotify API: https://developer.spotify.com/documentation/web-api
- MusicBrainz API: https://musicbrainz.org/doc/MusicBrainz_API
- iTunes Search API: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
- Radix UI (modals, dialogs): https://www.radix-ui.com/

### Community
- GitHub Issues: https://github.com/joakirrin/music-curator/issues
- Discussions: https://github.com/joakirrin/music-curator/discussions

### Contact
- Email: [your-email]
- Twitter: [@yourhandle] (optional)
- Buy Me a Coffee: [to be set up]

---

**Last Updated**: 2025-11-19  
**Version**: 9.0 (Added Phase 4.5 - Smart Export + Branding)  
**Current Status**: Phase 4 Complete ✅ | Phase 4.5 Ready to Start 🚀  
**Next Up**: Chunk 4.5.1 - Smart Platform Search Fallback

---

## 🎉 CHANGELOG

### v9.0 (2025-11-19)
- ✨ Added Phase 4.5: Smart Export + Branding
  - 4.5.1: Smart Platform Search Fallback (3-tier strategy)
  - 4.5.2: Playlist Export Branding (mandatory, future premium removal)
  - 4.5.3: Buy Me a Coffee Integration
  - 4.5.4: Premium Feature System (framework only)
  - 4.5.5: About/Credits Section
- 📝 Updated success metrics for Phase 4.5
- 📝 Added detailed testing scenarios
- 📝 Clarified monetization strategy (beta free, future premium)

### v8.0 (2025-11-18)
- ✅ Completed Phase 4: Universal Verification System
- ✨ Added automatic platform link resolution via ISRC
- ✨ Implemented Spotify ISRC resolver
- ✨ Implemented Apple Music ISRC resolver
- 📊 Improved success rates: 60-90% direct platform links

### v7.0 and earlier
- See git history for previous changes
