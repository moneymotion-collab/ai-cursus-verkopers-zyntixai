"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSiteOrigin } from "@/lib/env/site-origin";
import { buildProductDestination } from "@/features/onboarding/domain/onboarding-steps";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import {
  buildInvitationContinuationCookieOptions,
  INVITE_CONTINUATION_COOKIE_NAME,
  shouldUseSecureInvitationContinuationCookie,
  unsealInvitationContinuation,
} from "@/features/invitations/server/continuation";
import {
  buildInvitationRegistrationOriginCookieOptions,
  INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
} from "@/features/invitations/server/registration-origin";
import { acceptOrganizationInvitation } from "@/features/invitations/server/accept-invitation";
import { assertInvitationAcceptSameOrigin } from "@/features/invitations/server/accept-invitation-origin";
import {
  ACCEPT_INVITATION_MESSAGES,
  toAcceptInvitationUiResult,
  type AcceptInvitationActionResult,
} from "@/features/invitations/server/accept-invitation-result";

/**
 * Explicit Invitation Acceptance mutation.
 * No client authority fields. Raw token never accepted as an argument.
 *
 * redirect() is intentionally outside any catch so Next.js control flow
 * is never normalized as an unexpected UI result.
 */
export async function acceptInvitationAction(): Promise<AcceptInvitationActionResult> {
  const headerStore = await headers();
  if (!assertInvitationAcceptSameOrigin(headerStore)) {
    return toAcceptInvitationUiResult("origin_rejected");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return toAcceptInvitationUiResult("auth_required");
  }

  if (!user.email_confirmed_at) {
    return {
      ok: false,
      code: "verification_required",
      message: ACCEPT_INVITATION_MESSAGES.verification_required,
    };
  }

  const cookieStore = await cookies();
  const continuationCookie = cookieStore.get(INVITE_CONTINUATION_COOKIE_NAME)
    ?.value;
  const secure = shouldUseSecureInvitationContinuationCookie(
    resolveSiteOrigin(),
  );

  const unsealed = unsealInvitationContinuation(continuationCookie);
  if (!unsealed.ok) {
    clearRawContinuationCookie(cookieStore, secure);
    // OD-APP-C2: retain valid bound registration-origin; clear only raw.
    return toAcceptInvitationUiResult("invite_not_found_or_unavailable");
  }

  const rpcResult = await acceptOrganizationInvitation(
    supabase,
    unsealed.rawToken,
  );

  if (rpcResult.kind === "success" || rpcResult.kind === "already_member") {
    // Clear credentials first — DB mutation already committed; never resurrect.
    clearRawContinuationCookie(cookieStore, secure);
    clearRegistrationOriginCookie(cookieStore, secure);

    const memberships = await listActiveOrganizationMemberships(supabase);
    const matched =
      memberships.ok &&
      memberships.memberships.some(
        (membership) => membership.organizationId === rpcResult.organizationId,
      );

    if (matched) {
      redirect(buildProductDestination(rpcResult.organizationId));
    }

    // Verification failed after DB success: never use unverified org id,
    // never owner-provision, never restore invitation cookies.
    // Converge via already-resolved fresh memberships only.
    if (memberships.ok && memberships.memberships.length === 1) {
      redirect(
        buildProductDestination(memberships.memberships[0]!.organizationId),
      );
    }
    if (memberships.ok && memberships.memberships.length > 1) {
      redirect("/leads");
    }
    redirect("/");
  }

  if (rpcResult.kind === "invite_not_found_or_unavailable") {
    // OD-APP-C2: clear raw only; retain registration-origin cookie as-is.
    clearRawContinuationCookie(cookieStore, secure);
    return toAcceptInvitationUiResult("invite_not_found_or_unavailable");
  }

  // email_mismatch | forbidden | admin_action | unexpected | transport:
  // OD-APP-C1 / locked retain matrix — do not clear cookies.
  if (rpcResult.kind === "transport_error") {
    return toAcceptInvitationUiResult("unexpected");
  }

  return toAcceptInvitationUiResult(rpcResult.kind);
}

function clearRawContinuationCookie(
  cookieStore: {
    set: (
      name: string,
      value: string,
      options: ReturnType<typeof buildInvitationContinuationCookieOptions>,
    ) => void;
  },
  secure: boolean,
): void {
  cookieStore.set(
    INVITE_CONTINUATION_COOKIE_NAME,
    "",
    buildInvitationContinuationCookieOptions(0, secure),
  );
}

function clearRegistrationOriginCookie(
  cookieStore: {
    set: (
      name: string,
      value: string,
      options: ReturnType<typeof buildInvitationRegistrationOriginCookieOptions>,
    ) => void;
  },
  secure: boolean,
): void {
  cookieStore.set(
    INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
    "",
    buildInvitationRegistrationOriginCookieOptions(0, secure),
  );
}
