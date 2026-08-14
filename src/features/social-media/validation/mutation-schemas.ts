import { z } from "zod";
import { IMPLEMENTED_SOCIAL_PROVIDERS } from "@/features/social-media/domain/provider";
import { SOCIAL_OAUTH_RETURN_PATH_IDS } from "@/features/social-media/domain/oauth-intent";

const uuidSchema = z.string().uuid();

/**
 * Start-connect input. Browser-controlled fields are minimal.
 * Organization, actor, credentials, scopes, callback URL, and external
 * account identity are intentionally absent (server-derived later).
 */
export const socialConnectRequestSchema = z
  .object({
    workspaceId: uuidSchema,
    provider: z.enum(IMPLEMENTED_SOCIAL_PROVIDERS, {
      errorMap: () => ({ message: "Select a supported social provider." }),
    }),
  })
  .strict();

export type SocialConnectRequestInput = z.infer<typeof socialConnectRequestSchema>;

export function validateSocialConnectRequest(input: unknown) {
  return socialConnectRequestSchema.safeParse(input);
}

/**
 * Disconnect input. Client identifies the connection only.
 * Organization id, external account id, and credentials are not accepted.
 */
export const socialDisconnectRequestSchema = z
  .object({
    connectionId: uuidSchema,
  })
  .strict();

export type SocialDisconnectRequestInput = z.infer<
  typeof socialDisconnectRequestSchema
>;

export function validateSocialDisconnectRequest(input: unknown) {
  return socialDisconnectRequestSchema.safeParse(input);
}

/**
 * Reauthorization input. Same identity boundary as disconnect:
 * connection id only. Server re-reads the connection and preserves
 * expected external account identity.
 */
export const socialReauthorizeRequestSchema = z
  .object({
    connectionId: uuidSchema,
  })
  .strict();

export type SocialReauthorizeRequestInput = z.infer<
  typeof socialReauthorizeRequestSchema
>;

export function validateSocialReauthorizeRequest(input: unknown) {
  return socialReauthorizeRequestSchema.safeParse(input);
}

export const socialOAuthReturnPathIdSchema = z.enum(SOCIAL_OAUTH_RETURN_PATH_IDS);

export function validateSocialOAuthReturnPathId(input: unknown) {
  return socialOAuthReturnPathIdSchema.safeParse(input);
}

export const implementedSocialProviderSchema = z.enum(
  IMPLEMENTED_SOCIAL_PROVIDERS,
);

export function validateImplementedSocialProvider(input: unknown) {
  return implementedSocialProviderSchema.safeParse(input);
}
