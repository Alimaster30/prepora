const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
  "NEXT_PUBLIC_PRIVACY_EMAIL",
  "NEXT_PUBLIC_LEGAL_NAME",
  "NEXT_PUBLIC_LEGAL_JURISDICTION",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_VAPI_WEB_TOKEN",
  "NEXT_PUBLIC_VAPI_WORKFLOW_ID",
  "DATABASE_URL",
  "GEMINI_API_KEY",
  "PYTHON_API_URL",
  "INTERNAL_SERVICE_KEY",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing required production configuration: ${missing.join(", ")}`);
  process.exit(1);
}

const origin = new URL(process.env.NEXT_PUBLIC_APP_URL);
if (origin.protocol !== "https:" && origin.hostname !== "localhost") {
  console.error("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
  process.exit(1);
}

if (process.env.INTERNAL_SERVICE_KEY.length < 32) {
  console.error("INTERNAL_SERVICE_KEY must contain at least 32 characters.");
  process.exit(1);
}

const databaseUrl = new URL(process.env.DATABASE_URL);
if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
  console.error("DATABASE_URL must be a PostgreSQL connection string.");
  process.exit(1);
}

console.log("Production environment validation passed.");
