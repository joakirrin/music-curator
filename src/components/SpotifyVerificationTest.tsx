// src/components/SpotifyVerificationTest.tsx
// Temporary test component - remove after testing!

import { useState } from 'react';
import { verifySong } from '../services/spotifyVerification';
import type { Song } from '../types/song';

export function SpotifyVerificationTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testRealTrack = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const testSong: Song = {
      id: 'test-1',
      title: 'Mr. Brightside',
      artist: 'The Killers',
      spotifyUri: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
      liked: false,
      toAdd: false,
      platforms: [],
    };

    try {
      const verificationResult = await verifySong(testSong);
      setResult(verificationResult);
      console.log('✅ Verification result:', verificationResult);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testFakeTrack = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const fakeSong: Song = {
      id: 'test-2',
      title: 'Fake Song',
      artist: 'Fake Artist',
      spotifyUri: 'https://open.spotify.com/track/0000000000000000000000',
      liked: false,
      toAdd: false,
      platforms: [],
    };

    try {
      const verificationResult = await verifySong(fakeSong);
      setResult(verificationResult);
      console.log('✅ Verification result:', verificationResult);
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-900 border border-emerald-500 rounded-lg shadow-lg max-w-md">
      <h3 className="text-white font-bold mb-3">🧪 Spotify Verification Test</h3>
      
      <div className="flex gap-2 mb-3">
        <button
          onClick={testRealTrack}
          disabled={loading}
          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-600"
        >
          Test Real Track
        </button>
        
        <button
          onClick={testFakeTrack}
          disabled={loading}
          className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-600"
        >
          Test Fake Track
        </button>
      </div>

      {loading && (
        <div className="text-yellow-400 text-sm">⏳ Verifying...</div>
      )}

      {error && (
        <div className="text-red-400 text-sm mb-2">
          ❌ Error: {error}
        </div>
      )}

      {result && (
        <div className="text-white text-xs bg-gray-800 p-2 rounded overflow-auto max-h-48">
          <div className="font-bold mb-1">
            Status: {result.verificationStatus === 'verified' ? '✅ Verified' : '❌ Failed'}
          </div>
          {result.metadata && (
            <div className="space-y-1">
              <div>Title: {result.metadata.title}</div>
              <div>Artist: {result.metadata.artist}</div>
              <div>Album: {result.metadata.album}</div>
              <div>Popularity: {result.metadata.popularity}/100</div>
              <div>Duration: {result.metadata.duration}s</div>
              {result.metadata.albumArt && (
                <img src={result.metadata.albumArt} alt="Album" className="w-16 h-16 mt-2" />
              )}
            </div>
          )}
          {result.verificationError && (
            <div className="text-red-400">Error: {result.verificationError}</div>
          )}
        </div>
      )}
      
      <div className="text-gray-400 text-xs mt-2">
        Remove this component after testing!
      </div>
    </div>
  );
}
