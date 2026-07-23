"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AnalysisResult } from "./MockInterviewSession";

interface Props {
  questions: string[];
  responses: Record<string, string>;
  analysis: Record<string, AnalysisResult>;
  categories: string[];
  onRestart: () => void;
}

function ScorePill({ value }: { value: number }) {
  const color =
    value >= 70 ? "text-success-200 bg-emerald-500/5 border-emerald-500/20"
    : value >= 40 ? "text-orange-500 bg-orange-500/5 border-orange-500/20"
    : "text-destructive bg-red-500/5 border-red-500/20";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {value}%
    </span>
  );
}

export default function MockInterviewSummary({
  questions,
  responses,
  analysis,
  categories,
  onRestart,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);

  const answered = questions.filter((q) => responses[q]);
  const avgScore =
    answered.length === 0
      ? 0
      : Math.round(
          answered.reduce((sum, q) => sum + (analysis[q]?.score ?? 0), 0) /
            answered.length
        );

  const avgSimilarity =
    answered.length === 0
      ? 0
      : Math.round(
          answered.reduce((sum, q) => sum + (analysis[q]?.similarity ?? 0), 0) /
            answered.length
        );

  return (
    <div className="state-enter mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="rounded-xl border border-border bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold text-success-200">Session complete</p>
        <h2 className="mt-2 text-2xl font-semibold">
          Review what worked and choose one improvement
        </h2>
        <p className="mb-6 mt-3 text-muted-foreground">
          You answered {answered.length} of {questions.length} questions across{" "}
          <span className="font-semibold text-foreground">{categories.join(", ")}</span>.
        </p>

        <dl className="grid border-t border-border sm:grid-cols-3">
          {[
            { label: "Average overall", value: `${avgScore}%` },
            { label: "Average relevance", value: `${avgSimilarity}%` },
            { label: "Questions completed", value: String(answered.length) },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`flex items-center justify-between gap-4 py-4 sm:block sm:px-5 sm:first:pl-0 ${
                index > 0 ? "border-t border-border sm:border-l sm:border-t-0" : ""
              }`}
            >
              <dt className="text-xs font-medium text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-lg font-semibold text-foreground sm:mt-1">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Per-question breakdown */}
      <div className="flex flex-col gap-3">
        <h3 className="text-primary-100 text-lg font-semibold">
          Question review
        </h3>

        {questions.map((q, idx) => {
          const a = analysis[q];
          const r = responses[q];
          const isOpen = expanded === idx;

          if (!r || !a) return null;

          return (
            <div
              key={idx}
              className={`overflow-hidden rounded-xl border bg-white transition-colors duration-200 ${
                isOpen
                  ? "border-primary"
                  : "border-border hover:border-slate-400"
              }`}
            >
              {/* Header */}
              <button
                id={`summary-q${idx}-toggle`}
                className="w-full flex items-start gap-4 p-5 text-left"
                onClick={() => setExpanded(isOpen ? null : idx)}
              >
                <span className="flex-shrink-0 w-7 h-7 mt-0.5 rounded-full bg-primary-200/15 border border-primary-200/30 flex items-center justify-center text-xs font-bold text-primary-200">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-primary-100 text-sm font-medium line-clamp-2">
                    {q}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <ScorePill value={a.score} />
                    <span className="text-xs text-light-400/60">Overall</span>
                    <span className="mx-1 text-light-400/30">·</span>
                    <ScorePill value={a.similarity} />
                    <span className="text-xs text-light-400/60">Relevance</span>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div className="state-enter flex flex-col gap-4 border-t border-border px-5 pb-5 pt-4">
                  <dl className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border sm:grid-cols-4 sm:divide-y-0">
                    {[
                      { label: "Overall",   value: a.score },
                      { label: "Relevance", value: a.similarity },
                      { label: "Length",    value: a.length_score },
                      { label: "Structure", value: a.structure_score },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-[var(--surface-subtle)] p-3 text-center"
                      >
                        <dd className="text-sm font-semibold text-foreground">{value}%</dd>
                        <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
                      </div>
                    ))}
                  </dl>

                  {/* Response */}
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      Your answer
                    </p>
                    <p className="border-t border-border pt-3 text-sm leading-relaxed text-foreground">
                      {r}
                    </p>
                  </div>

                  {/* Feedback */}
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      Coaching note
                    </p>
                    <p className="border-t border-border pt-3 text-sm leading-relaxed text-foreground">
                      {a.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-center pb-8">
        <button
          id="restart-interview-btn"
          onClick={onRestart}
          className="btn-primary flex items-center gap-2"
        >
          Start another session
        </button>
      </div>
    </div>
  );
}
