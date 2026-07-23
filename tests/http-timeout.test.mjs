import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "../lib/server/http.ts";

test("returns a successful upstream response before the deadline", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    assert.equal(init.signal.aborted, false);
    return new Response("ready", { status: 200 });
  };

  try {
    const response = await fetchWithTimeout(
      "https://service.invalid/health",
      {},
      50
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "ready");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("throws RequestTimeoutError when the upstream deadline expires", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true }
      );
    });

  try {
    await assert.rejects(
      fetchWithTimeout("https://service.invalid/slow", {}, 5),
      (error) => error instanceof RequestTimeoutError
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves a caller-requested abort instead of reporting a timeout", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true }
      );
    });
  const controller = new AbortController();

  try {
    const request = fetchWithTimeout(
      "https://service.invalid/cancelled",
      { signal: controller.signal },
      100
    );
    controller.abort();
    await assert.rejects(
      request,
      (error) =>
        error instanceof DOMException &&
        error.name === "AbortError" &&
        !(error instanceof RequestTimeoutError)
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
