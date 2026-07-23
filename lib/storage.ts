import "server-only";

import { randomUUID } from "node:crypto";

import { DEFAULT_RESUME_LAYOUT_ID } from "@/lib/resume-layouts";
import {
  createRecord,
  deleteRecord,
  deleteRecords,
  getRecord,
  queryRecords,
  setRecord,
} from "@/lib/server/document-store";
import { themeColors } from "@/lib/utils";

export interface ExperienceData {
  _id?: string;
  title?: string;
  companyName?: string;
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking?: boolean;
  workSummary?: string;
}

export interface EducationData {
  _id?: string;
  universityName?: string;
  degree?: string;
  major?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface SkillData {
  _id?: string;
  name?: string;
  rating?: number;
}

export interface ResumeData {
  resumeId: string;
  userId: string;
  title: string;
  updatedAt?: Date;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  summary?: string;
  experience?: string[];
  education?: string[];
  skills?: string[];
  themeColor?: string;
  layoutId?: string;
  photo?: string;
}

export type PopulatedResume = Omit<
  ResumeData,
  "experience" | "education" | "skills"
> & {
  experience: ExperienceData[];
  education: EducationData[];
  skills: SkillData[];
};

type StoredResume = Omit<ResumeData, "updatedAt"> & { updatedAt?: string };

function withoutUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined)
  ) as Partial<T>;
}

function normalizeResume(data: Partial<StoredResume>, fallbackId: string): ResumeData {
  return {
    ...(data as Omit<ResumeData, "updatedAt">),
    resumeId:
      typeof data.resumeId === "string" && data.resumeId
        ? data.resumeId
        : fallbackId,
    updatedAt:
      typeof data.updatedAt === "string" ? new Date(data.updatedAt) : undefined,
    experience: Array.isArray(data.experience)
      ? data.experience.filter((item): item is string => typeof item === "string")
      : [],
    education: Array.isArray(data.education)
      ? data.education.filter((item): item is string => typeof item === "string")
      : [],
    skills: Array.isArray(data.skills)
      ? data.skills.filter((item): item is string => typeof item === "string")
      : [],
  };
}

async function getRelatedDocuments<T extends object>(
  collection: "experiences" | "educations" | "skills",
  ids: string[]
): Promise<T[]> {
  const records = await Promise.all(ids.map((id) => getRecord<T>(collection, id)));
  return records.flatMap((record) =>
    record ? [{ _id: record.id, ...record.data } as T] : []
  );
}

export const storage = {
  async createResume(data: {
    resumeId: string;
    userId: string;
    title: string;
  }): Promise<ResumeData> {
    const updatedAt = new Date();
    const resume: ResumeData = {
      resumeId: data.resumeId,
      userId: data.userId,
      title: data.title,
      updatedAt,
      themeColor: themeColors[0],
      layoutId: DEFAULT_RESUME_LAYOUT_ID,
      experience: [],
      education: [],
      skills: [],
    };
    await createRecord<StoredResume>(
      "resumes",
      { ...resume, updatedAt: updatedAt.toISOString() },
      data.resumeId
    );
    return resume;
  },

  async findResume(resumeId: string): Promise<PopulatedResume | null> {
    const record = await getRecord<StoredResume>("resumes", resumeId);
    if (!record) return null;
    const resume = normalizeResume(record.data, record.id);
    const [experience, education, skills] = await Promise.all([
      getRelatedDocuments<ExperienceData>("experiences", resume.experience ?? []),
      getRelatedDocuments<EducationData>("educations", resume.education ?? []),
      getRelatedDocuments<SkillData>("skills", resume.skills ?? []),
    ]);
    const {
      experience: _experienceIds,
      education: _educationIds,
      skills: _skillIds,
      ...baseResume
    } = resume;
    return { ...baseResume, experience, education, skills };
  },

  async findResumeRecord(resumeId: string): Promise<ResumeData | null> {
    const record = await getRecord<StoredResume>("resumes", resumeId);
    return record ? normalizeResume(record.data, record.id) : null;
  },

  async findResumesByUserId(userId: string): Promise<ResumeData[]> {
    const records = await queryRecords<StoredResume>(
      "resumes",
      [{ field: "userId", op: "eq", value: userId }],
      100
    );
    return records
      .map((record) => normalizeResume(record.data, record.id))
      .sort(
        (first, second) =>
          (second.updatedAt?.getTime() ?? 0) -
          (first.updatedAt?.getTime() ?? 0)
      );
  },

  async updateResume(
    resumeId: string,
    updates: Partial<ResumeData>
  ): Promise<ResumeData | null> {
    const existing = await getRecord<StoredResume>("resumes", resumeId);
    if (!existing) return null;
    const allowedUpdates = withoutUndefined({
      title: updates.title,
      firstName: updates.firstName,
      lastName: updates.lastName,
      jobTitle: updates.jobTitle,
      address: updates.address,
      phone: updates.phone,
      email: updates.email,
      summary: updates.summary,
      themeColor: updates.themeColor,
      layoutId: updates.layoutId,
      photo: updates.photo,
      updatedAt: new Date().toISOString(),
    });
    const updated = await setRecord<StoredResume>(
      "resumes",
      resumeId,
      allowedUpdates as StoredResume,
      { merge: true }
    );
    return normalizeResume(updated.data, updated.id);
  },

  async deleteResume(resumeId: string): Promise<boolean> {
    const resume = await this.findResumeRecord(resumeId);
    if (!resume) return false;
    await Promise.all([
      deleteRecords("experiences", resume.experience ?? []),
      deleteRecords("educations", resume.education ?? []),
      deleteRecords("skills", resume.skills ?? []),
      deleteRecord("resumeShares", resumeId),
    ]);
    await deleteRecord("resumes", resumeId);
    return true;
  },

  async saveExperience(data: ExperienceData): Promise<ExperienceData> {
    const id = data._id || `exp_${randomUUID()}`;
    const experience = withoutUndefined({ ...data, _id: id }) as ExperienceData;
    await setRecord("experiences", id, experience);
    return experience;
  },

  async findExperienceById(id: string): Promise<ExperienceData | null> {
    const record = await getRecord<ExperienceData>("experiences", id);
    return record ? { _id: record.id, ...record.data } : null;
  },

  async saveEducation(data: EducationData): Promise<EducationData> {
    const id = data._id || `edu_${randomUUID()}`;
    const education = withoutUndefined({ ...data, _id: id }) as EducationData;
    await setRecord("educations", id, education);
    return education;
  },

  async findEducationById(id: string): Promise<EducationData | null> {
    const record = await getRecord<EducationData>("educations", id);
    return record ? { _id: record.id, ...record.data } : null;
  },

  async saveSkill(data: SkillData): Promise<SkillData> {
    const id = data._id || `skill_${randomUUID()}`;
    const skill = withoutUndefined({ ...data, _id: id }) as SkillData;
    await setRecord("skills", id, skill);
    return skill;
  },

  async findSkillById(id: string): Promise<SkillData | null> {
    const record = await getRecord<SkillData>("skills", id);
    return record ? { _id: record.id, ...record.data } : null;
  },

  async setResumeRelationIds(
    resumeId: string,
    relation: "experience" | "education" | "skills",
    ids: string[]
  ): Promise<void> {
    await setRecord(
      "resumes",
      resumeId,
      { [relation]: ids, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  },

  async deleteRelatedDocuments(
    collection: "experiences" | "educations" | "skills",
    ids: string[]
  ): Promise<void> {
    await deleteRecords(collection, ids);
  },

  async addExperiencesToResume(resumeId: string, ids: string[]) {
    await this.setResumeRelationIds(resumeId, "experience", ids);
  },
  async addEducationsToResume(resumeId: string, ids: string[]) {
    await this.setResumeRelationIds(resumeId, "education", ids);
  },
  async addSkillsToResume(resumeId: string, ids: string[]) {
    await this.setResumeRelationIds(resumeId, "skills", ids);
  },

  async saveResumeShare(
    resumeId: string,
    data: { userId: string; tokenHash: string; enabled: boolean }
  ): Promise<void> {
    await setRecord("resumeShares", resumeId, {
      ...data,
      resumeId,
      createdAt: new Date().toISOString(),
    });
  },

  async findResumeShare(resumeId: string): Promise<{
    userId: string;
    tokenHash: string;
    enabled: boolean;
  } | null> {
    const record = await getRecord<{
      userId: string;
      tokenHash: string;
      enabled: boolean;
    }>("resumeShares", resumeId);
    return record?.data ?? null;
  },

  async disableResumeShare(resumeId: string): Promise<void> {
    await setRecord(
      "resumeShares",
      resumeId,
      { enabled: false, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  },
};
