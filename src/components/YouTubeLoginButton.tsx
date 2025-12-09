// src/components/YouTubeLoginButton.tsx
// YouTube login/logout button component
// ✅ UPDATED: Listens for 'youtube-auth-changed' event for instant updates

import { useState, useEffect } from 'react';
import { youtubeAuth } from '@/services/youtubeAuth';

export function YouTubeLoginButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ display_name?: string; picture?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check auth status on mount and after login
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = youtubeAuth.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const userData = youtubeAuth.getUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    };

    checkAuth();

    // ✅ Listen for auth changes (dispatched from youtubeAuth.ts)
    window.addEventListener('youtube-auth-changed', checkAuth);

    // Check periodically (in case token expires)
    const interval = setInterval(checkAuth, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
      window.removeEventListener('youtube-auth-changed', checkAuth);
    };
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await youtubeAuth.login();
    } catch (err) {
      console.error('YouTube login failed:', err);
      alert('Failed to log in to YouTube. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('🔓 Disconnect from YouTube Music?')) {
      youtubeAuth.logout();
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        {/* User info */}
        <div className="hidden sm:flex items-center gap-2">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.display_name || 'User'}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-sm text-gray-300">{user.display_name || 'YouTube User'}</span>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-xl border border-red-600/30 bg-red-950/20 text-red-400 text-sm font-medium hover:bg-red-950/40 hover:border-red-600/50 transition-colors"
          title="Disconnect from YouTube"
        >
          <span className="hidden sm:inline">Disconnect YouTube</span>
          <span className="sm:hidden">🔓</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-600/30 bg-red-950/20 text-red-400 text-sm font-medium hover:bg-red-950/40 hover:border-red-600/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Connect to YouTube Music"
    >
      {/* YouTube icon */}
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>

      {/* Text */}
      <span className="hidden sm:inline">
        {isLoading ? 'Connecting...' : 'Connect YouTube'}
      </span>
      <span className="sm:hidden">{isLoading ? '...' : 'YouTube'}</span>
    </button>
  );
}