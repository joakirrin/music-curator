// src/components/ImportChatGPTModal.tsx
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Song } from "../types/song";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (songs: Song[]) => void;
  existingSongs: Song[];
};

type ChatGPTRecommendation = {
  title: string;
  artist: string;
  featuring?: string;
  album?: string;
  year?: string;
  producer?: string;
  spotifyUri?: string;
  spotifyUrl?: string; // ✅ NEW: Accept Spotify URL too
  previewUrl?: string;
  reason?: string;
  duration?: number;
};

type ChatGPTFormat = {
  round?: number;
  recommendations: ChatGPTRecommendation[];
};

// ✅ NEW: Convert Spotify URL to URI
function normalizeSpotifyLink(input?: string): string | undefined {
  if (!input) return undefined;
  
  // If it's already a URI, return it
  if (input.startsWith('spotify:track:')) {
    return input;
  }
  
  // If it's a URL, extract the track ID
  const urlMatch = input.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (urlMatch) {
    return `spotify:track:${urlMatch[1]}`;
  }
  
  // If it looks like a bare track ID
  if (input.match(/^[a-zA-Z0-9]{22}$/)) {
    return `spotify:track:${input}`;
  }
  
  // Otherwise return as-is (might be a full URL which we can handle in the component)
  return input;
}

export default function ImportChatGPTModal({
  open,
  onOpenChange,
  onImport,
  existingSongs,
}: Props) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = () => {
    setError("");
    setIsLoading(true);

    try {
      // Parse JSON
      const parsed: ChatGPTFormat = JSON.parse(jsonText.trim());

      // Validate structure
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error(
          'Invalid format: JSON must contain a "recommendations" array'
        );
      }

      if (parsed.recommendations.length === 0) {
        throw new Error("No recommendations found in JSON");
      }

      // Calculate the next round number
      const existingRounds = existingSongs
        .map((s) => s.round)
        .filter((r): r is number => typeof r === "number");
      const maxRound = existingRounds.length > 0 ? Math.max(...existingRounds) : 0;
      const nextRound = parsed.round ?? maxRound + 1;

      // Transform recommendations to Song objects
      const newSongs: Song[] = parsed.recommendations.map((rec, index) => {
        // Validate required fields
        if (!rec.title || !rec.artist) {
          throw new Error(
            `Recommendation #${index + 1} is missing required fields (title or artist)`
          );
        }

        // ✅ NEW: Handle both spotifyUri and spotifyUrl fields
        const spotifyLink = normalizeSpotifyLink(rec.spotifyUri || rec.spotifyUrl);

        return {
          id: `chatgpt-${Date.now()}-${index}`,
          title: rec.title,
          artist: rec.artist,
          featuring: rec.featuring,
          album: rec.album,
          year: rec.year,
          producer: rec.producer,
          source: "chatgpt" as const,
          round: nextRound,
          feedback: "pending" as const,
          spotifyUri: spotifyLink,
          previewUrl: rec.previewUrl,
          addedAt: new Date().toISOString(),
          comments: rec.reason,
          duration: rec.duration,
          // Default values for other fields
          platforms: [],
          liked: false,
          toAdd: false,
        };
      });

      // Success! Import the songs
      onImport(newSongs);
      setJsonText("");
      onOpenChange(false);

      // Show success message
      alert(
        `✅ Successfully imported ${newSongs.length} song(s) from Round ${nextRound}!`
      );
    } catch (err: any) {
      setError(err.message || "Failed to parse JSON. Please check the format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setJsonText("");
    setError("");
  };

  const exampleJSON = `{
  "round": 1,
  "recommendations": [
    {
      "title": "Midnight City",
      "artist": "M83",
      "album": "Hurry Up, We're Dreaming",
      "year": "2011",
      "spotifyUrl": "https://open.spotify.com/track/3zidJjXGWgKqgQnfb6hKak",
      "reason": "Epic synth anthem with soaring melodies"
    },
    {
      "title": "Do I Wanna Know?",
      "artist": "Arctic Monkeys",
      "album": "AM",
      "year": "2013",
      "spotifyUrl": "https://open.spotify.com/track/5FVd6KXrgO9B3JPmC8OPst",
      "reason": "Groovy bassline, perfect for late night vibes"
    }
  ]
}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
            Import from ChatGPT
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Paste the JSON response from ChatGPT below. Songs will be
            automatically assigned to the next round. Supports both Spotify URLs and URIs!
          </Dialog.Description>

          {/* JSON Text Area - ✅ FIXED: White background */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ChatGPT JSON Response
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setError("");
                }}
                placeholder={exampleJSON}
                rows={12}
                className="w-full px-3 py-2 rounded-xl border border-gray-500 bg-gray-700 text-white placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Error:</span> {error}
                </p>
              </div>
            )}

            {/* Example Format */}
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                📋 Expected JSON Format
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded-lg overflow-x-auto text-xs">
                {exampleJSON}
              </pre>
            </details>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Clear
            </button>
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleImport}
              disabled={!jsonText.trim() || isLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Importing..." : "Import Songs"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
