import { z } from "zod";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

function rejectControlChars(value: string, message: string) {
  if (CONTROL_CHARS.test(value)) {
    return { message };
  }
  return null;
}

export const registerInputSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required." })
      .trim()
      .min(1, "Name is required.")
      .max(80, "Name must be at most 80 characters.")
      .superRefine((value, ctx) => {
        const control = rejectControlChars(value, "Name contains invalid characters.");
        if (control) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: control.message });
        }
      }),
    email: z
      .string({ required_error: "Email is required." })
      .trim()
      .min(1, "Email is required.")
      .max(254, "Email must be at most 254 characters.")
      .email("Enter a valid email address.")
      .transform((value) => value.toLowerCase()),
    password: z
      .string({ required_error: "Password is required." })
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters.")
      .refine((value) => value.trim().length > 0, {
        message: "Password cannot be only whitespace.",
      }),
    companyName: z
      .string({ required_error: "Company name is required." })
      .trim()
      .min(2, "Company name must be at least 2 characters.")
      .max(100, "Company name must be at most 100 characters.")
      .superRefine((value, ctx) => {
        const control = rejectControlChars(
          value,
          "Company name contains invalid characters.",
        );
        if (control) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: control.message });
        }
      }),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerInputSchema>;

export function parseRegisterInput(input: unknown) {
  return registerInputSchema.safeParse(input);
}

/** Optional email for verification resend when no Auth session exists yet. */
export const resendVerificationInputSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required." })
      .trim()
      .min(1, "Email is required.")
      .max(254, "Email must be at most 254 characters.")
      .email("Enter a valid email address.")
      .transform((value) => value.toLowerCase()),
  })
  .strict();

export function parseResendVerificationInput(input: unknown) {
  return resendVerificationInputSchema.safeParse(input);
}
