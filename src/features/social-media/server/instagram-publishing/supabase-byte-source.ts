/**
 * Narrow Supabase Storage download for Instagram provider delivery (SMM-B1.7-R1).
 *
 * Uses SOCIAL_PRIVATE_MEDIA_STORAGE_KEY ONLY for private-bucket object download
 * after HMAC validation. Never used for Social Publication RPCs, attempt
 * completion, or credential mutation.
 */

import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SocialMediaByteSource } from "@/features/social-media/server/instagram-publishing/media-delivery";
import {
  isSafeSocialMediaStorageObjectKey,
  SOCIAL_MEDIA_PRIVATE_BUCKET_ID,
} from "@/features/social-media/server/instagram-publishing/storage-paths";

export const SOCIAL_PRIVATE_MEDIA_STORAGE_KEY_ENV =
  "SOCIAL_PRIVATE_MEDIA_STORAGE_KEY" as const;

function readPrivateMediaStorageKey(
  env: Record<string, string | undefined>,
): string | null {
  const value = env[SOCIAL_PRIVATE_MEDIA_STORAGE_KEY_ENV]?.trim();
  if (!value || value.length < 20) {
    return null;
  }
  return value;
}

function readSupabaseUrl(
  env: Record<string, string | undefined>,
): string | null {
  const value =
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() || env.SUPABASE_URL?.trim();
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      if (parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1") {
        return null;
      }
    }
    return value;
  } catch {
    return null;
  }
}

/**
 * Production byte source: private bucket download after path safety checks.
 * Fail-closed when private media storage key / URL missing.
 */
export function createSupabaseSocialMediaByteSource(
  env: Record<string, string | undefined> = process.env,
): SocialMediaByteSource {
  return {
    async getObject(input) {
      if (!isSafeSocialMediaStorageObjectKey(input.storageObjectKey)) {
        return { ok: false, reason: "forbidden" };
      }
      // Tenant binding: object key must be prefixed with organization id segment.
      if (!input.storageObjectKey.startsWith(`${input.organizationId}/`)) {
        return { ok: false, reason: "forbidden" };
      }

      const url = readSupabaseUrl(env);
      const key = readPrivateMediaStorageKey(env);
      if (!url || !key) {
        return { ok: false, reason: "unavailable" };
      }

      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const downloaded = await client.storage
        .from(SOCIAL_MEDIA_PRIVATE_BUCKET_ID)
        .download(input.storageObjectKey);

      if (downloaded.error || !downloaded.data) {
        return { ok: false, reason: "not_found" };
      }

      const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
      const contentType =
        downloaded.data.type && downloaded.data.type.length > 0
          ? downloaded.data.type
          : "application/octet-stream";

      return { ok: true, bytes, contentType };
    },
  };
}
