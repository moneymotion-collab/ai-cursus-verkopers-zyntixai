/**
 * Client-safe invitation email delivery UI status codes (CB-E1-A).
 * No secrets, no provider payloads, no raw tokens.
 */

export type InvitationDeliveryUiStatus =
  | "submitted"
  | "disabled"
  | "recipient_not_allowed"
  | "configuration_error"
  | "provider_error";
