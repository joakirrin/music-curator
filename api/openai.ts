import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Inline config to avoid TypeScript import issues in Vercel serverless
const OPENAI_CONFIG = {
  model: "gpt-5",
  max_completion_tokens: 2000,
  reasoning_effort: "minimal",
} as const;

// Only accept calls from Fonea's own pages. Browsers always send Origin on
// POST, so this blocks other websites from spending the OpenAI balance.
// Not bulletproof (scripts can fake the header), but stops casual abuse.
function isAllowedOrigin(req: { headers?: Record<string, string | string[] | undefined> }): boolean {
  const headers = req.headers ?? {};
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const raw = pick(headers.origin) || pick(headers.referer);
  let host = "";
  try {
    host = new URL(raw).hostname;
  } catch {
    return false;
  }
  return (
    host === "foneamusic.com" ||
    host === "www.foneamusic.com" ||
    host === "music-curator-self.vercel.app" ||
    // Preview deployments of this Vercel account (fonea-app-git-<branch>-<account>.vercel.app).
    // The account suffix is unique, so other people's Vercel projects can't match it.
    host.endsWith("-joaquins-projects-d341371b.vercel.app") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  if (!isAllowedOrigin(req)) {
    res.status(403).send("Forbidden");
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
