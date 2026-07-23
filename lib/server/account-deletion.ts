import "server-only";

import {
  deleteRecords,
  deleteRecordsByUser,
  queryRecords,
} from "@/lib/server/document-store";
import { database } from "@/lib/server/database";

export const DIRECT_USER_COLLECTIONS = [
  "feedback",
  "interviews",
  "mockInterviewSessions",
  "resumeShares",
  "scheduledInterviews",
] as const;

type ResumeRelations = {
  experience?: string[];
  education?: string[];
  skills?: string[];
};

export async function deleteUserData(userId: string): Promise<void> {
  const resumes = await queryRecords<ResumeRelations>(
    "resumes",
    [{ field: "userId", op: "eq", value: userId }],
    500
  );
  const experienceIds = resumes.flatMap((record) => record.data.experience ?? []);
  const educationIds = resumes.flatMap((record) => record.data.education ?? []);
  const skillIds = resumes.flatMap((record) => record.data.skills ?? []);

  await Promise.all([
    deleteRecords("experiences", experienceIds),
    deleteRecords("educations", educationIds),
    deleteRecords("skills", skillIds),
    deleteRecords("resumes", resumes.map((record) => record.id)),
    deleteRecordsByUser(DIRECT_USER_COLLECTIONS, userId),
  ]);

  const sql = database();
  await sql`delete from usage_quotas where user_id = ${userId}`;
}
