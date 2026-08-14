import "server-only";

import { resolveInvitationEmailDeliveryRuntimeConfig } from "@/features/invitations/server/delivery/config";
import { isInvitationEmailRecipientAllowlisted } from "@/features/invitations/server/delivery/config";
import { buildInvitationEmailContent } from "@/features/invitations/server/delivery/invitation-email-template";
import { createResendInvitationEmailProvider } from "@/features/invitations/server/delivery/resend-adapter";
import type {
  DeliverInvitationInput,
  DeliverInvitationResult,
  InvitationEmailProvider,
} from "@/features/invitations/server/delivery/types";

export type DeliverInvitationDeps = {
  env?: Record<string, string | undefined>;
  provider?: InvitationEmailProvider;
};

/**
 * Provider-neutral invitation delivery entrypoint.
 * Never logs acceptanceUrl (contains raw token) or rendered bodies.
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

  const template = buildInvitationEmailContent(
    {
      organizationName: input.organizationName,
      targetRole: input.targetRole,
      acceptanceUrl: input.acceptanceUrl,
      expiresAt: input.expiresAt,
    },
    env,
  );

  if (!template.ok) {
    return { kind: "delivery_configuration_error" };
  }

  const provider =
    deps.provider ?? createResendInvitationEmailProvider(runtime.apiKey);

  const sendResult = await provider.sendInvitationEmail({
    from: runtime.from,
    to: input.recipientEmail,
    subject: template.content.subject,
    html: template.content.html,
    text: template.content.text,
    idempotencyKey: input.idempotencyKey,
  });

  if (!sendResult.ok) {
    return { kind: "delivery_provider_error" };
  }

  return { kind: "submitted", providerMessageId: sendResult.id };
}
