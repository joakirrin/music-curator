// src/types/index.ts

/**
 * Central export point for all type definitions.
 * Only re-exports the types that actually exist in ./song.
 */

export type {
  Song,
  Platform,
  FilterType,
  VerificationFilterType,
  SongSource,
  FeedbackStatus,
  VerificationStatus,
  VerificationSource,
} from './song';
