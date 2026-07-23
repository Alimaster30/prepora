import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeResumeHtml } from "../lib/security/sanitize-rich-html.ts";

test("resume HTML keeps formatting and removes executable content", () => {
  const dirty =
    '<p onclick="alert(1)">Built <strong>APIs</strong></p>' +
    '<img src=x onerror="alert(2)"><script>alert(3)</script>' +
    '<a href="javascript:alert(4)">unsafe</a>';
  const clean = sanitizeResumeHtml(dirty);

  assert.equal(clean.includes("onclick"), false);
  assert.equal(clean.includes("onerror"), false);
  assert.equal(clean.includes("<script"), false);
  assert.equal(clean.includes("<img"), false);
  assert.equal(clean.includes("<a"), false);
  assert.match(clean, /<strong>APIs<\/strong>/);
});

test("resume HTML removes SVG and embedded objects", () => {
  const clean = sanitizeResumeHtml(
    '<svg><a><animate attributeName="href"></animate></a></svg><iframe src="https://example.com"></iframe><object></object>'
  );
  assert.equal(clean, "");
});
