import {
  archiveCustomerInputSchema,
  createCustomerInputSchema,
  restoreCustomerInputSchema,
  transitionCustomerStatusInputSchema,
  updateCustomerProfileInputSchema,
} from "@/features/customers/validation/mutation-schemas";

export function parseCreateCustomerActionInput(input: unknown) {
  return createCustomerInputSchema.safeParse(input);
}

export function parseUpdateCustomerProfileActionInput(input: unknown) {
  return updateCustomerProfileInputSchema.safeParse(input);
}

export function parseTransitionCustomerStatusActionInput(input: unknown) {
  return transitionCustomerStatusInputSchema.safeParse(input);
}

export function parseArchiveCustomerActionInput(input: unknown) {
  return archiveCustomerInputSchema.safeParse(input);
}

export function parseRestoreCustomerActionInput(input: unknown) {
  return restoreCustomerInputSchema.safeParse(input);
}
