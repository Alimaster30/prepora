import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createRecord, queryRecords } from "@/lib/server/document-store";
import { requireSessionUser } from "@/lib/server/session";

const resultSchema = z.object({
  score: z.number().finite().min(0).max(100),
  similarity: z.number().finite().min(0).max(100),
  length_score: z.number().finite().min(0).max(100),
  structure_score: z.number().finite().min(0).max(100),
  feedback: z.string().trim().max(5_000),
}).strict();

const boundedRecord = <T extends z.ZodTypeAny>(value: T) =>
  z.record(value).refine((record) => Object.keys(record).length <= 100, {
    message: "Too many session entries.",
  });

const sessionSchema = z.object({
  categories: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  questions: z.array(z.string().trim().min(1).max(2_000)).max(100).default([]),
  responses: boundedRecord(z.string().max(20_000)).default({}),
  analysis: boundedRecord(resultSchema).default({}),
  completedAt: z.string().datetime().optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser();
    const data = sessionSchema.parse(await req.json());
    if (Buffer.byteLength(JSON.stringify(data), "utf8") > 750_000) {
      return NextResponse.json(
        { success: false, error: "The session is too large to save." },
        { status: 413 }
      );
    }
    const record = await createRecord("mockInterviewSessions", {
      categories: data.categories,
      questions: data.questions,
      responses: data.responses,
      analysis: data.analysis,
      completedAt: data.completedAt ?? new Date().toISOString(),
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, sessionId: record.id });
  } catch (error: unknown) {
    const unauthorized =
      error instanceof Error && error.name === "AuthenticationError";
    return NextResponse.json(
      { success: false, error: unauthorized ? "Sign in to save sessions." : "The session data is invalid." },
      { status: unauthorized ? 401 : 400 }
    );
  }
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const records = await queryRecords<Record<string, unknown>>(
      "mockInterviewSessions",
      [{ field: "userId", op: "eq", value: user.id }],
      50
    );
    const sessions = records
      .map((record) => ({ id: record.id, ...record.data }))
      .sort((first: any, second: any) =>
        String(second.createdAt ?? "").localeCompare(String(first.createdAt ?? ""))
      )
      .slice(0, 20);
    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    const unauthorized =
      error instanceof Error && error.name === "AuthenticationError";
    return NextResponse.json(
      { sessions: [], error: unauthorized ? "Sign in to view sessions." : "Could not load session history." },
      { status: unauthorized ? 401 : 500 }
    );
  }
}
