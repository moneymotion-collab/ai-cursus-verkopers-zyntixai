import { Badge } from "@/components/ui/badge";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import type {
  MemberAdminMember,
  PendingInvitationListItem,
} from "@/features/invitations/domain/member-administration-read-types";
import { canManageOrganizationInvitation } from "@/features/invitations/domain/permissions";
import {
  isOrganizationInvitationResendable,
  isOrganizationInvitationRevocable,
} from "@/features/invitations/domain/lifecycle";
import {
  toMemberAdminMemberPresentation,
  toPendingInvitationPresentation,
} from "@/features/invitations/ui/member-administration-presentation";
import { PendingInvitationActions } from "@/features/invitations/ui/pending-invitation-actions";
import styles from "./member-administration-lists.module.css";

type ActiveMembersSectionProps = {
  members: MemberAdminMember[];
  timeZone: string;
  loadFailed: boolean;
  errorMessage?: string;
};

type PendingInvitationsSectionProps = {
  invitations: PendingInvitationListItem[];
  timeZone: string;
  loadFailed: boolean;
  errorMessage?: string;
  organizationId: string;
  actorRole: OrganizationRole;
};

function resolvePendingActionCapabilities(
  invitation: PendingInvitationListItem,
  actorRole: OrganizationRole,
  nowIso: string,
): {
  canResend: boolean;
  canRevoke: boolean;
  showOwnerManageHint: boolean;
} {
  const mayManage = canManageOrganizationInvitation(
    actorRole,
    "active",
    invitation.role,
  );

  if (!mayManage) {
    return {
      canResend: false,
      canRevoke: false,
      showOwnerManageHint: true,
    };
  }

  const canResend = isOrganizationInvitationResendable({
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    now: nowIso,
  });

  const canRevoke = isOrganizationInvitationRevocable({
    status: invitation.status,
  });

  return { canResend, canRevoke, showOwnerManageHint: false };
}

export function ActiveMembersSection({
  members,
  timeZone,
  loadFailed,
  errorMessage,
}: ActiveMembersSectionProps) {
  const rows = members.map((member) =>
    toMemberAdminMemberPresentation(member, timeZone),
  );

  return (
    <section aria-labelledby="active-members-heading">
      <div className={styles.sectionHeader}>
        <h2 id="active-members-heading">Active members</h2>
        {!loadFailed ? (
          <p className={styles.count} aria-live="polite">
            {rows.length === 1 ? "1 member" : `${rows.length} members`}
          </p>
        ) : null}
      </div>

      {loadFailed ? (
        <div
          className={styles.errorWrap}
          role="alert"
          aria-labelledby="active-members-error-title"
        >
          <p id="active-members-error-title" className={styles.errorTitle}>
            Unable to load active members
          </p>
          <p className={styles.errorDescription}>
            {errorMessage ??
              "Something went wrong while loading members. Please try again."}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.emptyWrap} aria-labelledby="active-members-empty-title">
          <p id="active-members-empty-title" className={styles.emptyTitle}>
            No active members
          </p>
          <p className={styles.emptyDescription}>
            Active members for this organization will appear here.
          </p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.visuallyHidden}>
                Active organization members
              </caption>
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.membershipId}>
                    <td>
                      <span className={styles.nameCell}>{row.displayName}</span>
                    </td>
                    <td>
                      <Badge variant="info">{row.roleLabel}</Badge>
                    </td>
                    <td>
                      <Badge variant="success">{row.statusLabel}</Badge>
                    </td>
                    <td>{row.joinedAtLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.cardList} aria-label="Active members">
            {rows.map((row) => (
              <li key={row.membershipId} className={styles.card}>
                <h3 className={styles.cardTitle}>{row.displayName}</h3>
                <div className={styles.cardBadges}>
                  <Badge variant="info">{row.roleLabel}</Badge>
                  <Badge variant="success">{row.statusLabel}</Badge>
                </div>
                <dl className={styles.cardMeta}>
                  <div>
                    <dt>Joined</dt>
                    <dd>{row.joinedAtLabel}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function PendingInvitationsSection({
  invitations,
  timeZone,
  loadFailed,
  errorMessage,
  organizationId,
  actorRole,
}: PendingInvitationsSectionProps) {
  const nowIso = new Date().toISOString();
  const rows = invitations.map((invitation) => {
    const presentation = toPendingInvitationPresentation(invitation, timeZone);
    const capabilities = resolvePendingActionCapabilities(
      invitation,
      actorRole,
      nowIso,
    );
    return { ...presentation, ...capabilities };
  });

  return (
    <section aria-labelledby="pending-invitations-heading">
      <div className={styles.sectionHeader}>
        <h2 id="pending-invitations-heading">Pending invitations</h2>
        {!loadFailed ? (
          <p className={styles.count} aria-live="polite">
            {rows.length === 1
              ? "1 invitation"
              : `${rows.length} invitations`}
          </p>
        ) : null}
      </div>

      {loadFailed ? (
        <div
          className={styles.errorWrap}
          role="alert"
          aria-labelledby="pending-invitations-error-title"
        >
          <p id="pending-invitations-error-title" className={styles.errorTitle}>
            Unable to load pending invitations
          </p>
          <p className={styles.errorDescription}>
            {errorMessage ??
              "Something went wrong while loading invitations. Please try again."}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div
          className={styles.emptyWrap}
          aria-labelledby="pending-invitations-empty-title"
        >
          <p id="pending-invitations-empty-title" className={styles.emptyTitle}>
            No pending invitations
          </p>
          <p className={styles.emptyDescription}>
            There are no pending invitations for this organization.
          </p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.visuallyHidden}>
                Pending organization invitations
              </caption>
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Invited by</th>
                  <th scope="col">Created</th>
                  <th scope="col">Expires</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.invitationId}>
                    <td>
                      <span className={styles.nameCell}>{row.emailLabel}</span>
                    </td>
                    <td>
                      <Badge variant="info">{row.roleLabel}</Badge>
                    </td>
                    <td>
                      <Badge variant="warning">{row.statusLabel}</Badge>
                    </td>
                    <td>{row.inviterLabel}</td>
                    <td>{row.createdAtLabel}</td>
                    <td>{row.expiresAtLabel}</td>
                    <td>
                      {row.canResend || row.canRevoke ? (
                        <PendingInvitationActions
                          organizationId={organizationId}
                          invitationId={row.invitationId}
                          emailLabel={row.emailLabel}
                          canResend={row.canResend}
                          canRevoke={row.canRevoke}
                        />
                      ) : row.showOwnerManageHint ? (
                        <p className={styles.manageHint}>
                          Owner access required to manage this invitation.
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.cardList} aria-label="Pending invitations">
            {rows.map((row) => (
              <li key={row.invitationId} className={styles.card}>
                <h3 className={styles.cardTitle}>{row.emailLabel}</h3>
                <div className={styles.cardBadges}>
                  <Badge variant="info">{row.roleLabel}</Badge>
                  <Badge variant="warning">{row.statusLabel}</Badge>
                </div>
                <dl className={styles.cardMeta}>
                  <div>
                    <dt>Invited by</dt>
                    <dd>{row.inviterLabel}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{row.createdAtLabel}</dd>
                  </div>
                  <div>
                    <dt>Expires</dt>
                    <dd>{row.expiresAtLabel}</dd>
                  </div>
                </dl>
                <div className={styles.cardActions}>
                  {row.canResend || row.canRevoke ? (
                    <PendingInvitationActions
                      organizationId={organizationId}
                      invitationId={row.invitationId}
                      emailLabel={row.emailLabel}
                      canResend={row.canResend}
                      canRevoke={row.canRevoke}
                    />
                  ) : row.showOwnerManageHint ? (
                    <p className={styles.manageHint}>
                      Owner access required to manage this invitation.
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
