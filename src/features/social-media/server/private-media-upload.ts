/**
 * Upload JPEG bytes to the private Social media bucket (B1.8).
 * Uses SOCIAL_PRIVATE_MEDIA_STORAGE_KEY — never for Social Publication RPCs.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  isSafeSocialMediaStorageObjectKey,
  SOCIAL_MEDIA_PRIVATE_BUCKET_ID,
} from "@/features/social-media/server/instagram-publishing/storage-paths";
import { SOCIAL_PRIVATE_MEDIA_STORAGE_KEY_ENV } from "@/features/social-media/server/instagram-publishing/supabase-byte-source";
import {
  isJpegMagic,
  isValidInstagramFeedImageDimensions,
  readJpegDimensions,
} from "@/features/social-media/server/jpeg-dimensions";

const MIN_BYTES = 1;
const MAX_BYTES = 8 * 1024 * 1024;

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

export type PrivateMediaUploadSuccess = {
  ok: true;
  storageObjectKey: string;
  byteSize: number;
  widthPx: number;
  heightPx: number;
  mimeType: "image/jpeg";
};

export type PrivateMediaUploadFailure = {
  ok: false;
  reason:
    | "invalid_jpeg"
    | "invalid_dimensions"
    | "invalid_size"
    | "unsafe_key"
    | "configuration_error"
    | "upload_failed";
};

export async function uploadPrivateSocialJpeg(input: {
  organizationId: string;
  bytes: Uint8Array;
  widthPx?: number;
  heightPx?: number;
  env?: Record<string, string | undefined>;
}): Promise<PrivateMediaUploadSuccess | PrivateMediaUploadFailure> {
  const env = input.env ?? process.env;
  const organizationId = input.organizationId.trim();
  if (!organizationId || input.bytes.length < MIN_BYTES || input.bytes.length > MAX_BYTES) {
    return { ok: false, reason: "invalid_size" };
  }
  if (!isJpegMagic(input.bytes)) {
    return { ok: false, reason: "invalid_jpeg" };
  }

  let width = input.widthPx;
  let height = input.heightPx;
  if (
    width == null ||
    height == null ||
    !Number.isInteger(width) ||
    !Number.isInteger(height)
  ) {
    const dims = readJpegDimensions(input.bytes);
    if (!dims) {
      return { ok: false, reason: "invalid_jpeg" };
    }
    width = dims.width;
    height = dims.height;
  }

  if (!isValidInstagramFeedImageDimensions(width, height)) {
    return { ok: false, reason: "invalid_dimensions" };
  }

  const storageObjectKey = `${organizationId}/b18/${randomUUID()}.jpg`;
  if (
    !isSafeSocialMediaStorageObjectKey(storageObjectKey) ||
    !storageObjectKey.startsWith(`${organizationId}/`)
  ) {
    return { ok: false, reason: "unsafe_key" };
  }

  const url = readSupabaseUrl(env);
  const key = readPrivateMediaStorageKey(env);
  if (!url || !key) {
    return { ok: false, reason: "configuration_error" };
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const uploaded = await client.storage
    .from(SOCIAL_MEDIA_PRIVATE_BUCKET_ID)
    .upload(storageObjectKey, input.bytes, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploaded.error) {
    return { ok: false, reason: "upload_failed" };
  }

  return {
    ok: true,
    storageObjectKey,
    byteSize: input.bytes.length,
    widthPx: width,
    heightPx: height,
    mimeType: "image/jpeg",
  };
}
