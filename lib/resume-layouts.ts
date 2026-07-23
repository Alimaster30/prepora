export const RESUME_LAYOUT_IDS = [
  "classic",
  "modern",
  "minimal",
  "executive",
] as const;

export type ResumeLayoutId = (typeof RESUME_LAYOUT_IDS)[number];

export const DEFAULT_RESUME_LAYOUT_ID: ResumeLayoutId = "classic";

export const RESUME_LAYOUT_OPTIONS: {
  id: ResumeLayoutId;
  label: string;
  description: string;
}[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Centered header, accent top bar, traditional sections.",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Sidebar with contact & skills; main column for story.",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Lots of whitespace, subtle lines, strong typography.",
  },
  {
    id: "executive",
    label: "Executive",
    description: "Bold banner header, structured body with accent rail.",
  },
];

export function normalizeResumeLayoutId(value: unknown): ResumeLayoutId {
  if (
    typeof value === "string" &&
    RESUME_LAYOUT_IDS.includes(value as ResumeLayoutId)
  ) {
    return value as ResumeLayoutId;
  }
  return DEFAULT_RESUME_LAYOUT_ID;
}
