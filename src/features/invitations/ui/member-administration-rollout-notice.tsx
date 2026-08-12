import { Alert } from "@/components/ui/alert";

type MemberAdministrationRolloutNoticeProps = {
  invitationAcceptanceEnabled: boolean;
};

/**
 * Informational restricted-rollout notice for Member Administration.
 * Does not disable create/resend/revoke. Does not expose env values.
 */
export function MemberAdministrationRolloutNotice({
  invitationAcceptanceEnabled,
}: MemberAdministrationRolloutNoticeProps) {
  if (invitationAcceptanceEnabled) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      title="Invitations are in restricted rollout"
    >
      Invitation acceptance is currently disabled, and invitation email delivery
      is not enabled yet. Creating or refreshing an invitation updates the
      pending record but does not notify the recipient or enable acceptance.
    </Alert>
  );
}
