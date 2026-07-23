import FinalResumeView from "@/components/resume/layout/ResumeView";
import React from "react";
import { Metadata } from "next";
import { fetchResume } from "@/lib/actions/resume.actions";
import { isAuthenticated } from "@/lib/actions/auth.action";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchResume(id);
  const resume = JSON.parse(data || "{}");

  if (!resume?.firstName && !resume?.lastName) {
    return {
      title: "Prepora — Resume",
      description: "View your AI-generated professional resume.",
    };
  }

  return {
    title: `${resume?.firstName} ${resume?.lastName} — Prepora`,
    description: `${resume?.firstName} ${resume?.lastName}'s Resume. Built with Prepora.`,
  };
}

const ResumeView = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const authed = await isAuthenticated();
  const { id } = await params;

  return <FinalResumeView params={{ id }} isOwnerView={authed} />;
};

export default ResumeView;
