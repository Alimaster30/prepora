import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const MODEL_NAME = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 2;

function jsonPayload(value: string): unknown {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function retryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return ["429", "500", "502", "503", "504", "timeout", "fetch failed"].some(
    (fragment) => message.includes(fragment)
  );
}

export async function generateStructuredObject<T>({
  schema,
  system,
  prompt,
}: {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<{ object: T }> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("Gemini is not configured.");

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel(
    {
      model: MODEL_NAME,
      systemInstruction: system,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
        maxOutputTokens: 8_192,
      },
    },
    { timeout: REQUEST_TIMEOUT_MS }
  );

  let finalError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      return { object: schema.parse(jsonPayload(result.response.text())) };
    } catch (error: unknown) {
      finalError = error;
      if (attempt === MAX_ATTEMPTS || !retryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw finalError;
}
