import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";

export default function PublicFooter() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-muted-foreground sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo imageClassName="h-8" />
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
            Free plan
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Legal and support">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          {supportEmail ? (
            <a href={`mailto:${supportEmail}`} className="hover:text-foreground">
              Support
            </a>
          ) : (
            <span title="Set NEXT_PUBLIC_SUPPORT_EMAIL before launch">Support coming soon</span>
          )}
        </nav>
      </div>
    </footer>
  );
}
