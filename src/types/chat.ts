// src/types/chat.ts
import type { Song } from './song';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  songs?: Song[]; // For assistant messages with recommendations
  verificationStatus?: 'pending' | 'complete' | 'failed';
  verificationProgress?: {
    total: number;
    verified: number;
    failed: number;
  };
};

export type ChatHistory = {
  messages: ChatMessage[];
  lastUpdated: number;
};
