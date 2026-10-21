import { describe, expect, it } from "vitest";
import {
  createRawSocialOAuthStateSecret,
  fingerprintSocialOAuthRawState,
  generateSocialOAuthState,
  SOCIAL_OAUTH_RAW_STATE_BYTE_LENGTH,
} from "@/features/social-media/server/oauth-state";
import { isSocialOAuthStateFingerprint } from "@/features/social-media/domain/oauth-state";

describe("SMM-B1.1-C OAuth state generation", () => {
  it("generates opaque high-entropy state values that differ", () => {
    const a = generateSocialOAuthState();
    const b = generateSocialOAuthState();
    expect(a.rawState.value).toHaveLength(SOCIAL_OAUTH_RAW_STATE_BYTE_LENGTH * 2);
    expect(b.rawState.value).toHaveLength(SOCIAL_OAUTH_RAW_STATE_BYTE_LENGTH * 2);
    expect(a.rawState.value).not.toBe(b.rawState.value);
    expect(a.fingerprint).not.toBe(b.fingerprint);
    expect(/^[0-9a-f]+$/.test(a.rawState.value)).toBe(true);
  });

  it("fingerprints deterministically as 64-hex SHA-256", () => {
    const raw = createRawSocialOAuthStateSecret("a".repeat(64));
    const first = fingerprintSocialOAuthRawState(raw);
    const second = fingerprintSocialOAuthRawState(raw.value);
    expect(first).toBe(second);
    expect(isSocialOAuthStateFingerprint(first)).toBe(true);
  });

  it("rejects empty or malformed fingerprint inputs", () => {
    expect(fingerprintSocialOAuthRawState("")).toBeNull();
  });

  it("does not embed org, user, or token material in generated state", () => {
    const generated = generateSocialOAuthState();
    expect(generated.rawState.value).not.toMatch(/org/i);
    expect(generated.rawState.value).not.toMatch(/token/i);
    expect(generated.rawState.value).not.toContain("-");
  });
});
