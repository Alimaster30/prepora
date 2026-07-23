import dayjs from "dayjs";
import Link from "next/link";
import { ArrowLeft, CalendarDays, RotateCcw } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const interview = await getInterviewById(id);

  if (!interview) redirect("/interview");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  return (
    <section className="root-layout">
      <header>
        <Link
          href="/interview"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Interview overview
        </Link>
        <p className="mt-4 text-sm font-semibold text-primary">Interview feedback</p>
        <h1 className="mt-2 capitalize tracking-[-0.025em]">
          {interview.role} interview
        </h1>
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Overall score</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {typeof feedback?.totalScore === "number"
                ? Math.floor(feedback.totalScore)
                : "N/A"}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Completed</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <CalendarDays aria-hidden="true" size={16} className="text-muted-foreground" />
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "Not available"}
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="assessment-heading">
        <h2 id="assessment-heading" className="text-xl font-semibold">
          Overall assessment
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          {feedback?.finalAssessment || "Your assessment will appear after the interview is complete."}
        </p>
      </section>

      <section aria-labelledby="breakdown-heading" className="section-rule">
        <h2 id="breakdown-heading" className="text-xl font-semibold">
          Breakdown
        </h2>
        <div className="mt-5 divide-y divide-border rounded-xl border border-border bg-white">
          {feedback?.categoryScores?.map((category, index) => (
            <div key={index} className="grid gap-2 p-5 sm:grid-cols-[180px_1fr]">
              <p className="font-semibold text-foreground">
                {category.name}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {category.score}/100
                </span>
              </p>
              <p className="text-sm leading-6 text-muted-foreground">{category.comment}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-rule grid gap-8 md:grid-cols-2">
        <section aria-labelledby="strengths-heading">
          <h2 id="strengths-heading" className="text-xl font-semibold">Strengths</h2>
          <ul className="mt-4 space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
            {feedback?.strengths?.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="improve-heading">
          <h2 id="improve-heading" className="text-xl font-semibold">Areas to improve</h2>
          <ul className="mt-4 space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
            {feedback?.areasForImprovement?.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="section-rule flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="min-h-11 rounded-md">
          <Link href="/interview">Back to overview</Link>
        </Button>
        <Button asChild className="min-h-11 rounded-md">
          <Link href={`/interview/${id}`}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Practice again
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
