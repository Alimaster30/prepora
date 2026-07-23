import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Toaster as ResumeToaster } from "@/components/ui/toaster";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Prepora | Interview and resume preparation",
  description:
    "Practice interviews, improve your resume, and leave each session with a clear next step.",
  icons: { icon: "/prepora-mobile-logo.png" },
  openGraph: {
    title: "Prepora | Interview and resume preparation",
    description: "Practice interviews, improve your resume, and turn feedback into a clear next step.",
    type: "website",
    siteName: "Prepora",
  },
  twitter: {
    card: "summary",
    title: "Prepora",
    description: "Interview and resume preparation with actionable feedback.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-[var(--font-inter)]`}
        suppressHydrationWarning
      >
        {children}
        <ResumeToaster />
        <Toaster richColors />
      </body>
    </html>
  );
}
