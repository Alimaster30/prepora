import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/session";
import { coachRequestHeaders } from "@/lib/server/coach";

const PYTHON_API = process.env.PYTHON_API_URL ?? "http://localhost:8001";

export async function GET() {
  try {
    await requireSessionUser();
    const res = await fetchWithTimeout(
      `${PYTHON_API}/categories`,
      { cache: "no-store", headers: coachRequestHeaders() },
      8_000
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Interview topics are temporarily unavailable." },
        { status: 503 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error && error.name === "AuthenticationError" ? "Sign in to use the coach." : "The text coach is temporarily unavailable." },
      { status: error instanceof Error && error.name === "AuthenticationError" ? 401 : 503 }
    );
  }
}
