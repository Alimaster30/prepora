"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { CalendarDays, Clock3, Download, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  deleteScheduledInterview,
  getScheduledInterviews,
  type ScheduledInterviewRecord,
} from "@/lib/actions/schedule.actions";

export default function ScheduledInterviews() {
  const [schedules, setSchedules] = useState<ScheduledInterviewRecord[]>([]);
  const load = useCallback(async () => {
    try {
      setSchedules(await getScheduledInterviews());
    } catch {
      toast.error("Could not load scheduled interviews.");
    }
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener("scheduled-interviews-updated", load);
    return () => window.removeEventListener("scheduled-interviews-updated", load);
  }, [load]);

  async function remove(id: string) {
    const previous = schedules;
    setSchedules((items) => items.filter((item) => item.id !== id));
    const result = await deleteScheduledInterview(id);
    if (!result.success) {
      setSchedules(previous);
      toast.error(result.error || "Could not remove the schedule.");
    }
  }

  function addToCalendar(schedule: ScheduledInterviewRecord) {
    const start = new Date(schedule.scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1_000);
    const utc = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const escape = (value: string) =>
      value.replace(/\\/g, "\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Prepora//Practice Calendar//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${schedule.id}@prepora`,
      `DTSTAMP:${utc(new Date())}`,
      `DTSTART:${utc(start)}`,
      `DTEND:${utc(end)}`,
      `SUMMARY:${escape(schedule.interviewTitle)}`,
      `DESCRIPTION:${escape(schedule.notes || "Scheduled Prepora practice interview")}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Your Prepora practice interview starts in 30 minutes.",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `prepora-${schedule.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar event downloaded with a 30-minute reminder.");
  }

  if (schedules.length === 0) return null;
  return (
    <section aria-labelledby="scheduled-heading" className="state-enter section-rule">
      <h2 id="scheduled-heading" className="text-xl font-semibold">Upcoming practice</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Synced to your account across devices.
      </p>
      <div className="mt-5 divide-y divide-border rounded-xl border border-border bg-white">
        {schedules.map((schedule) => {
          const date = dayjs(schedule.scheduledAt);
          const hoursAway = date.diff(dayjs(), "hour");
          const dateText =
            hoursAway < 24 ? "Within 24 hours" : date.format("MMM D, YYYY");
          return (
            <article key={schedule.id} className="interactive-row flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold capitalize">{schedule.interviewTitle}</h3>
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">Scheduled</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays aria-hidden="true" size={15} />{dateText}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 aria-hidden="true" size={15} />{date.format("h:mm A")}
                  </span>
                </div>
                {schedule.notes && <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{schedule.notes}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild className="min-h-10 flex-1 rounded-md sm:flex-none">
                  <Link href={`/interview/${schedule.interviewId}`}>Start</Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => addToCalendar(schedule)}
                  variant="outline"
                  className="min-h-10 rounded-md"
                  aria-label={`Add ${schedule.interviewTitle} to calendar`}
                  title="Add to calendar with a 30-minute reminder"
                >
                  <Download aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => void remove(schedule.id)}
                  variant="outline"
                  className="min-h-10 rounded-md text-destructive"
                  aria-label={`Cancel ${schedule.interviewTitle}`}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
