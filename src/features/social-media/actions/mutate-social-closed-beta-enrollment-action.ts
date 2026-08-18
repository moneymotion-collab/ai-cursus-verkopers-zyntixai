"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SOCIAL_CLOSED_BETA_OPERATOR_ACTIONS,
  type SocialClosedBetaOperatorAction,
} from "@/features/social-media/domain/closed-beta-enrollment";
import {
  buildSocialClosedBetaOperatorDetailHref,
  SOCIAL_CLOSED_BETA_OPERATOR_ROUTE,
} from "@/features/social-media/domain/platform-operator-navigation";
import { mutateOperatorClosedBetaEnrollment } from "@/features/social-media/server/platform-closed-beta-operator";
import { resolvePlatformClosedBetaOperatorSession } from "@/features/social-media/server/platform-operator-session";

export type OperatorClosedBetaMutationActionResult =
  | {
      ok: true;
      previousStatus: string | null;
      nextStatus: string;
    }
  | {
      ok: false;
      code:
        | "unauthorized"
        | "forbidden"
        | "invalid_request"
        | "not_found"
        | "conflict"
        | "invalid_transition"
        | "closed_beta_not_enrolled"
        | "internal_error";
    };

function isAction(value: string): value is SocialClosedBetaOperatorAction {
  return (SOCIAL_CLOSED_BETA_OPERATOR_ACTIONS as readonly string[]).includes(
    value,
  );
}

export async function mutateSocialClosedBetaEnrollmentAction(input: {
  organizationId: string;
  action: string;
  reason?: string;
  confirm?: boolean;
}): Promise<OperatorClosedBetaMutationActionResult> {
  const organizationId = input.organizationId?.trim();
  const actionRaw = input.action?.trim();
  if (!organizationId || !actionRaw || !isAction(actionRaw)) {
    return { ok: false, code: "invalid_request" };
  }

  if (
    (actionRaw === "allow_publishing" ||
      actionRaw === "pause" ||
      actionRaw === "revoke") &&
    input.confirm !== true
  ) {
    return { ok: false, code: "invalid_request" };
  }

  const supabase = await createSupabaseServerClient();
  const session = await resolvePlatformClosedBetaOperatorSession(supabase);
  if (!session.ok) {
    if (session.reason === "auth_required") {
      return { ok: false, code: "unauthorized" };
    }
    return { ok: false, code: "forbidden" };
  }

  const result = await mutateOperatorClosedBetaEnrollment(session.service, {
    organizationId,
    action: actionRaw,
    reason: input.reason,
    actorUserId: session.userId,
  });

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  revalidatePath(SOCIAL_CLOSED_BETA_OPERATOR_ROUTE);
  revalidatePath(buildSocialClosedBetaOperatorDetailHref(organizationId));

  return {
    ok: true,
    previousStatus: result.previousStatus,
    nextStatus: result.nextStatus,
  };
}
