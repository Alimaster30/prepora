"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import {
  createRecord,
  getRecord,
  queryRecords,
  setRecord,
} from "@/lib/server/document-store";
import {
  consumeDailyQuota,
  type DailyQuotaReservation,
  QuotaExceededError,
  refundDailyQuota,
} from "@/lib/server/quota";
import { requireSessionUser } from "@/lib/server/session";
import { getRandomInterviewCover } from "@/lib/utils";
import { generateStructuredObject } from "@/lib/server/structured-ai";

const idSchema = z.string().trim().min(1).max(180);
const transcriptSchema = z.array(z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(10_000),
}).strict()).min(2).max(250);
const feedbackSchema = z.object({
  totalScore: z.number().int().min(0).max(100),
  categoryScores: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    score: z.number().int().min(0).max(100),
    comment: z.string().trim().min(1).max(1_500),
  })).length(5),
  strengths: z.array(z.string().trim().min(1).max(300)).min(1).max(6),
  areasForImprovement: z.array(z.string().trim().min(1).max(300)).min(1).max(6),
  finalAssessment: z.string().trim().min(1).max(3_000),
});
const interviewInputSchema = z.object({
  role: z.string().trim().min(2).max(120),
  type: z.string().trim().min(2).max(60),
  level: z.string().trim().min(2).max(60),
  techstack: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  questions: z.array(z.string().trim().min(5).max(1_000)).min(1).max(20),
}).strict();
const interviewSetupSchema = z.object({
  role: z.string().trim().min(2).max(120),
  type: z.enum(["Technical", "Behavioral", "Mixed"]),
  level: z.enum(["Entry-level", "Junior", "Mid-level", "Senior", "Lead"]),
  techstack: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  amount: z.number().int().min(3).max(10).default(6),
  jobDescription: z.string().trim().max(4_000).optional(),
}).strict();

type InterviewDocument = Omit<Interview, "id"> & {
  visibility?: "private" | "public" | "template";
};

async function readableInterview(idInput: string, userId: string) {
  const id = idSchema.parse(idInput);
  const record = await getRecord<InterviewDocument>("interviews", id);
  if (!record) return null;
  const data = record.data;
  const publicInterview =
    data.visibility === "public" || data.visibility === "template";
  return data.userId === userId || publicInterview
    ? ({ id: record.id, ...data } as Interview)
    : null;
}

function safeLimit(value: number | undefined) {
  return Math.min(Math.max(Number.isFinite(value) ? value! : 20, 1), 50);
}

export async function createFeedback(params: CreateFeedbackParams) {
  let quotaReservation: DailyQuotaReservation | undefined;
  try {
    const user = await requireSessionUser();
    const interviewId = idSchema.parse(params.interviewId);
    const transcript = transcriptSchema.parse(params.transcript);
    const interview = await readableInterview(interviewId, user.id);
    if (!interview) {
      return { success: false as const, error: "Interview not found." };
    }
    const feedbackId = params.feedbackId
      ? idSchema.parse(params.feedbackId)
      : randomUUID();
    if (params.feedbackId) {
      const existing = await getRecord<{ userId?: string; interviewId?: string }>(
        "feedback",
        feedbackId
      );
      if (existing) {
        if (
          existing.data.userId !== user.id ||
          existing.data.interviewId !== interviewId
        ) {
          return { success: false as const, error: "Feedback not found." };
        }
      }
    }
    quotaReservation = await consumeDailyQuota(
      user.id,
      "interview-feedback",
      12
    );

    const formattedTranscript = transcript
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");
    const { object } = await generateStructuredObject({
      schema: feedbackSchema,
      system:
        "You are a rigorous but constructive interview evaluator. Score only evidence in the transcript. Never invent demonstrated skills or facts.",
      prompt: `Evaluate this ${interview.level} ${interview.role} mock interview.
Interview type: ${interview.type}
Focus areas: ${interview.techstack.join(", ")}

Use exactly these five categories: Communication Skills, Technical Knowledge, Problem-Solving, Cultural & Role Fit, Confidence & Clarity.

Transcript:
${formattedTranscript}`,
    });

    await setRecord("feedback", feedbackId, {
      interviewId,
      userId: user.id,
      role: interview.role,
      ...object,
      transcript,
      createdAt: new Date().toISOString(),
    });
    return { success: true as const, feedbackId };
  } catch (error: unknown) {
    console.error("Feedback generation failed:", error);
    await refundDailyQuota(quotaReservation).catch((refundError) => {
      console.error("Feedback quota refund failed:", refundError);
    });
    return {
      success: false as const,
      error:
        error instanceof QuotaExceededError
          ? error.message
          : error instanceof z.ZodError
          ? "The interview transcript is incomplete or invalid."
          : "Feedback generation is temporarily unavailable. Your interview was not assigned a fabricated score.",
    };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const user = await requireSessionUser();
  return readableInterview(id, user.id);
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const user = await requireSessionUser();
  const interviewId = idSchema.parse(params.interviewId);
  const records = await queryRecords<Omit<Feedback, "id">>(
    "feedback",
    [
      { field: "interviewId", op: "eq", value: interviewId },
      { field: "userId", op: "eq", value: user.id },
    ],
    1
  );
  return records[0]
    ? ({ id: records[0].id, ...records[0].data } as Feedback)
    : null;
}

function newestFirst(first: Interview, second: Interview) {
  return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[]> {
  await requireSessionUser();
  const records = await queryRecords<InterviewDocument>(
    "interviews",
    [{ field: "visibility", op: "in", value: ["public", "template"] }],
    50
  );
  return records
    .map((record) => ({ id: record.id, ...record.data }) as Interview)
    .filter((interview) => interview.finalized)
    .sort(newestFirst)
    .slice(0, safeLimit(params.limit));
}

export async function getInterviewsByUserId(
  _userId: string
): Promise<Interview[]> {
  const user = await requireSessionUser();
  const records = await queryRecords<InterviewDocument>(
    "interviews",
    [{ field: "userId", op: "eq", value: user.id }],
    100
  );
  return records
    .map((record) => ({ id: record.id, ...record.data }) as Interview)
    .sort(newestFirst);
}

export async function generateInterviewRecord(input: unknown) {
  let quotaReservation: DailyQuotaReservation | undefined;
  try {
    const user = await requireSessionUser();
    const setup = interviewSetupSchema.parse(input);
    quotaReservation = await consumeDailyQuota(
      user.id,
      "interview-generation",
      8
    );
    const { object } = await generateStructuredObject({
      schema: z.object({
        questions: z.array(z.string().trim().min(10).max(1_000)).min(3).max(10),
      }),
      system:
        "You create realistic mock interview questions. Questions must be concise, speakable, non-duplicative, and appropriate for the requested seniority.",
      prompt: `Create exactly ${setup.amount} ${setup.type.toLowerCase()} interview questions.
Role: ${setup.role}
Level: ${setup.level}
Focus areas: ${setup.techstack.join(", ")}
${setup.jobDescription ? `Job context: ${setup.jobDescription}` : ""}
Balance fundamentals, applied judgment, and evidence from past experience.`,
    });
    const questions = object.questions.slice(0, setup.amount);
    if (questions.length < 3) throw new Error("Too few questions generated.");
    const record = await createRecord("interviews", {
      role: setup.role,
      type: setup.type,
      level: setup.level,
      techstack: setup.techstack,
      questions,
      userId: user.id,
      visibility: "private",
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    });
    return { success: true as const, interviewId: record.id };
  } catch (error: unknown) {
    console.error("Interview generation failed:", error);
    await refundDailyQuota(quotaReservation).catch((refundError) => {
      console.error("Interview quota refund failed:", refundError);
    });
    return {
      success: false as const,
      error:
        error instanceof QuotaExceededError
          ? error.message
          : error instanceof z.ZodError
            ? error.issues[0]?.message || "Check the interview setup."
            : "Could not generate interview questions. Please try again.",
    };
  }
}

export async function createInterviewRecord(params: CreateInterviewParams) {
  try {
    const user = await requireSessionUser();
    const input = interviewInputSchema.parse({
      role: params.role,
      type: params.type,
      level: params.level,
      techstack: params.techstack,
      questions: params.questions,
    });
    const interview = {
      ...input,
      userId: user.id,
      visibility: "private",
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };
    const record = await createRecord("interviews", interview);
    return { success: true as const, interviewId: record.id };
  } catch (error: unknown) {
    console.error("Interview creation failed:", error);
    return {
      success: false as const,
      error:
        error instanceof z.ZodError
          ? "Complete the interview role, level, focus areas, and questions."
          : "Could not create the interview.",
    };
  }
}

export async function getInterviewsTakenByUser(
  _userId: string
): Promise<Interview[]> {
  const user = await requireSessionUser();
  const feedback = await queryRecords<{ interviewId?: string }>(
    "feedback",
    [{ field: "userId", op: "eq", value: user.id }],
    100
  );
  const interviewIds = [
    ...new Set(
      feedback
        .map((record) => record.data.interviewId)
        .filter((id): id is string => typeof id === "string")
    ),
  ];
  const interviews = await Promise.all(
    interviewIds.map((id) => readableInterview(id, user.id))
  );
  return interviews
    .filter((interview): interview is Interview => interview !== null)
    .sort(newestFirst);
}
