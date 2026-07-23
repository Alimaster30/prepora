import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchWithTimeout } from "@/lib/server/http";
import {
  consumeDailyQuota,
  type DailyQuotaReservation,
  QuotaExceededError,
  refundDailyQuota,
} from "@/lib/server/quota";
import { requireSessionUser } from "@/lib/server/session";
import { coachRequestHeaders } from "@/lib/server/coach";

const PYTHON_API = process.env.PYTHON_API_URL ?? "http://localhost:8001";

export async function POST(req: NextRequest) {
  let quotaReservation: DailyQuotaReservation | undefined;
  try {
    const user = await requireSessionUser();
    const body = z.object({
      question: z.string().trim().min(1).max(2_000),
      answer: z.string().trim().min(1).max(20_000),
    }).parse(await req.json());
    quotaReservation = await consumeDailyQuota(
      user.id,
      "coach-analysis",
      100
    );
    const res = await fetchWithTimeout(`${PYTHON_API}/analyze`, {
      method: "POST",
      headers: coachRequestHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ question: body.question, answer: body.answer }),
      cache: "no-store",
    }, 20_000);

    if (!res.ok) {
      throw new Error(`Text coach returned status ${res.status}.`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    await refundDailyQuota(quotaReservation).catch((refundError) => {
      console.error("[mock-interview/analyze] Quota refund failed:", refundError);
    });
    if (error instanceof QuotaExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "A question and answer are required." }, { status: 400 });
    }
    if (error instanceof Error && error.name === "AuthenticationError") {
      return NextResponse.json({ error: "Sign in to use the coach." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "The text coach is temporarily unavailable." },
      { status: 503 }
    );
  }
}
