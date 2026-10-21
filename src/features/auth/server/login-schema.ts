import { z } from "zod";

export const loginInputSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z
    .string({ required_error: "Password is required." })
    .min(1, "Password is required."),
  next: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export function parseLoginInput(input: unknown) {
  return loginInputSchema.safeParse(input);
}
