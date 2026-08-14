import { describe, expect, it, vi } from "vitest";
import {
  buildInvitationAcceptanceUrl,
  isTrustedInvitationAcceptanceUrl,
  isTrustedInvitationEmailOrigin,
  INVITATION_ACCEPTANCE_EXCHANGE_PATH,
} from "@/features/invitations/server/delivery/acceptance-url";
import {
  isInvitationEmailDeliveryEnabled,
  isInvitationEmailRecipientAllowlisted,
  parseInvitationEmailDeliveryEnabled,
  parseInvitationEmailRecipientAllowlist,
  resolveInvitationEmailDeliveryRuntimeConfig,
} from "@/features/invitations/server/delivery/config";
import { deliverInvitation } from "@/features/invitations/server/delivery/deliver-invitation";
import { orchestrateInvitationDelivery } from "@/features/invitations/server/delivery/orchestrate-invitation-delivery";
import type { InvitationEmailProvider } from "@/features/invitations/server/delivery/types";

const VALID_TOKEN =
  "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ORG_ID = "11111111-1111-4111-8111-111111111111";
const TRUSTED_ORIGIN = "https://zyntixai.example";
const ACCEPTANCE_URL = `${TRUSTED_ORIGIN}${INVITATION_ACCEPTANCE_EXCHANGE_PATH}?token=${VALID_TOKEN}`;

const READY_ENV = {
  INVITATION_EMAIL_DELIVERY_ENABLED: "true",
  RESEND_API_KEY: "re_test",
  INVITATION_EMAIL_FROM: "ZyntixAI <invites@example.com>",
  INVITATION_EMAIL_RECIPIENT_ALLOWLIST: "qa@example.com",
  NEXT_PUBLIC_SITE_URL: TRUSTED_ORIGIN,
} as const;

function mockProvider(
  impl?: InvitationEmailProvider["sendInvitationEmail"],
): InvitationEmailProvider & {
  sendInvitationEmail: ReturnType<typeof vi.fn>;
} {
  return {
    sendInvitationEmail: vi.fn(
      impl ??
        (async () => ({
          ok: true as const,
          id: "msg_test",
        })),
    ),
  };
}

describe("invitation email delivery config (CB-E1-A)", () => {
  it("fails closed unless delivery flag is exact true", () => {
    expect(parseInvitationEmailDeliveryEnabled(undefined)).toBe(false);
    expect(parseInvitationEmailDeliveryEnabled("")).toBe(false);
    expect(parseInvitationEmailDeliveryEnabled("false")).toBe(false);
    expect(parseInvitationEmailDeliveryEnabled("TRUE")).toBe(true);
    expect(parseInvitationEmailDeliveryEnabled(" true ")).toBe(true);
    expect(parseInvitationEmailDeliveryEnabled("1")).toBe(false);
    expect(parseInvitationEmailDeliveryEnabled("yes")).toBe(false);
    expect(
      isInvitationEmailDeliveryEnabled({
        INVITATION_EMAIL_DELIVERY_ENABLED: "true",
      }),
    ).toBe(true);
    expect(
      isInvitationEmailDeliveryEnabled({
        INVITATION_EMAIL_DELIVERY_ENABLED: "false",
      }),
    ).toBe(false);
  });

  it("treats missing credentials as fine while delivery is OFF", () => {
    expect(
      resolveInvitationEmailDeliveryRuntimeConfig({
        INVITATION_EMAIL_DELIVERY_ENABLED: "false",
      }),
    ).toEqual({ kind: "disabled" });
    expect(resolveInvitationEmailDeliveryRuntimeConfig({})).toEqual({
      kind: "disabled",
    });
  });

  it("fails closed when delivery ON without secret, sender, or allowlist", () => {
    expect(
      resolveInvitationEmailDeliveryRuntimeConfig({
        INVITATION_EMAIL_DELIVERY_ENABLED: "true",
      }),
    ).toEqual({ kind: "configuration_error" });

    expect(
      resolveInvitationEmailDeliveryRuntimeConfig({
        INVITATION_EMAIL_DELIVERY_ENABLED: "true",
        RESEND_API_KEY: "re_test",
        INVITATION_EMAIL_FROM: "ZyntixAI <invites@example.com>",
      }),
    ).toEqual({ kind: "configuration_error" });

    expect(
      resolveInvitationEmailDeliveryRuntimeConfig({
        INVITATION_EMAIL_DELIVERY_ENABLED: "true",
        RESEND_API_KEY: "re_test",
        INVITATION_EMAIL_FROM: "ZyntixAI <invites@example.com>",
        INVITATION_EMAIL_RECIPIENT_ALLOWLIST: "qa@example.com",
      }),
    ).toEqual({
      kind: "ready",
      apiKey: "re_test",
      from: "ZyntixAI <invites@example.com>",
      allowlist: ["qa@example.com"],
    });
  });

  it("normalizes allowlist case and whitespace; empty fails closed", () => {
    expect(parseInvitationEmailRecipientAllowlist(undefined)).toEqual([]);
    expect(parseInvitationEmailRecipientAllowlist("")).toEqual([]);
    expect(
      parseInvitationEmailRecipientAllowlist(" QA@Example.com , other@ex.com "),
    ).toEqual(["qa@example.com", "other@ex.com"]);

    const allowlist = parseInvitationEmailRecipientAllowlist(
      " QA@Example.com ",
    );
    expect(
      isInvitationEmailRecipientAllowlisted("qa@example.com", allowlist),
    ).toBe(true);
    expect(
      isInvitationEmailRecipientAllowlisted(" blocked@example.com ", allowlist),
    ).toBe(false);
    expect(isInvitationEmailRecipientAllowlisted("qa@example.com", [])).toBe(
      false,
    );
  });
});

describe("buildInvitationAcceptanceUrl (CB-E1-B)", () => {
  it("uses trusted origin and fixed exchange path with only token", () => {
    const url = buildInvitationAcceptanceUrl(VALID_TOKEN, {
      NEXT_PUBLIC_SITE_URL: `${TRUSTED_ORIGIN}/`,
    });
    expect(url).toBe(ACCEPTANCE_URL);
    const parsed = new URL(url!);
    expect(parsed.pathname).toBe(INVITATION_ACCEPTANCE_EXCHANGE_PATH);
    expect([...parsed.searchParams.keys()]).toEqual(["token"]);
    expect(parsed.searchParams.get("token")).toBe(VALID_TOKEN);
    expect(parsed.searchParams.has("redirect")).toBe(false);
    expect(parsed.searchParams.has("organizationId")).toBe(false);
    expect(parsed.searchParams.has("role")).toBe(false);
    expect(parsed.searchParams.has("email")).toBe(false);
    expect(parsed.searchParams.has("utm_source")).toBe(false);
  });

  it("rejects malformed tokens and untrusted origins", () => {
    expect(buildInvitationAcceptanceUrl("not-a-token", {})).toBeNull();
    expect(
      buildInvitationAcceptanceUrl(VALID_TOKEN, {
        NEXT_PUBLIC_SITE_URL: "javascript:alert(1)",
      }),
    ).toBeNull();
    expect(
      buildInvitationAcceptanceUrl(VALID_TOKEN, {
        NEXT_PUBLIC_SITE_URL: "https://user:pass@evil.example",
      }),
    ).toBeNull();
  });

  it("supports local development origin fallback", () => {
    const url = buildInvitationAcceptanceUrl(VALID_TOKEN, {});
    expect(url).toBe(
      `http://127.0.0.1:3000${INVITATION_ACCEPTANCE_EXCHANGE_PATH}?token=${VALID_TOKEN}`,
    );
    expect(isTrustedInvitationEmailOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(isTrustedInvitationAcceptanceUrl(url!, {})).toBe(true);
  });

  it("rejects acceptance URLs that do not match trusted origin contract", () => {
    expect(
      isTrustedInvitationAcceptanceUrl(
        `https://evil.example${INVITATION_ACCEPTANCE_EXCHANGE_PATH}?token=${VALID_TOKEN}`,
        { NEXT_PUBLIC_SITE_URL: TRUSTED_ORIGIN },
      ),
    ).toBe(false);
    expect(
      isTrustedInvitationAcceptanceUrl(
        `${ACCEPTANCE_URL}&redirect=/admin`,
        { NEXT_PUBLIC_SITE_URL: TRUSTED_ORIGIN },
      ),
    ).toBe(false);
  });
});

describe("deliverInvitation / orchestrateInvitationDelivery", () => {
  it("does not call provider when delivery is disabled", async () => {
    const provider = mockProvider();
    const result = await deliverInvitation(
      {
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        organizationName: "QA Org",
        recipientEmail: "qa@example.com",
        targetRole: "staff",
        expiresAt: "2099-01-01T00:00:00.000Z",
        acceptanceUrl: ACCEPTANCE_URL,
        operation: "create",
      },
      {
        env: { INVITATION_EMAIL_DELIVERY_ENABLED: "false" },
        provider,
      },
    );
    expect(result).toEqual({ kind: "delivery_disabled" });
    expect(provider.sendInvitationEmail).not.toHaveBeenCalled();
  });

  it("blocks non-allowlisted recipients without provider calls", async () => {
    const provider = mockProvider();
    const result = await deliverInvitation(
      {
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        organizationName: "QA Org",
        recipientEmail: "blocked@example.com",
        targetRole: "staff",
        expiresAt: null,
        acceptanceUrl: ACCEPTANCE_URL,
        operation: "create",
      },
      {
        env: { ...READY_ENV },
        provider,
      },
    );
    expect(result).toEqual({ kind: "delivery_recipient_not_allowed" });
    expect(provider.sendInvitationEmail).not.toHaveBeenCalled();
  });

  it("fails closed without provider when acceptance URL is not trusted", async () => {
    const provider = mockProvider();
    const result = await deliverInvitation(
      {
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        organizationName: "QA Org",
        recipientEmail: "qa@example.com",
        targetRole: "staff",
        expiresAt: null,
        acceptanceUrl: `https://evil.example${INVITATION_ACCEPTANCE_EXCHANGE_PATH}?token=${VALID_TOKEN}`,
        operation: "create",
      },
      {
        env: { ...READY_ENV },
        provider,
      },
    );
    expect(result).toEqual({ kind: "delivery_configuration_error" });
    expect(provider.sendInvitationEmail).not.toHaveBeenCalled();
  });

  it("submits once with subject/html/text and no token metadata fields", async () => {
    const provider = mockProvider();
    const result = await deliverInvitation(
      {
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        organizationName: "QA Org",
        recipientEmail: "qa@example.com",
        targetRole: "staff",
        expiresAt: "2099-01-01T00:00:00.000Z",
        acceptanceUrl: ACCEPTANCE_URL,
        operation: "create",
        idempotencyKey: "invitation-email:create:test",
      },
      {
        env: { ...READY_ENV },
        provider,
      },
    );
    expect(result).toEqual({ kind: "submitted", providerMessageId: "msg_test" });
    expect(provider.sendInvitationEmail).toHaveBeenCalledTimes(1);
    const args = provider.sendInvitationEmail.mock.calls[0]?.[0];
    expect(args).toEqual({
      from: "ZyntixAI <invites@example.com>",
      to: "qa@example.com",
      subject: "You're invited to join QA Org on ZyntixAI",
      html: expect.stringContaining("Accept invitation"),
      text: expect.stringContaining(ACCEPTANCE_URL),
      idempotencyKey: "invitation-email:create:test",
    });
    expect(args).not.toHaveProperty("tags");
    expect(args).not.toHaveProperty("headers");
    expect(args).not.toHaveProperty("metadata");
    expect(JSON.stringify(Object.keys(args ?? {}).sort())).not.toContain(
      "token",
    );
  });

  it("maps provider failure without exposing provider payloads", async () => {
    const provider = mockProvider(async () => ({ ok: false }));
    const result = await deliverInvitation(
      {
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        organizationName: "QA Org",
        recipientEmail: "qa@example.com",
        targetRole: "staff",
        expiresAt: null,
        acceptanceUrl: ACCEPTANCE_URL,
        operation: "resend",
      },
      {
        env: { ...READY_ENV },
        provider,
      },
    );
    expect(result).toEqual({ kind: "delivery_provider_error" });
    expect(JSON.stringify(result)).not.toContain("re_test");
  });

  it("orchestrates fail-closed before loading org name when disabled", async () => {
    const provider = mockProvider();
    const loadOrganizationName = vi.fn(async () => "Should not load");
    const result = await orchestrateInvitationDelivery(
      {
        rawToken: VALID_TOKEN,
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        recipientEmail: "qa@example.com",
        targetRole: "viewer",
        expiresAt: null,
        operation: "create",
        loadOrganizationName,
      },
      {
        env: { INVITATION_EMAIL_DELIVERY_ENABLED: "false" },
        provider,
      },
    );
    expect(result).toEqual({ kind: "delivery_disabled" });
    expect(loadOrganizationName).not.toHaveBeenCalled();
    expect(provider.sendInvitationEmail).not.toHaveBeenCalled();
  });

  it("orchestrates allowlisted create through provider once", async () => {
    const provider = mockProvider();
    const result = await orchestrateInvitationDelivery(
      {
        rawToken: VALID_TOKEN,
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        recipientEmail: "qa@example.com",
        targetRole: "staff",
        expiresAt: "2099-01-01T00:00:00.000Z",
        operation: "create",
        loadOrganizationName: async () => "ZyntixAI Production QA",
      },
      {
        env: { ...READY_ENV },
        provider,
      },
    );
    expect(result.kind).toBe("submitted");
    expect(provider.sendInvitationEmail).toHaveBeenCalledTimes(1);
    const args = provider.sendInvitationEmail.mock.calls[0]?.[0];
    expect(args?.html).toContain("ZyntixAI Production QA");
    expect(args?.html).toContain("Staff");
    expect(args?.idempotencyKey).toBe(
      `invitation-email:create:${INVITE_ID}:2099-01-01T00:00:00.000Z`,
    );
    expect(args?.idempotencyKey).not.toContain(VALID_TOKEN);
  });

  it("does not call provider for malformed token during orchestration", async () => {
    const provider = mockProvider();
    const result = await orchestrateInvitationDelivery(
      {
        rawToken: "not-a-valid-token",
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        recipientEmail: "qa@example.com",
        targetRole: "staff",
        expiresAt: null,
        operation: "create",
        loadOrganizationName: async () => "QA Org",
      },
      {
        env: { ...READY_ENV },
        provider,
      },
    );
    expect(result).toEqual({ kind: "delivery_configuration_error" });
    expect(provider.sendInvitationEmail).not.toHaveBeenCalled();
  });
});
