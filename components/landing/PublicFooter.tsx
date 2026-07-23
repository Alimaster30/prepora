import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";

import BrandLogo from "@/components/BrandLogo";

const productLinks = [
  { href: "/#capabilities", label: "What you can do" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/sign-up", label: "Join the beta" },
  { href: "/sign-in", label: "Sign in" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy notice" },
  { href: "/terms", label: "Terms of use" },
];

const linkClassName =
  "group inline-flex w-fit items-center gap-1.5 text-sm text-slate-300 hover:text-white focus-visible:text-white";

export default function PublicFooter() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const jurisdiction = process.env.NEXT_PUBLIC_LEGAL_JURISDICTION?.trim();
  const location = jurisdiction ? `Remote-first, ${jurisdiction}` : "Remote-first";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Prepora footer
      </h2>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 py-14 sm:py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr] lg:gap-10 lg:py-20">
          <div className="max-w-md">
            <Link href="/" className="inline-flex" aria-label="Prepora home">
              <BrandLogo imageClassName="h-9 brightness-0 invert" />
            </Link>
            <div className="mt-6 flex items-center gap-3">
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-300 opacity-50 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-blue-300" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                Free during beta
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              A practical workspace for stronger interviews, clearer resumes,
              and more confident applications.
            </p>
          </div>

          <section aria-labelledby="contact-heading">
            <h3
              id="contact-heading"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
            >
              Contact
            </h3>
            <div className="mt-5 space-y-4">
              {supportEmail ? (
                <a href={`mailto:${supportEmail}`} className={linkClassName}>
                  <Mail aria-hidden="true" size={16} strokeWidth={1.8} />
                  <span className="break-all">{supportEmail}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    size={14}
                  />
                </a>
              ) : (
                <p className="flex items-start gap-2 text-sm leading-6 text-slate-400">
                  <Mail aria-hidden="true" className="mt-1 shrink-0" size={16} strokeWidth={1.8} />
                  Support email available in the app
                </p>
              )}
              <p className="flex items-start gap-2 text-sm leading-6 text-slate-300">
                <MapPin aria-hidden="true" className="mt-1 shrink-0" size={16} strokeWidth={1.8} />
                <span>
                  {location}
                  <span className="block text-slate-400">Supporting candidates worldwide</span>
                </span>
              </p>
            </div>
          </section>

          <nav aria-labelledby="product-links-heading">
            <h3
              id="product-links-heading"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
            >
              Product
            </h3>
            <ul className="mt-5 space-y-3.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClassName}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="legal-links-heading">
            <h3
              id="legal-links-heading"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
            >
              Legal
            </h3>
            <ul className="mt-5 space-y-3.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClassName}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Prepora. All rights reserved.</p>
          <p>Built for focused preparation, not busywork.</p>
        </div>
      </div>
    </footer>
  );
}
