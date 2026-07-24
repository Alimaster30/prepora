import { z } from "zod";

const generatedQuestionSchema = z.string().trim().min(10).max(1_000);

export const generatedQuestionsSchema = z
  .union([
    z.object({
      questions: z.array(generatedQuestionSchema).min(3).max(10),
    }),
    z.array(generatedQuestionSchema).min(3).max(10),
  ])
  .transform(
    (value): { questions: string[] } => ({
      questions: Array.isArray(value) ? value : value.questions,
    })
  );
