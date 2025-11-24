// src/hooks/useSpotifyAuth.ts
import { useEffect, useState } from 'react';
import { spotifyAuth } from '@/services/spotifyAuth';

type Status = 'logged_out' | 'ready' | 'refreshing';

export function useSpotifyAuth() {
  const [status, setStatus] = useState<Status>('logged_out');
  const [user, setUser] = useState(spotifyAuth.getUser());

  // On mount, attempt to refresh (silent sign-in)
  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await spotifyAuth.refreshAccessToken();
      if (!alive) return;
      setUser(spotifyAuth.getUser());
      setStatus(ok ? 'ready' : 'logged_out');
    })();
    return () => { alive = false; };
  }, []);

  const accessToken = spotifyAuth.getAuthState()?.access_token ?? null;

  const login = () => spotifyAuth.login();
  const logout = () => {
    spotifyAuth.logout();
    setStatus('logged_out');
    setUser(null);
  };

  return { status, user, accessToken, login, logout };
}
