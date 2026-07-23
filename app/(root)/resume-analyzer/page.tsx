import { Check, FileSearch } from "lucide-react";

import ResumeUploadAnalyzer from "@/components/resume/common/ResumeUploadAnalyzer";

const ResumeAnalyzerPage = () => {
  return (
    <div className="root-layout">
      <header>
        <p className="text-sm font-semibold text-primary">Resume review</p>
        <h1 className="mt-2 tracking-[-0.025em]">Review before you apply</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Upload a resume to check its clarity, role alignment, and applicant
          tracking compatibility. You will receive a prioritized set of improvements.
        </p>
      </header>

      <section className="grid overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <FileSearch aria-hidden="true" size={21} strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Upload your current resume</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use a PDF or text file up to 5 MB. Your report opens in a focused
            review dialog when the analysis is ready.
          </p>
          <div className="mt-6">
            <ResumeUploadAnalyzer />
          </div>
        </div>

        <div className="bg-[var(--surface-subtle)] p-6 sm:p-8">
          <p className="text-sm font-semibold text-foreground">
            Your review will cover
          </p>
          <ul className="mt-5 list-none space-y-4 p-0">
            {[
              "A clear overall assessment and ATS compatibility score",
              "Specific strengths worth keeping",
              "The highest-impact improvements to make next",
              "Practical recommendations grouped by resume section",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check aria-hidden="true" className="mt-0.5 shrink-0 text-success-200" size={17} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ResumeAnalyzerPage;
