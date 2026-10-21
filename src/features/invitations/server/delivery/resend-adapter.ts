import "server-only";

import { Resend } from "resend";
import type {
  InvitationEmailProvider,
  InvitationEmailProviderSendParams,
  InvitationEmailProviderSendResult,
} from "@/features/invitations/server/delivery/types";

/**
 * Official Resend adapter. Click/open tracking are not enabled on sends.
 * Account-level tracking must remain disabled for invitation domains (CB-E1-D).
 */
export function createResendInvitationEmailProvider(
  apiKey: string,
): InvitationEmailProvider {
  const resend = new Resend(apiKey);

  return {
    async sendInvitationEmail(
      params: InvitationEmailProviderSendParams,
    ): Promise<InvitationEmailProviderSendResult> {
      try {
        const { data, error } = await resend.emails.send(
          {
            from: params.from,
            to: params.to,
            subject: params.subject,
            html: params.html,
            text: params.text,
          },
          params.idempotencyKey
            ? { idempotencyKey: params.idempotencyKey }
            : undefined,
        );

        if (error) {
          return { ok: false };
        }

        const id =
          data && typeof data === "object" && "id" in data
            ? typeof (data as { id: unknown }).id === "string"
              ? (data as { id: string }).id
              : null
            : null;

        return { ok: true, id };
      } catch {
        return { ok: false };
      }
    },
  };
}
