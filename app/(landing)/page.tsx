import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileCheck2,
  FileText,
  MessageSquareText,
  Mic2,
} from "lucide-react";

import BrandLogo from "@/components/BrandLogo";

const capabilities = [
  {
    icon: Mic2,
    title: "Practice a realistic interview",
    description:
      "Answer questions aloud in a focused simulation, then review specific feedback on your content and delivery.",
  },
  {
    icon: MessageSquareText,
    title: "Work through difficult questions",
    description:
      "Choose a topic, shape a stronger response, and understand why one answer works better than another.",
  },
  {
    icon: FileText,
    title: "Build a credible resume",
    description:
      "Turn your experience into a clear, professional resume with structured guidance for every section.",
  },
  {
    icon: FileCheck2,
    title: "Review before you apply",
    description:
      "Check clarity, relevance, and role alignment, then leave with a prioritized list of improvements.",
  },
];

const workflow = [
  {
    title: "Choose today's priority",
    description: "Start with the interview or resume task that matters for your next application.",
  },
  {
    title: "Practice with useful structure",
    description: "Work in a guided session that keeps the task clear and the feedback easy to follow.",
  },
  {
    title: "Continue from a clear next step",
    description: "Return to your saved work and pick up without reconstructing what you were doing.",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-clip bg-background text-foreground">
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
          <div className="landing-hero-copy max-w-xl">
            <p className="mb-5 text-sm font-semibold text-primary">
              A practical career preparation workspace
            </p>
            <h1 className="max-w-[14ch] text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[60px]">
              Prepare for the next opportunity with a clear plan.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Practice interviews, improve your resume, and turn feedback into
              the next useful action. Everything stays together, so your
              preparation feels manageable.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="cta-primary group inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-light-800"
              >
                Start preparing
                <ArrowRight aria-hidden="true" className="cta-arrow" size={17} />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Start free. Your interview practice and resumes remain saved.
            </p>
          </div>

          <div className="landing-hero-preview workspace-preview overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex min-h-14 items-center justify-between border-b border-border bg-white px-5">
              <div className="flex items-center gap-2.5">
                <BrandLogo variant="mobile" imageClassName="h-6" />
                <span className="text-sm font-semibold">Today</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Preparation workspace
              </span>
            </div>
            <div className="grid min-h-[410px] sm:grid-cols-[150px_1fr]">
              <div className="hidden border-r border-border bg-white p-3 sm:block">
                {["Overview", "Interviews", "Resume", "Feedback"].map((item, index) => (
                  <div
                    key={item}
                    className={`mb-1 rounded-md px-3 py-2.5 text-xs font-medium ${
                      index === 0
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="p-5 sm:p-7">
                <p className="text-xs font-semibold text-muted-foreground">
                  Continue where you left off
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Make your next answer more specific
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Your last practice identified one useful improvement. Review
                  the example, then try the question again.
                </p>

                <div className="mt-6 border-y border-border">
                  <div className="workspace-row flex items-start justify-between gap-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Behavioral interview practice
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        6 questions completed
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary">Continue</span>
                  </div>
                  <div className="workspace-row flex items-start justify-between gap-5 border-t border-border py-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Resume experience section
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add impact to two bullet points
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">Review</span>
                  </div>
                </div>

                <div className="workspace-recommendation mt-6 rounded-lg bg-accent p-4">
                  <p className="text-xs font-semibold text-accent-foreground">
                    Recommended next
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Practice one answer using the situation, action, and result structure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div className="scroll-reveal">
            <p className="text-sm font-semibold text-primary">What you can do</p>
            <h2 className="mt-3 max-w-sm text-3xl font-semibold tracking-[-0.02em]">
              One place for the work behind a strong application.
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              Each tool supports a real preparation task. Together, they help
              you move from uncertain to ready without losing context.
            </p>
          </div>

          <div className="border-t border-border">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="feature-row scroll-reveal grid gap-4 border-b border-border py-6 sm:grid-cols-[44px_0.8fr_1.2fr] sm:items-start"
              >
                <div className="feature-icon flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold sm:pt-2">{title}</h3>
                <p className="text-sm leading-6 text-muted-foreground sm:pt-1.5">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="scroll-reveal max-w-xl">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em]">
              A steady rhythm, not another complicated system.
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {workflow.map((item) => (
              <div key={item.title} className="workflow-step scroll-reveal border-t border-border pt-5">
                <Check aria-hidden="true" className="workflow-check mb-5 text-success-200" size={20} />
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="closing-cta scroll-reveal flex flex-col items-start justify-between gap-8 border-b border-t border-border py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.02em]">
              Start with the task that matters today.
            </h2>
            <p className="mt-3 text-muted-foreground">
              You can build from there. Your work will be ready when you return.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="cta-primary group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-light-800"
          >
            Create your workspace
            <ArrowRight aria-hidden="true" className="cta-arrow" size={17} />
          </Link>
        </div>
      </section>

    </div>
  );
}
