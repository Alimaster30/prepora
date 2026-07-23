"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileCheck2,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Settings,
} from "lucide-react";

import SignOutButton from "@/components/SignOutButton";
import BrandLogo from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

const destinations = [
  { href: "/interview", label: "Overview", icon: LayoutDashboard },
  { href: "/mock-interview", label: "Coach", icon: MessageSquareText },
  { href: "/resume/dashboard", label: "Build", icon: FileText },
  { href: "/resume-analyzer", label: "Review", icon: FileCheck2 },
];

export default function AppShellNavigation() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/resume/dashboard") {
      return (
        pathname.startsWith("/resume/dashboard") ||
        pathname.startsWith("/resume/my-resume")
      );
    }
    return pathname.startsWith(href);
  };

  const desktopLabel = (label: string) => {
    if (label === "Coach") return "Interview coach";
    if (label === "Build") return "Resume builder";
    if (label === "Review") return "Resume review";
    return label;
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-border bg-[var(--shell)] lg:flex">
        <Link
          href="/interview"
          className="flex min-h-20 items-center justify-between gap-3 border-b border-border px-5 hover:bg-white"
          aria-label="Prepora home"
        >
          <BrandLogo
            variant="desktop"
            priority
            imageClassName="h-7 max-w-[132px]"
          />
          <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success-200" aria-hidden="true" />
            Free
          </span>
        </Link>

        <nav className="flex-1 px-3 py-5" aria-label="Product navigation">
          <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
            Prepare
          </p>
          <ul className="m-0 list-none space-y-1 p-0">
            {destinations.map(({ href, label, icon: Icon }) => (
              <li key={href} className="m-0 list-none p-0">
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-muted-foreground hover:bg-white hover:text-foreground",
                    isActive(href) && "bg-accent font-semibold text-accent-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-foreground",
                      isActive(href) && "bg-white text-primary"
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-[17px]"
                      strokeWidth={1.9}
                    />
                  </span>
                  <span>{desktopLabel(label)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-3 pb-2">
          <Link
            href="/interview/new"
            className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white hover:bg-slate-800 active:translate-y-px"
          >
            <Plus aria-hidden="true" className="size-4" />
            New interview
          </Link>
        </div>
        <div className="border-t border-border p-3">
          <Link
            href="/settings"
            className={cn(
              "mb-1 flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              pathname.startsWith("/settings") && "bg-accent font-semibold text-accent-foreground"
            )}
          >
            <Settings aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            Account settings
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-border bg-[var(--shell)] px-4 lg:hidden">
        <Link href="/interview" className="flex items-center gap-3" aria-label="Prepora home">
          <BrandLogo variant="mobile" priority imageClassName="h-8" />
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
            Free
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            aria-label="Account settings"
            className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings aria-hidden="true" className="size-[18px]" />
          </Link>
          <SignOutButton compact />
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-[var(--shell)] pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Mobile product navigation"
      >
        <ul className="m-0 grid list-none grid-cols-4 p-1.5">
          {destinations.map(({ href, label, icon: Icon }) => (
            <li key={href} className="m-0 list-none p-0">
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground",
                  isActive(href) && "bg-accent font-semibold text-accent-foreground"
                )}
              >
                <Icon
                  aria-hidden="true"
                  className="size-[18px]"
                  strokeWidth={1.8}
                />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
