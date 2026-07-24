import assert from "node:assert/strict";
import test from "node:test";

import { generatedQuestionsSchema } from "../lib/validations/interview.ts";

const questions = [
  "How would you diagnose a slow production request?",
  "Describe a tradeoff you made while designing an API.",
  "How do you keep a technical migration safe and observable?",
];

test("accepts the requested object-shaped Gemini response", () => {
  assert.deepEqual(generatedQuestionsSchema.parse({ questions }), { questions });
});

test("normalizes an array-shaped Gemini response", () => {
  assert.deepEqual(generatedQuestionsSchema.parse(questions), { questions });
});
