import "server-only";

// Render free services can take around a minute to wake. User-facing coach
// requests wait through that cold start instead of failing after a few seconds.
export const COACH_COLD_START_TIMEOUT_MS = 75_000;
export const COACH_ANALYSIS_TIMEOUT_MS = 90_000;

export function coachRequestHeaders(
  headers: HeadersInit = {}
): HeadersInit {
  const serviceKey = process.env.INTERNAL_SERVICE_KEY?.trim();
  if (process.env.NODE_ENV === "production" && !serviceKey) {
    throw new Error("INTERNAL_SERVICE_KEY is required in production.");
  }
  return serviceKey
    ? { ...headers, "X-Prepora-Service-Key": serviceKey }
    : headers;
}
