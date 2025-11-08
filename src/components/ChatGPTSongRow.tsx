// src/components/ChatGPTSongRow.tsx
import type { Song } from "../types/song";
import { formatDistanceToNow } from "date-fns";

type Props = {
  song: Song;
  onUpdate: (next: Song) => void;
  onDelete: () => void;
};

export const ChatGPTSongRow = ({ song, onUpdate, onDelete }: Props) => {
  const set = <K extends keyof Song>(key: K, value: Song[K]) =>
    onUpdate({ ...song, [key]: value });

  const feedbackOptions: Array<"keep" | "skip" | "pending"> = ["keep", "skip", "pending"];

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return null;
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto px-4 py-4 border-b border-gray-700 bg-gray-700 hover:bg-gray-650 transition-colors overflow-hidden">
      {/* ✅ Dark mode: gray-700 background, darker gray card */}
      
      {/* Header Row - Badges & Actions */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* 🎨 NEW: Status Badge - PROMINENT */}
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 ${
          song.feedback === "keep" 
            ? "bg-green-600 text-white border-green-500" 
            : song.feedback === "skip"
            ? "bg-red-600 text-white border-red-500"
            : "bg-yellow-500 text-gray-900 border-yellow-400"
        }`}>
          {song.feedback === "keep" && "✓ Keep"}
          {song.feedback === "skip" && "✗ Skip"}
          {song.feedback === "pending" && "⏸ Pending Review"}
        </span>

        {/* ✨ NEW: Verification Badge */}
        {song.verificationStatus && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            song.verificationStatus === "verified"
              ? "bg-emerald-600 text-white border-emerald-500"
              : song.verificationStatus === "checking"
              ? "bg-gray-500 text-white border-gray-400"
              : song.verificationStatus === "failed"
              ? "bg-red-700 text-white border-red-600"
              : "bg-orange-500 text-white border-orange-400"
          }`}
          title={
            song.verificationStatus === "verified"
              ? `Verified via ${song.verificationSource || 'Spotify'} on ${song.verifiedAt ? new Date(song.verifiedAt).toLocaleDateString() : 'unknown date'}`
              : song.verificationStatus === "checking"
              ? "Checking if this track exists..."
              : song.verificationStatus === "failed"
              ? `Verification failed: ${song.verificationError || 'Track not found'}`
              : "Not yet verified"
          }>
            {song.verificationStatus === "verified" && "✓ Verified"}
            {song.verificationStatus === "checking" && "🔄 Checking..."}
            {song.verificationStatus === "failed" && "✗ Failed"}
            {song.verificationStatus === "unverified" && "⚠️ Unverified"}
          </span>
        )}

        {/* Round Badge */}
        {song.round && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300 border border-emerald-700">
            Round {song.round}
          </span>
        )}

        {/* Duration */}
        {song.duration && (
          <span className="px-2 py-1 rounded-full text-xs text-gray-300 bg-gray-600">
            ⏱️ {formatDuration(song.duration)}
          </span>
        )}

        {/* Timestamp */}
        {song.addedAt && (
          <span className="text-xs text-gray-400 ml-auto">
            Added {formatTimestamp(song.addedAt)}
          </span>
        )}

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="px-2 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 border border-red-600 transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Song Info Grid - 2 columns with DARK inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Left Column */}
        <div className="space-y-2">
          <input
            value={song.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 break-words"
          />
          <input
            value={song.artist}
            onChange={(e) => set("artist", e.target.value)}
            placeholder="Artist"
            className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            value={song.featuring ?? ""}
            onChange={(e) => set("featuring", e.target.value)}
            placeholder="Featuring"
            className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            value={song.album ?? ""}
            onChange={(e) => set("album", e.target.value)}
            placeholder="Album"
            className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          <input
            value={song.year ?? ""}
            onChange={(e) => set("year", e.target.value)}
            placeholder="Year"
            className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            value={song.producer ?? ""}
            onChange={(e) => set("producer", e.target.value)}
            placeholder="Producer"
            className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {/* Search Buttons */}
          <a
            href={`https://open.spotify.com/search/${encodeURIComponent(song.artist + ' ' + song.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            🔍 Search Spotify
          </a>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.artist + ' ' + song.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center px-3 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            🔍 Search YouTube
          </a>
        </div>
      </div>

      {/* ChatGPT's Recommendation Reason */}
      {song.comments && (
        <div className="mb-3 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
          <p className="text-xs font-medium text-amber-400 mb-1">💡 Why ChatGPT recommended:</p>
          <p className="text-sm text-gray-300 italic">"{song.comments}"</p>
        </div>
      )}

      {/* Feedback Buttons */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-300">Your decision:</span>
        {feedbackOptions.map((option) => (
          <button
            key={option}
            onClick={() => set("feedback", option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              song.feedback === option
                ? option === "keep"
                  ? "bg-green-600 text-white border-green-600"
                  : option === "skip"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-gray-600 text-white border-gray-600"
                : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
            }`}
          >
            {option === "keep" && "✓ Keep"}
            {option === "skip" && "✗ Skip"}
            {option === "pending" && "⏸ Pending"}
          </button>
        ))}
      </div>

      {/* User Feedback Textbox */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          📝 Your feedback (will be sent back to ChatGPT):
        </label>
        <textarea
          value={song.userFeedback ?? ""}
          onChange={(e) => set("userFeedback", e.target.value)}
          placeholder="Optional: Tell ChatGPT why you kept/skipped this song, or request similar music..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Example: "Love the synth layers!" or "Too slow for my taste" or "More like this please!"
        </p>
      </div>

      {/* Platform Badges */}
      {song.platforms && song.platforms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Available on:</span>
          {song.platforms.map((platform) => (
            <span
              key={platform}
              className="px-2 py-1 rounded-full text-xs bg-gray-600 text-gray-200 border border-gray-500"
            >
              {platform}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
