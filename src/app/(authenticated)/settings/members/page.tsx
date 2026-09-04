import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInvitableOrganizationRoles } from "@/features/invitations/domain/permissions";
import { buildMembersListHref } from "@/features/invitations/domain/members-navigation";
import { isInvitationsFeatureEnabled } from "@/features/invitations/server/invitations-feature";
import { isInvitationEmailDeliveryEnabled } from "@/features/invitations/server/delivery/config";
import { loadMemberAdministrationPage } from "@/features/invitations/server/load-member-administration-page";
import {
  ActiveMembersSection,
  PendingInvitationsSection,
} from "@/features/invitations/ui/member-administration-lists";
import { InviteMemberForm } from "@/features/invitations/ui/invite-member-form";
import { MemberAdministrationRolloutNotice } from "@/features/invitations/ui/member-administration-rollout-notice";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import styles from "./page.module.css";

type MembersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function OrganizationRequiredPanel({
  organizations,
}: {
  organizations: OrganizationOption[];
}) {
  return (
    <section className={styles.statePanel} aria-labelledby="members-org-required-title">
      <h1 id="members-org-required-title">Organization selection required</h1>
      <p>Select an organization to view members and pending invitations.</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a href={buildMembersListHref(organization.organizationId)}>
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadMemberAdministrationPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="members" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view members for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="members" membersNavVisible={false}>
        <section
          className={styles.statePanel}
          aria-labelledby="org-unavailable-title"
        >
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="members" membersNavVisible={false}>
        <OrganizationRequiredPanel organizations={result.organizations} />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="members" membersNavVisible={false}>
        <section
          className={styles.statePanel}
          aria-labelledby="org-context-missing-title"
        >
          <h1 id="org-context-missing-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav="members" membersNavVisible={false}>
        <section
          className={styles.statePanel}
          aria-labelledby="members-forbidden-title"
        >
          <h1 id="members-forbidden-title">Access denied</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    const retryHref = result.organizationId
      ? buildMembersListHref(result.organizationId)
      : buildMembersListHref();

    return (
      <AppShell
        activeNav="members"
        membersNavVisible={false}
        organizationOptions={[]}
      >
        <section
          className={styles.statePanel}
          aria-labelledby="members-load-error-title"
        >
          <h1 id="members-load-error-title">Unable to load members</h1>
          <Alert variant="error" title={result.message} />
          {result.retryable ? (
            <a className={styles.retryLink} href={retryHref}>
              Try again
            </a>
          ) : null}
        </section>
      </AppShell>
    );
  }

  const timeZone = "UTC";
  const invitableRoles = getInvitableOrganizationRoles(result.role, "active");
  // Acceptance/continuation gate only — does not disable create/resend/revoke.
  const invitationAcceptanceEnabled = isInvitationsFeatureEnabled();
  const invitationEmailDeliveryEnabled = isInvitationEmailDeliveryEnabled();

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      activeNav="members"
      membersNavVisible
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction="/settings/members"
    >
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1>Members</h1>
          <p className={styles.subtitle}>
            Review active members and pending invitations for this organization.
          </p>
          <p className={styles.orgName}>{result.organizationName}</p>
        </header>

        <MemberAdministrationRolloutNotice
          invitationAcceptanceEnabled={invitationAcceptanceEnabled}
          invitationEmailDeliveryEnabled={invitationEmailDeliveryEnabled}
        />

        <InviteMemberForm
          organizationId={result.organizationId}
          invitableRoles={invitableRoles}
          invitationAcceptanceEnabled={invitationAcceptanceEnabled}
          invitationEmailDeliveryEnabled={invitationEmailDeliveryEnabled}
        />

        <ActiveMembersSection
          members={result.members}
          timeZone={timeZone}
          loadFailed={result.membersLoadFailed}
          errorMessage={result.membersErrorMessage}
        />

        <PendingInvitationsSection
          invitations={result.pendingInvitations}
          timeZone={timeZone}
          loadFailed={result.invitationsLoadFailed}
          errorMessage={result.invitationsErrorMessage}
          organizationId={result.organizationId}
          actorRole={result.role}
        />
      </div>
    </AppShell>
  );
}
