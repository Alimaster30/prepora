# Prepora

Prepora is a production-oriented SaaS with a free plan for realistic interview practice, evidence-based feedback, resume creation and analysis, and interview planning.

## What is implemented

- Direct Google Identity Services authentication with server-side token verification.
- Neon-backed opaque sessions, verified Google email identity, and all-device revocation.
- Structured AI interview setup by role, level, style, focus areas, and job context.
- Voice interviews through Vapi and transcript-based feedback through Gemini.
- Text interview coach backed by a FastAPI service.
- Resume builder, PDF import, AI analysis, PDF export, and revocable public links.
- Cross-device interview scheduling stored against the signed-in account.
- Server-enforced daily free-plan quotas for costly AI operations.
- Transactional quota refunds when a paid operation fails before completion.
- Ownership validation, bounded inputs, safe API errors, and credential ignore rules.
- Recent-auth account deletion with cascading removal of account-scoped records.
- Production privacy/terms surfaces, configurable support contacts, and dependency health checks.

The UI follows the light-first product system documented in `DESIGN.md`, with responsive navigation, consistent interaction states, and reduced-motion-safe state transitions.

## Stack

- Next.js 15, React 19, TypeScript, Tailwind CSS
- Neon PostgreSQL with indexed JSONB feature records and relational identity/session tables
- Google Identity Services and Google Auth Library for authentication
- Gemini through the Google Generative AI SDK
- Vapi for voice sessions
- FastAPI, scikit-learn, spaCy, and NLTK for the text coach

## Local development

Requirements: Node.js 22+, npm, and Python 3.11+.

1. Copy `.env.example` to `.env.local` and populate every value needed by the features you run.
2. Install the web dependencies:

   ```bash
   npm install
   ```

3. Apply the PostgreSQL migrations to the Neon database configured in
   `DATABASE_URL`:

   ```bash
   npm run db:migrate
   npm run db:check
   ```

4. Create a Python virtual environment and install the coach service:

   ```bash
   python -m venv .venv
   .venv/Scripts/activate
   pip install -r python-backend/requirements.txt
   ```

5. Start both services:

   ```bash
   npm run dev:all
   ```

The Next.js app runs on port 3000. The Python service defaults to port 8001.

## Quality gates

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Do not deploy when any gate fails. The share-token tests cover token generation, tamper rejection, malformed identifiers, and invalid stored hashes.

## Free plan limits

Limits are enforced per account and UTC day in PostgreSQL:

- 8 interview question generations
- 12 transcript feedback generations
- 15 resume parsing or analysis operations
- 100 text-coach analysis operations

These limits protect the free plan from accidental or abusive model usage. Change them only in `lib/server/quota.ts` after reviewing provider budgets.

## Production deployment

Deploy the Next.js application and Python coach as separate services. Set
`DATABASE_URL` to Neon's pooled PostgreSQL connection string and keep it
server-only. Set `PYTHON_API_URL` in the web service to the public HTTPS URL
of the coach.

The web service applies explicit deadlines to coach requests. The Python service
does not expose internal exception text, and `BACKEND_ALLOWED_ORIGINS` controls
the optional browser origins permitted for direct diagnostic access.

Use `GET /api/health` for uptime and dependency monitoring. It returns HTTP 503
when the configured text-coach service is unavailable without exposing its URL
or internal error details.

Before launch:

- Configure all variables from `.env.example` in the hosting platform.
- Configure `NEXT_PUBLIC_SUPPORT_EMAIL`; public launch should not show the support placeholder.
- Add `DATABASE_URL` and the public web variables as GitHub Actions secrets so the build gate can run.
- Run `npm run db:migrate` against staging and production before deploying the corresponding web release.
- Add the production domain to the Google OAuth web client's authorized JavaScript origins.
- Configure the OAuth consent screen, public-facing support email, application name, and privacy/terms links in Google Cloud Console.
- Verify Google sign-up, returning sign-in, sign-out, and all-device revocation on the production domain.
- Use HTTPS for both services and restrict Python-service ingress where the platform permits.
- Verify sign-up, sign-in, interview creation, feedback, resume save/export/share/revoke, scheduling, and account isolation using production credentials.
- Rotate any provider key that has ever been committed, copied into chat, or shared outside the deployment secret store.
- Configure provider budgets and alerts for Gemini, Vapi, Neon, Google Cloud, and hosting.
- Connect `/api/health` to uptime monitoring and add an error-monitoring provider.
- Configure Neon backup/retention and point-in-time recovery, complete a restore drill, and have the Privacy Notice and Terms reviewed for launch regions.

PostgreSQL is accessed only from server code. Never expose `DATABASE_URL` or
direct database credentials to browser bundles.

## Security

Never commit `.env` files, database credentials, OAuth secrets, or provider
keys. Credential-shaped files are ignored, but ignore rules do not remove
secrets from previous Git history. If a key may have leaked, revoke it at the
provider and issue a new one.

Public resume URLs are bearer links. Creating a new link rotates the previous link, and revoking it makes the stored link invalid. Share only resumes intended for public viewing.

Report suspected vulnerabilities privately to the project owner and include the affected route, impact, and reproduction steps. Do not include live credentials or private user data.
