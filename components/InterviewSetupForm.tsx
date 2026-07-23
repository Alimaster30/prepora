"use client";

import { ListChecks, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateInterviewRecord } from "@/lib/actions/general.action";

const levels = ["Entry-level", "Junior", "Mid-level", "Senior", "Lead"] as const;
const types = ["Technical", "Behavioral", "Mixed"] as const;

export default function InterviewSetupForm() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("Mid-level");
  const [type, setType] = useState<(typeof types)[number]>("Mixed");
  const [focusAreas, setFocusAreas] = useState("");
  const [amount, setAmount] = useState(6);
  const [jobDescription, setJobDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const techstack = focusAreas
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (role.trim().length < 2 || techstack.length === 0) {
      setError("Add a target role and at least one focus area.");
      return;
    }

    setSubmitting(true);
    setError("");
    const result = await generateInterviewRecord({
      role: role.trim(),
      level,
      type,
      techstack,
      amount,
      jobDescription: jobDescription.trim() || undefined,
    });
    setSubmitting(false);

    if (!result.success || !result.interviewId) {
      const message = result.error || "Could not prepare the interview.";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Your interview is ready.");
    router.push(`/interview/${result.interviewId}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-xl border border-border bg-white p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-foreground">Target role</span>
            <Input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Example: Frontend engineer"
              className="mt-2"
              maxLength={120}
              required
              autoFocus
            />
          </label>
          <label>
            <span className="text-sm font-semibold text-foreground">Experience level</span>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value as (typeof levels)[number])}
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {levels.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold text-foreground">Interview style</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as (typeof types)[number])}
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {types.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-foreground">Focus areas</span>
            <Input
              value={focusAreas}
              onChange={(event) => setFocusAreas(event.target.value)}
              placeholder="React, TypeScript, system design"
              className="mt-2"
              maxLength={500}
              required
            />
            <span className="mt-1.5 block text-xs text-muted-foreground">
              Separate topics, tools, or competencies with commas.
            </span>
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-foreground">Job context (optional)</span>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the most relevant responsibilities or requirements."
              className="mt-2 min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={4000}
            />
          </label>
        </div>
        {error && <p role="alert" className="state-enter mt-5 text-sm font-medium text-destructive">{error}</p>}
      </div>

      <aside className="h-fit rounded-xl border border-border bg-slate-50 p-5">
        <ListChecks aria-hidden="true" className="size-5 text-primary" />
        <h2 className="mt-4 text-lg font-semibold">Question set</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Questions are generated for this role and saved privately to your workspace.
        </p>
        <label className="mt-5 block">
          <span className="text-sm font-semibold text-foreground">Number of questions</span>
          <select
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            {[5, 6, 7, 8, 9, 10].map((option) => (
              <option key={option} value={option}>{option} questions</option>
            ))}
          </select>
        </label>
        <Button type="submit" className="mt-6 min-h-11 w-full" disabled={submitting}>
          {submitting ? <><Loader2 className="size-4 animate-spin" /> Preparing</> : "Prepare interview"}
        </Button>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Free plan limit: 8 generated interviews per day.
        </p>
      </aside>
    </form>
  );
}
