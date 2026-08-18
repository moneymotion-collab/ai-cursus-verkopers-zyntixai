"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canManageSocialConnections } from "@/features/social-media/domain/permissions";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { listActiveSocialWorkspaces } from "@/features/social-media/server/list-social-workspaces";
import { listSocialAccountConnections } from "@/features/social-media/server/list-social-connections";
import { prepareB18ImagePublication } from "@/features/social-media/server/b18-prepare-image-publication";

export type PrepareB18InstagramImagePublicationActionResult =
  | {
      ok: true;
      publicationId: string;
      contentId: string;
      variantVersionId: string;
      assetId: string;
    }
  | {
      ok: false;
      code:
        | "feature_disabled"
        | "unauthorized"
        | "forbidden"
        | "invalid_request"
        | "invalid_jpeg"
        | "workspace_not_found"
        | "connection_not_found"
        | "workflow_not_ready"
        | "connection_ineligible"
        | "capability_missing"
        | "internal_error";
    };

/**
 * Owner/Admin prepare path: upload JPEG + materialize content/publication rows.
 * Does not enable SOCIAL_PUBLISHING_ENABLED and does not call Meta.
 */
export async function prepareB18InstagramImagePublicationAction(
  formData: FormData,
): Promise<PrepareB18InstagramImagePublicationActionResult> {
  if (!isSocialInstagramConnectionsFeatureEnabled()) {
    return { ok: false, code: "feature_disabled" };
  }

  const organizationId =
    typeof formData.get("organizationId") === "string"
      ? String(formData.get("organizationId")).trim()
      : "";
  const connectionId =
    typeof formData.get("connectionId") === "string"
      ? String(formData.get("connectionId")).trim()
      : "";
  const file = formData.get("file");
  if (!organizationId || !connectionId || !(file instanceof File)) {
    return { ok: false, code: "invalid_request" };
  }

  const supabase = await createSupabaseServerClient();
  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId,
  });
  if (!orgContext.ok) {
    if (orgContext.error.code === "AUTH_REQUIRED") {
      return { ok: false, code: "unauthorized" };
    }
    return { ok: false, code: "forbidden" };
  }
  if (!canManageSocialConnections(orgContext.context.role, "active")) {
    return { ok: false, code: "forbidden" };
  }

  const [workspacesResult, connectionsResult] = await Promise.all([
    listActiveSocialWorkspaces(supabase, orgContext.context.organizationId),
    listSocialAccountConnections(supabase, orgContext.context.organizationId),
  ]);
  if (!workspacesResult.ok || !connectionsResult.ok) {
    return { ok: false, code: "internal_error" };
  }

  const workspace = workspacesResult.workspaces[0];
  if (!workspace) {
    return { ok: false, code: "workspace_not_found" };
  }

  const connection = connectionsResult.connections.find(
    (row) =>
      row.id === connectionId &&
      row.provider === "instagram" &&
      row.status === "connected" &&
      row.capabilitySnapshot.includes("publish_image") &&
      !row.reauthorizationRequired,
  );
  if (!connection) {
    return { ok: false, code: "connection_not_found" };
  }
  if (connection.workspaceId !== workspace.id) {
    return { ok: false, code: "invalid_request" };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const prepared = await prepareB18ImagePublication(supabase, {
    organizationId: orgContext.context.organizationId,
    brandId: workspace.brandId,
    workspaceId: workspace.id,
    connectionId: connection.id,
    jpegBytes: buffer,
  });

  if (!prepared.ok) {
    switch (prepared.reason) {
      case "invalid_jpeg":
      case "invalid_dimensions":
      case "invalid_size":
        return { ok: false, code: "invalid_jpeg" };
      case "forbidden":
        return { ok: false, code: "forbidden" };
      case "workflow_not_ready":
        return { ok: false, code: "workflow_not_ready" };
      case "connection_ineligible":
        return { ok: false, code: "connection_ineligible" };
      case "capability_missing":
        return { ok: false, code: "capability_missing" };
      case "invalid_input":
        return { ok: false, code: "invalid_request" };
      default:
        return { ok: false, code: "internal_error" };
    }
  }

  return {
    ok: true,
    publicationId: prepared.publicationId,
    contentId: prepared.contentId,
    variantVersionId: prepared.variantVersionId,
    assetId: prepared.assetId,
  };
}
