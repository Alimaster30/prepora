"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-16 text-[#171a21]">
          <div className="w-full max-w-lg border-y border-[#dde1e7] py-10">
            <p className="text-sm font-semibold text-[#2457d6]">
              Prepora is temporarily unavailable
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">
              We could not load the application.
            </h1>
            <p className="mt-4 leading-7 text-[#5d6471]">
              Try once more. If the problem continues, return later—your saved
              interview and resume data has not been removed.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="min-h-11 rounded-md bg-[#2457d6] px-5 text-sm font-semibold text-white"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#dde1e7] bg-white px-5 text-sm font-semibold"
              >
                Return home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
