import OpenAI from "openai";
import type { 
  LLMResponse, 
  FeedbackPayload, 
  ReplacementPayload,
  MinimalSong,
  SongsJsonFormat 
} from "./types";
import { OPENAI_CONFIG, SYSTEM_PROMPTS } from "./config";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For client-side use (consider proxy in production)
});

/**
 * Parses LLM response to extract explanation and songs-json
 */
function parseLLMResponse(rawResponse: string): LLMResponse {
  // Find the ```songs-json block (also accept plain ```json for flexibility)
  const jsonBlockRegex = /```(?:songs-json|json)\s*\n([\s\S]*?)\n```/;
  const match = rawResponse.match(jsonBlockRegex);
  
  if (!match) {
    throw new Error(
      "No ```songs-json block found in response. " +
      "GPT should return a markdown code block with the JSON."
    );
  }
  
  const jsonText = match[1].trim();
  const explanationText = rawResponse.substring(0, match.index).trim();
  
  // Parse JSON
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(
      `Failed to parse songs-json: ${err instanceof Error ? err.message : 'Invalid JSON'}. ` +
      `JSON text was: ${jsonText.substring(0, 200)}...`
    );
  }
  
  // Handle two possible formats:
  // 1. Direct array: [{"title":"...","artist":"..."}, ...]
  // 2. Wrapped format: {"round":1, "requestedCount":5, "recommendations":[...]}
  
  let songsJson: SongsJsonFormat;
  
  if (Array.isArray(parsedJson)) {
    // GPT-5 returned a direct array - wrap it
    songsJson = {
      round: 1, // Default round
      requestedCount: parsedJson.length,
      recommendations: parsedJson,
    };
  } else if (parsedJson.recommendations && Array.isArray(parsedJson.recommendations)) {
    // Already in the correct format
    songsJson = parsedJson as SongsJsonFormat;
  } else {
    throw new Error(
      'Invalid songs-json format: expected either an array of songs or an object with "recommendations" array. ' +
      `Got: ${JSON.stringify(parsedJson).substring(0, 200)}...`
    );
  }
  
  // Validate we have songs
  if (songsJson.recommendations.length === 0) {
    throw new Error('Invalid songs-json format: recommendations array is empty');
  }
  
  // Validate each recommendation has required fields
  songsJson.recommendations.forEach((rec, idx) => {
    if (!rec.title || !rec.artist) {
      throw new Error(
        `Recommendation #${idx + 1} is missing required fields. ` +
        `Expected: { title, artist }, got: ${JSON.stringify(rec)}`
      );
    }
  });
  
  return {
    explanationText,
    songsJson,
    rawResponse,
  };
}

/**
 * Get recommendations from a vibe/prompt (initial request)
 */
export async function getRecommendationsFromVibe(
  prompt: string,
  requestedCount: number = 5,
  context?: {
    previousSongs?: MinimalSong[];
    tasteSummary?: string;
  }
): Promise<LLMResponse> {
  // Build user message with optional context
  let userMessage = prompt;
  
  if (context?.previousSongs && context.previousSongs.length > 0) {
    userMessage += "\n\n**Previous songs you've recommended:**\n";
    context.previousSongs.forEach(song => {
      const decision = song.decision ? ` (${song.decision})` : '';
      userMessage += `- "${song.title}" by ${song.artist}${decision}\n`;
    });
  }
  
  if (context?.tasteSummary) {
    userMessage += `\n\n**Taste summary:** ${context.tasteSummary}`;
  }
  
  userMessage += `\n\n**Please recommend exactly ${requestedCount} songs** that match this vibe. Format your response as:\n1. A brief explanation (1-3 paragraphs)\n2. A \`\`\`songs-json code block with the recommendations`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      max_completion_tokens: OPENAI_CONFIG.max_completion_tokens,
      reasoning_effort: OPENAI_CONFIG.reasoning_effort,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS.base,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });
    
    const rawResponse = completion.choices[0]?.message?.content;
    
    if (!rawResponse) {
      throw new Error("No response from OpenAI");
    }
    
    return parseLLMResponse(rawResponse);
  } catch (err) {
    if (err instanceof Error && err.message.includes("songs-json")) {
      // Already a parsing error, rethrow
      throw err;
    }
    throw new Error(
      `Failed to get recommendations from OpenAI: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Get recommendations based on user feedback
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
2. A \`\`\`songs-json code block with ${feedbackPayload.requestedCount} new recommendations`;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      max_completion_tokens: OPENAI_CONFIG.max_completion_tokens,
      reasoning_effort: OPENAI_CONFIG.reasoning_effort,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS.base + "\n\n" + SYSTEM_PROMPTS.feedback,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });
    
    const rawResponse = completion.choices[0]?.message?.content;
    
    if (!rawResponse) {
      throw new Error("No response from OpenAI");
    }
    
    return parseLLMResponse(rawResponse);
  } catch (err) {
    if (err instanceof Error && err.message.includes("songs-json")) {
      throw err;
    }
    throw new Error(
      `Failed to get feedback-based recommendations: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

/**
 * Get replacements for invalid/failed songs
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

Please suggest exactly ${replacementPayload.requestedCount} alternative song(s) that are:
- Similar in style/vibe to the failed tracks
- More mainstream and widely available on Spotify/Apple Music
- Real, verifiable tracks (avoid obscure or rare songs)

Format your response as:
1. A brief explanation of your replacement strategy
2. A \`\`\`songs-json code block with ONLY the ${replacementPayload.requestedCount} replacement(s)`;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      max_completion_tokens: OPENAI_CONFIG.max_completion_tokens,
      reasoning_effort: OPENAI_CONFIG.reasoning_effort,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS.base + "\n\n" + SYSTEM_PROMPTS.replacements,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });
    
    const rawResponse = completion.choices[0]?.message?.content;
    
    if (!rawResponse) {
      throw new Error("No response from OpenAI");
    }
    
    return parseLLMResponse(rawResponse);
  } catch (err) {
    if (err instanceof Error && err.message.includes("songs-json")) {
      throw err;
    }
    throw new Error(
      `Failed to get replacement recommendations: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}