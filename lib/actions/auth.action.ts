"use server";

import { OAuth2Client } from "google-auth-library";
import { z } from "zod";

import { createAppSession, deleteAppSession } from "@/lib/server/app-session";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { enforceRateLimit, RateLimitError } from "@/lib/server/rate-limit";
import { getSessionUser } from "@/lib/server/session";
import {
  createPasswordUser,
  findPasswordUserByEmail,
  upsertGoogleUser,
} from "@/lib/server/users";
import {
  passwordSignInSchema,
  passwordSignUpSchema,
  type PasswordSignInInput,
  type PasswordSignUpInput,
} from "@/lib/validations/auth";

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

    await createAppSession(user.id, "google.com");
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

export async function signInWithPassword(params: PasswordSignInInput) {
  try {
    const input = passwordSignInSchema.parse(params);
    await enforceRateLimit({
      bucket: "password-signin-ip",
      limit: 12,
      windowMs: 10 * 60 * 1_000,
    });
    await enforceRateLimit({
      bucket: "password-signin-email",
      identifier: input.email,
      limit: 10,
      windowMs: 10 * 60 * 1_000,
    });

    const credentials = await findPasswordUserByEmail(input.email);
    const passwordHash =
      credentials?.passwordHash ?? (await hashPassword("invalid-credential"));
    const passwordMatches = await verifyPassword(input.password, passwordHash);
    if (!credentials || !passwordMatches) {
      return {
        success: false as const,
        message: "Email or password is incorrect.",
      };
    }

    await createAppSession(credentials.user.id, "password");
    return { success: true as const, isNewUser: false as const };
  } catch (error: unknown) {
    if (!(error instanceof z.ZodError)) {
      console.error("Password sign-in failed:", error);
    }
    return {
      success: false as const,
      message:
        error instanceof RateLimitError
          ? error.message
          : error instanceof z.ZodError
            ? "Check your email and password, then try again."
            : "Sign-in could not be completed. Please try again.",
    };
  }
}

export async function signUpWithPassword(params: PasswordSignUpInput) {
  try {
    const input = passwordSignUpSchema.parse(params);
    await enforceRateLimit({
      bucket: "password-signup-ip",
      limit: 8,
      windowMs: 60 * 60 * 1_000,
    });
    await enforceRateLimit({
      bucket: "password-signup-email",
      identifier: input.email,
      limit: 4,
      windowMs: 60 * 60 * 1_000,
    });

    const passwordHash = await hashPassword(input.password);
    const user = await createPasswordUser({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    if (!user) {
      return {
        success: false as const,
        message: "An account with this email already exists. Sign in instead.",
      };
    }

    await createAppSession(user.id, "password");
    return { success: true as const, isNewUser: true as const };
  } catch (error: unknown) {
    if (!(error instanceof z.ZodError)) {
      console.error("Password sign-up failed:", error);
    }
    return {
      success: false as const,
      message:
        error instanceof RateLimitError
          ? error.message
          : error instanceof z.ZodError
            ? "Check your account details, then try again."
            : "Your account could not be created. Please try again.",
    };
  }
}

export async function signOut() {
  await deleteAppSession();
}

export async function getCurrentUser(): Promise<User | null> {
  return getSessionUser();
}

export async function isAuthenticated() {
  return Boolean(await getCurrentUser());
}
