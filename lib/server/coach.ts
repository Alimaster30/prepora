import "server-only";

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
