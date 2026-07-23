import assert from "node:assert/strict";
import test from "node:test";

import {
  createResumeShareToken,
  hashResumeShareToken,
  parseResumeShareToken,
  verifyResumeShareToken,
} from "../lib/server/share-token.ts";

test("creates an unguessable token bound to the resume id", () => {
  const token = createResumeShareToken("resume_12345678");
  const parsed = parseResumeShareToken(token);
  assert.equal(parsed?.resumeId, "resume_12345678");
  assert.ok((parsed?.secret.length ?? 0) >= 32);
});

test("accepts the original token and rejects a modified token", () => {
  const token = createResumeShareToken("resume_12345678");
  const hash = hashResumeShareToken(token);
  assert.equal(verifyResumeShareToken(token, hash), true);
  assert.equal(verifyResumeShareToken(`${token}x`, hash), false);
});

test("rejects malformed identifiers and token hashes", () => {
  assert.throws(() => createResumeShareToken("../private"));
  assert.equal(parseResumeShareToken("short"), null);
  assert.equal(verifyResumeShareToken("anything", "not-a-hash"), false);
});
