"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canManageSocialConnections } from "@/features/social-media/domain/permissions";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";
import { executeB18ImagePublication } from "@/features/social-media/server/b18-execute-image-publication";
import { assertClosedBetaPublishAllowed } from "@/features/social-media/server/social-closed-beta-enrollment";
import { assertControlledPublishWindowBinding } from "@/features/social-media/server/controlled-publish-window";
import {
  CONTROLLED_WINDOW_EXHAUSTED,
  PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW,
} from "@/features/social-media/domain/controlled-publish-window";

export type ExecuteB18InstagramImagePublicationActionResult =
  | {
      ok: true;
      publicationId: string;
      attemptId: string;
      outcome:
        | "succeeded"
        | "failed_retryable"
        | "failed_terminal"
        | "unknown_external_outcome";
      externalPublicationIdPresent: boolean;
    }
  | {
      ok: false;
      code:
        | "feature_disabled"
        | "unauthorized"
        | "forbidden"
        | "invalid_request"
        | "not_found"
        | "conflict"
        | "stale_claim"
        | "none_due"
        | "credential_unavailable"
        | "closed_beta_not_enrolled"
        | "closed_beta_paused"
        | "closed_beta_revoked"
        | "closed_beta_publish_not_allowed"
        | "publication_not_authorized_for_window"
        | "controlled_window_exhausted"
        | "internal_error";
    };

/**
 * Owner/Admin execute path. Fail-closed unless SOCIAL_PUBLISHING_ENABLED=true.
 */
export async function executeB18InstagramImagePublicationAction(input: {
  organizationId: string;
  publicationId: string;
}): Promise<ExecuteB18InstagramImagePublicationActionResult> {
  if (!isSocialInstagramConnectionsFeatureEnabled()) {
    return { ok: false, code: "feature_disabled" };
  }
  if (!isSocialPublishingFeatureEnabled()) {
    return { ok: false, code: "feature_disabled" };
  }

  const organizationId = input.organizationId?.trim();
  const publicationId = input.publicationId?.trim();
  if (!organizationId || !publicationId) {
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

  const publishEntitlement = await assertClosedBetaPublishAllowed(
    supabase,
    orgContext.context.organizationId,
  );
  if (!publishEntitlement.ok) {
    if (
      publishEntitlement.code === "closed_beta_not_enrolled" ||
      publishEntitlement.code === "closed_beta_paused" ||
      publishEntitlement.code === "closed_beta_revoked" ||
      publishEntitlement.code === "closed_beta_publish_not_allowed" ||
      publishEntitlement.code === "forbidden"
    ) {
      return { ok: false, code: publishEntitlement.code };
    }
    return { ok: false, code: "internal_error" };
  }

  const windowBinding = await assertControlledPublishWindowBinding(
    supabase,
    orgContext.context.organizationId,
    publicationId,
  );
  if (!windowBinding.ok) {
    if (
      windowBinding.code === PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW ||
      windowBinding.code === CONTROLLED_WINDOW_EXHAUSTED ||
      windowBinding.code === "forbidden"
    ) {
      return { ok: false, code: windowBinding.code };
    }
    return { ok: false, code: "internal_error" };
  }

  const result = await executeB18ImagePublication(supabase, {
    organizationId: orgContext.context.organizationId,
    publicationId,
  });

  if (!result.ok) {
    switch (result.reason) {
      case "feature_disabled":
      case "forbidden":
      case "not_found":
      case "conflict":
      case "stale_claim":
      case "none_due":
      case "credential_unavailable":
      case "closed_beta_not_enrolled":
      case "closed_beta_paused":
      case "closed_beta_revoked":
      case "closed_beta_publish_not_allowed":
      case "publication_not_authorized_for_window":
      case "controlled_window_exhausted":
        return { ok: false, code: result.reason };
      case "invalid_input":
        return { ok: false, code: "invalid_request" };
      default:
        return { ok: false, code: "internal_error" };
    }
  }

  return {
    ok: true,
    publicationId: result.publicationId,
    attemptId: result.attemptId,
    outcome: result.outcome,
    externalPublicationIdPresent: result.externalPublicationIdPresent,
  };
}
