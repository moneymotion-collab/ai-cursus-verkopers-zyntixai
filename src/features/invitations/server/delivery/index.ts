import "server-only";

export {
  buildInvitationAcceptanceUrl,
  INVITATION_ACCEPTANCE_EXCHANGE_PATH,
} from "@/features/invitations/server/delivery/acceptance-url";
export {
  isInvitationEmailDeliveryEnabled,
  isInvitationEmailRecipientAllowlisted,
  parseInvitationEmailDeliveryEnabled,
  parseInvitationEmailRecipientAllowlist,
  readInvitationEmailRecipientAllowlist,
  resolveInvitationEmailDeliveryRuntimeConfig,
} from "@/features/invitations/server/delivery/config";
export {
  buildMinimalInvitationEmailContent,
  deliverInvitation,
  type DeliverInvitationDeps,
} from "@/features/invitations/server/delivery/deliver-invitation";
export { loadOrganizationDisplayNameForDelivery } from "@/features/invitations/server/delivery/load-organization-display-name";
export {
  orchestrateInvitationDelivery,
  type OrchestrateInvitationDeliveryParams,
} from "@/features/invitations/server/delivery/orchestrate-invitation-delivery";
export { createResendInvitationEmailProvider } from "@/features/invitations/server/delivery/resend-adapter";
export type {
  DeliverInvitationInput,
  DeliverInvitationResult,
  InvitationDeliveryOperation,
  InvitationDeliveryUiStatus,
  InvitationEmailProvider,
  InvitationEmailProviderSendParams,
  InvitationEmailProviderSendResult,
} from "@/features/invitations/server/delivery/types";
export { toInvitationDeliveryUiStatus } from "@/features/invitations/server/delivery/types";
