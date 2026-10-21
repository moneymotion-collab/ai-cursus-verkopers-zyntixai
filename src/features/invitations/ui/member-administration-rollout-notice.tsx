import { Alert } from "@/components/ui/alert";

type MemberAdministrationRolloutNoticeProps = {
  invitationAcceptanceEnabled: boolean;
  invitationEmailDeliveryEnabled: boolean;
};

/**
 * Informational restricted-rollout notice for Member Administration.
 * Reflects acceptance and delivery gates independently. Does not disable controls.
 * Does not expose env names or secret values.
 */
export function MemberAdministrationRolloutNotice({
  invitationAcceptanceEnabled,
  invitationEmailDeliveryEnabled,
}: MemberAdministrationRolloutNoticeProps) {
  if (invitationAcceptanceEnabled && invitationEmailDeliveryEnabled) {
    return null;
  }

  let body: string;
  if (!invitationAcceptanceEnabled && !invitationEmailDeliveryEnabled) {
    body =
      "Invitation acceptance is currently disabled, and invitation email delivery is currently disabled. Creating or refreshing an invitation updates the pending record but does not notify the recipient or enable acceptance.";
  } else if (!invitationAcceptanceEnabled) {
    body =
      "Invitation acceptance is currently disabled. Creating or refreshing an invitation updates the pending record but does not enable acceptance.";
  } else {
    body =
      "Invitation email delivery is currently disabled. Creating an invitation updates the pending record but does not notify the recipient by email.";
  }

  return (
    <Alert variant="warning" title="Invitations are in restricted rollout">
      {body}
    </Alert>
  );
}
