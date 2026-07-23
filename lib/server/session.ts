import "server-only";

import { getGoogleAppSession } from "@/lib/server/app-session";
import { findUserById } from "@/lib/server/users";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: true;
  authProvider: "google.com";
  authTime: number;
}

export class AuthenticationError extends Error {
  readonly status = 401;
  constructor(message = "You must be signed in to continue.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  readonly status = 403;
  constructor(message = "You do not have permission to access this resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getGoogleAppSession();
  if (!session) return null;
  const user = await findUserById(session.userId);
  if (!user?.email || !user.emailVerified) return null;

  return {
    id: user.id,
    name: user.name.trim() || user.email.split("@")[0] || "Candidate",
    email: user.email,
    emailVerified: true,
    authProvider: "google.com",
    authTime: session.authTime,
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthenticationError();
  return user;
}

export function isAccessError(
  error: unknown
): error is AuthenticationError | AuthorizationError {
  return error instanceof AuthenticationError || error instanceof AuthorizationError;
}
