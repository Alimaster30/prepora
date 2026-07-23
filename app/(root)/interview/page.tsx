import Link from "next/link";
import { ArrowRight, MessageSquareText, Plus } from "lucide-react";

import InterviewCard from "@/components/InterviewCard";
import ScheduledInterviews from "@/components/ScheduledInterviews";
import UnauthenticatedMessage from "@/components/UnauthenticatedMessage";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByInterviewId,
  getInterviewsByUserId,
  getInterviewsTakenByUser,
  getLatestInterviews,
} from "@/lib/actions/general.action";

const SAMPLE_DATE = "2025-01-01T00:00:00.000Z";

const sampleInterviews: Interview[] = [
  {
    id: "sample-1",
    role: "Frontend Developer",
    level: "Mid-Level",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js"],
    questions: [],
    userId: "sample",
    finalized: true,
    createdAt: SAMPLE_DATE,
  },
  {
    id: "sample-2",
    role: "Full Stack Engineer",
    level: "Senior",
    type: "Mixed",
    techstack: ["Node.js", "MongoDB", "React"],
    questions: [],
    userId: "sample",
    finalized: true,
    createdAt: SAMPLE_DATE,
  },
  {
    id: "sample-3",
    role: "Product Manager",
    level: "Mid-Level",
    type: "Behavioral",
    techstack: ["Agile", "Scrum", "Product Strategy"],
    questions: [],
    userId: "sample",
    finalized: true,
    createdAt: SAMPLE_DATE,
  },
  {
    id: "sample-4",
    role: "Backend Developer",
    level: "Junior",
    type: "Technical",
    techstack: ["Python", "Django", "PostgreSQL"],
    questions: [],
    userId: "sample",
    finalized: true,
    createdAt: SAMPLE_DATE,
  },
  {
    id: "sample-5",
    role: "DevOps Engineer",
    level: "Senior",
    type: "Technical",
    techstack: ["AWS", "Docker", "Kubernetes"],
    questions: [],
    userId: "sample",
    finalized: true,
    createdAt: SAMPLE_DATE,
  },
  {
    id: "sample-6",
    role: "UX Designer",
    level: "Mid-Level",
    type: "Mixed",
    techstack: ["Figma", "User Research", "Prototyping"],
    questions: [],
    userId: "sample",
    finalized: true,
    createdAt: SAMPLE_DATE,
  },
];

async function InterviewDashboard() {
  const user = await getCurrentUser();
  if (!user) return <UnauthenticatedMessage />;

  const [userCreatedInterviews, fetchedAvailableInterviews, takenInterviews] =
    await Promise.all([
      getInterviewsByUserId(user.id),
      getLatestInterviews({ userId: user.id }),
      getInterviewsTakenByUser(user.id),
    ]);

  const actualUserInterviews = (userCreatedInterviews || []).filter(
    (interview) =>
      interview.userId === user.id &&
      interview.userId !== "sample" &&
      !interview.id.startsWith("sample-")
  );

  const takenOrUserInterviews =
    takenInterviews && takenInterviews.length > 0
      ? takenInterviews
      : actualUserInterviews;

  const userInterviewsWithFeedback = await Promise.all(
    (takenOrUserInterviews || []).map(async (interview) => {
      const feedback = await getFeedbackByInterviewId({
        interviewId: interview.id,
        userId: user.id,
      });
      return { ...interview, feedback };
    })
  );

  const otherUsersInterviews = (fetchedAvailableInterviews || []).filter(
    (interview) =>
      interview.userId !== user.id &&
      interview.userId !== "sample" &&
      !interview.id.startsWith("sample-")
  );
  const availableInterviews =
    otherUsersInterviews.length > 0 ? otherUsersInterviews : sampleInterviews;

  const firstName = user.name?.trim().split(" ")[0];
  const recommendedInterview = userInterviewsWithFeedback[0];
  const recommendedHasFeedback = Boolean(recommendedInterview?.feedback);
  const recommendedHref = recommendedInterview
    ? recommendedHasFeedback
      ? `/interview/${recommendedInterview.id}/feedback`
      : `/interview/${recommendedInterview.id}`
    : "/interview/new";

  return (
    <div className="root-layout">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Your workspace</p>
          <h1 className="mt-2 tracking-[-0.025em]">
            {firstName ? `Welcome back, ${firstName}.` : "Your preparation workspace"}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Continue a recent interview or choose one focused task for today.
          </p>
        </div>
        <Button asChild className="min-h-11 rounded-md px-5 font-semibold sm:shrink-0">
          <Link href="/interview/new">
            <Plus aria-hidden="true" className="size-4" />
            Start an interview
          </Link>
        </Button>
      </header>

      <section
        aria-labelledby="recommended-heading"
        className="overflow-hidden rounded-xl bg-foreground text-white"
      >
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
          <div className="px-6 py-7 sm:px-8 sm:py-9">
            <p className="text-sm font-semibold text-blue-300">Recommended next</p>
            <h2
              id="recommended-heading"
              className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl"
            >
              {recommendedInterview
                ? recommendedHasFeedback
                  ? `Review your ${recommendedInterview.role} feedback`
                  : `Continue your ${recommendedInterview.role} interview`
                : "Create a practice session around your next opportunity"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {recommendedInterview
                ? recommendedHasFeedback
                  ? "Use the evidence from your latest session to choose one improvement before you practice again."
                  : "Your interview is ready. Return to it while the role and examples are still fresh."
                : "Choose the role, level, and focus areas. We will prepare a realistic question set you can complete at your pace."}
            </p>
            <Link
              href={recommendedHref}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-foreground hover:bg-slate-100"
            >
              {recommendedInterview
                ? recommendedHasFeedback
                  ? "Review feedback"
                  : "Continue interview"
                : "Set up an interview"}
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>

          <div className="border-t border-white/15 bg-white/[0.04] px-6 py-7 lg:border-l lg:border-t-0 lg:px-7 lg:py-9">
            <p className="text-xs font-semibold text-slate-300">Current focus</p>
            {recommendedInterview ? (
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-xs text-slate-400">Role</dt>
                  <dd className="mt-1 text-sm font-semibold capitalize text-white">
                    {recommendedInterview.role}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
                  <div>
                    <dt className="text-xs text-slate-400">Format</dt>
                    <dd className="mt-1 text-sm font-medium text-white">
                      {recommendedInterview.type}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">Level</dt>
                    <dd className="mt-1 text-sm font-medium text-white">
                      {recommendedInterview.level || "Flexible"}
                    </dd>
                  </div>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Start with the role you are applying for now. You can create
                another version later for a different opportunity.
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="continue-heading" className="section-rule">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 id="continue-heading" className="text-xl font-semibold">
              Continue where you left off
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your recent sessions and their latest feedback.
            </p>
          </div>
        </div>

        {userInterviewsWithFeedback.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {userInterviewsWithFeedback.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                level={interview.level}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
                feedback={interview.feedback}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-9">
            <p className="font-semibold text-foreground">No interview history yet</p>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Begin with one practice session. Your feedback and next step will
              appear here when you finish.
            </p>
            <Link
              href="/interview/new"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-light-800"
            >
              Create your first interview
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="practice-heading" className="section-rule">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="practice-heading" className="text-xl font-semibold">
              Choose a practice interview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick the closest role and adjust your approach as you learn.
            </p>
          </div>
          <Link
            href="/mock-interview"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:text-light-800"
          >
            <MessageSquareText aria-hidden="true" size={17} />
            Open text coach
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableInterviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              userId={user.id}
              interviewId={interview.id}
              role={interview.role}
              type={interview.type}
              level={interview.level}
              techstack={interview.techstack}
              createdAt={interview.createdAt}
              feedback={null}
            />
          ))}
        </div>
      </section>

      <ScheduledInterviews />
    </div>
  );
}

export default InterviewDashboard;
