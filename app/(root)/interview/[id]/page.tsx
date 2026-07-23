import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getDisplayInterviewName } from "@/lib/utils";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const interview = await getInterviewById(id);

  if (!interview) redirect("/interview");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });
  const displayName = getDisplayInterviewName(
    interview.role,
    interview.techstack,
    interview.type
  );

  return (
    <div className="root-layout">
      <header>
        <Link
          href="/interview"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Interview overview
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Voice interview</p>
            <h1 className="mt-2 capitalize tracking-[-0.025em]">
              {displayName} interview
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {interview.level} · {interview.techstack.slice(0, 4).join(", ")}
            </p>
          </div>
          <span className="w-fit rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
            {interview.type}
          </span>
        </div>
      </header>

      <Agent
        userName={user.name}
        userId={user.id}
        interviewId={id}
        type="interview"
        questions={interview.questions}
        feedbackId={feedback?.id}
        role={interview.role}
        interviewType={interview.type}
        level={interview.level}
        techstack={interview.techstack}
      />
    </div>
  );
};

export default InterviewDetails;
