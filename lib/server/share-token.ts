import { createHash, randomBytes, timingSafeEqual } from "crypto";

const resumeIdPattern = /^[a-zA-Z0-9_-]{8,128}$/;

export function createResumeShareToken(resumeId: string) {
  if (!resumeIdPattern.test(resumeId)) {
    throw new Error("Invalid resume identifier.");
  }
  return `${resumeId}.${randomBytes(24).toString("base64url")}`;
}

export function parseResumeShareToken(token: string) {
  if (token.length < 40 || token.length > 400) return null;
  const separator = token.indexOf(".");
  if (separator < 8) return null;
  const resumeId = token.slice(0, separator);
  const secret = token.slice(separator + 1);
  return resumeIdPattern.test(resumeId) && secret.length >= 32 ? { resumeId, secret } : null;
}

export function hashResumeShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyResumeShareToken(token: string, expectedHash: string) {
  if (!/^[0-9a-f]{64}$/i.test(expectedHash)) return false;
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hashResumeShareToken(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
