// src/types/chat.ts
import type { Song } from './song';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  songs?: Song[];
  verificationStatus?: 'pending' | 'in_progress' | 'complete' | 'failed' | 'cancelled' | 'timeout';
  verificationProgress?: {
    total: number;
    verified: number;
    failed: number;
  };
  verificationTimeoutSeconds?: number;
  verificationStartTime?: number; // 🆕 Track when verification started
  verificationAbortController?: AbortController; // 🆕 For canceling verification
  replacementStatus?: 'requesting' | 'verifying' | 'complete' | 'failed';
  replacementAttempt?: number;
  // 🆕 Added for soft error recovery
  metadata?: {
    errorMessage?: string;
    recoveryOptions?: Array<{
      action: 'retry' | 'continue' | 'regenerate';
      label: string;
    }>;
    [key: string]: any; // Allow other metadata fields
  };
};