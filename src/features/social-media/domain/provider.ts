/**
 * Known provider family vs implemented/connectable provider.
 * Adding a family name must not enable connections.
 */

export const KNOWN_SOCIAL_PROVIDER_FAMILIES = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
  "youtube",
  "x",
] as const;

export type KnownSocialProviderFamily =
  (typeof KNOWN_SOCIAL_PROVIDER_FAMILIES)[number];

/**
 * First implemented Social Media provider (OD-SMM-1).
 * Unsupported providers are unrepresentable here.
 */
export const IMPLEMENTED_SOCIAL_PROVIDERS = ["instagram"] as const;

export type ImplementedSocialProvider =
  (typeof IMPLEMENTED_SOCIAL_PROVIDERS)[number];

export type SocialProvider = ImplementedSocialProvider;

export function isKnownSocialProviderFamily(
  value: string,
): value is KnownSocialProviderFamily {
  return (KNOWN_SOCIAL_PROVIDER_FAMILIES as readonly string[]).includes(value);
}

export function isImplementedSocialProvider(
  value: string,
): value is ImplementedSocialProvider {
  return (IMPLEMENTED_SOCIAL_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Connectable provider authorization is NOT "exists in a union".
 * Must be implemented AND later pass fail-closed feature gates.
 */
export function isConnectionEnabledSocialProvider(
  value: string,
  connectionsEnabled: boolean,
  providerEnabled: boolean,
): value is ImplementedSocialProvider {
  return (
    isImplementedSocialProvider(value) &&
    connectionsEnabled === true &&
    providerEnabled === true
  );
}
