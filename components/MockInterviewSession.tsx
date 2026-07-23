"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
export interface AnalysisResult {
  score: number;
  similarity: number;
  length_score: number;
  structure_score: number;
  feedback: string;
}

interface Props {
  questions: string[];
  onComplete: (
    responses: Record<string, string>,
    analysis: Record<string, AnalysisResult>
  ) => void;
}

// ── Score badge color ────────────────────────────────────────────────────────
function scoreColor(val: number) {
  if (val >= 70) return "#2f7d5b";
  if (val >= 40) return "#a56416";
  return "#b83b42";
}

// ── Circular progress ring ───────────────────────────────────────────────────
function ScoreRing({ value, label }: { value: number; label: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = scoreColor(value);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle
            cx="40" cy="40" r={r}
            fill="none" stroke="#dde1e7" strokeWidth="7"
          />
          <circle
            cx="40" cy="40" r={r}
            fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <span
          className="absolute text-sm font-bold"
          style={{ color }}
        >
          {value}%
        </span>
      </div>
      <span className="text-center text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Main session component ───────────────────────────────────────────────────
export default function MockInterviewSession({ questions, onComplete }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<Record<string, AnalysisResult>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const currentAnalysis = analysis[currentQuestion];

  const progressPct = ((currentIdx) / questions.length) * 100;

  async function handleSubmit() {
    if (!answer.trim()) {
      setError("Please type your response before submitting.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/mock-interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");

      setResponses((prev) => ({ ...prev, [currentQuestion]: answer }));
      setAnalysis((prev) => ({ ...prev, [currentQuestion]: data }));
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleNext() {
    if (isLastQuestion) {
      const finalResponses = { ...responses, [currentQuestion]: answer };
      const finalAnalysis = { ...analysis };
      onComplete(finalResponses, finalAnalysis);
    } else {
      setCurrentIdx((i) => i + 1);
      setAnswer("");
      setSubmitted(false);
      setError(null);
    }
  }

  return (
    <div className="state-enter mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <span>{Math.round(progressPct)}% complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground">
            Q{currentIdx + 1}
          </span>
          <p className="pt-1 text-base font-medium leading-relaxed text-foreground">
            {currentQuestion}
          </p>
        </div>

        {/* Answer textarea */}
        {!submitted ? (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-foreground">Your answer</label>
            <textarea
              id={`answer-q${currentIdx}`}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              placeholder="Write a specific answer. Include context, your actions, and the result where relevant."
              className="w-full resize-none rounded-md border border-input bg-white px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
            />

            {/* Word count */}
            <div className="flex justify-between items-center text-xs">
              {error && <p role="alert" className="state-enter text-destructive">{error}</p>}
              <span className="ml-auto text-muted-foreground">
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <button
              id={`submit-q${currentIdx}`}
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="btn-primary self-end flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Reviewing...
                </>
              ) : (
                "Review answer"
              )}
            </button>
          </div>
        ) : (
          /* Submitted answer read-only */
          <div className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground">
            <span className="mb-1 block text-xs text-muted-foreground">Your answer</span>
            {answer}
          </div>
        )}
      </div>

      {/* Analysis results */}
      {currentAnalysis && (
        <div
          className="state-enter flex flex-col gap-6 rounded-xl border border-border bg-white p-5 sm:p-6"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Answer review
          </h3>

          {/* Score rings */}
          <div className="flex flex-wrap justify-around gap-6">
            <ScoreRing value={currentAnalysis.score}          label="Overall Score" />
            <ScoreRing value={currentAnalysis.similarity}     label="Relevance" />
            <ScoreRing value={currentAnalysis.length_score}   label="Length" />
            <ScoreRing value={currentAnalysis.structure_score} label="Structure" />
          </div>

          {/* Feedback */}
          <div className="border-t border-border pt-5">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Coaching note
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              {currentAnalysis.feedback}
            </p>
          </div>

          {/* Next / Finish button */}
          <div className="flex justify-end">
            <button
              id={`next-q${currentIdx}`}
              onClick={handleNext}
              className="btn-primary flex items-center gap-2"
            >
              {isLastQuestion ? "View summary" : "Next question"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
