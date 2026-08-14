import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { INVITATION_ACCEPTANCE_EXCHANGE_PATH } from "@/features/invitations/server/delivery/acceptance-url";
import {
  buildInvitationEmailContent,
  escapeHtmlForInvitationEmail,
  formatInvitationExpiryLabel,
  invitationTargetRoleDisplayLabel,
  sanitizeInvitationEmailSubjectFragment,
} from "@/features/invitations/server/delivery/invitation-email-template";

const VALID_TOKEN =
  "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const TRUSTED_ORIGIN = "https://zyntixai.example";
const ACCEPTANCE_URL = `${TRUSTED_ORIGIN}${INVITATION_ACCEPTANCE_EXCHANGE_PATH}?token=${VALID_TOKEN}`;
const ENV = { NEXT_PUBLIC_SITE_URL: TRUSTED_ORIGIN };

describe("invitation email template (CB-E1-B)", () => {
  it("builds subject without token or recipient email", () => {
    const result = buildInvitationEmailContent(
      {
        organizationName: "Acme Coaching",
        targetRole: "viewer",
        acceptanceUrl: ACCEPTANCE_URL,
        expiresAt: "2026-08-21T12:00:00.000Z",
      },
      ENV,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.content.subject).toBe(
      "You're invited to join Acme Coaching on ZyntixAI",
    );
    expect(result.content.subject).not.toContain(VALID_TOKEN);
    expect(result.content.subject.toLowerCase()).not.toContain("@");
    expect(result.content.preheader).toContain("Acme Coaching");
    expect(result.content.preheader).not.toContain(VALID_TOKEN);
  });

  it("renders HTML with CTA, role, expiry, ignore guidance, and escaped org", () => {
    const malicious = `<script>alert(1)</script> A&B "Quotes" 'Ticks'`;
    const result = buildInvitationEmailContent(
      {
        organizationName: malicious,
        targetRole: "admin",
        acceptanceUrl: ACCEPTANCE_URL,
        expiresAt: "2026-08-21T12:00:00.000Z",
      },
      ENV,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const { html, text } = result.content;
    expect(html).toContain("ZyntixAI");
    expect(html).toContain("<h1");
    expect(html).toContain("Accept invitation");
    expect(html).toContain(`href="${escapeHtmlForInvitationEmail(ACCEPTANCE_URL)}"`);
    expect(html).toContain("Admin");
    expect(html).toContain("This invitation expires on 21 August 2026 (UTC).");
    expect(html).toContain(
      "If you weren't expecting this invitation, you can ignore this email.",
    );
    expect(html).toContain(escapeHtmlForInvitationEmail(malicious));
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toMatch(/src=["']https?:\/\//i);
    expect(html).not.toContain("<img");

    expect(text).toContain("ZyntixAI");
    expect(text).toContain(malicious);
    expect(text).toContain(ACCEPTANCE_URL);
    expect(text).toContain("Admin");
    expect(text).toContain("This invitation expires on 21 August 2026 (UTC).");
    expect(text).not.toContain("<a ");
    expect(text).not.toContain("<strong>");
    expect(text).not.toContain("<h1");
    expect((text.match(new RegExp(VALID_TOKEN, "g")) ?? []).length).toBe(1);
  });

  it("omits role when target role is not a known invitation role", () => {
    const result = buildInvitationEmailContent(
      {
        organizationName: "QA Org",
        targetRole: "owner",
        acceptanceUrl: ACCEPTANCE_URL,
        expiresAt: null,
      },
      ENV,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.content.text).toContain(
      "You have been invited to join QA Org on ZyntixAI.",
    );
    expect(result.content.text).not.toMatch(/as (Admin|Staff|Viewer|owner)/i);
    expect(result.content.html).not.toContain("owner");
  });

  it("fails closed for untrusted acceptance URLs and blank org names", () => {
    expect(
      buildInvitationEmailContent(
        {
          organizationName: "QA Org",
          targetRole: "staff",
          acceptanceUrl: `https://evil.example${INVITATION_ACCEPTANCE_EXCHANGE_PATH}?token=${VALID_TOKEN}`,
          expiresAt: null,
        },
        ENV,
      ),
    ).toEqual({ ok: false, reason: "invalid_acceptance_url" });

    expect(
      buildInvitationEmailContent(
        {
          organizationName: "   ",
          targetRole: "staff",
          acceptanceUrl: ACCEPTANCE_URL,
          expiresAt: null,
        },
        ENV,
      ),
    ).toEqual({ ok: false, reason: "invalid_organization_name" });
  });

  it("formats expiry and role labels deterministically", () => {
    expect(formatInvitationExpiryLabel(null)).toContain("may expire");
    expect(formatInvitationExpiryLabel("not-a-date")).toContain("may expire");
    expect(formatInvitationExpiryLabel("2026-08-21T12:00:00.000Z")).toBe(
      "This invitation expires on 21 August 2026 (UTC).",
    );
    expect(invitationTargetRoleDisplayLabel("staff")).toBe("Staff");
    expect(invitationTargetRoleDisplayLabel("owner")).toBeNull();
    expect(sanitizeInvitationEmailSubjectFragment("Acme\r\nBcc: evil")).toBe(
      "Acme Bcc: evil",
    );
  });

  it("keeps exchange route scanner/referrer protections unchanged", () => {
    const exchange = readFileSync(
      join(process.cwd(), "src/app/invite/accept/exchange/route.ts"),
      "utf8",
    );
    expect(exchange).toContain('REFERRER_POLICY = "no-referrer"');
    expect(exchange).toContain("Cache-Control");
    expect(exchange).toContain("no-store");
    expect(exchange).toContain("MUST NOT invoke Acceptance mutation");
    expect(exchange).toContain("isInvitationsFeatureEnabled");
    expect(exchange).not.toContain("accept_organization_invitation");
  });

  it("delivery modules do not log token-bearing payloads", () => {
    const files = [
      "src/features/invitations/server/delivery/invitation-email-template.ts",
      "src/features/invitations/server/delivery/acceptance-url.ts",
      "src/features/invitations/server/delivery/deliver-invitation.ts",
      "src/features/invitations/server/delivery/orchestrate-invitation-delivery.ts",
      "src/features/invitations/server/delivery/resend-adapter.ts",
      "src/features/invitations/actions/create-invitation-action.ts",
      "src/features/invitations/actions/resend-invitation-action.ts",
    ];
    for (const relative of files) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source).not.toContain("console.log");
      expect(source).not.toContain("console.error");
      expect(source).not.toContain("console.info");
      expect(source).not.toContain("console.debug");
    }
  });
});
