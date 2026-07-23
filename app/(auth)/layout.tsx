import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";

import { isAuthenticated } from "@/lib/actions/auth.action";
import BrandLogo from "@/components/BrandLogo";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (isUserAuthenticated) redirect("/interview");

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="auth-panel hidden bg-foreground px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <Link href="/" className="flex items-center gap-3" aria-label="Prepora home">
          <BrandLogo
            variant="desktop"
            priority
            imageClassName="h-9 brightness-0 invert"
          />
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
            Free plan
          </span>
        </Link>

        <div className="auth-panel-copy max-w-md">
          <p className="text-sm font-semibold text-blue-300">Your preparation workspace</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em] text-white">
            Return to your work with the next step already clear.
          </h1>
          <div className="mt-8 space-y-4">
            {[
              "Keep interview practice and feedback together",
              "Build and review resumes in one place",
              "Continue from your most useful next action",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                <Check aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Calm structure for the work behind your next opportunity.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex min-h-16 items-center border-b border-border bg-white px-5 lg:hidden">
          <Link href="/" className="flex items-center" aria-label="Prepora home">
            <BrandLogo variant="mobile" priority imageClassName="h-8" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="auth-form-enter w-full max-w-md">{children}</div>
        </div>
        <div className="flex justify-center gap-5 px-5 pb-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
