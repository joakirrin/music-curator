// src/types/chat.ts
// Chat message types with verification and auto-replacement support

import type { Song } from "./song";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  
  // Songs attached to this message (when assistant provides recommendations)
  songs?: Song[];
  
  // Verification status
  verificationStatus?: "pending" | "in_progress" | "complete" | "cancelled" | "timeout" | "failed";
  verificationProgress?: {
    total: number;
    verified: number;
    failed: number;
  };
  
  // 🆕 TIER S: Auto-replacement status
  replacementStatus?: "requesting" | "verifying" | "complete" | "failed";
  replacementAttempt?: number; // Which retry attempt (1-3)
  
  // 🆕 Cancellation & Timeout Controls
  verificationAbortController?: AbortController; // For cancelling verification
  verificationStartTime?: number; // Timestamp when verification started
  verificationTimeoutSeconds?: number; // Default 30, can be extended to 60 via prompt
};
