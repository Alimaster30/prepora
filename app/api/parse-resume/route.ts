import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  consumeDailyQuota,
  type DailyQuotaReservation,
  QuotaExceededError,
  refundDailyQuota,
} from "@/lib/server/quota";
import { requireSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const m = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1].trim() : trimmed;
}

export async function POST(req: NextRequest) {
  let quotaReservation: DailyQuotaReservation | undefined;
  try {
    const user = await requireSessionUser();
    const { resumeText } = await req.json();

    if (!resumeText?.trim()) {
      return NextResponse.json({ error: "No resume text provided." }, { status: 400 });
    }
    if (typeof resumeText !== "string" || resumeText.length > 50_000) {
      return NextResponse.json(
        { error: "Resume text must be 50,000 characters or fewer." },
        { status: 413 }
      );
    }
    quotaReservation = await consumeDailyQuota(
      user.id,
      "resume-parsing",
      15
    );

    const prompt = `You are a resume parser. Extract all information from the following resume text and return it as a JSON object with exactly this structure:

{
  "firstName": "string",
  "lastName": "string",
  "jobTitle": "string",
  "email": "string",
  "phone": "string",
  "address": "string (city, country or full address)",
  "summary": "string (professional summary/objective)",
  "experience": [
    {
      "title": "string (job title)",
      "companyName": "string",
      "city": "string",
      "state": "string",
      "startDate": "string (e.g. Jan 2020)",
      "endDate": "string (e.g. Dec 2022 or Present)",
      "currentlyWorking": boolean,
      "workSummary": "string (responsibilities and achievements, can include HTML like <ul><li>)</li></ul>"
    }
  ],
  "education": [
    {
      "universityName": "string",
      "degree": "string",
      "major": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "skills": [
    {
      "name": "string",
      "rating": number (1-5, estimate based on how prominently featured)
    }
  ]
}

Rules:
- If a field is not found, use an empty string "" or empty array []
- For skills, extract ALL mentioned technologies, languages, frameworks, tools
- For experience workSummary, format responsibilities as HTML bullet points
- currentlyWorking is true only if end date says "Present" or "Current"
- Return ONLY valid JSON, no markdown, no extra text

Resume text:
${resumeText}`;

    const chat = model.startChat({
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
      history: [],
    });

    const result = await chat.sendMessage(prompt);
    const raw = result.response.text();
    const parsed = JSON.parse(stripJsonFences(raw));

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("[parse-resume] Error:", error);
    await refundDailyQuota(quotaReservation).catch((refundError) => {
      console.error("[parse-resume] Quota refund failed:", refundError);
    });
    if (error instanceof QuotaExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof Error && error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Sign in to import a resume." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Could not extract structured resume details." },
      { status: 500 }
    );
  }
}
