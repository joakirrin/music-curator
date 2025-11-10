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
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 ${
            song.feedback === "keep"
              ? "bg-green-600 text-white border-green-500"
              : song.feedback === "skip"
              ? "bg-red-600 text-white border-red-500"
              : "bg-yellow-500 text-gray-900 border-yellow-400"
          }`}
        >
          {song.feedback === "keep" && "✓ Keep"}
          {song.feedback === "skip" && "✗ Skip"}
          {song.feedback === "pending" && "⏸ Pending Review"}
        </span>

        {song.verificationStatus && (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${
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
                ? `Verified via ${song.verificationSource || "Spotify"} on ${
                    song.verifiedAt
                      ? new Date(song.verifiedAt).toLocaleDateString()
                      : "unknown date"
                  }`
                : song.verificationStatus === "checking"
                ? "Checking if this track exists..."
                : song.verificationStatus === "failed"
                ? `Verification failed: ${song.verificationError || "Track not found"}`
                : "Not yet verified"
            }
          >
            {song.verificationStatus === "verified" && "✓ Verified"}
            {song.verificationStatus === "checking" && "🔄 Checking..."}
            {song.verificationStatus === "failed" && "✗ Failed"}
            {song.verificationStatus === "unverified" && "⚠️ Unverified"}
          </span>
        )}

        {song.round && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300 border border-emerald-700">
            Round {song.round}
          </span>
        )}

        {song.duration && (
          <span className="px-2 py-1 rounded-full text-xs text-gray-300 bg-gray-600">
            ⏱️ {formatDuration(song.duration)}
          </span>
        )}

        {/* Timestamp + Delete en el header (a la derecha) */}
        <div className="flex items-center gap-3 ml-auto">
          {song.addedAt && (
            <span className="text-xs text-gray-400">
              Added {formatTimestamp(song.addedAt)}
            </span>
          )}
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 border border-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* GRID reestructurado para permitir row-span del bloque de recomendación */}
      {/* Orden: 
          Fila 1:  Title | Year
          Fila 2:  Artist | Producer
          Fila 3:  Featuring | Reason (row-span-2)
          Fila 4:  Album    | Reason (continúa)
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 md:auto-rows-min">
        {/* Fila 1 */}
        <input
          value={song.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Title"
          className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 break-words md:col-start-1 md:row-start-1"
        />
        <input
          value={song.year ?? ""}
          onChange={(e) => set("year", e.target.value)}
          placeholder="Year"
          className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-start-2 md:row-start-1"
        />

        {/* Fila 2 */}
        <input
          value={song.artist}
          onChange={(e) => set("artist", e.target.value)}
          placeholder="Artist"
          className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-start-1 md:row-start-2"
        />
        <input
          value={song.producer ?? ""}
          onChange={(e) => set("producer", e.target.value)}
          placeholder="Producer"
          className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-start-2 md:row-start-2"
        />

        {/* Fila 3 */}
        <input
          value={song.featuring ?? ""}
          onChange={(e) => set("featuring", e.target.value)}
          placeholder="Featuring"
          className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-start-1 md:row-start-3"
        />

        {/* WHY ChatGPT (derecha, doble altura: row-span-2) */}
        {song.comments && (
          <div className="mb-0 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg md:col-start-2 md:row-start-3 md:row-span-2">
            <p className="text-xs font-medium text-amber-400 mb-1">
              💡 Why ChatGPT recommended:
            </p>
            <p className="text-sm text-gray-300 italic">"{song.comments}"</p>
          </div>
        )}

        {/* Fila 4 */}
        <input
          value={song.album ?? ""}
          onChange={(e) => set("album", e.target.value)}
          placeholder="Album"
          className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 md:col-start-1 md:row-start-4"
        />


      </div>

      {/* FEEDBACK */}
<div className="flex items-center justify-between flex-wrap gap-2 mb-3">
  <div className="flex items-center gap-2">
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

  {/* BOTONES DE BÚSQUEDA — ahora alineados a la derecha del bloque */}
  <div className="flex items-center gap-3">
    <a
      href={`https://open.spotify.com/search/${encodeURIComponent(song.artist + " " + song.title)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-auto px-4 py-2 rounded-full bg-[#1DB954] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:bg-[#1ed760] transition-all"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 168 168"
        className="w-4 h-4 mr-2 fill-current"
        aria-hidden="true"
      >
        <path d="M84 0a84 84 0 1 0 0 168 84 84 0 0 0 0-168Zm38.1 121.8a5.2 5.2 0 0 1-7.1 1.6c-19.3-11.8-43.7-14.4-72.4-7.6a5.2 5.2 0 0 1-2.4-10.1c31.2-7.3 58.4-4.4 80.4 8.3a5.2 5.2 0 0 1 1.5 7.8Zm9.8-21.8a6.5 6.5 0 0 1-8.9 2.1c-22.1-13.5-55.9-17.4-82.1-9.3a6.5 6.5 0 0 1-3.8-12.4c29.6-9.1 66.9-5 91.6 10.2a6.5 6.5 0 0 1 3.2 9.4Zm1-23.3C106.3 60 64.5 58.7 42 65.8a7.8 7.8 0 1 1-4.6-14.9c25.9-8 72.3-6.6 103.4 12.1a7.8 7.8 0 0 1-8 13.7Z" />
      </svg>
      Search on Spotify
    </a>

    <a
      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.artist + " " + song.title)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-auto px-4 py-2 rounded-full bg-[#FF0000] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:bg-[#e60000] transition-all"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-5 h-5 mr-2 fill-current"
        aria-hidden="true"
      >
        <path d="M23.5 6.2s-.2-1.7-.9-2.5c-.8-.9-1.7-.9-2.1-1C16.9 2.3 12 2.3 12 2.3h0s-4.9 0-8.5.4c-.4 0-1.4.1-2.1 1-.7.8-.9 2.5-.9 2.5S0 8.2 0 10.3v1.8c0 2.1.2 4.1.2 4.1s.2 1.7.9 2.5c.8.9 1.9.9 2.4 1 1.7.2 7.2.4 7.2.4s4.9 0 8.5-.4c.4 0 1.4-.1 2.1-1 .7-.8.9-2.5.9-2.5s.2-2 .2-4.1v-1.8c0-2.1-.2-4.1-.2-4.1ZM9.6 14.9V8.6l6.4 3.2-6.4 3.1Z" />
      </svg>
      Search on YouTube
    </a>
  </div>
</div>


      {/* USER FEEDBACK TEXTAREA */}
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

      {/* PLATFORM BADGES */}
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
