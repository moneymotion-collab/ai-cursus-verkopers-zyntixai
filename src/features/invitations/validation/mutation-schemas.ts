import { z } from "zod";
import { ORGANIZATION_INVITATION_TARGET_ROLES } from "@/features/invitations/domain/permissions";
import { normalizeOrganizationInvitationEmail } from "@/features/invitations/domain/email";

const uuidSchema = z.string().uuid();

/**
 * Create-invitation input schema.
 * Email: trim + lowercase via shared domain normalizer, then email validity.
 * Actor identity/role/status fields are intentionally absent (server-derived later).
 */
export const createOrganizationInvitationInputSchema = z
  .object({
    organizationId: uuidSchema,
    email: z
      .string({ required_error: "Email is required." })
      .min(1, "Email is required.")
      .max(254, "Email must be at most 254 characters.")
      .transform((value) => normalizeOrganizationInvitationEmail(value))
      .refine((value) => value.length > 0, {
        message: "Email is required.",
      })
      .refine((value) => z.string().email().safeParse(value).success, {
        message: "Enter a valid email address.",
      }),
    targetRole: z.enum(ORGANIZATION_INVITATION_TARGET_ROLES, {
      errorMap: () => ({ message: "Select a valid invitation role." }),
    }),
  })
  .strict();

export type CreateOrganizationInvitationInput = z.infer<
  typeof createOrganizationInvitationInputSchema
>;

export function validateCreateOrganizationInvitationInput(input: unknown) {
  return createOrganizationInvitationInputSchema.safeParse(input);
}

/**
 * Manage (resend/revoke) action input.
 * Client identifies the row by invitation id; organization id is re-verified
 * against active membership and is never sole authority.
 * Target email/role/status/token fields are intentionally absent.
 */
export const manageOrganizationInvitationInputSchema = z
  .object({
    organizationId: uuidSchema,
    invitationId: uuidSchema,
  })
  .strict();

export type ManageOrganizationInvitationInput = z.infer<
  typeof manageOrganizationInvitationInputSchema
>;

export function validateManageOrganizationInvitationInput(input: unknown) {
  return manageOrganizationInvitationInputSchema.safeParse(input);
}
