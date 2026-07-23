import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
} from "@google/generative-ai";
import {
  consumeDailyQuota,
  type DailyQuotaReservation,
  QuotaExceededError,
  refundDailyQuota,
} from "@/lib/server/quota";
import { requireSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;

function isRetryableError(error: any): boolean {
  const message = String(error?.message || "").toLowerCase();
  const status = error?.status || error?.statusCode;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strip markdown code fences that Gemini sometimes wraps around JSON output
 * even when responseMimeType: "application/json" is requested.
 */
function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

async function askGemini(prompt: string): Promise<string> {
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await chatSession.sendMessage(prompt);
      return result.response.text();
    } catch (error: any) {
      lastError = error;

      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        const delay = Math.min(
          INITIAL_RETRY_DELAY * Math.pow(2, attempt),
          MAX_RETRY_DELAY
        );
        console.warn(
          `Gemini API error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
          error?.message,
          `Retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function POST(req: NextRequest) {
  let quotaReservation: DailyQuotaReservation | undefined;
  try {
    const user = await requireSessionUser();
    const body = await req.json();
    const resumeText: string = body?.resumeText ?? "";

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "No resume text provided." },
        { status: 400 }
      );
    }
    if (resumeText.length > 50_000) {
      return NextResponse.json(
        { error: "Resume text must be 50,000 characters or fewer." },
        { status: 413 }
      );
    }
    quotaReservation = await consumeDailyQuota(
      user.id,
      "resume-analysis",
      15
    );

    const prompt = `Analyze this resume text against general resume-quality and machine-parseability criteria. Do not claim to simulate a specific employer, ATS vendor, or job match because no job description or vendor rubric was provided. The resume text is:

${resumeText}

Please provide an analysis with the following structure:
{
  "overallScore": number (0-100, general document quality only),
  "strengths": array of strings (at least 3-5 items),
  "weaknesses": array of strings (at least 3-5 items),
  "suggestions": array of objects with "category" and "recommendation" fields,
  "atsscore": number (0-100, a transparent machine-parseability proxy only),
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

Return only valid JSON, no additional text.`;

    const raw = await askGemini(prompt);
    const analysis = JSON.parse(stripJsonFences(raw));

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("[analyze-resume] Error:", error);
    await refundDailyQuota(quotaReservation).catch((refundError) => {
      console.error("[analyze-resume] Quota refund failed:", refundError);
    });

    if (error instanceof QuotaExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof Error && error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Sign in to analyze a resume." }, { status: 401 });
    }
    const message = String(error instanceof Error ? error.message : "");
    const isRateLimit =
      error?.status === 429 ||
      message.includes("429") ||
      message.toLowerCase().includes("rate limit");

    if (isRateLimit) {
      return NextResponse.json(
        {
          error:
            "Resume analysis is temporarily unavailable because the Gemini API rate limit has been reached. Please wait a minute and try again.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Resume analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
