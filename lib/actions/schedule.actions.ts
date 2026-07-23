"use server";

import { z } from "zod";

import {
  createRecord,
  deleteRecord,
  getRecord,
  queryRecords,
} from "@/lib/server/document-store";
import { requireSessionUser } from "@/lib/server/session";

const idSchema = z.string().trim().min(1).max(180);
const scheduleSchema = z.object({
  interviewId: idSchema,
  scheduledAt: z.string().datetime(),
  notes: z.string().trim().max(1_000).optional(),
}).strict();

export interface ScheduledInterviewRecord {
  id: string;
  interviewId: string;
  interviewTitle: string;
  scheduledAt: string;
  notes?: string;
}

export async function scheduleInterview(input: unknown) {
  try {
    const user = await requireSessionUser();
    const data = scheduleSchema.parse(input);
    const scheduledDate = new Date(data.scheduledAt);
    const now = Date.now();
    if (scheduledDate.getTime() < now - 60_000) {
      return { success: false as const, error: "Choose a time in the future." };
    }
    if (scheduledDate.getTime() > now + 366 * 24 * 60 * 60 * 1_000) {
      return { success: false as const, error: "Schedules can be created up to one year ahead." };
    }

    const interview = await getRecord<{
      userId?: string;
      visibility?: string;
      role?: string;
    }>("interviews", data.interviewId);
    if (!interview) {
      return { success: false as const, error: "Interview not found." };
    }
    const interviewData = interview.data;
    const readable =
      interviewData?.userId === user.id ||
      interviewData?.visibility === "public" ||
      interviewData?.visibility === "template";
    if (!readable) {
      return { success: false as const, error: "Interview not found." };
    }

    const record = await createRecord("scheduledInterviews", {
      userId: user.id,
      interviewId: data.interviewId,
      interviewTitle: `${String(interviewData?.role || "Practice")} interview`,
      scheduledAt: data.scheduledAt,
      notes: data.notes || "",
      createdAt: new Date().toISOString(),
    });
    return { success: true as const, scheduleId: record.id };
  } catch (error: unknown) {
    console.error("Schedule creation failed:", error);
    return {
      success: false as const,
      error:
        error instanceof z.ZodError
          ? error.issues[0]?.message || "Check the schedule details."
          : "Could not schedule the interview.",
    };
  }
}

export async function getScheduledInterviews(): Promise<ScheduledInterviewRecord[]> {
  const user = await requireSessionUser();
  const records = await queryRecords<{
    interviewId: string;
    interviewTitle?: string;
    scheduledAt: string;
    notes?: string;
  }>(
    "scheduledInterviews",
    [{ field: "userId", op: "eq", value: user.id }],
    100
  );
  const now = Date.now();
  const expired = records.filter(
    (record) => new Date(String(record.data.scheduledAt)).getTime() < now
  );
  if (expired.length) {
    await Promise.all(
      expired.map((record) => deleteRecord("scheduledInterviews", record.id))
    );
  }
  const expiredIds = new Set(expired.map((record) => record.id));
  return records
    .filter((record) => !expiredIds.has(record.id))
    .map((record) => ({
      id: record.id,
      interviewId: String(record.data.interviewId),
      interviewTitle: String(record.data.interviewTitle || "Practice interview"),
      scheduledAt: String(record.data.scheduledAt),
      notes: String(record.data.notes || "") || undefined,
    }))
    .sort(
      (first, second) =>
        new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime()
    );
}

export async function deleteScheduledInterview(idInput: string) {
  try {
    const user = await requireSessionUser();
    const id = idSchema.parse(idInput);
    const record = await getRecord<{ userId?: string }>("scheduledInterviews", id);
    if (!record || record.data.userId !== user.id) {
      return { success: false as const, error: "Schedule not found." };
    }
    await deleteRecord("scheduledInterviews", id);
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Could not remove the schedule." };
  }
}
