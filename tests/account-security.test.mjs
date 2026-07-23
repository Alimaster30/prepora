import assert from "node:assert/strict";
import test from "node:test";

import {
  getIdentityValidationError,
  RECENT_AUTH_WINDOW_SECONDS,
} from "../lib/server/account-security.ts";

const now = 2_000_000_000;

test("accepts a matching, verified, recently authenticated identity", () => {
  assert.equal(
    getIdentityValidationError(
      "user-1",
      { uid: "user-1", email_verified: true, auth_time: now - 30 },
      now
    ),
    null
  );
});

test("rejects a token belonging to another account", () => {
  assert.match(
    getIdentityValidationError(
      "user-1",
      { uid: "user-2", email_verified: true, auth_time: now },
      now
    ),
    /does not belong/
  );
});

test("rejects an unverified email", () => {
  assert.match(
    getIdentityValidationError(
      "user-1",
      { uid: "user-1", email_verified: false, auth_time: now },
      now
    ),
    /Verify your email/
  );
});

test("rejects stale and implausibly future authentication times", () => {
  assert.match(
    getIdentityValidationError(
      "user-1",
      {
        uid: "user-1",
        email_verified: true,
        auth_time: now - RECENT_AUTH_WINDOW_SECONDS - 1,
      },
      now
    ),
    /Sign in again/
  );
  assert.match(
    getIdentityValidationError(
      "user-1",
      { uid: "user-1", email_verified: true, auth_time: now + 61 },
      now
    ),
    /Sign in again/
  );
});
