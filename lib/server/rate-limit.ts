import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

import { database } from "@/lib/server/database";

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many requests. Please wait and try again.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function requestIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function enforceRateLimit({
  bucket,
  limit,
  windowMs,
  identifier,
}: {
  bucket: string;
  limit: number;
  windowMs: number;
  identifier?: string;
}): Promise<void> {
  const identity = identifier || (await requestIp());
  const keyHash = createHash("sha256")
    .update(`${bucket}:${identity}`)
    .digest("hex");
  const sql = database();
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const expiresAt = new Date(resetAt.getTime() + 24 * 60 * 60 * 1_000);

  const rows = await sql<{ count: number; reset_at: Date }[]>`
    insert into rate_limits (key_hash, bucket, count, reset_at, expires_at)
    values (${keyHash}, ${bucket}, 1, ${resetAt}, ${expiresAt})
    on conflict (key_hash) do update
    set bucket = excluded.bucket,
        count = case
          when rate_limits.reset_at <= ${now} then 1
          else rate_limits.count + 1
        end,
        reset_at = case
          when rate_limits.reset_at <= ${now} then excluded.reset_at
          else rate_limits.reset_at
        end,
        expires_at = case
          when rate_limits.reset_at <= ${now} then excluded.expires_at
          else rate_limits.expires_at
        end
    returning count, reset_at
  `;

  if (rows[0].count > limit) {
    const retryAfterMs = Math.max(
      new Date(rows[0].reset_at).getTime() - Date.now(),
      1_000
    );
    throw new RateLimitError(Math.ceil(retryAfterMs / 1_000));
  }
}
