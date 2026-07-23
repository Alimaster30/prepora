"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route failed:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="state-enter w-full max-w-lg rounded-xl border border-border bg-white p-7 sm:p-9">
        <div className="flex size-11 items-center justify-center rounded-lg bg-red-50 text-destructive">
          <AlertTriangle aria-hidden="true" size={21} />
        </div>
        <p className="mt-6 text-sm font-semibold text-primary">
          Something interrupted this page
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em]">
          Your work is still safe.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Try loading this page again. If the problem continues, return to your
          workspace and continue from there.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn-primary">
            <RotateCcw aria-hidden="true" size={17} />
            Try again
          </button>
          <Link href="/interview" className="btn-secondary">
            Return to workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
