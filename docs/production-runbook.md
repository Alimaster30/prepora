# Prepora production runbook

## Render deployment

The production Blueprint is `render.yaml`. It provisions the `prepora-io`
Next.js service at `https://prepora-io.onrender.com` and the
`prepora-coach` FastAPI service in Render's Ohio region, close to the current
Neon `us-east-2` database.

During the first Blueprint sync, supply every variable marked `sync: false`.
The web build applies idempotent Neon migrations before validating and building
the application. Render uses `/api/live` for web liveness and `/health` for
coach liveness; dependency readiness remains available at `/api/health`.

Add `https://prepora-io.onrender.com` to the Google OAuth web client's authorized
JavaScript origins. Do not add paths or trailing slashes to that origin.

## Required external controls

1. Configure every variable checked by `npm run validate:production` in the
   hosting provider's encrypted secret manager.
2. Create the Neon production database, use its pooled connection string for
   `DATABASE_URL`, and run `npm run db:migrate` before deploying the web app.
3. Enable scheduled Neon backups and point-in-time recovery, then complete a restore drill before
   launch. Record the recovery time and the person responsible for restores.
4. Restrict the deployed Python service to the web service's network when the
   host supports private networking. Keep `INTERNAL_SERVICE_KEY` enabled even
   on a private network.
5. Connect an OTLP-compatible observability destination, configure uptime
   checks against `/api/health`, and alert on HTTP 5xx rate, latency, quota
   exhaustion, and provider failures.
6. Configure billing budgets and hard provider quotas for Google Cloud,
   Gemini, Neon, Vapi, the web host, and the Python host.
7. Add the production domain to Google OAuth authorized origins, Vapi's web
   allowlist, and `NEXT_PUBLIC_APP_URL`.
8. Fill in the real legal operator, jurisdiction, support email, and privacy
   email, then have the Terms and Privacy Notice reviewed for launch regions.

## Database maintenance

Schedule cleanup jobs for expired `auth_sessions`, `rate_limits`, and
`account_deletion_requests` rows. Monitor connection saturation and use the
Neon pooled connection string in serverless deployments.

## Release gate

Run:

```text
npm ci
npm run db:migrate
npm run db:check
npm run lint
npm run typecheck
npm test
npm run audit:production
npm run validate:production
npm run build
python -m pip_audit -r python-backend/requirements.txt
python -m pytest python-backend/tests
```

Do not deploy if any command fails. Deploy to staging first, complete sign-in,
resume sharing, microphone denial, account deletion, coach availability, and
rollback smoke tests, then promote the same tested revision to production.
