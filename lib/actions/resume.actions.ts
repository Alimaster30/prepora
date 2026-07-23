"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getResumeTemplateById } from "@/lib/resume-templates";
import {
  createResumeShareToken,
  hashResumeShareToken,
  parseResumeShareToken,
  verifyResumeShareToken,
} from "@/lib/server/share-token";
import { AuthorizationError, isAccessError, requireSessionUser } from "@/lib/server/session";
import { sanitizeResumeHtml } from "@/lib/security/sanitize-rich-html";
import { storage, type EducationData, type ExperienceData, type ResumeData, type SkillData } from "@/lib/storage";

const resumeIdSchema = z.string().trim().min(8, "The resume identifier is invalid.").max(128, "The resume identifier is invalid.").regex(/^[a-zA-Z0-9_-]+$/, "The resume identifier is invalid.");
const text = (max: number) => z.string().trim().max(max).optional();
const richText = (max: number) =>
  z.string().trim().max(max).transform(sanitizeResumeHtml).optional();
const relationId = z.string().trim().min(1).max(180).optional();
const dateText = z.string().trim().max(30).optional();
const updateSchema = z.object({
  title: text(120), firstName: text(80), lastName: text(80),
  jobTitle: text(120), address: text(240), phone: text(30),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  summary: text(4_000),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  layoutId: z.string().trim().min(1).max(40).optional(),
  photo: z.string().max(5_000_000, "The profile image is too large.").optional(),
}).strict();
const experienceArraySchema = z.array(z.object({
  _id: relationId, title: text(160), companyName: text(160),
  city: text(100), state: text(100), startDate: dateText, endDate: dateText,
  currentlyWorking: z.boolean().optional(), workSummary: richText(20_000),
}).strict()).max(30);
const educationArraySchema = z.array(z.object({
  _id: relationId, universityName: text(200), degree: text(160),
  major: text(160), startDate: dateText, endDate: dateText,
  description: text(10_000),
}).strict()).max(20);
const skillArraySchema = z.array(z.object({
  _id: relationId, name: z.string().trim().min(1).max(100).optional(),
  rating: z.number().finite().min(0).max(5).optional(),
}).strict()).max(60);

function publicError(error: unknown, fallback: string): string {
  if (isAccessError(error)) return error.message;
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Some submitted information is invalid.";
  }
  console.error(fallback, error);
  return fallback;
}
async function getOwnedResume(resumeIdInput: string, userId: string) {
  const resumeId = resumeIdSchema.parse(resumeIdInput);
  const resume = await storage.findResumeRecord(resumeId);
  if (!resume) throw new Error("Resume not found.");
  if (resume.userId !== userId) throw new AuthorizationError();
  return resume;
}
function refreshResume(resumeId: string) {
  revalidatePath("/resume/dashboard");
  revalidatePath(`/resume/my-resume/${resumeId}/edit`);
  revalidatePath(`/resume/my-resume/${resumeId}/view`);
}
async function saveRelation<T extends { _id?: string }>(
  resume: ResumeData,
  relation: "experience" | "education" | "skills",
  collection: "experiences" | "educations" | "skills",
  input: unknown,
  schema: z.ZodType<T[]>,
  save: (entry: T) => Promise<T>
) {
  const items = schema.parse(input);
  const ownedIds = new Set(resume[relation] ?? []);
  const saved = await Promise.all(items.map((entry) => save({
    ...entry,
    _id: entry._id && ownedIds.has(entry._id) ? entry._id : undefined,
  })));
  const nextIds = saved.flatMap((entry) => entry._id ? [entry._id] : []);
  const removedIds = [...ownedIds].filter((id) => !nextIds.includes(id));
  await storage.setResumeRelationIds(resume.resumeId, relation, nextIds);
  await storage.deleteRelatedDocuments(collection, removedIds);
  refreshResume(resume.resumeId);
  return storage.findResume(resume.resumeId);
}

export async function createResume({ resumeId: input, title }: {
  resumeId: string; userId?: string; title: string;
}) {
  try {
    const user = await requireSessionUser();
    const resume = await storage.createResume({
      resumeId: resumeIdSchema.parse(input),
      userId: user.id,
      title: z.string().trim().min(1).max(120).parse(title),
    });
    revalidatePath("/resume/dashboard");
    return { success: true as const, data: JSON.stringify(resume) };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not create the resume.") };
  }
}
export async function fetchResume(input: string) {
  const user = await requireSessionUser();
  const resume = await getOwnedResume(input, user.id);
  return JSON.stringify((await storage.findResume(resume.resumeId)) ?? {});
}
export async function fetchUserResumes(_userId?: string) {
  const user = await requireSessionUser();
  return JSON.stringify(await storage.findResumesByUserId(user.id));
}
export async function checkResumeOwnership(_userId: string | undefined, input: string) {
  try {
    const user = await requireSessionUser();
    await getOwnedResume(input, user.id);
    return true;
  } catch {
    return false;
  }
}
export async function updateResume({ resumeId: input, updates }: {
  resumeId: string; updates: Partial<ResumeData>;
}) {
  try {
    const user = await requireSessionUser();
    const resume = await getOwnedResume(input, user.id);
    const updated = await storage.updateResume(resume.resumeId, updateSchema.parse(updates));
    if (!updated) return { success: false as const, error: "Resume not found." };
    refreshResume(resume.resumeId);
    return { success: true as const, data: JSON.stringify(updated) };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not update the resume.") };
  }
}

export async function addExperienceToResume(input: string, data: unknown) {
  try {
    const user = await requireSessionUser();
    const resume = await getOwnedResume(input, user.id);
    const updated = await saveRelation<ExperienceData>(
      resume, "experience", "experiences", data,
      experienceArraySchema as z.ZodType<ExperienceData[]>,
      (entry) => storage.saveExperience(entry)
    );
    return { success: true as const, data: JSON.stringify(updated) };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not save work experience.") };
  }
}
export async function addEducationToResume(input: string, data: unknown) {
  try {
    const user = await requireSessionUser();
    const resume = await getOwnedResume(input, user.id);
    const updated = await saveRelation<EducationData>(
      resume, "education", "educations", data,
      educationArraySchema as z.ZodType<EducationData[]>,
      (entry) => storage.saveEducation(entry)
    );
    return { success: true as const, data: JSON.stringify(updated) };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not save education.") };
  }
}
export async function addSkillToResume(input: string, data: unknown) {
  try {
    const user = await requireSessionUser();
    const resume = await getOwnedResume(input, user.id);
    const updated = await saveRelation<SkillData>(
      resume, "skills", "skills", data,
      skillArraySchema as z.ZodType<SkillData[]>,
      (entry) => storage.saveSkill(entry)
    );
    return { success: true as const, data: JSON.stringify(updated) };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not save skills.") };
  }
}

export async function applyResumeTemplate({ resumeId, templateId }: {
  resumeId: string; templateId: string;
}) {
  try {
    const user = await requireSessionUser();
    await getOwnedResume(resumeId, user.id);
    const template = getResumeTemplateById(templateId);
    if (!template || template.id === "blank") return { success: true as const };
    const details = await updateResume({
      resumeId,
      updates: {
        ...template.personal,
        summary: template.summary,
        themeColor: template.themeColor,
        layoutId: template.resumeLayoutId,
      },
    });
    if (!details.success) return details;
    const experience = await addExperienceToResume(resumeId, template.experience);
    if (!experience.success) return experience;
    const education = await addEducationToResume(resumeId, template.education);
    if (!education.success) return education;
    const skills = await addSkillToResume(resumeId, template.skills);
    if (!skills.success) return skills;
    refreshResume(resumeId);
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not apply the resume template.") };
  }
}

export async function deleteResume(input: string, _path?: string) {
  try {
    const user = await requireSessionUser();
    const resume = await getOwnedResume(input, user.id);
    await storage.deleteResume(resume.resumeId);
    revalidatePath("/resume/dashboard");
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not delete the resume.") };
  }
}

export async function createResumeShare(input: string) {
  try {
    const user = await requireSessionUser();
    const resume = await getOwnedResume(input, user.id);
    const token = createResumeShareToken(resume.resumeId);
    await storage.saveResumeShare(resume.resumeId, {
      userId: user.id,
      tokenHash: hashResumeShareToken(token),
      enabled: true,
    });
    return { success: true as const, path: `/resume-share/${token}` };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not create a share link.") };
  }
}

export async function revokeResumeShare(input: string) {
  try {
    const user = await requireSessionUser();
    const resume = await getOwnedResume(input, user.id);
    await storage.disableResumeShare(resume.resumeId);
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: publicError(error, "Could not disable the share link.") };
  }
}

export async function fetchSharedResume(tokenInput: string) {
  try {
    const token = z.string().min(40).max(400).parse(tokenInput);
    const parsed = parseResumeShareToken(token);
    if (!parsed) return null;
    const resumeId = resumeIdSchema.parse(parsed.resumeId);
    const share = await storage.findResumeShare(resumeId);
    if (!share?.enabled || typeof share.tokenHash !== "string") return null;
    if (!verifyResumeShareToken(token, share.tokenHash)) return null;
    const resume = await storage.findResume(resumeId);
    return resume ? JSON.stringify(resume) : null;
  } catch {
    return null;
  }
}
