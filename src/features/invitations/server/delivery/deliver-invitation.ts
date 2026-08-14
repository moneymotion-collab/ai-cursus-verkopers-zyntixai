import "server-only";

import { resolveInvitationEmailDeliveryRuntimeConfig } from "@/features/invitations/server/delivery/config";
import { isInvitationEmailRecipientAllowlisted } from "@/features/invitations/server/delivery/config";
import { createResendInvitationEmailProvider } from "@/features/invitations/server/delivery/resend-adapter";
import type {
  DeliverInvitationInput,
  DeliverInvitationResult,
  InvitationEmailProvider,
} from "@/features/invitations/server/delivery/types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Minimal invitation email body for CB-E1-A interface completeness.
 * CB-E1-B owns richer template design.
 */
export function buildMinimalInvitationEmailContent(input: {
  organizationName: string;
  targetRole: string;
  acceptanceUrl: string;
  expiresAt: string | null;
}): { subject: string; html: string; text: string } {
  const org = escapeHtml(input.organizationName);
  const role = escapeHtml(input.targetRole);
  const url = escapeHtml(input.acceptanceUrl);
  const expiryText = input.expiresAt
    ? `This invitation expires at ${input.expiresAt} (UTC).`
    : "This invitation may expire. Accept it as soon as possible.";
  const expiryHtml = input.expiresAt
    ? `This invitation expires at ${escapeHtml(input.expiresAt)} (UTC).`
    : "This invitation may expire. Accept it as soon as possible.";

  const subject = `You're invited to join ${input.organizationName} on ZyntixAI`;

  const text = [
    `You have been invited to join ${input.organizationName} on ZyntixAI as ${input.targetRole}.`,
    "",
    `Accept the invitation: ${input.acceptanceUrl}`,
    "",
    expiryText,
    "",
    "If you were not expecting this invitation, you can ignore this message.",
  ].join("\n");

  const html = [
    `<p>You have been invited to join <strong>${org}</strong> on ZyntixAI as <strong>${role}</strong>.</p>`,
    `<p><a href="${url}">Accept invitation</a></p>`,
    `<p>${expiryHtml}</p>`,
    `<p>If you were not expecting this invitation, you can ignore this message.</p>`,
  ].join("");

  return { subject, html, text };
}

export type DeliverInvitationDeps = {
  env?: Record<string, string | undefined>;
  provider?: InvitationEmailProvider;
};

/**
 * Provider-neutral invitation delivery entrypoint.
 * Never logs acceptanceUrl (contains raw token).
 */
export async function deliverInvitation(
  input: DeliverInvitationInput,
  deps: DeliverInvitationDeps = {},
): Promise<DeliverInvitationResult> {
  const env = deps.env ?? process.env;
  const runtime = resolveInvitationEmailDeliveryRuntimeConfig(env);

  if (runtime.kind === "disabled") {
    return { kind: "delivery_disabled" };
  }

  if (runtime.kind === "configuration_error") {
    return { kind: "delivery_configuration_error" };
  }

  if (
    !isInvitationEmailRecipientAllowlisted(
      input.recipientEmail,
      runtime.allowlist,
    )
  ) {
    return { kind: "delivery_recipient_not_allowed" };
  }

  const provider =
    deps.provider ?? createResendInvitationEmailProvider(runtime.apiKey);

  const content = buildMinimalInvitationEmailContent({
    organizationName: input.organizationName,
    targetRole: input.targetRole,
    acceptanceUrl: input.acceptanceUrl,
    expiresAt: input.expiresAt,
  });

  const sendResult = await provider.sendInvitationEmail({
    from: runtime.from,
    to: input.recipientEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
    idempotencyKey: input.idempotencyKey,
  });

  if (!sendResult.ok) {
    return { kind: "delivery_provider_error" };
  }

  return { kind: "submitted", providerMessageId: sendResult.id };
}
