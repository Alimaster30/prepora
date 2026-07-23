import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string): string => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  // Fall back to the sanitized key itself so the URL never contains "undefined"
  return mappings[key as keyof typeof mappings] ?? key;
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech,
      url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
    };
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url)) ? url : "/tech.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = (seed?: string) => {
  // Use a simple hash function to generate a deterministic "random" index
  let hash = 0;
  const str = seed || "default";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const randomIndex = Math.abs(hash) % interviewCovers.length;
  return `/covers${interviewCovers[randomIndex]}`;
};

const avatarGradients = [
  "bg-primary-200",
  "bg-[#7C3AED]",
  "bg-[#34D399]",
  "bg-[#FBBF24]",
  "bg-[#60A5FA]",
  "bg-[#F472B6]",
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

export const getAvatarGradient = (seed: string) => {
  return avatarGradients[Math.abs(hashString(seed)) % avatarGradients.length];
};

export const getInterviewInitials = (role?: string, techstack?: string[]) => {
  const source = role?.trim() || techstack?.[0]?.trim() || "AI";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const getDisplayInterviewName = (
  role?: string,
  techstack?: string[],
  type?: string
) => {
  const cleanedRole = role?.trim();
  if (cleanedRole && cleanedRole.toLowerCase() !== "generated interview") {
    return cleanedRole;
  }

  const primaryTech = techstack?.find((tech) => Boolean(tech?.trim()))?.trim();

  if (primaryTech && type) {
    return `${primaryTech} ${type}`.trim();
  }

  if (primaryTech) {
    return primaryTech;
  }

  if (type) {
    return `${type} Mock`;
  }

  return "AI Mock";
};

// ── Resume utilities (used by lib/storage.ts and lib/validations/resume.ts) ──

export const themeColors = [
  "#111827", "#4b5563", "#9ca3af", "#e5e7eb", "#f9fafb",
  "#1d4ed8", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444",
  "#a855f7", "#ec4899", "#14b8a6", "#8b5cf6", "#e11d48",
];

export const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, "").trim();
