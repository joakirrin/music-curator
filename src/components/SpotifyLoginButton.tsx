// src/components/SpotifyLoginButton.tsx
import { spotifyAuth } from '@/services/spotifyAuth';

export function SpotifyLoginButton() {
  return (
    <button
      onClick={() => void spotifyAuth.login()}
      className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
      title="Login with Spotify"
    >
      🎧 Sign in with Spotify
    </button>
  );
}
