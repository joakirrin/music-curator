// src/components/SpotifyLoginButton.tsx
// Shows profile + badge (no checkmark) when signed in

import { spotifyAuth } from '@/services/spotifyAuth';
import { useState, useEffect } from 'react';

type SpotifyUser = {
  id: string;
  display_name?: string;
  images?: { url?: string }[];
} | null;

export function SpotifyLoginButton() {
  const [user, setUser] = useState<SpotifyUser>(null);
  const [isReady, setIsReady] = useState(false);

  // Check auth status on mount and set up interval to recheck
  useEffect(() => {
    const checkAuth = () => {
      const authState = spotifyAuth.getAuthState();
      if (authState?.access_token) {
        const userData = spotifyAuth.getUser();
        setUser(userData);
        setIsReady(true);
      } else {
        setUser(null);
        setIsReady(false);
      }
    };

    checkAuth();
    
    // Recheck every 2 seconds to catch login changes
    const interval = setInterval(checkAuth, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // If already logged in, show user info with badge (no checkmark)
  if (isReady && user) {
    return (
      <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-600 bg-emerald-950/30 text-emerald-300 text-sm">
        {/* Badge indicator - just a dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full shadow-lg border-2 border-gray-900 animate-pulse" />

        {user.images?.[0]?.url && (
          <img 
            src={user.images[0].url} 
            alt={user.display_name || 'User'} 
            className="w-6 h-6 rounded-full border border-emerald-500"
          />
        )}
        <span className="hidden sm:inline font-medium">
          {user.display_name || user.id}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 168 168"
          className="w-4 h-4"
          fill="currentColor"
        >
          <path d="M84 0a84 84 0 1 0 84 84A84 84 0 0 0 84 0ZM122.5 121a5 5 0 0 1-6.9 1.6c-19-11.6-42.8-14.2-71.3-7.7a5 5 0 0 1-2.2-9.7c30.9-7.1 57.8-4.2 79.5 8.8a5 5 0 0 1 1 7Zm9.8-21.7a6.3 6.3 0 0 1-8.7 2c-21.7-13.3-54.8-17.2-80.6-9.3a6.3 6.3 0 0 1-3.6-12c28.6-8.6 64.5-4.3 89.1 11.3a6.3 6.3 0 0 1 3.8 8Zm.8-23.5c-25.3-15-67.2-16.4-91.4-8.8a7.5 7.5 0 0 1-4.6-14.3c27.4-8.8 73.6-7.2 102.8 10.2a7.5 7.5 0 1 1-7.7 12.9Z" />
        </svg>
      </div>
    );
  }

  // If not logged in, show login button with secondary styling
  return (
    <button
      onClick={() => void spotifyAuth.login()}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-600 bg-transparent text-gray-300 text-sm font-medium hover:bg-gray-700 hover:text-white hover:border-emerald-500 hover:text-emerald-400 transition-colors group"
      title="Sign in with Spotify to verify tracks"
    >
      {/* Spotify logo SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 168 168"
        className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors"
        fill="currentColor"
      >
        <path d="M84 0a84 84 0 1 0 84 84A84 84 0 0 0 84 0ZM122.5 121a5 5 0 0 1-6.9 1.6c-19-11.6-42.8-14.2-71.3-7.7a5 5 0 0 1-2.2-9.7c30.9-7.1 57.8-4.2 79.5 8.8a5 5 0 0 1 1 7Zm9.8-21.7a6.3 6.3 0 0 1-8.7 2c-21.7-13.3-54.8-17.2-80.6-9.3a6.3 6.3 0 0 1-3.6-12c28.6-8.6 64.5-4.3 89.1 11.3a6.3 6.3 0 0 1 3.8 8Zm.8-23.5c-25.3-15-67.2-16.4-91.4-8.8a7.5 7.5 0 0 1-4.6-14.3c27.4-8.8 73.6-7.2 102.8 10.2a7.5 7.5 0 1 1-7.7 12.9Z" />
      </svg>

      <span className="hidden sm:inline">Sign in</span>
    </button>
  );
}
