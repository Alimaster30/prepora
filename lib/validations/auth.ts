import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.")
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Use no more than 128 characters.");

export const passwordSignInSchema = z.object({
  email,
  password,
});

export const passwordSignUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your name.")
      .max(100, "Use no more than 100 characters."),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type PasswordSignInInput = z.input<typeof passwordSignInSchema>;
export type PasswordSignUpInput = z.input<typeof passwordSignUpSchema>;
