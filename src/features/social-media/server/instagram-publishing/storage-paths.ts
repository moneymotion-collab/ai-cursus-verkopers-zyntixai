/**
 * Path-safe Social media object keys for private provider delivery (SMM-B1.7-R1).
 */

import "server-only";

/**
 * Reject traversal / absolute / empty keys.
 * Allowed shape: org-scoped relative keys with safe charset.
 */
export function isSafeSocialMediaStorageObjectKey(key: string): boolean {
  const trimmed = key.trim();
  if (trimmed.length === 0 || trimmed.length > 512) {
    return false;
  }
  if (trimmed !== key) {
    return false;
  }
  if (trimmed.startsWith("/") || trimmed.includes("\\")) {
    return false;
  }
  if (trimmed.includes("..")) {
    return false;
  }
  if (!/^[a-zA-Z0-9/_.\-]+$/.test(trimmed)) {
    return false;
  }
  return true;
}

export const SOCIAL_MEDIA_PRIVATE_BUCKET_ID = "zyntix-social-media" as const;
