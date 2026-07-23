import { NextResponse } from "next/server";

import {
  deleteAppSession,
  deleteSessionsForUser,
} from "@/lib/server/app-session";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireSessionUser } from "@/lib/server/session";

export async function POST() {
  try {
    const user = await requireSessionUser();
    await enforceRateLimit({
      bucket: "session-revocation",
      identifier: user.id,
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    });
    await deleteSessionsForUser(user.id);
    await deleteAppSession();
    const response = NextResponse.json({ success: true });
    response.cookies.delete("prepora_session");
    response.cookies.delete("prepora_google_session");
    return response;
  } catch (error: unknown) {
    const unauthorized =
      error instanceof Error && error.name === "AuthenticationError";
    return NextResponse.json(
      {
        success: false,
        error: unauthorized
          ? "Sign in to manage sessions."
          : "Could not revoke sessions. Please try again.",
      },
      { status: unauthorized ? 401 : 500 }
    );
  }
}
