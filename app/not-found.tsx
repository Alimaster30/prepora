import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="state-enter w-full max-w-lg border-y border-border py-10">
        <p className="text-sm font-semibold text-primary">404 · Page not found</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">
          This page is no longer here.
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          The link may be incomplete, expired, or moved. Return to your
          workspace to continue preparing.
        </p>
        <Link href="/interview" className="btn-primary mt-7">
          <ArrowLeft aria-hidden="true" size={17} />
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
