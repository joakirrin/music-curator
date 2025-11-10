// src/components/SpotifyLoginButton.tsx
import { spotifyAuth } from '@/services/spotifyAuth';

export function SpotifyLoginButton() {
  return (
    <button
      onClick={() => void spotifyAuth.login()}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
      title="Login with Spotify"
    >
      {/* Spotify logo SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 168 168"
        className="w-5 h-5"
        fill="currentColor"
      >
        <path d="M84 0a84 84 0 1 0 84 84A84 84 0 0 0 84 0ZM122.5 121a5 5 0 0 1-6.9 1.6c-19-11.6-42.8-14.2-71.3-7.7a5 5 0 0 1-2.2-9.7c30.9-7.1 57.8-4.2 79.5 8.8a5 5 0 0 1 1 7Zm9.8-21.7a6.3 6.3 0 0 1-8.7 2c-21.7-13.3-54.8-17.2-80.6-9.3a6.3 6.3 0 0 1-3.6-12c28.6-8.6 64.5-4.3 89.1 11.3a6.3 6.3 0 0 1 3.8 8Zm.8-23.5c-25.3-15-67.2-16.4-91.4-8.8a7.5 7.5 0 0 1-4.6-14.3c27.4-8.8 73.6-7.2 102.8 10.2a7.5 7.5 0 1 1-7.7 12.9Z" />
      </svg>

      Sign in with Spotify
    </button>
  );
}
