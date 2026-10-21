import { afterEach, describe, expect, it } from "vitest";
import {
  deriveInvitationContinuationKey,
  hasValidInvitationContinuation,
  INVITE_CONTINUATION_SECRET_MIN_LENGTH,
  sealInvitationContinuation,
} from "@/features/invitations/server/continuation";
import {
  deriveInvitationRegistrationOriginKey,
  INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
  INVITE_REGISTRATION_ORIGIN_KEY_PURPOSE,
  INVITE_REGISTRATION_ORIGIN_TTL_SECONDS,
  isBoundInvitationRegistrationOrigin,
  isRealNewAuthIdentity,
  sealInvitationRegistrationOrigin,
  unsealInvitationRegistrationOrigin,
} from "@/features/invitations/server/registration-origin";
import {
  resolveInvitationAuthState,
} from "@/features/invitations/server/resolve-invitation-auth-state";

const TEST_SECRET = "d".repeat(INVITE_CONTINUATION_SECRET_MIN_LENGTH);
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VALID_TOKEN = "ab".repeat(32);

describe("invitation registration origin", () => {
  const previous = process.env.INVITE_CONTINUATION_SECRET;
  const previousGate = process.env.INVITATIONS_ENABLED;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.INVITE_CONTINUATION_SECRET;
    } else {
      process.env.INVITE_CONTINUATION_SECRET = previous;
    }
    if (previousGate === undefined) {
      delete process.env.INVITATIONS_ENABLED;
    } else {
      process.env.INVITATIONS_ENABLED = previousGate;
    }
  });

  it("uses a distinct KDF purpose from Slice-A continuation", () => {
    expect(INVITE_REGISTRATION_ORIGIN_KEY_PURPOSE).toContain(
      "registration-origin",
    );
    const originKey = deriveInvitationRegistrationOriginKey(TEST_SECRET);
    const continuationKey = deriveInvitationContinuationKey(TEST_SECRET);
    expect(originKey.equals(continuationKey)).toBe(false);
  });

  it("rejects continuation ciphertext as registration-origin and vice versa", () => {
    const continuation = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(continuation.ok).toBe(true);
    if (!continuation.ok) {
      return;
    }
    expect(
      unsealInvitationRegistrationOrigin(continuation.cookieValue, {
        secret: TEST_SECRET,
      }).ok,
    ).toBe(false);

    const origin = sealInvitationRegistrationOrigin(USER_A, {
      secret: TEST_SECRET,
    });
    expect(origin.ok).toBe(true);
    if (!origin.ok) {
      return;
    }
    expect(
      sealInvitationContinuation(VALID_TOKEN, { secret: TEST_SECRET }).ok,
    ).toBe(true);
    expect(
      hasValidInvitationContinuation(origin.cookieValue, { secret: TEST_SECRET }),
    ).toBe(false);
  });

  it("round-trips user-bound origin with 48h TTL", () => {
    const nowMs = 1_700_000_000_000;
    const sealed = sealInvitationRegistrationOrigin(USER_A, {
      secret: TEST_SECRET,
      nowMs,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    expect(sealed.maxAge).toBe(INVITE_REGISTRATION_ORIGIN_TTL_SECONDS);
    expect(sealed.cookieValue).not.toContain(USER_A);

    const unsealed = unsealInvitationRegistrationOrigin(sealed.cookieValue, {
      secret: TEST_SECRET,
      nowMs,
    });
    expect(unsealed).toEqual({
      ok: true,
      createdUserId: USER_A,
      issuedAt: 1_700_000_000,
      expiresAt: 1_700_000_000 + INVITE_REGISTRATION_ORIGIN_TTL_SECONDS,
    });
  });

  it("binds trust to created_user_id only", () => {
    const sealed = sealInvitationRegistrationOrigin(USER_A, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    expect(
      isBoundInvitationRegistrationOrigin(sealed.cookieValue, USER_A, {
        secret: TEST_SECRET,
      }),
    ).toBe(true);
    expect(
      isBoundInvitationRegistrationOrigin(sealed.cookieValue, USER_B, {
        secret: TEST_SECRET,
      }),
    ).toBe(false);
    expect(
      isBoundInvitationRegistrationOrigin(sealed.cookieValue, null, {
        secret: TEST_SECRET,
      }),
    ).toBe(false);
  });

  it("rejects expired and tampered origin", () => {
    const issuedAtMs = 1_700_000_000_000;
    const sealed = sealInvitationRegistrationOrigin(USER_A, {
      secret: TEST_SECRET,
      nowMs: issuedAtMs,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    expect(
      unsealInvitationRegistrationOrigin(sealed.cookieValue, {
        secret: TEST_SECRET,
        nowMs: issuedAtMs + INVITE_REGISTRATION_ORIGIN_TTL_SECONDS * 1000,
      }).ok,
    ).toBe(false);

    const tampered = `${sealed.cookieValue.slice(0, -2)}aa`;
    expect(
      unsealInvitationRegistrationOrigin(tampered, { secret: TEST_SECRET }).ok,
    ).toBe(false);
  });

  it("requires real new auth identity evidence", () => {
    expect(isRealNewAuthIdentity(null)).toBe(false);
    expect(isRealNewAuthIdentity({ id: USER_A, identities: [] })).toBe(false);
    expect(isRealNewAuthIdentity({ id: USER_A, identities: undefined })).toBe(
      false,
    );
    expect(
      isRealNewAuthIdentity({
        id: USER_A,
        identities: [{ provider: "email" }],
      }),
    ).toBe(true);
  });

  it("resolves invitation auth priority raw > bound origin > none", () => {
    process.env.INVITE_CONTINUATION_SECRET = TEST_SECRET;
    process.env.INVITATIONS_ENABLED = "true";
    const raw = sealInvitationContinuation(VALID_TOKEN, { secret: TEST_SECRET });
    const origin = sealInvitationRegistrationOrigin(USER_A, {
      secret: TEST_SECRET,
    });
    expect(raw.ok && origin.ok).toBe(true);
    if (!raw.ok || !origin.ok) {
      return;
    }

    expect(
      resolveInvitationAuthState({
        cookies: {
          continuation: raw.cookieValue,
          registrationOrigin: origin.cookieValue,
        },
        authenticatedUserId: USER_A,
      }).kind,
    ).toBe("raw_continuation");

    expect(
      resolveInvitationAuthState({
        cookies: { registrationOrigin: origin.cookieValue },
        authenticatedUserId: USER_A,
      }).kind,
    ).toBe("bound_registration_origin");

    expect(
      resolveInvitationAuthState({
        cookies: { registrationOrigin: origin.cookieValue },
        authenticatedUserId: USER_B,
      }).kind,
    ).toBe("none");

    expect(INVITE_REGISTRATION_ORIGIN_COOKIE_NAME).toBe(
      "zyntix_invite_registration_origin",
    );
  });
});
