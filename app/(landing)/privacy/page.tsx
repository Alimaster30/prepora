import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Notice | Prepora",
  description: "How Prepora handles account and career-preparation data.",
};

const sections = [
  {
    title: "Information we handle",
    body: [
      "Account information such as your name, email address, verification status, and authentication identifiers.",
      "If you create a password, Prepora stores a salted cryptographic hash rather than the password itself.",
      "Content you choose to provide, including resumes, job context, interview answers, transcripts, feedback, schedules, and settings.",
      "Operational information such as feature usage counts, request diagnostics, and security events needed to operate and protect the service.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "To authenticate you, save your work, generate interview and resume guidance, enforce plan limits, troubleshoot failures, and protect the service from abuse.",
      "We do not sell your personal information or use your private career content for advertising.",
    ],
  },
  {
    title: "AI and service providers",
    body: [
      "Relevant content may be sent to providers that power the product: Google Identity Services for Google sign-in, Neon for PostgreSQL application data, Google Gemini for AI generation and analysis, Vapi for voice interview sessions, and the infrastructure hosting the web and text-coach services.",
      "Do not include government identifiers, financial details, health information, confidential employer data, or other information you do not need for career preparation.",
    ],
  },
  {
    title: "Browser permissions and local storage",
    body: [
      "Microphone access is requested only when you choose to start a voice interview. Live audio is sent to Vapi to operate the session; Prepora saves the resulting transcript and feedback to your account. You can deny or revoke microphone access in your browser settings, but voice interviews will not work without it.",
      "Prepora temporarily stores an interview name, session identifier, and transcript in your browser so an interrupted session can recover. This recovery data is cleared after feedback is created. Essential sign-in and security cookies are required while you use an account.",
      "A document or image is accessed only after you choose it with your device file picker. Resume documents are uploaded to extract text; the original PDF or TXT is not retained by that extraction step. A resume photo is resized and saved with the resume until you remove it. Camera or video permission will be requested only if you deliberately use a future feature that captures them.",
    ],
  },
  {
    title: "Public resume links",
    body: [
      "A resume is private by default. If you create a public resume link, anyone with that bearer link can view the shared resume. Rotating or revoking the link disables the previous URL.",
    ],
  },
  {
    title: "Retention and deletion",
    body: [
      "Saved content remains associated with your account until you delete individual items or delete your account. Account deletion removes the active account and account-scoped application records. A limited deletion-status record is retained for up to 30 days so failed deletion operations can be completed. Hosting security logs and provider records may remain for their documented retention periods or where legally required.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can decline optional permission prompts, revoke microphone access in your browser, remove a saved resume photo, revoke public resume links, and permanently delete your account from Account Settings. You may also contact us to ask a privacy question or exercise an applicable data right.",
    ],
  },
];

export default function PrivacyPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim() || supportEmail;
  const legalName = process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || "Prepora";

  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-semibold text-primary">Prepora privacy</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Privacy Notice</h1>
      <p className="mt-4 text-sm text-muted-foreground">Effective July 23, 2026</p>
      <p className="mt-7 text-base leading-7 text-muted-foreground">
        This notice explains how {legalName} handles information when you use
        Prepora.
      </p>

      <div className="mt-10 space-y-9">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
        <section>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {privacyEmail ? (
              <>
                Privacy questions and applicable data-right requests can be sent to{" "}
                <a className="font-semibold text-primary" href={`mailto:${privacyEmail}`}>
                  {privacyEmail}
                </a>
                .
              </>
            ) : (
              "A privacy contact is required before production deployment."
            )}
          </p>
        </section>
      </div>
    </article>
  );
}
