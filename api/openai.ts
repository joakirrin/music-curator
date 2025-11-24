import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Inline config to avoid TypeScript import issues in Vercel serverless
const OPENAI_CONFIG = {
  model: "gpt-5-mini",
  max_completion_tokens: 2000,
  reasoning_effort: "minimal",
} as const;

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set on the server");
    res.status(500).send("OPENAI_API_KEY is not set on the server");
    return;
  }

  // Parse request body
  let messages: ChatMessage[] | undefined;
  try {
    if (req.body) {
      messages = req.body.messages;
    } else if (req.rawBody) {
      const parsed = JSON.parse(req.rawBody.toString());
      messages = parsed.messages;
    }
  } catch (err) {
    console.error("Failed to parse request body:", err);
    res.status(400).send("Invalid JSON body");
    return;
  }

  if (!messages || !Array.isArray(messages)) {
    res.status(400).send("Missing messages array");
    return;
  }

  // Call OpenAI
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      max_completion_tokens: OPENAI_CONFIG.max_completion_tokens,
      reasoning_effort: OPENAI_CONFIG.reasoning_effort,
      messages,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      res.status(502).send("No response from OpenAI");
      return;
    }

    res.status(200).json({ content });
  } catch (err) {
    console.error("OpenAI request failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).send(`OpenAI request failed: ${message}`);
  }
}
