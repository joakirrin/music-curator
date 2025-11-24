// src/components/AlbumArt.tsx
/**
 * Reusable Album Art Component
 * Automatically fetches and displays album art with loading states
 */

import { useCallback, useEffect, useState } from "react";
import { getAlbumArt } from "../services/albumArtService";
import type { Song } from "../types/song";
import type { AlbumArtResult } from "../services/albumArtService";

type Props = {
  song: Song;
  size?: "small" | "medium" | "large";
  className?: string;
  onArtLoaded?: (art: AlbumArtResult) => void;
};

export default function AlbumArt({
  song,
  size = "medium",
  className = "",
  onArtLoaded,
}: Props) {
  const [albumArt, setAlbumArt] = useState<string>(song.albumArtUrl || "");
  const [loading, setLoading] = useState(!song.albumArtUrl);
  const [error, setError] = useState(false);

  const loadAlbumArt = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const art = await getAlbumArt(song);
      setAlbumArt(art.url);
      onArtLoaded?.(art);
    } catch (err) {
      console.error("Failed to load album art:", err);
      setError(true);
      setAlbumArt("/assets/placeholder-album.svg");
    } finally {
      setLoading(false);
    }
  }, [onArtLoaded, song]);

  useEffect(() => {
    if (!song.albumArtUrl && (song.releaseId || song.platformIds?.apple?.id)) {
      void loadAlbumArt();
    }
  }, [loadAlbumArt, song.albumArtUrl, song.platformIds?.apple?.id, song.releaseId]);

  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-48 h-48",
  };

  return (
    <div
      className={`album-art ${sizeClasses[size]} ${className}`}
      data-loading={loading}
      data-error={error}
    >
      {loading ? (
        <div className="album-art-skeleton" />
      ) : (
        <img
          src={albumArt}
          alt={`${song.album || song.title} by ${song.artist} artwork`}
          className="album-art-image"
          loading="lazy"
          onError={(e) => {
            // Fallback to placeholder on error
            setError(true);
            e.currentTarget.src = "/assets/placeholder-album.svg";
          }}
        />
      )}
    </div>
  );
}
