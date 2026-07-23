"use server";

import { OAuth2Client } from "google-auth-library";

import {
  createGoogleAppSession,
  deleteGoogleAppSession,
} from "@/lib/server/app-session";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";
import { getSessionUser } from "@/lib/server/session";
import { upsertGoogleUser } from "@/lib/server/users";

const googleClient = new OAuth2Client();

export async function signInWithGoogle(params: GoogleSignInParams) {
  try {
    await enforceRateLimit({
      bucket: "google-signin",
      limit: 20,
      windowMs: 10 * 60 * 1_000,
    });
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      return {
        success: false as const,
        message: "Google sign-in is not configured yet.",
      };
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: params.idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const email =
      typeof payload?.email === "string"
        ? payload.email.trim().toLowerCase()
        : "";
    const googleSubject = payload?.sub;
    if (!email || payload?.email_verified !== true || !googleSubject) {
      return {
        success: false as const,
        message: "Google could not verify this account.",
      };
    }

    const fallbackName = email.split("@")[0] || "Candidate";
    const name =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim().slice(0, 100)
        : fallbackName;
    const { user, isNewUser } = await upsertGoogleUser({
      googleSubject,
      email,
      name,
      ...(typeof payload.picture === "string"
        ? { avatarUrl: payload.picture }
        : {}),
    });

    await createGoogleAppSession(user.id);
    return { success: true as const, isNewUser };
  } catch (error: unknown) {
    console.error("Direct Google sign-in failed:", error);
    return {
      success: false as const,
      message:
        error instanceof RateLimitError
          ? error.message
          : "Google sign-in could not be completed. Please try again.",
    };
  }
}

export async function signOut() {
  await deleteGoogleAppSession();
}

export async function getCurrentUser(): Promise<User | null> {
  return getSessionUser();
}

export async function isAuthenticated() {
  return Boolean(await getCurrentUser());
}
