// Types for Fonea GPT contract

// What GPT returns in structured format
export type SongsJsonFormat = {
  round?: number;
  requestedCount?: number;
  recommendations: Array<{
    title: string;
    artist: string;
    reason?: string;
    comment?: string;
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

// Response mode for controlling GPT behavior
export type ResponseMode = "auto" | "chat" | "songs";

// Recovery options for soft errors
export type RecoveryOption = {
  action: "retry" | "regenerate" | "continue";
  label: string;
};

// Parsed LLM response with soft error support
export type LLMResponse = {
  type: "success" | "conversation" | "soft_error";
  explanationText: string;
  songsJson: SongsJsonFormat | null;
  rawResponse: string;
  error?: {
    message: string;
    recoveryOptions: RecoveryOption[];
  };
};

// Minimal song for context (to avoid huge prompts)
export type MinimalSong = {
  title: string;
  artist: string;
  decision?: "keep" | "skip";
};