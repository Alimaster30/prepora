import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/session";
import {
  COACH_COLD_START_TIMEOUT_MS,
  coachRequestHeaders,
} from "@/lib/server/coach";

const PYTHON_API = process.env.PYTHON_API_URL ?? "http://localhost:8001";

export async function GET(req: NextRequest) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(req.url);
    const categories = (searchParams.get("categories") ?? "").slice(0, 500);
    const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "10", 10);
    const limit = String(Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 10, 1), 25));
    const res = await fetchWithTimeout(
      `${PYTHON_API}/questions?categories=${encodeURIComponent(categories)}&limit=${limit}`,
      { cache: "no-store", headers: coachRequestHeaders() },
      COACH_COLD_START_TIMEOUT_MS
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Interview questions are temporarily unavailable." },
        { status: 503 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[mock-interview/questions] Coach request failed:", error);
    return NextResponse.json(
      { error: error instanceof Error && error.name === "AuthenticationError" ? "Sign in to use the coach." : "The text coach is temporarily unavailable." },
      { status: error instanceof Error && error.name === "AuthenticationError" ? 401 : 503 }
    );
  }
}
