/**
 * Instagram professional account types in first-provider scope.
 * Personal accounts are outside OD-SMM-1.
 */

export const INSTAGRAM_PROFESSIONAL_ACCOUNT_TYPES = [
  "business",
  "creator",
] as const;

export type InstagramProfessionalAccountType =
  (typeof INSTAGRAM_PROFESSIONAL_ACCOUNT_TYPES)[number];

export type RawInstagramAccountType = string;

export function isInstagramProfessionalAccountType(
  value: string,
): value is InstagramProfessionalAccountType {
  return (INSTAGRAM_PROFESSIONAL_ACCOUNT_TYPES as readonly string[]).includes(
    value,
  );
}

export function normalizeInstagramProfessionalAccountType(
  raw: RawInstagramAccountType | null | undefined,
): InstagramProfessionalAccountType | null {
  if (raw == null) {
    return null;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "business") {
    return "business";
  }
  if (normalized === "creator" || normalized === "media_creator") {
    return "creator";
  }
  return null;
}

export function isSupportedInstagramProfessionalAccount(
  raw: RawInstagramAccountType | null | undefined,
): boolean {
  return normalizeInstagramProfessionalAccountType(raw) !== null;
}
