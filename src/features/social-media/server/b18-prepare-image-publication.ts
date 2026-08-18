/**
 * B1.8 prepare pipeline: upload JPEG + content/variant/version/approval/publication.
 * Does not enable SOCIAL_PUBLISHING_ENABLED and never calls Meta.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  B18_CONTENT_ITEM_TITLE,
  B18_CONTROLLED_IMAGE_CAPTION,
} from "@/features/social-media/domain/b18-publish-navigation";
import { uploadPrivateSocialJpeg } from "@/features/social-media/server/private-media-upload";

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

function firstRow(data: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  return candidate as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export type PrepareB18ImagePublicationSuccess = {
  ok: true;
  publicationId: string;
  connectionId: string;
  contentId: string;
  variantId: string;
  variantVersionId: string;
  assetId: string;
  brandId: string;
  workspaceId: string;
};

export type PrepareB18ImagePublicationFailure = {
  ok: false;
  reason:
    | "invalid_input"
    | "invalid_jpeg"
    | "invalid_dimensions"
    | "invalid_size"
    | "forbidden"
    | "not_found"
    | "conflict"
    | "workflow_not_ready"
    | "connection_ineligible"
    | "capability_missing"
    | "configuration_error"
    | "transport_error"
    | "unexpected";
};

async function rpcRow(
  client: RpcCapableClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; reason: "transport_error" }
> {
  try {
    const { data, error } = await client.rpc(fn, args);
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    if (!row) {
      return { ok: false, reason: "transport_error" };
    }
    return { ok: true, row };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

function mapResultCode(
  code: string | null,
): PrepareB18ImagePublicationFailure["reason"] {
  switch (code) {
    case "invalid_input":
    case "forbidden":
    case "not_found":
    case "conflict":
    case "workflow_not_ready":
    case "connection_ineligible":
    case "capability_missing":
      return code;
    default:
      return "unexpected";
  }
}

export async function prepareB18ImagePublication(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    brandId: string;
    workspaceId: string;
    connectionId: string;
    jpegBytes: Uint8Array;
    widthPx?: number;
    heightPx?: number;
    env?: Record<string, string | undefined>;
  },
): Promise<
  PrepareB18ImagePublicationSuccess | PrepareB18ImagePublicationFailure
> {
  const organizationId = input.organizationId.trim();
  const brandId = input.brandId.trim();
  const workspaceId = input.workspaceId.trim();
  const connectionId = input.connectionId.trim();
  if (!organizationId || !brandId || !workspaceId || !connectionId) {
    return { ok: false, reason: "invalid_input" };
  }

  const uploaded = await uploadPrivateSocialJpeg({
    organizationId,
    bytes: input.jpegBytes,
    widthPx: input.widthPx,
    heightPx: input.heightPx,
    env: input.env,
  });
  if (!uploaded.ok) {
    if (uploaded.reason === "upload_failed") {
      return { ok: false, reason: "configuration_error" };
    }
    if (uploaded.reason === "unsafe_key") {
      return { ok: false, reason: "unexpected" };
    }
    return { ok: false, reason: uploaded.reason };
  }

  const client = supabase as unknown as RpcCapableClient;

  const assetResult = await rpcRow(client, "register_social_media_asset", {
    p_organization_id: organizationId,
    p_brand_id: brandId,
    p_storage_object_key: uploaded.storageObjectKey,
    p_mime_type: uploaded.mimeType,
    p_media_category: "image",
    p_byte_size: uploaded.byteSize,
    p_width_px: uploaded.widthPx,
    p_height_px: uploaded.heightPx,
    p_duration_ms: null,
    p_checksum_sha256: null,
    p_processing_state: "ready",
    p_parent_asset_id: null,
    p_derivation_kind: null,
    p_alt_text: null,
    p_origin_kind: "human_created",
  });
  if (!assetResult.ok) {
    return assetResult;
  }
  if (asString(assetResult.row.result_code) !== "success") {
    return {
      ok: false,
      reason: mapResultCode(asString(assetResult.row.result_code)),
    };
  }
  const assetId = asString(assetResult.row.asset_id);
  if (!assetId) {
    return { ok: false, reason: "unexpected" };
  }

  const contentResult = await rpcRow(client, "create_social_content_item", {
    p_organization_id: organizationId,
    p_brand_id: brandId,
    p_internal_title: B18_CONTENT_ITEM_TITLE,
    p_concept_summary: null,
    p_primary_message: null,
    p_campaign_id: null,
    p_primary_pillar_id: null,
    p_origin_kind: "human_created",
    p_source_content_id: null,
    p_status: "draft",
  });
  if (!contentResult.ok) {
    return contentResult;
  }
  if (asString(contentResult.row.result_code) !== "success") {
    return {
      ok: false,
      reason: mapResultCode(asString(contentResult.row.result_code)),
    };
  }
  const contentId = asString(contentResult.row.content_id);
  if (!contentId) {
    return { ok: false, reason: "unexpected" };
  }

  const variantResult = await rpcRow(client, "create_social_content_variant", {
    p_organization_id: organizationId,
    p_content_id: contentId,
    p_planned_provider: "instagram",
    p_content_format: "image",
    p_title: B18_CONTENT_ITEM_TITLE,
    p_caption: B18_CONTROLLED_IMAGE_CAPTION,
    p_description: null,
    p_cta_text: null,
    p_hashtags: null,
    p_alt_text: null,
    p_provider_config: {},
    p_status: "draft",
  });
  if (!variantResult.ok) {
    return variantResult;
  }
  if (asString(variantResult.row.result_code) !== "success") {
    return {
      ok: false,
      reason: mapResultCode(asString(variantResult.row.result_code)),
    };
  }
  const variantId = asString(variantResult.row.variant_id);
  if (!variantId) {
    return { ok: false, reason: "unexpected" };
  }

  const attachResult = await rpcRow(
    client,
    "set_social_variant_media_attachments",
    {
      p_organization_id: organizationId,
      p_variant_id: variantId,
      p_attachments: [
        {
          asset_id: assetId,
          sort_order: 0,
          asset_role: "primary",
        },
      ],
    },
  );
  if (!attachResult.ok) {
    return attachResult;
  }
  if (asString(attachResult.row.result_code) !== "success") {
    return {
      ok: false,
      reason: mapResultCode(asString(attachResult.row.result_code)),
    };
  }

  const versionResult = await rpcRow(
    client,
    "create_social_content_variant_version",
    {
      p_organization_id: organizationId,
      p_variant_id: variantId,
      p_change_note: "B1.8 controlled IMAGE version",
    },
  );
  if (!versionResult.ok) {
    return versionResult;
  }
  if (asString(versionResult.row.result_code) !== "success") {
    return {
      ok: false,
      reason: mapResultCode(asString(versionResult.row.result_code)),
    };
  }
  const variantVersionId = asString(versionResult.row.version_id);
  if (!variantVersionId) {
    return { ok: false, reason: "unexpected" };
  }

  const approvalResult = await rpcRow(
    client,
    "submit_social_approval_decision",
    {
      p_organization_id: organizationId,
      p_variant_version_id: variantVersionId,
      p_decision: "approved",
      p_reason: "B1.8 controlled verification",
      p_review_request_id: null,
    },
  );
  if (!approvalResult.ok) {
    return approvalResult;
  }
  if (asString(approvalResult.row.result_code) !== "success") {
    return {
      ok: false,
      reason: mapResultCode(asString(approvalResult.row.result_code)),
    };
  }

  const readinessResult = await rpcRow(
    client,
    "evaluate_social_variant_version_workflow_readiness",
    {
      p_organization_id: organizationId,
      p_variant_version_id: variantVersionId,
    },
  );
  if (!readinessResult.ok) {
    return readinessResult;
  }
  if (asString(readinessResult.row.result_code) !== "success") {
    return {
      ok: false,
      reason: mapResultCode(asString(readinessResult.row.result_code)),
    };
  }
  if (asBoolean(readinessResult.row.workflow_ready) !== true) {
    return { ok: false, reason: "workflow_not_ready" };
  }

  const idempotencyKey = `b18_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const publicationResult = await rpcRow(client, "create_social_publication", {
    p_organization_id: organizationId,
    p_variant_version_id: variantVersionId,
    p_connection_id: connectionId,
    p_execution_mode: "immediate",
    p_schedule_slot_id: null,
    p_intended_execute_at: null,
    p_idempotency_key: idempotencyKey,
  });
  if (!publicationResult.ok) {
    return publicationResult;
  }
  if (asString(publicationResult.row.result_code) !== "success") {
    return {
      ok: false,
      reason: mapResultCode(asString(publicationResult.row.result_code)),
    };
  }
  const publicationId = asString(publicationResult.row.publication_id);
  if (!publicationId) {
    return { ok: false, reason: "unexpected" };
  }

  return {
    ok: true,
    publicationId,
    connectionId,
    contentId,
    variantId,
    variantVersionId,
    assetId,
    brandId,
    workspaceId,
  };
}
