import "server-only";

import { database } from "@/lib/server/database";

export type QuotaFeature =
  | "interview-generation"
  | "interview-feedback"
  | "resume-analysis"
  | "resume-parsing"
  | "resume-writing-assist"
  | "coach-analysis";

export class QuotaExceededError extends Error {
  readonly status = 429;
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export interface DailyQuotaReservation {
  userId: string;
  feature: QuotaFeature;
  day: string;
}

export async function consumeDailyQuota(
  userId: string,
  feature: QuotaFeature,
  limit: number
): Promise<DailyQuotaReservation> {
  const day = new Date().toISOString().slice(0, 10);
  const sql = database();
  const rows = await sql<{ count: number }[]>`
    insert into usage_quotas (user_id, feature, day, count)
    values (${userId}, ${feature}, ${day}, 1)
    on conflict (user_id, feature, day) do update
    set count = usage_quotas.count + 1, updated_at = now()
    where usage_quotas.count < ${limit}
    returning count
  `;

  if (!rows[0]) {
    throw new QuotaExceededError(
      `You reached today's daily limit for ${feature.replaceAll("-", " ")}. Try again tomorrow.`
    );
  }
  return { userId, feature, day };
}

export async function refundDailyQuota(
  reservation: DailyQuotaReservation | undefined
) {
  if (!reservation) return;
  const sql = database();
  await sql`
    update usage_quotas
    set count = greatest(count - 1, 0), updated_at = now()
    where user_id = ${reservation.userId}
      and feature = ${reservation.feature}
      and day = ${reservation.day}
  `;
  await sql`
    delete from usage_quotas
    where user_id = ${reservation.userId}
      and feature = ${reservation.feature}
      and day = ${reservation.day}
      and count = 0
  `;
}
