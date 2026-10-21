import { describe, expect, it, vi } from "vitest";
import { createMemoryInvitationDeliveryAttemptStore } from "@/features/invitations/server/delivery/attempt-store";
import {
  buildInvitationDeliveryGenerationKey,
  buildInvitationDeliveryIdempotencyKey,
} from "@/features/invitations/server/delivery/idempotency";
import { orchestrateInvitationDelivery } from "@/features/invitations/server/delivery/orchestrate-invitation-delivery";
import type { InvitationEmailProvider } from "@/features/invitations/server/delivery/types";
import { INVITATION_ACCEPTANCE_EXCHANGE_PATH } from "@/features/invitations/server/delivery/acceptance-url";

const VALID_TOKEN =
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const OTHER_TOKEN =
  "1111111111111111111111111111111111111111111111111111111111111111";
const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ORG_ID = "11111111-1111-4111-8111-111111111111";
const EXPIRES = "2099-01-01T00:00:00.000Z";
const EXPIRES_ROTATED = "2099-01-08T00:00:00.000Z";
const TRUSTED_ORIGIN = "https://zyntixai.example";

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

describe("CB-E1-C invitation delivery idempotency", () => {
  it("derives stable generation/idempotency keys without token or email", () => {
    const createKey = buildInvitationDeliveryIdempotencyKey({
      invitationId: INVITE_ID,
      operation: "create",
      expiresAt: EXPIRES,
    });
    const createAgain = buildInvitationDeliveryIdempotencyKey({
      invitationId: INVITE_ID,
      operation: "create",
      expiresAt: EXPIRES,
    });
    const resendKey = buildInvitationDeliveryIdempotencyKey({
      invitationId: INVITE_ID,
      operation: "resend",
      expiresAt: EXPIRES,
    });
    const rotated = buildInvitationDeliveryIdempotencyKey({
      invitationId: INVITE_ID,
      operation: "resend",
      expiresAt: EXPIRES_ROTATED,
    });

    expect(createKey).toBe(createAgain);
    expect(createKey).toBe(
      `invite-delivery/create:${INVITE_ID}:${EXPIRES}`,
    );
    expect(createKey).not.toBe(resendKey);
    expect(resendKey).not.toBe(rotated);
    expect(createKey).not.toContain(VALID_TOKEN);
    expect(createKey.toLowerCase()).not.toContain("@");
    expect(
      buildInvitationDeliveryGenerationKey({
        invitationId: INVITE_ID,
        operation: "create",
        expiresAt: EXPIRES,
      }),
    ).toBe(`create:${INVITE_ID}:${EXPIRES}`);
  });

  it("passes the same provider idempotency key and records a submitted attempt once", async () => {
    const provider = mockProvider();
    const store = createMemoryInvitationDeliveryAttemptStore();
    const expectedKey = buildInvitationDeliveryIdempotencyKey({
      invitationId: INVITE_ID,
      operation: "create",
      expiresAt: EXPIRES,
    });

    const first = await orchestrateInvitationDelivery(
      {
        rawToken: VALID_TOKEN,
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        recipientEmail: "qa@example.com",
        targetRole: "staff",
        expiresAt: EXPIRES,
        operation: "create",
        loadOrganizationName: async () => "QA Org",
      },
      { env: { ...READY_ENV }, provider, attemptStore: store },
    );

    expect(first).toEqual({
      kind: "submitted",
      providerMessageId: "msg_test",
    });
    expect(provider.sendInvitationEmail).toHaveBeenCalledTimes(1);
    expect(provider.sendInvitationEmail.mock.calls[0]?.[0]?.idempotencyKey).toBe(
      expectedKey,
    );
    expect(store.records.size).toBe(1);
    const record = [...store.records.values()][0];
    expect(record?.status).toBe("submitted");
    expect(record?.providerMessageId).toBe("msg_test");
    expect(record?.idempotencyKey).toBe(expectedKey);
  });

  it("deduplicates duplicate orchestration for the same generation without a second provider call", async () => {
    const provider = mockProvider();
    const store = createMemoryInvitationDeliveryAttemptStore();
    const params = {
      rawToken: VALID_TOKEN,
      invitationId: INVITE_ID,
      organizationId: ORG_ID,
      recipientEmail: "qa@example.com",
      targetRole: "staff",
      expiresAt: EXPIRES,
      operation: "create" as const,
      loadOrganizationName: async () => "QA Org",
    };

    await orchestrateInvitationDelivery(params, {
      env: { ...READY_ENV },
      provider,
      attemptStore: store,
    });
    const second = await orchestrateInvitationDelivery(params, {
      env: { ...READY_ENV },
      provider,
      attemptStore: store,
    });

    expect(second).toEqual({
      kind: "submitted",
      providerMessageId: "msg_test",
    });
    expect(provider.sendInvitationEmail).toHaveBeenCalledTimes(1);
  });

  it("allows a new provider call after token rotation (new generation)", async () => {
    const provider = mockProvider(async () => ({
      ok: true as const,
      id: "msg_rotated",
    }));
    const store = createMemoryInvitationDeliveryAttemptStore();

    await orchestrateInvitationDelivery(
      {
        rawToken: VALID_TOKEN,
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        recipientEmail: "qa@example.com",
        targetRole: "viewer",
        expiresAt: EXPIRES,
        operation: "resend",
        loadOrganizationName: async () => "QA Org",
      },
      { env: { ...READY_ENV }, provider, attemptStore: store },
    );

    await orchestrateInvitationDelivery(
      {
        rawToken: OTHER_TOKEN,
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        recipientEmail: "qa@example.com",
        targetRole: "viewer",
        expiresAt: EXPIRES_ROTATED,
        operation: "resend",
        loadOrganizationName: async () => "QA Org",
      },
      { env: { ...READY_ENV }, provider, attemptStore: store },
    );

    expect(provider.sendInvitationEmail).toHaveBeenCalledTimes(2);
    expect(store.records.size).toBe(2);
    const keys = [...store.records.values()].map((row) => row.idempotencyKey);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("records provider failure and reuses the same idempotency key on same-generation retry", async () => {
    const provider = mockProvider();
    provider.sendInvitationEmail
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, id: "msg_retry" });
    const store = createMemoryInvitationDeliveryAttemptStore();
    const expectedKey = buildInvitationDeliveryIdempotencyKey({
      invitationId: INVITE_ID,
      operation: "create",
      expiresAt: EXPIRES,
    });
    const params = {
      rawToken: VALID_TOKEN,
      invitationId: INVITE_ID,
      organizationId: ORG_ID,
      recipientEmail: "qa@example.com",
      targetRole: "staff",
      expiresAt: EXPIRES,
      operation: "create" as const,
      loadOrganizationName: async () => "QA Org",
    };

    const failed = await orchestrateInvitationDelivery(params, {
      env: { ...READY_ENV },
      provider,
      attemptStore: store,
    });
    expect(failed).toEqual({ kind: "delivery_provider_error" });
    expect([...store.records.values()][0]?.status).toBe("failed");

    const retried = await orchestrateInvitationDelivery(params, {
      env: { ...READY_ENV },
      provider,
      attemptStore: store,
    });
    expect(retried).toEqual({
      kind: "submitted",
      providerMessageId: "msg_retry",
    });
    expect(provider.sendInvitationEmail).toHaveBeenCalledTimes(2);
    expect(provider.sendInvitationEmail.mock.calls[0]?.[0]?.idempotencyKey).toBe(
      expectedKey,
    );
    expect(provider.sendInvitationEmail.mock.calls[1]?.[0]?.idempotencyKey).toBe(
      expectedKey,
    );
    expect([...store.records.values()][0]?.status).toBe("submitted");
  });

  it("does not persist allowlist blocks and never calls provider", async () => {
    const provider = mockProvider();
    const store = createMemoryInvitationDeliveryAttemptStore();
    const result = await orchestrateInvitationDelivery(
      {
        rawToken: VALID_TOKEN,
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        recipientEmail: "blocked@example.com",
        targetRole: "staff",
        expiresAt: EXPIRES,
        operation: "create",
        loadOrganizationName: async () => "QA Org",
      },
      { env: { ...READY_ENV }, provider, attemptStore: store },
    );
    expect(result).toEqual({ kind: "delivery_recipient_not_allowed" });
    expect(provider.sendInvitationEmail).not.toHaveBeenCalled();
    expect(store.records.size).toBe(0);
  });

  it("keeps acceptance URL out of attempt records", async () => {
    const provider = mockProvider();
    const store = createMemoryInvitationDeliveryAttemptStore();
    await orchestrateInvitationDelivery(
      {
        rawToken: VALID_TOKEN,
        invitationId: INVITE_ID,
        organizationId: ORG_ID,
        recipientEmail: "qa@example.com",
        targetRole: "staff",
        expiresAt: EXPIRES,
        operation: "create",
        loadOrganizationName: async () => "QA Org",
      },
      { env: { ...READY_ENV }, provider, attemptStore: store },
    );
    const serialized = JSON.stringify([...store.records.values()]);
    expect(serialized).not.toContain(VALID_TOKEN);
    expect(serialized).not.toContain(INVITATION_ACCEPTANCE_EXCHANGE_PATH);
    expect(serialized).not.toContain("qa@example.com");
  });
});
