import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Prepora",
  description: "Terms for using Prepora.",
};

export default function TermsPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const legalName = process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || "Prepora";
  const jurisdiction =
    process.env.NEXT_PUBLIC_LEGAL_JURISDICTION?.trim() || "the applicable jurisdiction";

  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-semibold text-primary">Prepora terms</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Terms of Use</h1>
      <p className="mt-4 text-sm text-muted-foreground">Effective July 23, 2026</p>
      <p className="mt-7 text-base leading-7 text-muted-foreground">
        These terms govern access to Prepora, operated by {legalName}. By creating
        an account or using the service, you agree to them.
      </p>

      <div className="mt-10 space-y-9 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-xl font-semibold text-foreground">Service and free plan</h2>
          <p className="mt-3">
            The service currently includes a free plan and may change, experience
            interruptions, introduce reasonable limits, or discontinue features. Material
            changes to pricing or these terms will be communicated before they apply.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Age requirement</h2>
          <p className="mt-3">
            You must be at least 16 years old, or the minimum age required to consent
            to online services where you live, and legally able to accept these terms.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Your account</h2>
          <p className="mt-3">
            Provide accurate account information, keep credentials secure, complete any
            verification we request, and use only your own account. You are responsible for
            content submitted through your account and must have the right to use it.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Acceptable use</h2>
          <p className="mt-3">
            Do not abuse quotas, probe or disrupt the service, upload malware, impersonate
            others, violate privacy or intellectual-property rights, automate access without
            permission, or use the product for unlawful discrimination or hiring decisions.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">AI-generated guidance</h2>
          <p className="mt-3">
            AI outputs may be incomplete, inaccurate, or unsuitable for a particular role.
            Review every resume, answer, and recommendation yourself. The service does not
            guarantee interviews, offers, employment outcomes, or professional advice.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Public sharing</h2>
          <p className="mt-3">
            You control whether to create a public resume link. Anyone who receives that
            link may view and redistribute its contents, so share only information intended
            for a public audience and revoke the link when it is no longer needed.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Suspension and deletion</h2>
          <p className="mt-3">
            Access may be limited or suspended to protect users, providers, or the service,
            or in response to serious violations. You can permanently delete your account
            and account-scoped data from Account Settings.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Disclaimers and liability</h2>
          <p className="mt-3">
            The service is provided on an “as available” basis to the extent permitted by law.
            The operator is not responsible for employment decisions, reliance on generated
            content, or indirect losses arising from use of the service. Applicable consumer
            rights cannot be excluded.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Governing law</h2>
          <p className="mt-3">
            These terms are governed by the laws of {jurisdiction}, except where
            mandatory consumer law provides otherwise.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="mt-3">
            {supportEmail ? (
              <a className="font-semibold text-primary" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
            ) : (
              "A support contact is required before production deployment."
            )}
          </p>
        </section>
      </div>
    </article>
  );
}
