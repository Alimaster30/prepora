import type { Metadata } from "next";
import { notFound } from "next/navigation";

import FinalResumeView from "@/components/resume/layout/ResumeView";
import { fetchSharedResume } from "@/lib/actions/resume.actions";

async function sharedResume(token: string) {
  const serialized = await fetchSharedResume(token);
  return serialized ? JSON.parse(serialized) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const resume = await sharedResume(token);
  if (!resume) return { title: "Shared resume unavailable" };
  const name = [resume.firstName, resume.lastName].filter(Boolean).join(" ");
  return {
    title: name ? `${name} — Resume` : "Shared resume",
    description: "A resume shared through Prepora.",
    robots: { index: false, follow: false },
  };
}

export default async function SharedResumePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resume = await sharedResume(token);
  if (!resume) notFound();
  return (
    <main className="min-h-screen bg-background">
      <FinalResumeView
        params={{ id: resume.resumeId }}
        isOwnerView={false}
        initialData={resume}
      />
    </main>
  );
}
