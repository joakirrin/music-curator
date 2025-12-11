import type { 
  LLMResponse, 
  FeedbackPayload, 
  ReplacementPayload,
  SongsJsonFormat,
  ResponseMode
} from "./types";
import { SYSTEM_PROMPTS } from "./config";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callOpenAIProxy(messages: ChatMessage[]): Promise<string> {
  const response = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI proxy error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = (await response.json()) as { content?: string; error?: string };

  if (!data.content) {
    throw new Error(data.error || "No response from OpenAI");
  }

  return data.content;
}

/**
 * Helper to build messages with mode injection (for soft error system)
 */
function buildMessagesWithMode(
  systemPrompt: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  mode: ResponseMode,
  strictMode: boolean = false
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  // Inject mode hint for GPT (optional but helpful)
  if (mode === "songs") {
    messages.push({
      role: "system",
      content: "The user is requesting song recommendations. Provide songs in the structured format.",
    });
  } else if (mode === "chat") {
    messages.push({
      role: "system",
      content: "Focus on conversational responses. Do not provide songs unless explicitly requested.",
    });
  }

  // Add strict formatting reminder if retry
  if (strictMode) {
    messages.push({
      role: "system",
      content: `CRITICAL: Your previous output had formatting issues. Follow the format EXACTLY:

=== SONG RECOMMENDATIONS START ===

SONG 1
Title: Song Name
Artist: Artist Name
Comment: Brief comment (one line)

SONG 2
Title: Another Song
Artist: Another Artist
Comment: Another comment

=== SONG RECOMMENDATIONS END ===

- Use the start/end markers exactly as shown
- Each song starts with "SONG #"
- Three fields per song: Title:, Artist:, Comment:
- One blank line between songs
- No other formatting`,
    });
  }

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }

  return messages;
}

/**
 * Parses LLM response to extract explanation and songs (if present)
 * Supports soft error recovery for better user experience
 * Uses line-based format instead of JSON
 */
function parseLLMResponse(rawResponse: string, mode: ResponseMode): LLMResponse {
  // Look for song recommendations block (case-insensitive)
  const blockRegex = /===\s*SONG RECOMMENDATIONS START\s*===([\s\S]*?)===\s*SONG RECOMMENDATIONS END\s*===/i;
  const blockMatch = rawResponse.match(blockRegex);
  
  if (!blockMatch) {
    // No song block found
    
    if (mode === "songs") {
      // Expected songs but didn't get them - soft error
      return {
        type: "soft_error",
        explanationText: rawResponse.trim(),
        songsJson: null,
        rawResponse,
        error: {
          message: "I didn't provide songs in the expected format. Would you like me to try again?",
          recoveryOptions: [
            { action: "retry", label: "Yes, give me songs" },
            { action: "continue", label: "Continue chatting" },
          ],
        },
      };
    }
    
    // For "auto" or "chat" modes, treat as conversational response
    return {
      type: "conversation",
      explanationText: rawResponse.trim(),
      songsJson: null,
      rawResponse,
    };
  }
  
  // Extract explanation text (everything before the START marker)
  const startMarkerIndex = rawResponse.search(/===\s*SONG RECOMMENDATIONS START\s*===/i);
  const explanationText = startMarkerIndex >= 0 
    ? rawResponse.substring(0, startMarkerIndex).trim()
    : '';
  
  // Extract songs from block content (case-insensitive field matching)
  const blockContent = blockMatch[1];
  const songs: Array<{ title: string; artist: string; reason?: string; comment?: string }> = [];
  
  // Split by SONG # markers
  const songBlocks = blockContent.split(/SONG\s+\d+/i).filter(block => block.trim().length > 0);
  
  for (const block of songBlocks) {
    // Extract fields (case-insensitive)
    const titleMatch = block.match(/Title:\s*(.+?)(?=\n|$)/i);
    const artistMatch = block.match(/Artist:\s*(.+?)(?=\n|$)/i);
    const commentMatch = block.match(/Comment:\s*(.+?)(?=\n|$)/i);
    const reasonMatch = block.match(/Reason:\s*(.+?)(?=\n|$)/i); // For compatibility
    
    if (titleMatch && artistMatch) {
      songs.push({
        title: titleMatch[1].trim(),
        artist: artistMatch[1].trim(),
        comment: commentMatch ? commentMatch[1].trim() : undefined,
        reason: reasonMatch ? reasonMatch[1].trim() : commentMatch ? commentMatch[1].trim() : undefined,
      });
    }
  }
  
  console.log(`[Line Parser] Found ${songs.length} songs in response`);
  
  if (songs.length === 0) {
    return {
      type: "soft_error",
      explanationText,
      songsJson: null,
      rawResponse,
      error: {
        message: "No songs were found in the response.",
        recoveryOptions: [
          { action: "retry", label: "Ask for songs again" },
          { action: "continue", label: "Continue chatting" },
        ],
      },
    };
  }
  
  // Filter out songs missing required fields
  const validSongs = songs.filter(song => song.title && song.artist);
  
  if (validSongs.length < songs.length) {
    console.warn(`[Line Parser] Filtered ${songs.length - validSongs.length} songs missing required fields`);
  }
  
  if (validSongs.length === 0) {
    return {
      type: "soft_error",
      explanationText,
      songsJson: null,
      rawResponse,
      error: {
        message: "Songs were missing required information (title and artist).",
        recoveryOptions: [
          { action: "regenerate", label: "Try generating again" },
          { action: "continue", label: "Continue chatting" },
        ],
      },
    };
  }
  
  // Build SongsJsonFormat structure (same as before, just populated from line format)
  const songsJson: SongsJsonFormat = {
    round: 1,
    requestedCount: validSongs.length,
    recommendations: validSongs,
  };
  
  return {
    type: "success",
    explanationText,
    songsJson,
    rawResponse,
  };
}

/**
 * Get recommendations from a vibe/prompt with full conversation context
 * Supports multi-turn conversations and variable song counts
 */
export async function getRecommendationsFromVibe(
  prompt: string,
  requestedCount: number = 5,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  mode: ResponseMode = "auto",
  strictMode: boolean = false
): Promise<LLMResponse> {
  try {
    // Build messages with mode injection
    const messages = buildMessagesWithMode(
      SYSTEM_PROMPTS.base,
      conversationHistory || [],
      mode,
      strictMode
    );

    // Add hint about requested count if specified
    if (requestedCount && Number.isFinite(requestedCount) && requestedCount !== 5) {
      messages.push({
        role: "system",
        content: `The user asked for approximately ${requestedCount} songs.`,
      });
    }
    
    // Add current user message
    messages.push({
      role: "user",
      content: prompt,
    });
    
    const rawResponse = await callOpenAIProxy(messages);

    if (!rawResponse) {
      throw new Error("No response from OpenAI");
    }
    
    return parseLLMResponse(rawResponse, mode);
  } catch (err) {
    throw new Error(
      `Failed to get recommendations from OpenAI: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Get recommendations based on user feedback
 * Always expects songs output (mode: "songs")
 */
export async function getRecommendationsFromFeedback(
  feedbackPayload: FeedbackPayload
): Promise<LLMResponse> {
  // Build feedback message with JSON payload
  const feedbackJson = JSON.stringify(feedbackPayload, null, 2);
  
  const userMessage = `Here's my feedback on the previous recommendations from Round ${feedbackPayload.round}:

\`\`\`feedback-json
${feedbackJson}
\`\`\`

Based on this feedback, please:
1. Analyze the patterns in what I kept vs skipped
2. Pay attention to my comments
3. Recommend exactly ${feedbackPayload.requestedCount} NEW songs that better match my taste

Format your response as:
1. A brief summary of what you learned from my feedback (1-2 paragraphs)
2. Songs in the structured format with start/end markers`;

  try {
    const messages = buildMessagesWithMode(
      SYSTEM_PROMPTS.base + "\n\n" + SYSTEM_PROMPTS.feedback,
      [],
      "songs",
      false
    );
    
    messages.push({
      role: "user",
      content: userMessage,
    });

    const rawResponse = await callOpenAIProxy(messages);

    if (!rawResponse) {
      throw new Error("No response from OpenAI");
    }
    
    return parseLLMResponse(rawResponse, "songs");
  } catch (err) {
    throw new Error(
      `Failed to get feedback-based recommendations: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Get replacements for invalid/failed songs
 * Always expects songs output (mode: "songs")
 */
export async function getReplacementsForInvalidSongs(
  replacementPayload: ReplacementPayload
): Promise<LLMResponse> {
  // Build replacement message with JSON payload
  const replacementJson = JSON.stringify(replacementPayload, null, 2);
  
  const userMessage = `These songs from Round ${replacementPayload.round} couldn't be verified on streaming platforms:

\`\`\`replacements-json
${replacementJson}
\`\`\`

Please suggest ${replacementPayload.requestedCount} alternative song(s) that are similar in vibe but more widely available.

Use the structured format with start/end markers.`;

  try {
    const messages = buildMessagesWithMode(
      SYSTEM_PROMPTS.base + "\n\n" + SYSTEM_PROMPTS.replacements,
      [],
      "songs",
      false
    );
    
    messages.push({
      role: "user",
      content: userMessage,
    });

    const rawResponse = await callOpenAIProxy(messages);

    if (!rawResponse) {
      throw new Error("No response from OpenAI");
    }
    
    return parseLLMResponse(rawResponse, "songs");
  } catch (err) {
    throw new Error(
      `Failed to get replacement recommendations: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}