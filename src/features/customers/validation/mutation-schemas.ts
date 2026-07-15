import { z } from "zod";
import { CUSTOMER_STATUSES } from "@/features/customers/domain/status";

const uuidSchema = z.string().uuid();

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    });

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : null;
  })
  .refine((value) => value === null || z.string().email().safeParse(value).success, {
    message: "Enter a valid email address.",
  });

export const createCustomerInputSchema = z
  .object({
    organizationId: uuidSchema,
    displayName: z.string().trim().min(1, "Display name is required.").max(200),
    firstName: optionalTrimmedString(200),
    lastName: optionalTrimmedString(200),
    email: optionalEmail,
    phone: optionalTrimmedString(50),
    ownerMemberId: uuidSchema.optional().nullable(),
  })
  .strict();

export const updateCustomerProfileInputSchema = z
  .object({
    organizationId: uuidSchema,
    customerId: uuidSchema,
    displayName: z.string().trim().min(1, "Display name is required.").max(200),
    firstName: optionalTrimmedString(200),
    lastName: optionalTrimmedString(200),
    email: optionalEmail,
    phone: optionalTrimmedString(50),
    ownerMemberId: uuidSchema.optional().nullable(),
  })
  .strict();

export const transitionCustomerStatusInputSchema = z
  .object({
    organizationId: uuidSchema,
    customerId: uuidSchema,
    toStatus: z.enum(CUSTOMER_STATUSES),
    reason: optionalTrimmedString(500),
  })
  .strict();

export const archiveCustomerInputSchema = z
  .object({
    organizationId: uuidSchema,
    customerId: uuidSchema,
  })
  .strict();

export const restoreCustomerInputSchema = archiveCustomerInputSchema;

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;
export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileInputSchema>;
export type TransitionCustomerStatusInput = z.infer<typeof transitionCustomerStatusInputSchema>;
export type ArchiveCustomerInput = z.infer<typeof archiveCustomerInputSchema>;
export type RestoreCustomerInput = z.infer<typeof restoreCustomerInputSchema>;

export function validateCreateCustomerInput(input: unknown) {
  return createCustomerInputSchema.safeParse(input);
}

export function validateUpdateCustomerProfileInput(input: unknown) {
  return updateCustomerProfileInputSchema.safeParse(input);
}

export function validateTransitionCustomerStatusInput(input: unknown) {
  return transitionCustomerStatusInputSchema.safeParse(input);
}

export function validateArchiveCustomerInput(input: unknown) {
  return archiveCustomerInputSchema.safeParse(input);
}

export function validateRestoreCustomerInput(input: unknown) {
  return restoreCustomerInputSchema.safeParse(input);
}
