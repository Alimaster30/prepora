"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import BrandLogo from "@/components/BrandLogo";

const links = [
  { href: "/#capabilities", label: "What you can do" },
  { href: "/#how-it-works", label: "How it works" },
];

const LandingNav = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="landing-nav sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link href="/" className="flex items-center" aria-label="Prepora home">
          <BrandLogo priority imageClassName="sm:h-9" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Public navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!isAuthenticated && (
            <Link
              href="/sign-in"
              className="inline-flex min-h-10 items-center rounded-md px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Sign in
            </Link>
          )}
          <Link
            href={isAuthenticated ? "/interview" : "/sign-up"}
            className="cta-primary inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-light-800"
          >
            {isAuthenticated ? "Continue preparing" : "Start preparing"}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-public-navigation"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
        >
          {isOpen ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-public-navigation"
          className="mobile-nav-enter border-t border-border bg-white px-5 py-4 md:hidden"
          aria-label="Mobile public navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t border-border pt-4">
              {!isAuthenticated && (
                <Link
                  href="/sign-in"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border text-sm font-semibold"
                >
                  Sign in
                </Link>
              )}
              <Link
                href={isAuthenticated ? "/interview" : "/sign-up"}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                {isAuthenticated ? "Continue" : "Get started"}
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default LandingNav;
