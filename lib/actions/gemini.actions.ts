"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "node:crypto";
import { z } from "zod";
import { requireSessionUser } from "@/lib/server/session";
import {
  consumeDailyQuota,
  refundDailyQuota,
} from "@/lib/server/quota";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
}, { timeout: 30_000 });

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  // responseMimeType: "text/plain",
  responseMimeType: "application/json",
};

// Track in-flight requests to prevent duplicate calls
const inFlightRequests = new Map<string, Promise<string>>();

// Retry configuration
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

// Helper function to check if error is retryable
function isRetryableError(error: any): boolean {
  const message = String(error?.message || "").toLowerCase();
  const status = error?.status || error?.statusCode;

  // Retry on 503 (Service Unavailable), 429 (Rate Limit), or network errors
  return (
    status === 503 ||
    status === 429 ||
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("overloaded") ||
    message.includes("rate limit") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout")
  );
}

// Helper function to calculate exponential backoff delay
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  return Math.min(delay, MAX_RETRY_DELAY);
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strip markdown code fences that Gemini sometimes wraps around JSON output
 * even when responseMimeType: "application/json" is requested.
 * e.g.  ```json\n{...}\n```  →  {...}
 */
function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  // Match ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

async function askGemini(prompt: string) {
  // Create a simple hash of the prompt to use as a key for deduplication
  // This prevents multiple identical requests from being sent simultaneously
  const requestKey = createHash("sha256").update(prompt).digest("hex");

  // If there's already an identical request in flight, wait for it
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  // Create the request promise with retry logic
  const requestPromise = (async () => {
    try {
      let lastError: any;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await chatSession.sendMessage(prompt);
          return result.response.text();
        } catch (error: any) {
          lastError = error;

          // Check if error is retryable and we haven't exceeded max retries
          if (attempt < MAX_RETRIES && isRetryableError(error)) {
            const delay = getRetryDelay(attempt);
            console.warn(
              `Gemini API error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
              error?.message || error,
              `Retrying in ${delay}ms...`
            );
            await sleep(delay);
            continue;
          }

          // If not retryable or max retries exceeded, throw the error
          throw error;
        }
      }

      // This should never be reached, but TypeScript needs it
      throw lastError;
    } finally {
      // Clean up the in-flight request after completion
      inFlightRequests.delete(requestKey);
    }
  })();

  // Store the promise so duplicate requests can wait for it
  inFlightRequests.set(requestKey, requestPromise);

  return requestPromise;
}

export async function generateSummary(jobTitle: string) {
  const user = await requireSessionUser();
  const safeJobTitle = z.string().trim().max(160).parse(jobTitle);
  const reservation = await consumeDailyQuota(user.id, "resume-writing-assist", 20);
  const prompt =
    safeJobTitle && safeJobTitle !== ""
      ? `Given the job title '${safeJobTitle}', provide a summary for three experience levels: Senior, Mid Level, and Fresher. Each summary should be 3-4 lines long and include the experience level and the corresponding summary in JSON format. The output should be an array of objects, each containing 'experience_level' and 'summary' fields. Ensure the summaries are tailored to each experience level.`
      : `Create a 3-4 line summary about myself for my resume, emphasizing my personality, social skills, and interests outside of work. The output should be an array of JSON objects, each containing 'experience_level' and 'summary' fields representing Active, Average, and Lazy personality traits. Use example hobbies if needed but do not insert placeholders for me to fill in.`;
  try {
    const result = await askGemini(prompt);
    return JSON.parse(stripJsonFences(result));
  } catch (error) {
    await refundDailyQuota(reservation);
    throw error;
  }
}

export async function generateEducationDescription(educationInfo: string) {
  const user = await requireSessionUser();
  const safeInfo = z.string().trim().min(2).max(500).parse(educationInfo);
  const reservation = await consumeDailyQuota(user.id, "resume-writing-assist", 20);
  try {
    const prompt = `Based on my education at ${safeInfo}, provide personal descriptions for three levels of curriculum activities: High Activity, Medium Activity, and Low Activity. Each description should be 3-4 lines long and written from my perspective, reflecting on past experiences. The output should be an array of JSON objects, each containing 'activity_level' and 'description' fields. Please include a subtle hint about my good (but not the best) results.`;
    const result = await askGemini(prompt);
    return JSON.parse(stripJsonFences(result));
  } catch (error) {
    await refundDailyQuota(reservation);
    throw error;
  }
}

export async function generateExperienceDescription(experienceInfo: string) {
  const user = await requireSessionUser();
  const safeInfo = z.string().trim().min(2).max(500).parse(experienceInfo);
  const reservation = await consumeDailyQuota(user.id, "resume-writing-assist", 20);
  try {
    const prompt = `Given that I have experience working as ${safeInfo}, provide a summary of three levels of activities I performed in that position, preferably as a list: High Activity, Medium Activity, and Low Activity. Each summary should be 3-4 lines long and written from my perspective, reflecting on my past experiences in that workplace. The output should be an array of JSON objects, each containing 'activity_level' and 'description' fields. You can include <b>, <i>, <u>, <s>, <blockquote>, <ul>, <ol>, and <li> to further enhance the descriptions. Use example work samples if needed, but do not insert placeholders for me to fill in.`;
    const result = await askGemini(prompt);
    return JSON.parse(stripJsonFences(result));
  } catch (error) {
    await refundDailyQuota(reservation);
    throw error;
  }
}

export async function analyzeResume(resumeData: any) {
  const user = await requireSessionUser();
  const serializedInput = JSON.stringify(resumeData);
  if (Buffer.byteLength(serializedInput, "utf8") > 500_000) {
    throw new Error("The resume is too large to analyze.");
  }
  const reservation = await consumeDailyQuota(user.id, "resume-analysis", 10);
  // Check if this is raw text from uploaded file or structured data
  const isRawText = resumeData.rawText || resumeData.extractedContent;
  const resumeContent = isRawText
    ? resumeData.rawText || resumeData.extractedContent
    : JSON.stringify(resumeData);

  const prompt = isRawText
    ? `Analyze this resume text and provide a comprehensive analysis in JSON format. The resume text is:

${resumeContent}

Please provide an analysis with the following structure:
{
  "overallScore": number (0-100),
  "strengths": array of strings (at least 3-5 items),
  "weaknesses": array of strings (at least 3-5 items),
  "suggestions": array of objects with "category" and "recommendation" fields,
  "atsscore": number (0-100, Applicant Tracking System compatibility score),
  "summary": string (2-3 paragraph overview of the resume quality)
}

Extract and analyze information from the text including: personal details, summary, work experience, education, skills, and overall structure.

Categories for suggestions should include: "Personal Details", "Summary", "Experience", "Education", "Skills", "Overall".

Be specific and actionable in your recommendations. Focus on:
- Content quality and completeness
- Formatting and structure
- Keyword optimization for ATS systems
- Industry best practices
- Areas for improvement

Return only valid JSON, no additional text.`
    : `Analyze this resume and provide a comprehensive analysis in JSON format. The resume data is: ${resumeContent}

Please provide an analysis with the following structure:
{
  "overallScore": number (0-100),
  "strengths": array of strings (at least 3-5 items),
  "weaknesses": array of strings (at least 3-5 items),
  "suggestions": array of objects with "category" and "recommendation" fields,
  "atsscore": number (0-100, Applicant Tracking System compatibility score),
  "summary": string (2-3 paragraph overview of the resume quality)
}

Categories for suggestions should include: "Personal Details", "Summary", "Experience", "Education", "Skills", "Overall".

Be specific and actionable in your recommendations. Focus on:
- Content quality and completeness
- Formatting and structure
- Keyword optimization for ATS systems
- Industry best practices
- Areas for improvement

Return only valid JSON, no additional text.`;

  try {
    const result = await askGemini(prompt);
    return JSON.parse(stripJsonFences(result));
  } catch (error: any) {
    await refundDailyQuota(reservation);
    console.error("Error analyzing resume:", error);

    const message = String(error?.message || "");
    const isRateLimit =
      error?.status === 429 ||
      message.includes("429") ||
      message.toLowerCase().includes("rate limit");

    if (isRateLimit) {
      // Friendlier message for the UI
      throw new Error(
        "Resume analysis is temporarily unavailable because the Gemini API rate limit or quota has been reached. Please wait a minute and try again, or reduce how often you run analyses."
      );
    }

    throw new Error(`Failed to analyze resume: ${message}`);
  }
}
