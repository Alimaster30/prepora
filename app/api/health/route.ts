import { NextResponse } from "next/server";

import { fetchWithTimeout } from "@/lib/server/http";
import { coachRequestHeaders } from "@/lib/server/coach";
import { checkDatabaseConnection } from "@/lib/server/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const pythonUrl = process.env.PYTHON_API_URL?.replace(/\/$/, "");
  const requiredConfiguration = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    "NEXT_PUBLIC_VAPI_WEB_TOKEN",
    "NEXT_PUBLIC_VAPI_WORKFLOW_ID",
    "GEMINI_API_KEY",
    "INTERNAL_SERVICE_KEY",
    "DATABASE_URL",
  ];
  const configurationReady = requiredConfiguration.every(
    (name) => Boolean(process.env[name]?.trim())
  );
  let database: "ok" | "unavailable" = "ok";
  try {
    await checkDatabaseConnection();
  } catch {
    database = "unavailable";
  }

  if (!pythonUrl) {
    return NextResponse.json({
      status:
        process.env.NODE_ENV === "production" || database !== "ok"
          ? "degraded"
          : "ok",
      checkedAt,
      services: {
        web: "ok",
        database,
        configuration: configurationReady ? "ok" : "incomplete",
        coach: "not-configured",
      },
    }, { status: process.env.NODE_ENV === "production" ? 503 : 200 });
  }

  try {
    const response = await fetchWithTimeout(
      `${pythonUrl}/health`,
      { headers: coachRequestHeaders() },
      3_000
    );
    if (!response.ok) throw new Error("Coach health check failed.");

    const healthy = database === "ok" && configurationReady;
    return NextResponse.json({
      status: healthy ? "ok" : "degraded",
      checkedAt,
      services: {
        web: "ok",
        database,
        configuration: configurationReady ? "ok" : "incomplete",
        coach: "ok",
      },
    }, { status: healthy ? 200 : 503 });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        checkedAt,
        services: {
          web: "ok",
          database,
          configuration: configurationReady ? "ok" : "incomplete",
          coach: "unavailable",
        },
      },
      { status: 503 }
    );
  }
}
