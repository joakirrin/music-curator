// src/hooks/useChatState.ts
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/types/chat";

const STORAGE_KEY = "fonea-chat-history";
const ROUND_KEY = "fonea-current-round";
const MAX_MESSAGES = 15; // Keep last 15 conversations

/**
 * Chat state hook with localStorage persistence and round tracking
 * - Loads chat history from localStorage on mount
 * - Persists changes to localStorage
 * - Limits history to last 15 messages to avoid bloat
 * - Tracks current round number for sequential recommendations
 */
export function useChatState() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) {
          // Only keep the last MAX_MESSAGES
          return parsed.slice(-MAX_MESSAGES);
        }
      }
    } catch {
      // Ignore parse errors and start fresh
    }
    return [];
  });

  const [currentRound, setCurrentRound] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(ROUND_KEY);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return 1; // Start at round 1
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      // Only keep the last MAX_MESSAGES to avoid bloat
      const trimmedMessages = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedMessages));
    } catch {
      // Ignore quota errors
    }
  }, [messages]);

  // Persist current round to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ROUND_KEY, currentRound.toString());
    } catch {
      // Ignore quota errors
    }
  }, [currentRound]);

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const updateLastMessage = (updates: Partial<ChatMessage>) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0) {
        newMessages[lastIndex] = { ...newMessages[lastIndex], ...updates };
      }
      return newMessages;
    });
  };

  const incrementRound = () => {
    setCurrentRound(prev => prev + 1);
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const clearHistory = () => {
    setMessages([]);
    setCurrentRound(1); // Reset to round 1
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROUND_KEY);
  };

  return {
    messages,
    currentRound,
    isOpen,
    isLoading,
    addMessage,
    updateLastMessage,
    incrementRound,
    toggleChat,
    clearHistory,
    setIsLoading,
  };
}
