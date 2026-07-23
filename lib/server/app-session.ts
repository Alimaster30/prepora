import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { database } from "@/lib/server/database";

export const SESSION_COOKIE = "prepora_session";
export const LEGACY_GOOGLE_SESSION_COOKIE = "prepora_google_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type AuthProvider = "google.com" | "password";

export interface AppSession {
  userId: string;
  authProvider: AuthProvider;
  authTime: number;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAppSession(
  userId: string,
  authProvider: AuthProvider
) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const authTime = new Date();
  const expiresAt = new Date(authTime.getTime() + SESSION_DURATION_SECONDS * 1_000);
  const sql = database();

  await sql`
    insert into auth_sessions (
      token_hash, user_id, auth_provider, auth_time, expires_at
    ) values (
      ${tokenHash}, ${userId}, ${authProvider}, ${authTime}, ${expiresAt}
    )
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    maxAge: SESSION_DURATION_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
  cookieStore.delete(LEGACY_GOOGLE_SESSION_COOKIE);
}

export async function getAppSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE)?.value ||
    cookieStore.get(LEGACY_GOOGLE_SESSION_COOKIE)?.value;
  if (!token) return null;

  const sql = database();
  const tokenHash = hashSessionToken(token);
  const rows = await sql<{
    user_id: string;
    auth_provider: AuthProvider;
    auth_time: Date;
  }[]>`
    select user_id, auth_provider, auth_time
    from auth_sessions
    where token_hash = ${tokenHash} and expires_at > now()
    limit 1
  `;
  if (!rows[0]) {
    await sql`delete from auth_sessions where token_hash = ${tokenHash}`;
    return null;
  }

  return {
    userId: rows[0].user_id,
    authProvider: rows[0].auth_provider,
    authTime: new Date(rows[0].auth_time).getTime(),
  };
}

export async function deleteAppSession() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE)?.value ||
    cookieStore.get(LEGACY_GOOGLE_SESSION_COOKIE)?.value;
  if (token) {
    const sql = database();
    await sql`delete from auth_sessions where token_hash = ${hashSessionToken(token)}`;
  }
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_GOOGLE_SESSION_COOKIE);
}

export async function deleteSessionsForUser(userId: string) {
  const sql = database();
  await sql`delete from auth_sessions where user_id = ${userId}`;
}
