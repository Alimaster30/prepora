# Prepora architecture and implementation notes

This document reflects the current production architecture. Prepora is a
Google-authenticated interview preparation and resume workspace backed by Neon
PostgreSQL.

## Core stack

- Next.js 15, React 19, TypeScript, and Tailwind CSS
- Google Identity Services for browser sign-in
- Google Auth Library for server-side Google ID-token verification
- Neon PostgreSQL for identities, sessions, quotas, and product data
- Gemini for structured interview, feedback, and resume assistance
- Vapi for real-time voice interview sessions
- FastAPI for the text interview coach

## Authentication flow

1. The browser renders the official Google Identity Services button.
2. Google returns a signed ID token to the browser callback.
3. The server action verifies the token against
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
4. The verified Google subject and email are upserted into the `users` table.
5. Prepora creates a random opaque session token, stores only its SHA-256 hash
   in `auth_sessions`, and sends the token in an HTTP-only, SameSite cookie.
6. Protected server actions resolve the session and load the associated user.

Prepora never receives or stores the user's Google password. The application
requests only the basic OpenID identity scopes needed for sign-in.

## Database model

The initial schema is in `db/migrations/0001_initial.sql`.

- `users`: verified Google identity and profile metadata
- `auth_sessions`: revocable, expiring opaque application sessions
- `usage_quotas`: atomic per-user, per-feature daily counters
- `rate_limits`: atomic abuse-control windows
- `account_deletion_requests`: short-lived deletion audit records
- `app_records`: indexed JSONB records for document-shaped product data

The JSONB store holds interviews, feedback, mock-interview history, schedules,
resumes, resume sections, and revocable resume-share records. Common ownership,
visibility, interview, and creation-time access paths are indexed.

## Interview workflow

1. The user selects a role, seniority, interview type, and focus areas.
2. A server-enforced daily quota is reserved atomically.
3. Gemini returns structured questions validated with Zod.
4. Prepora saves the private interview record against the authenticated user.
5. The user completes a voice or text interview.
6. The transcript is bounded and validated before analysis.
7. Gemini returns evidence-based structured feedback, which is stored only
   when the interview is readable by the signed-in user.
8. Failed model operations refund the reserved daily quota.

## Resume workflow

Resume writes are server-only and ownership checked. Rich-text work summaries
are sanitized on write and render. Resumes support templates, section editing,
PDF import and export, AI assistance, and public bearer links that can be
rotated or revoked.

## Security controls

- Server-side authorization on all account-scoped operations
- HTTP-only, Secure-in-production, SameSite=Lax session cookies
- Session-token hashing at rest
- Recent-authentication requirement for permanent account deletion
- Atomic quotas and rate limits
- Strict Zod bounds on user-controlled payloads
- Sanitization of resume rich HTML
- Same-origin checks on unsafe API methods
- Timeouts and shared-service authentication for the Python coach
- Security headers and Content Security Policy
- No database credentials in browser bundles

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add a Neon pooled connection string as `DATABASE_URL`.
3. Add the Google OAuth web client ID as
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
4. Install dependencies with `npm install`.
5. Apply the database schema with `npm run db:migrate`.
6. Start the application with `npm run dev:all`.

## Production validation

Run the release gate documented in `docs/production-runbook.md`. At minimum:

```text
npm ci
npm run db:migrate
npm run lint
npm run typecheck
npm test
npm run audit:production
npm run validate:production
npm run build
```
