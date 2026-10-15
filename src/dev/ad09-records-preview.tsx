import { AppShellChrome } from "@/components/app-shell-chrome";
import { Alert } from "@/components/ui/alert";
import loadingStyles from "@/app/(authenticated)/settings/members/loading.module.css";
import pageStyles from "@/app/(authenticated)/settings/members/page.module.css";
import { getInvitableOrganizationRoles } from "@/features/invitations/domain/permissions";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import type {
  MemberAdminMember,
  PendingInvitationListItem,
} from "@/features/invitations/domain/member-administration-read-types";
import {
  ActiveMembersSection,
  PendingInvitationsSection,
} from "@/features/invitations/ui/member-administration-lists";
import { InviteMemberForm } from "@/features/invitations/ui/invite-member-form";
import { MemberAdministrationRolloutNotice } from "@/features/invitations/ui/member-administration-rollout-notice";
import type { ActionFeedback } from "@/features/invitations/ui/pending-invitation-actions";
import { courseSellerPreviewHref } from "@/dev/ad02-preview-access";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const LONG_NAME =
  "AD09 example member with a display name that wraps inside a narrow members list";
const LONG_EMAIL =
  "ad09.example.invitation.address.that.wraps@example-workspace.invalid";
const LONG_ORG =
  "AD09 example organization with a workspace name that wraps on a narrow screen";

function member(long: boolean, role: MemberAdminMember["role"], id: string): MemberAdminMember {
  return {
    membershipId: id,
    displayName: long ? LONG_NAME : "AD09 example member",
    role,
    status: "active",
    joinedAt: "2026-09-12T09:00:00.000Z",
  };
}

function invitation(
  long: boolean,
  role: PendingInvitationListItem["role"],
  id: string,
): PendingInvitationListItem {
  return {
    invitationId: id,
    emailNormalized: long ? LONG_EMAIL : "ad09.example@example.invalid",
    role,
    status: "pending",
    createdAt: "2026-10-01T09:00:00.000Z",
    expiresAt: "2027-01-01T09:00:00.000Z",
    invitedByMemberId: "example-owner",
    inviterDisplayName: long ? LONG_NAME : "AD09 example owner",
    isCredentialValid: true,
    isEffectivelyExpired: false,
  };
}

function actionFeedback(state: string): ActionFeedback | undefined {
  if (state === "member-revoke-confirm") {
    return { kind: "confirm_revoke" };
  }
  if (state === "member-resend-pending") {
    return { kind: "resending" };
  }
  if (state === "member-revoke-pending") {
    return { kind: "revoking" };
  }
  if (state === "member-action-error") {
    return { kind: "error", message: "AD09 example action message" };
  }
  if (state === "member-action-success") {
    return { kind: "success", message: "AD09 example invitation updated" };
  }
  return undefined;
}

export function Ad09RecordsPreview({
  state,
  orgName,
  statePrefix = "",
}: {
  state: string;
  orgName: string;
  statePrefix?: string;
}) {
  const long = state.endsWith("long");
  const previewHref = (name: string) => courseSellerPreviewHref(name, statePrefix);
  const actorRole: OrganizationRole = state === "member-admin" ? "admin" : "owner";
  const panel =
    state === "member-auth" ||
    state === "member-unavailable" ||
    state === "member-org" ||
    state === "member-forbidden" ||
    state === "member-query" ||
    state === "member-loading";
  const organizations = [
    { organizationId: ORG, role: actorRole, displayName: long ? LONG_ORG : orgName },
    { organizationId: OTHER, role: "admin" as const, displayName: "AD09 example second workspace" },
  ];

  return (
    <AppShellChrome
      activeNav="members"
      membersNavVisible={!panel}
      moduleNavVisibility={operatingModelNavVisibility("course_seller")}
      terminology={DEFAULT_PRODUCT_TERMINOLOGY}
      organizationOptions={panel ? [] : organizations}
      selectedOrganizationId={panel ? undefined : ORG}
      organizationSelectorAction="/ad02-preview"
      navigationPresentation={state === "member-loading" ? "pending" : "resolved"}
    >
      {state === "member-loading" ? (
        <section className={loadingStyles.loading} aria-busy="true" aria-live="polite">
          <h1 className={loadingStyles.title}>Members</h1>
          <p className={loadingStyles.message}>Loading members…</p>
          <div className={loadingStyles.tableSkeleton} aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={loadingStyles.row} />
            ))}
          </div>
          <ul className={loadingStyles.cardSkeleton} aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className={loadingStyles.card} />
            ))}
          </ul>
        </section>
      ) : null}
      {state === "member-auth" ? (
        <section className={pageStyles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view members for your organization.</p>
        </section>
      ) : null}
      {state === "member-unavailable" ? (
        <section className={pageStyles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      ) : null}
      {state === "member-org" ? (
        <section className={pageStyles.statePanel} aria-labelledby="members-org-required-title">
          <h1 id="members-org-required-title">Organization selection required</h1>
          <p>Select an organization to view members and pending invitations.</p>
          <ul className={pageStyles.orgList}>
            {organizations.map((organization) => (
              <li key={organization.organizationId}>
                <a href={`${previewHref("member-list")}&org=${organization.organizationId}`}>
                  {organization.displayName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {state === "member-forbidden" ? (
        <section className={pageStyles.statePanel} aria-labelledby="members-forbidden-title">
          <h1 id="members-forbidden-title">Access denied</h1>
          <p>AD09 example access message</p>
        </section>
      ) : null}
      {state === "member-query" ? (
        <section className={pageStyles.statePanel} aria-labelledby="members-load-error-title">
          <h1 id="members-load-error-title">Unable to load members</h1>
          <Alert variant="error" title="AD09 example query message" />
          <a className={pageStyles.retryLink} href={previewHref("member-list")}>
            Try again
          </a>
        </section>
      ) : null}
      {!panel ? (
        <div className={pageStyles.page}>
          <header className={pageStyles.pageHeader}>
            <h1>Members</h1>
            <p className={pageStyles.subtitle}>
              Review active members and pending invitations for this organization.
            </p>
            <p className={pageStyles.orgName}>{long ? LONG_ORG : orgName}</p>
          </header>
          <MemberAdministrationRolloutNotice
            invitationAcceptanceEnabled={false}
            invitationEmailDeliveryEnabled={false}
          />
          {statePrefix === "" && (state === "member-invite-error" || state === "member-invite-pending" || state === "member-invite-success") ? (
            <section>
              <h2>Invite member</h2>
              <p role="status">
                {state === "member-invite-error"
                  ? `AD09 example form message for ${LONG_EMAIL}.`
                  : state === "member-invite-pending"
                    ? `Saving is shown as pending for ${LONG_EMAIL}.`
                    : "AD09 example invitation created."}{" "}
                Static preview only. This does not submit a form.
              </p>
            </section>
          ) : null}
          {statePrefix === "" && state !== "member-invite-error" && state !== "member-invite-pending" && state !== "member-invite-success" ? (
          <InviteMemberForm
            organizationId={ORG}
            invitableRoles={getInvitableOrganizationRoles(actorRole, "active")}
            invitationAcceptanceEnabled={false}
            invitationEmailDeliveryEnabled={false}
          />
          ) : null}
          <ActiveMembersSection
            members={
              state === "member-empty" || state === "member-members-error"
                ? []
                : [
                    member(long, "owner", "example-member-1"),
                    member(false, actorRole === "admin" ? "admin" : "staff", "example-member-2"),
                  ]
            }
            timeZone="UTC"
            loadFailed={state === "member-members-error"}
            errorMessage="AD09 example members message"
          />
          <PendingInvitationsSection
            invitations={
              state === "member-empty" || state === "member-invites-error"
                ? []
                : state === "member-admin"
                  ? [
                      invitation(long, "admin", "example-invitation-admin"),
                      invitation(false, "staff", "example-invitation-staff"),
                    ]
                  : [
                      invitation(long, "staff", "example-invitation-1"),
                      invitation(false, "viewer", "example-invitation-2"),
                    ]
            }
            timeZone="UTC"
            loadFailed={state === "member-invites-error"}
            errorMessage="AD09 example invitations message"
            organizationId={ORG}
            actorRole={actorRole}
            actionInitialFeedback={actionFeedback(state)}
          />
        </div>
      ) : null}
    </AppShellChrome>
  );
}
