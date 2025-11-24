import type { Song } from "@/types/song";

// Type from ImportChatGPTModal (also used there)
type ChatGPTRecommendation = {
  title: string;
  artist: string;
  album?: string;
  year?: string;
  serviceUri?: string;
  serviceUrl?: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  reason?: string;
  duration?: number;
};

/**
 * Maps a ChatGPT recommendation to a Song object
 * Extracted from ImportChatGPTModal for reusability
 */
export function mapChatGPTRecommendationToSong(
  rec: ChatGPTRecommendation,
  round: number,
  index: number,
  autoVerify: boolean = true
): Song {
  if (!rec.title || !rec.artist) {
    throw new Error(`Recommendation #${index + 1} is missing required fields (title or artist)`);
  }

  const serviceLink = normalizeServiceLink(
    rec.serviceUri || rec.serviceUrl || rec.spotifyUri || rec.spotifyUrl
  );

  return {
    id: `chatgpt-${Date.now()}-${index}`,
    title: rec.title,
    artist: rec.artist,
    album: rec.album,
    year: rec.year,
    source: "chatgpt",
    round: round,
    feedback: "pending",
    spotifyUri: serviceLink,
    addedAt: new Date().toISOString(),
    comments: rec.reason,
    duration: rec.duration,
    platforms: [],
    liked: false,
    toAdd: false,
    verificationStatus: autoVerify ? "checking" : undefined,
  };
}

/**
 * Normalizes service link to URI format (copied from ImportChatGPTModal)
 */
function normalizeServiceLink(input?: string): string | undefined {
  if (!input) return undefined;
  if (input.includes(':')) return input;
  
  const spotifyMatch = input.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) return `spotify:track:${spotifyMatch[1]}`;
  
  const youtubeMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) return `youtube:video:${youtubeMatch[1]}`;
  
  const appleMusicMatch = input.match(/music\.apple\.com\/.*\/album\/.*\/(\d+)\?i=(\d+)/);
  if (appleMusicMatch) return `applemusic:track:${appleMusicMatch[2]}`;
  
  if (input.match(/^[a-zA-Z0-9]{22}$/)) return `spotify:track:${input}`;
  
  return input;
}

/**
 * Maps a Song to feedback format for GPT
 */
export function mapSongToFeedbackItem(song: Song) {
  return {
    title: song.title,
    artist: song.artist,
    decision: song.feedback === "keep" ? "keep" : "skip",
    userFeedback: song.userFeedback || undefined,
  };
}

/**
 * Maps a failed Song to replacement format for GPT
 */
export function mapSongToReplacementItem(song: Song) {
  return {
    title: song.title,
    artist: song.artist,
    reason: song.verificationError || "not_found",
  };
}
