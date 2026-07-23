import { BadgeCheck, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import DeleteAccountPanel from "@/components/settings/DeleteAccountPanel";
import SessionSecurityPanel from "@/components/settings/SessionSecurityPanel";
import { getCurrentUser } from "@/lib/actions/auth.action";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-sm font-semibold text-primary">Account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em]">Settings</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Review your plan, account identity, active access, and data controls.
      </p>

      <div className="mt-8 space-y-5">
        <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-base font-semibold">{user.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Signed in securely with Google
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <BadgeCheck aria-hidden="true" className="size-3.5" />
              Email verified
            </span>
          </div>
          <div className="mt-5 flex items-start gap-3 border-t border-border pt-5">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Free plan</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Core tools are currently free within the published daily usage limits.
                We will communicate material pricing or policy changes before they apply.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">Privacy and terms</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Read how your data is handled and the conditions for using the service.
          </p>
          <div className="mt-4 flex gap-4 text-sm font-semibold text-primary">
            <a href="/privacy" className="hover:text-light-800">Privacy Notice</a>
            <a href="/terms" className="hover:text-light-800">Terms of Use</a>
          </div>
        </section>

        <SessionSecurityPanel />

        <DeleteAccountPanel />
      </div>
    </div>
  );
}
