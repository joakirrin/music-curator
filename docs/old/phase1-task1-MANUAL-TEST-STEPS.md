# Manual Test Steps: Phase 1 – Task 1

## Prerequisites

Ensure you have the Fonea Sound Curator project set up with:
- Node.js 16+ installed
- `npm install` completed
- React, TypeScript, Vite, and Tailwind configured

## Test Setup

1. **Copy the implementation files to your project:**
   ```bash
   # Copy type definitions
   cp src/types/song.ts YOUR_PROJECT/src/types/
   cp src/types/index.ts YOUR_PROJECT/src/types/

   # Copy utilities
   cp src/utils/fileHandlers.ts YOUR_PROJECT/src/utils/
   cp src/utils/demoData.ts YOUR_PROJECT/src/utils/
   ```

2. **If you had existing types, ensure you're now importing from the new barrel:**
   ```typescript
   // Update any existing imports to use the barrel
   import type { Song, Playlist, RecommendationRound } from '@/types';
   ```

## Test 1: Compilation (Zero Errors)

**Steps:**
1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to the dev server URL (usually `http://localhost:5173`)

3. Check browser console for errors (should see none related to types)

4. Run TypeScript type checking:
   ```bash
   npx tsc --noEmit
   ```

**Expected Result:**
- ✅ Dev server starts without TypeScript errors
- ✅ No type errors in console
- ✅ `npx tsc --noEmit` completes successfully

---

## Test 2: Old Data Format Still Works

**Steps:**

1. Create a test component or script that loads old-format data:
   ```typescript
   import { parseSongsFromJson } from '@/utils/fileHandlers';
   
   const oldDataJson = JSON.stringify([
     {
       id: 'song-1',
       title: 'Old Song',
       artist: 'Old Artist',
       album: 'Old Album',
       duration: 243,
     },
     {
       id: 'song-2',
       title: 'Another Old Song',
       artist: 'Another Artist',
       duration: 180,
     },
   ]);
   
   try {
     const songs = parseSongsFromJson(oldDataJson);
     console.log('✅ Old data loaded:', songs);
     
     // Verify all songs loaded correctly
     console.assert(songs.length === 2, 'Should have 2 songs');
     console.assert(songs[0].title === 'Old Song', 'First song title correct');
     console.assert(songs[1].source === undefined, 'Old song should not have source field');
   } catch (error) {
     console.error('❌ Failed to load old data:', error);
   }
   ```

2. Run this test in your app or console

3. Verify songs render/display correctly in your UI

**Expected Result:**
- ✅ Old data loads without errors
- ✅ Console shows success messages
- ✅ Songs display correctly in the UI
- ✅ No warnings about missing fields

---

## Test 3: New Fields Are Accepted

**Steps:**

1. Create a test with new format data:
   ```typescript
   import { normalizeSong, parseSongsFromJson } from '@/utils/fileHandlers';
   import type { Song } from '@/types';
   
   // Test 1: Normalize single song with new fields
   const newSongData: Partial<Song> = {
     id: 'song-new-1',
     title: 'ChatGPT Recommendation',
     artist: 'AI Curator',
     album: 'AI Generated',
     duration: 240,
     source: 'chatgpt',
     round: 1,
     feedback: 'pending',
     playlistId: 'playlist-ai',
     spotifyUri: 'spotify:track:abc123',
     previewUrl: 'https://example.com/preview.mp3',
     addedAt: '2025-01-15T10:00:00Z',
   };
   
   try {
     const normalized = normalizeSong(newSongData);
     console.log('✅ New song normalized:', normalized);
     
     // Verify all fields preserved
     console.assert(normalized.source === 'chatgpt', 'Source preserved');
     console.assert(normalized.round === 1, 'Round preserved');
     console.assert(normalized.feedback === 'pending', 'Feedback preserved');
     console.assert(normalized.playlistId === 'playlist-ai', 'PlaylistId preserved');
     console.assert(normalized.spotifyUri === 'spotify:track:abc123', 'Spotify URI preserved');
     console.assert(normalized.previewUrl === 'https://example.com/preview.mp3', 'Preview URL preserved');
     console.assert(normalized.addedAt === '2025-01-15T10:00:00Z', 'addedAt preserved');
   } catch (error) {
     console.error('❌ Failed to normalize new song:', error);
   }
   
   // Test 2: Parse JSON with new fields
   const newDataJson = JSON.stringify([
     {
       id: 'song-ai-1',
       title: 'AI Pick 1',
       artist: 'ChatGPT',
       source: 'chatgpt',
       round: 1,
       feedback: 'pending',
       addedAt: '2025-01-15T10:00:00Z',
     },
     {
       id: 'song-spotify-1',
       title: 'Spotify Pick',
       artist: 'Spotify Algo',
       source: 'spotify',
       spotifyUri: 'spotify:track:xyz789',
       previewUrl: 'https://example.com/preview2.mp3',
     },
   ]);
   
   try {
     const songs = parseSongsFromJson(newDataJson);
     console.log('✅ New data parsed:', songs);
     
     console.assert(songs[0].source === 'chatgpt', 'First song source correct');
     console.assert(songs[1].spotifyUri === 'spotify:track:xyz789', 'Second song URI correct');
   } catch (error) {
     console.error('❌ Failed to parse new data:', error);
   }
   ```

2. Run this test

**Expected Result:**
- ✅ All new fields are accepted without errors
- ✅ All fields are preserved through normalization
- ✅ No type errors
- ✅ Console shows success messages

---

## Test 4: Mixed Format Data

**Steps:**

1. Test with demoData that mixes old and new formats:
   ```typescript
   import { demoSongs, demoPlaylists } from '@/utils/demoData';
   import { serializeSongsToJson, parseSongsFromJson } from '@/utils/fileHandlers';
   
   console.log('📊 Testing mixed format data from demoData...');
   
   // Verify mix of old and new format
   const oldFormatCount = demoSongs.filter((s) => !s.source).length;
   const newFormatCount = demoSongs.filter((s) => s.source).length;
   
   console.log(`  Old format songs: ${oldFormatCount}`);
   console.log(`  New format songs: ${newFormatCount}`);
   console.assert(oldFormatCount > 0, 'Should have old format songs');
   console.assert(newFormatCount > 0, 'Should have new format songs');
   
   // Test serialization roundtrip
   const json = serializeSongsToJson(demoSongs);
   const deserialized = parseSongsFromJson(json);
   
   console.assert(deserialized.length === demoSongs.length, 'Roundtrip length matches');
   console.assert(deserialized[0].title === demoSongs[0].title, 'Old format title preserved');
   console.assert(deserialized[2].source === demoSongs[2].source, 'New format source preserved');
   
   console.log('✅ Mixed format handling works');
   
   // Verify playlists load
   console.log(`📋 Playlists loaded: ${demoPlaylists.length}`);
   console.assert(demoPlaylists.length > 0, 'Playlists should exist');
   ```

2. Run this test

**Expected Result:**
- ✅ demoData loads correctly
- ✅ Mix of old and new format songs confirmed
- ✅ Serialization/deserialization preserves all data
- ✅ Playlists load without errors

---

## Test 5: Default Values Applied Correctly

**Steps:**

1. Test that safe defaults are applied only when needed:
   ```typescript
   import { normalizeSong } from '@/utils/fileHandlers';
   import type { Song } from '@/types';
   
   // Test: Feedback defaults to 'pending' if not specified
   const songWithoutFeedback: Partial<Song> = {
     id: 'test-1',
     title: 'Test',
     artist: 'Artist',
   };
   
   const result1 = normalizeSong(songWithoutFeedback);
   console.assert(result1.feedback === 'pending', 'Feedback defaults to pending');
   console.log('✅ Feedback default applied');
   
   // Test: addedAt defaults to current time if not specified
   const songWithoutDate: Partial<Song> = {
     id: 'test-2',
     title: 'Test',
     artist: 'Artist',
   };
   
   const result2 = normalizeSong(songWithoutDate);
   console.assert(result2.addedAt !== undefined, 'addedAt should be set');
   console.assert(typeof result2.addedAt === 'string', 'addedAt should be ISO string');
   console.log('✅ addedAt default applied');
   
   // Test: Other fields remain undefined if not specified
   const songMinimal: Partial<Song> = {
     id: 'test-3',
     title: 'Test',
     artist: 'Artist',
   };
   
   const result3 = normalizeSong(songMinimal);
   console.assert(result3.source === undefined, 'Source should be undefined if not provided');
   console.assert(result3.round === undefined, 'Round should be undefined if not provided');
   console.assert(result3.playlistId === undefined, 'PlaylistId should be undefined if not provided');
   console.log('✅ Undefined fields remain undefined');
   ```

2. Run this test

**Expected Result:**
- ✅ `feedback` defaults to 'pending' when missing
- ✅ `addedAt` defaults to current ISO timestamp when missing
- ✅ Other optional fields remain `undefined` if not provided
- ✅ No unwanted defaults applied

---

## Test 6: Error Handling

**Steps:**

1. Test that utilities throw meaningful errors for invalid data:
   ```typescript
   import { normalizeSong, parsePlaylistsFromJson } from '@/utils/fileHandlers';
   
   // Test: Missing required fields
   try {
     normalizeSong({ title: 'No ID' } as any);
     console.error('❌ Should have thrown error for missing id');
   } catch (error) {
     console.log(`✅ Caught error for missing id: ${error}`);
   }
   
   try {
     normalizeSong({ id: 'test', artist: 'No Title' } as any);
     console.error('❌ Should have thrown error for missing title');
   } catch (error) {
     console.log(`✅ Caught error for missing title: ${error}`);
   }
   
   // Test: Invalid JSON
   try {
     parsePlaylistsFromJson('{ invalid json }');
     console.error('❌ Should have thrown error for invalid JSON');
   } catch (error) {
     console.log(`✅ Caught error for invalid JSON: ${error}`);
   }
   
   // Test: Non-array JSON
   try {
     parsePlaylistsFromJson('{ "id": "test" }');
     console.error('❌ Should have thrown error for non-array');
   } catch (error) {
     console.log(`✅ Caught error for non-array: ${error}`);
   }
   ```

2. Run this test

**Expected Result:**
- ✅ Meaningful error messages for missing required fields
- ✅ Clear error handling for invalid JSON
- ✅ Clear error for non-array data when array expected

---

## Test 7: Demo Data in UI

**Steps:**

1. In your app component, add a demo data loader:
   ```typescript
   import { getDemoData } from '@/utils/demoData';
   
   // In your component
   const demo = getDemoData();
   
   console.log('📀 Demo Data Summary:');
   console.log(`  Songs: ${demo.songs.length}`);
   console.log(`  Playlists: ${demo.playlists.length}`);
   console.log(`  Recommendation Rounds: ${demo.rounds.length}`);
   ```

2. Display demo songs in your UI (existing song list, etc.)

3. Verify both old and new format songs render correctly

**Expected Result:**
- ✅ Demo data loads without errors
- ✅ All songs render in UI regardless of format
- ✅ New fields don't break rendering
- ✅ Mixed format data coexists peacefully

---

## Quick Summary Checklist

Run through these quick checks:

```
[ ] npm run dev compiles without TypeScript errors
[ ] Old format data (without new fields) loads and renders
[ ] New format data (with all fields) loads and renders
[ ] Mixed format (old + new in same array) works
[ ] Utilities accept objects with new optional fields
[ ] Default values applied correctly (feedback='pending', addedAt=now)
[ ] Error handling works for invalid data
[ ] Demo data loads from demoData.ts
[ ] No warnings in browser console
[ ] Existing functionality unchanged
```

---

## Troubleshooting

### Issue: TypeScript errors about Song type
**Solution:** Ensure you're using the new barrel export: `import type { Song } from '@/types'`

### Issue: Old data not loading
**Solution:** Verify that `normalizeSong()` is being called on each item before storing

### Issue: New fields are undefined in UI
**Solution:** This is expected if the data doesn't include them. Check that your data source actually includes the new fields.

### Issue: "Cannot find module" errors
**Solution:** Ensure paths are correct. If using path aliases, check `tsconfig.json` and `vite.config.ts`

---

## Notes

- All tests should complete with zero errors
- Performance should be identical to previous implementation
- No breaking changes to existing functionality
- All new fields are optional and backward compatible
