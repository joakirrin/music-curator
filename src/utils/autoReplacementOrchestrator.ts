// src/utils/autoReplacementOrchestrator.ts
// 🆕 TIER S: Auto-Replacement Orchestrator
// 
// Handles automatic replacement of failed songs after verification completes.
// Retries up to maxRetries times per round, then asks user for intervention.
// 
// Flow:
// 1. Request replacements from ChatGPT
// 2. Import + verify replacements
// 3. If verified → delete old failed songs
// 4. If still failed → retry (max 3x)
// 5. If exhausted → return userActionNeeded

import type { Song } from "@/types/song";

// ============================================================================
// TYPES
// ============================================================================

export interface VerificationResult {
  songId: string;
  success: boolean;
  reason?: string;
  spotifyData?: any;
}

export interface ReplacementProgress {
  round: number;
  stage: 'requesting' | 'verifying' | 'deleting' | 'retrying' | 'complete' | 'failed';
  attempt: number;
  totalAttempts: number;
  message: string;
}

export interface ReplacementResult {
  success: boolean;
  round: number;
  attempts: number;
  replacedCount: number;
  stillFailedSongs: Song[];
  userActionNeeded: boolean;
}

export interface AutoReplacementConfig {
  round: number;
  failedSongs: Song[];
  originalPrompt: string;  // To generate similar replacements
  maxRetries?: number;
  
  // Dependency injection (side effects)
  requestReplacements: (count: number, prompt: string) => Promise<Song[]>;
  importAndVerifySongs: (songs: Song[], round: number) => Promise<VerificationResult[]>;
  deleteSongs: (songIds: string[]) => Promise<void>;
  
  // Callbacks
  onProgress: (update: ReplacementProgress) => void;
  onComplete: (result: ReplacementResult) => void;
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function autoReplaceFailedSongs(
  config: AutoReplacementConfig
): Promise<ReplacementResult> {
  const {
    round,
    failedSongs,
    originalPrompt,
    maxRetries = 3,
    requestReplacements,
    importAndVerifySongs,
    deleteSongs,
    onProgress,
    onComplete,
  } = config;

  const failedSongIds = failedSongs.map(s => s.id);
  let attempt = 0;
  let stillFailed: Song[] = [...failedSongs];

  // Retry loop
  while (attempt < maxRetries && stillFailed.length > 0) {
    attempt++;
    
    try {
      // Step 1: Request replacements from ChatGPT
      onProgress({
        round,
        stage: 'requesting',
        attempt,
        totalAttempts: maxRetries,
        message: `Requesting ${stillFailed.length} replacements (attempt ${attempt}/${maxRetries})...`,
      });

      const replacements = await requestReplacements(
        stillFailed.length,
        originalPrompt
      );

      if (replacements.length === 0) {
        throw new Error('No replacements returned from ChatGPT');
      }

      // Step 2: Import + verify replacements
      onProgress({
        round,
        stage: 'verifying',
        attempt,
        totalAttempts: maxRetries,
        message: `Verifying ${replacements.length} replacement songs...`,
      });

      const verificationResults = await importAndVerifySongs(replacements, round);

      // Step 3: Check verification results
      const { verified, failed } = categorizeVerificationResults(
        replacements,
        verificationResults
      );

      if (verified.length > 0) {
        // Success! Delete old failed songs
        onProgress({
          round,
          stage: 'deleting',
          attempt,
          totalAttempts: maxRetries,
          message: `Deleting ${verified.length} old failed songs...`,
        });

        await deleteSongs(failedSongIds);
        
        // Update stillFailed list for next iteration
        stillFailed = failed;
        
        if (stillFailed.length === 0) {
          // Complete success!
          const result: ReplacementResult = {
            success: true,
            round,
            attempts: attempt,
            replacedCount: verified.length,
            stillFailedSongs: [],
            userActionNeeded: false,
          };
          
          onProgress({
            round,
            stage: 'complete',
            attempt,
            totalAttempts: maxRetries,
            message: `Successfully replaced all ${verified.length} songs!`,
          });
          
          onComplete(result);
          return result;
        }
      } else {
        // All replacements failed, prepare for retry
        stillFailed = failed;
      }

      if (attempt < maxRetries && stillFailed.length > 0) {
        onProgress({
          round,
          stage: 'retrying',
          attempt,
          totalAttempts: maxRetries,
          message: `${stillFailed.length} songs still failed. Retrying...`,
        });
      }

    } catch (error) {
      console.error(`Auto-replacement error (round ${round}, attempt ${attempt}):`, error);
      
      // Continue to next retry unless we've exhausted all attempts
      if (attempt >= maxRetries) {
        break;
      }
    }
  }

  // Exhausted all retries
  const result: ReplacementResult = {
    success: false,
    round,
    attempts: attempt,
    replacedCount: failedSongs.length - stillFailed.length,
    stillFailedSongs: stillFailed,
    userActionNeeded: true,
  };

  onProgress({
    round,
    stage: 'failed',
    attempt,
    totalAttempts: maxRetries,
    message: `Failed to replace ${stillFailed.length} songs after ${attempt} attempts. User intervention needed.`,
  });

  onComplete(result);
  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function categorizeVerificationResults(
  songs: Song[],
  results: VerificationResult[]
): { verified: Song[]; failed: Song[] } {
  const verified: Song[] = [];
  const failed: Song[] = [];

  // Create a map of results by songId for quick lookup
  const resultMap = new Map(results.map(r => [r.songId, r]));

  songs.forEach(song => {
    const result = resultMap.get(song.id);
    if (result?.success) {
      verified.push(song);
    } else {
      failed.push(song);
    }
  });

  return { verified, failed };
}

// ============================================================================
// BATCH ORCHESTRATOR (Process Multiple Rounds)
// ============================================================================

/**
 * Process auto-replacement for multiple rounds sequentially.
 * Useful when verification completes and multiple rounds have failures.
 */
export async function autoReplaceMultipleRounds(
  roundConfigs: AutoReplacementConfig[]
): Promise<Map<number, ReplacementResult>> {
  const results = new Map<number, ReplacementResult>();

  for (const config of roundConfigs) {
    const result = await autoReplaceFailedSongs(config);
    results.set(config.round, result);
  }

  return results;
}
