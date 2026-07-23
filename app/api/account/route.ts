import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { deleteUserData } from "@/lib/server/account-deletion";
import {
  deleteGoogleAppSession,
  deleteGoogleSessionsForUser,
} from "@/lib/server/app-session";
import { database } from "@/lib/server/database";
import { requireSessionUser } from "@/lib/server/session";
import { deleteUserById } from "@/lib/server/users";

const deletionSchema = z
  .object({ confirmation: z.literal("DELETE") })
  .strict();

export async function DELETE(request: NextRequest) {
  let deletionRequestId: string | undefined;
  try {
    const sessionUser = await requireSessionUser();
    deletionSchema.parse(await request.json());

    if (Date.now() - sessionUser.authTime > 10 * 60 * 1_000) {
      return NextResponse.json(
        {
          success: false,
          error:
            "For security, sign out and sign in with Google again before deleting your account.",
        },
        { status: 403 }
      );
    }

    deletionRequestId = createHash("sha256")
      .update(`account-deletion:${sessionUser.id}`)
      .digest("hex");
    const sql = database();
    await sql`
      insert into account_deletion_requests (
        id, user_id, status, started_at, expires_at
      ) values (
        ${deletionRequestId},
        ${sessionUser.id},
        'started',
        now(),
        now() + interval '30 days'
      )
      on conflict (id) do update
      set status = 'started', started_at = now(), completed_at = null,
          failed_at = null, expires_at = now() + interval '30 days'
    `;

    await deleteUserData(sessionUser.id);
    await sql`
      update account_deletion_requests
      set status = 'application-data-deleted'
      where id = ${deletionRequestId}
    `;
    await deleteGoogleSessionsForUser(sessionUser.id);
    await deleteUserById(sessionUser.id);
    await deleteGoogleAppSession();
    await sql`
      update account_deletion_requests
      set status = 'complete', completed_at = now()
      where id = ${deletionRequestId}
    `;

    const response = NextResponse.json({ success: true });
    response.cookies.delete("prepora_google_session");
    return response;
  } catch (error: unknown) {
    if (deletionRequestId) {
      const sql = database();
      await sql`
        update account_deletion_requests
        set status = 'failed', failed_at = now()
        where id = ${deletionRequestId}
      `.catch(() => undefined);
    }
    const unauthorized =
      error instanceof Error && error.name === "AuthenticationError";
    const invalid =
      error instanceof z.ZodError ||
      (error instanceof SyntaxError && error.name === "SyntaxError");
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: unauthorized
          ? "Sign in before deleting your account."
          : invalid
            ? "Enter DELETE and try again."
            : "We could not finish deleting the account. Contact support before trying again.",
      },
      { status: unauthorized ? 401 : invalid ? 400 : 500 }
    );
  }
}
