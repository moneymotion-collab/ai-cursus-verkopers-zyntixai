import { z } from "zod";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const emailSchema = z
  .string({ required_error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email must be at most 254 characters.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const forgotPasswordInputSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export function parseForgotPasswordInput(input: unknown) {
  return forgotPasswordInputSchema.safeParse(input);
}

const passwordField = z
  .string({ required_error: "Password is required." })
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`)
  .refine((value) => value.trim().length > 0, {
    message: "Password cannot be only whitespace.",
  })
  .superRefine((value, ctx) => {
    if (CONTROL_CHARS.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password contains invalid characters.",
      });
    }
  });

export const resetPasswordInputSchema = z
  .object({
    password: passwordField,
    confirmPassword: z
      .string({ required_error: "Confirm your password." })
      .min(1, "Confirm your password."),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export function parseResetPasswordInput(input: unknown) {
  return resetPasswordInputSchema.safeParse(input);
}
