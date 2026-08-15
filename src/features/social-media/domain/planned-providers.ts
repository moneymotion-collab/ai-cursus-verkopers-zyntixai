/**
 * Universal Social OS — planned providers vs implemented providers (SMM-B1.1-D).
 *
 * Planned ≠ enabled ≠ implemented.
 * Adding a planned name must not enable connections, OAuth, or DB CHECKs.
 * Runtime connect path remains IMPLEMENTED_SOCIAL_PROVIDERS only.
 */

/**
 * Full Beta-horizon provider family for architecture and roadmap planning.
 * Includes families already catalogued in A plus Threads and Pinterest.
 */
export const PLANNED_SOCIAL_PROVIDERS = [
  "instagram",
  "facebook",
  "threads",
  "tiktok",
  "linkedin",
  "youtube",
  "pinterest",
  "x",
] as const;

export type PlannedSocialProvider = (typeof PLANNED_SOCIAL_PROVIDERS)[number];

export const SOCIAL_PROVIDER_ROLLOUT_WAVES = {
  provider_1: ["instagram"],
  wave_2: ["facebook", "threads"],
  wave_3: ["tiktok"],
  wave_4: ["linkedin"],
  wave_5: ["youtube"],
  wave_6: ["pinterest", "x"],
} as const;

export type SocialProviderRolloutWave =
  keyof typeof SOCIAL_PROVIDER_ROLLOUT_WAVES;

export function isPlannedSocialProvider(
  value: string,
): value is PlannedSocialProvider {
  return (PLANNED_SOCIAL_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Login-product is provider-authorization-product, not a universal requirement.
 * Instagram uses `instagram_login`. Future providers may use a different product
 * or none. Never assume every provider has an Instagram-style login product.
 */
export type SocialAuthorizationProduct =
  | "instagram_login"
  | "facebook_login"
  | "provider_native_oauth"
  | "provider_native_api_key"
  | "unspecified";
