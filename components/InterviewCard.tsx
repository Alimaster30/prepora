"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import ScheduleInterview from "@/components/ScheduleInterview";
import { Button } from "@/components/ui/button";
import { getDisplayInterviewName } from "@/lib/utils";
import { scheduleInterview } from "@/lib/actions/schedule.actions";

const InterviewCard = ({
  interviewId,
  userId,
  role,
  type,
  level,
  techstack,
  createdAt,
  feedback,
}: InterviewCardProps) => {
  const router = useRouter();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleSchedule = async (scheduleData: {
    interviewId: string;
    scheduledDate: string;
    scheduledTime: string;
    notes?: string;
  }) => {
    const scheduledAt = new Date(
      `${scheduleData.scheduledDate}T${scheduleData.scheduledTime}`
    ).toISOString();
    const result = await scheduleInterview({
      interviewId: scheduleData.interviewId,
      scheduledAt,
      notes: scheduleData.notes,
    });
    if (!result.success) {
      throw new Error(result.error || "Could not schedule the interview.");
    }
    toast.success("Interview scheduled.");
    setShowScheduleModal(false);
    window.dispatchEvent(new Event("scheduled-interviews-updated"));
  };

  const startInterview = async () => {
    const isSample = !interviewId || interviewId.startsWith("sample-");
    if (!isSample) {
      router.push(`/interview/${interviewId}`);
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch("/api/interviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          type,
          level: level || "Mid-Level",
          techstack,
          questions: [],
          userId,
        }),
      });
      const data = await response.json();

      if (data?.success && data?.interviewId) {
        router.push(`/interview/${data.interviewId}`);
        return;
      }

      toast.error("We could not prepare this interview. Please try again.");
    } catch {
      toast.error("We could not prepare this interview. Check your connection and try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;
  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || new Date().toISOString()
  ).format("MMM D, YYYY");

  let displayScore: number | null = null;
  if (feedback) {
    const scores = Array.isArray(feedback.categoryScores)
      ? feedback.categoryScores
          .map((category) => category.score)
          .filter((score) => typeof score === "number")
      : [];

    if (scores.length > 0) {
      displayScore = Math.min(
        100,
        Math.max(
          0,
          Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
        )
      );
    } else if (typeof feedback.totalScore === "number") {
      displayScore = Math.min(100, Math.max(0, Math.round(feedback.totalScore)));
    }
  }

  const displayRole = getDisplayInterviewName(role, techstack, type);

  return (
    <>
      {showScheduleModal && (
        <ScheduleInterview
          interviewId={interviewId!}
          interviewTitle={`${role} interview`}
          onSchedule={handleSchedule}
          onCancel={() => setShowScheduleModal(false)}
        />
      )}

      <article className="group flex min-h-full flex-col rounded-xl border border-border bg-white p-5 transition-[border-color,background-color] duration-200 ease-out hover:border-slate-300 hover:bg-[var(--shell)] focus-within:border-primary/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">
                {normalizedType}
              </span>
              {level && <span>{level}</span>}
            </div>
            <h3 className="mt-4 text-lg font-semibold capitalize text-foreground">
              {displayRole} interview
            </h3>
          </div>
          {displayScore !== null && (
            <div
              className="flex items-baseline gap-1 text-sm font-semibold text-foreground"
              aria-label={`Feedback score ${displayScore} out of 100`}
            >
              <span className="text-lg">{displayScore}</span>
              <span className="font-normal text-muted-foreground">/100</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays aria-hidden="true" size={15} />
          <span>{formattedDate}</span>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {feedback?.finalAssessment ||
            "Practice this role, then return to a focused summary of what worked and what to improve."}
        </p>

        {techstack?.length > 0 && (
          <ul className="mt-5 flex list-none flex-wrap gap-1.5 p-0">
            {techstack.slice(0, 4).map((technology) => (
              <li
                key={technology}
                className="m-0 list-none rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {technology}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-5">
          {feedback ? (
            <>
              <Button asChild className="min-h-10 flex-1 rounded-md">
                <Link href={`/interview/${interviewId}/feedback`}>
                  View feedback
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-10 rounded-md">
                <Link href={`/interview/${interviewId}`} aria-label="Retake interview">
                  <RotateCcw aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                className="min-h-10 flex-1 rounded-md"
                onClick={startInterview}
                disabled={isStarting}
                aria-busy={isStarting}
              >
                {isStarting ? "Preparing..." : "Start practice"}
                {!isStarting && <ArrowRight aria-hidden="true" className="size-4" />}
              </Button>
              <Button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                variant="outline"
                className="min-h-10 rounded-md"
              >
                <Clock3 aria-hidden="true" className="size-4" />
                Schedule
              </Button>
            </>
          )}
        </div>
      </article>
    </>
  );
};

export default InterviewCard;
