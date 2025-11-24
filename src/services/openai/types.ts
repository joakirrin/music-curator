// Types for GPT-5 mini contract

// What GPT returns in ```songs-json block
export type SongsJsonFormat = {
  round: number;
  requestedCount: number;
  recommendations: Array<{
    title: string;
    artist: string;
    reason?: string;
    album?: string;
    year?: string;
    duration?: number;
  }>;
};

// What we send to GPT for feedback
export type FeedbackPayload = {
  type: "feedback";
  round: number;
  requestedCount: number;
  songs: Array<{
    title: string;
    artist: string;
    decision: "keep" | "skip";
    userFeedback?: string;
  }>;
};

// What we send to GPT for replacements
export type ReplacementPayload = {
  type: "replacements";
  round: number;
  invalidSongs: Array<{
    title: string;
    artist: string;
    reason: string;
  }>;
  requestedCount: number;
};

// Parsed LLM response
export type LLMResponse = {
  explanationText: string;  // Human text before ```songs-json (or entire response if no JSON)
  songsJson: SongsJsonFormat | null;  // Parsed JSON (null for conversational responses)
  rawResponse: string;  // Full response for debugging
};

// Minimal song for context (to avoid huge prompts)
export type MinimalSong = {
  title: string;
  artist: string;
  decision?: "keep" | "skip";
};