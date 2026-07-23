"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import MockInterviewSession, {
  type AnalysisResult,
} from "@/components/MockInterviewSession";
import MockInterviewSummary from "@/components/MockInterviewSummary";
import { getCurrentUser } from "@/lib/actions/auth.action";

// ── View states ───────────────────────────────────────────────────────────────
type View = "setup" | "session" | "summary" | "history";

// ── Small helper: category checkbox ──────────────────────────────────────────
function CategoryChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      id={`category-${label.replace(/\s+/g, "-").toLowerCase()}`}
      onClick={onToggle}
      className={`
        min-h-9 px-3 py-1.5 rounded-md text-xs font-semibold border
        ${
          selected
            ? "bg-accent text-accent-foreground border-primary"
            : "bg-white text-muted-foreground border-border hover:border-slate-400 hover:text-foreground"
        }
      `}
    >
      {label}
    </button>
  );
}

// ── Past session card ─────────────────────────────────────────────────────────
interface SessionRecord {
  id: string;
  categories: string[];
  questions: string[];
  completedAt: string;
  analysis: Record<string, AnalysisResult>;
}

function PastSessionCard({ session }: { session: SessionRecord }) {
  const answered = session.questions?.filter(
    (q) => session.analysis?.[q]
  );
  const avgScore =
    answered?.length
      ? Math.round(
          answered.reduce((s, q) => s + (session.analysis[q]?.score ?? 0), 0) /
            answered.length
        )
      : 0;

  const scoreTone =
    avgScore >= 70
      ? "text-success-200"
      : avgScore >= 40
        ? "text-orange-500"
        : "text-destructive";
  const scoreLabel =
    avgScore >= 70 ? "Strong" : avgScore >= 40 ? "Developing" : "Needs work";

  return (
    <article className="interactive-row rounded-xl border border-border bg-white p-5 hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {session.categories?.map((c) => (
              <span
                key={c}
                className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(session.completedAt).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-sm text-foreground">
            {answered?.length ?? 0} / {session.questions?.length ?? 0} questions answered
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end text-right">
          <span className={`text-2xl font-bold ${scoreTone}`}>
            {avgScore}%
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {scoreLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MockInterviewChatbotPage() {
  const [view, setView] = useState<View>("setup");

  // Setup state
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [questionLimit, setQuestionLimit] = useState(10);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState("");

  // Session state
  const [questions, setQuestions] = useState<string[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Results
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [analysis, setAnalysis] = useState<Record<string, AnalysisResult>>({});

  // History
  const [pastSessions, setPastSessions] = useState<SessionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // User
  const [userId, setUserId] = useState<string | null>(null);

  // Load user & categories on mount
  useEffect(() => {
    getCurrentUser().then((u) => setUserId(u?.id ?? null));
    fetch("/api/mock-interview/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setCatError(d.error);
        else setAllCategories(d.categories ?? []);
      })
      .catch(() => setCatError("Could not load categories. Is the Python backend running?"))
      .finally(() => setCatLoading(false));
  }, []);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const filteredCategories = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter((c) => c.toLowerCase().includes(q));
  }, [allCategories, catSearch]);

  function selectAllFiltered() {
    setSelectedCategories((prev) => {
      const merged = new Set([...prev, ...filteredCategories]);
      return Array.from(merged);
    });
  }

  function clearAll() {
    setSelectedCategories([]);
  }

  async function startInterview() {
    if (selectedCategories.length === 0) return;
    setSessionError(null);
    setSessionLoading(true);

    try {
      const res = await fetch(
        `/api/mock-interview/questions?categories=${encodeURIComponent(
          selectedCategories.join(",")
        )}&limit=${questionLimit}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load questions");

      setQuestions(data.questions);
      setResponses({});
      setAnalysis({});
      setView("session");
    } catch (e: unknown) {
      setSessionError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleComplete(
    finalResponses: Record<string, string>,
    finalAnalysis: Record<string, AnalysisResult>
  ) {
    setResponses(finalResponses);
    setAnalysis(finalAnalysis);
    setView("summary");

    // Save the completed session.
    if (userId) {
      await fetch("/api/mock-interview/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCategories,
          questions,
          responses: finalResponses,
          analysis: finalAnalysis,
          completedAt: new Date().toISOString(),
        }),
      });
    }
  }

  function handleRestart() {
    setView("setup");
    setSelectedCategories([]);
    setQuestions([]);
    setResponses({});
    setAnalysis({});
  }

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/mock-interview/sessions?userId=${userId}`);
      const data = await res.json();
      setPastSessions(data.sessions ?? []);
    } catch {
      /* silent */
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (view === "history") loadHistory();
  }, [view, loadHistory]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="root-layout">
      {/* Page header */}
      <section className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-primary">Interview coach</p>
          <h1 className="mt-2 tracking-[-0.025em]">Practice one answer at a time</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Choose the topics you want to work on. Each answer receives
            specific feedback on relevance, structure, and content.
          </p>
        </div>
        <div className="sm:shrink-0">
          <button
            id="view-history-btn"
            onClick={() => setView(view === "history" ? "setup" : "history")}
            className="btn-secondary flex items-center gap-2"
          >
            {view === "history" ? "Back to setup" : "Past sessions"}
          </button>
        </div>
      </section>

      {/* ── HISTORY ── */}
      {view === "history" && (
        <section className="state-enter flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Past sessions</h2>
          </div>

          {historyLoading ? (
            <div className="space-y-3" aria-label="Loading past sessions">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="skeleton h-28 rounded-xl border border-border"
                />
              ))}
            </div>
          ) : pastSessions.length === 0 ? (
            <div className="flex flex-col items-start rounded-xl border border-dashed border-slate-300 bg-white px-6 py-9">
              <p className="font-semibold text-foreground">No past sessions yet</p>
              <button
                onClick={() => setView("setup")}
                className="btn-primary mt-4"
              >
                Start your first session
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pastSessions.map((s) => (
                <PastSessionCard key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── SETUP ── */}
      {view === "setup" && (
        <section className="state-enter flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Set up your practice</h2>
          </div>

          <div className="flex flex-col gap-7 rounded-xl border border-border bg-white p-5 sm:p-6">
            {/* Category selector */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-light-100 font-medium text-sm">
                  Interview topics
                  <span className="ml-2 text-light-400/60">
                    ({selectedCategories.length} selected)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    disabled={filteredCategories.length === 0}
                    className="text-xs text-primary-200 hover:text-primary-100 underline-offset-2 hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Select all{catSearch ? " matching" : ""}
                  </button>
                  <span className="text-light-400/30">·</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={selectedCategories.length === 0}
                    className="text-xs text-light-400 hover:text-red-400 underline-offset-2 hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-400/50"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  id="category-search"
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search topics"
                  className="min-h-11 w-full rounded-md border border-input bg-white py-2 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
                {catSearch && (
                  <button
                    type="button"
                    onClick={() => setCatSearch("")}
                    className="clear-search-button absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear topic search"
                  >
                    ×
                  </button>
                )}
              </div>

              {catLoading ? (
                <div className="flex gap-2 flex-wrap">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="skeleton h-7 w-24 rounded-full" />
                  ))}
                </div>
              ) : catError ? (
                <div className="rounded-lg border border-destructive/30 bg-red-500/5 px-4 py-3 text-sm text-destructive">
                  {catError}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="py-6 text-center text-light-400/60 text-sm">
                  No categories match &ldquo;{catSearch}&rdquo;
                </div>
              ) : (
                <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1">
                  {filteredCategories.map((cat) => (
                    <CategoryChip
                      key={cat}
                      label={cat}
                      selected={selectedCategories.includes(cat)}
                      onToggle={() => toggleCategory(cat)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Question count */}
            <div className="flex flex-col gap-2">
              <label htmlFor="question-limit" className="text-light-100 font-medium text-sm">
                Number of questions: <span className="font-semibold text-primary">{questionLimit}</span>
              </label>
              <input
                id="question-limit"
                type="range"
                min={1}
                max={30}
                step={1}
                value={questionLimit}
                onChange={(e) => setQuestionLimit(Number(e.target.value))}
                className="h-2 w-full cursor-pointer border-none bg-slate-200 accent-primary"
              />
              <div className="flex justify-between text-xs text-light-400/60">
                <span>1</span><span>15</span><span>30</span>
              </div>
            </div>

            {sessionError && (
              <div className="rounded-lg border border-destructive/30 bg-red-500/5 px-4 py-3 text-sm text-destructive">
                {sessionError}
              </div>
            )}

            <button
              id="start-interview-btn"
              onClick={startInterview}
              disabled={selectedCategories.length === 0 || sessionLoading || catLoading}
              className="btn-primary self-start flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sessionLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Preparing questions...
                </>
              ) : (
                "Start practice"
              )}
            </button>
          </div>
        </section>
      )}

      {/* ── SESSION ── */}
      {view === "session" && (
        <MockInterviewSession
          questions={questions}
          onComplete={handleComplete}
        />
      )}

      {/* ── SUMMARY ── */}
      {view === "summary" && (
        <MockInterviewSummary
          questions={questions}
          responses={responses}
          analysis={analysis}
          categories={selectedCategories}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
