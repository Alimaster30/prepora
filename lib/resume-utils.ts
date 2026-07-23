import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const themeColors = [
  // Neutral anchors for monochrome needs
  "#111827",
  "#4b5563",
  "#9ca3af",
  "#e5e7eb",
  "#f9fafb",
  // Accessible brand-friendly hues
  "#1d4ed8", // blue
  "#0ea5e9", // sky
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#8b5cf6", // violet
  "#e11d48", // rose
];

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, "").trim();
};
