import { describe, expect, it } from "vitest";
import {
  isSocialOAuthFailureStage,
  SOCIAL_OAUTH_FAILURE_STAGES,
} from "@/features/social-media/domain/oauth-failure-stage";

describe("SMM-B1.7-R1 opaque OAuth failure stages", () => {
  it("exposes only the closed diagnostic stage set", () => {
    expect(SOCIAL_OAUTH_FAILURE_STAGES).toEqual([
      "authorization_code_exchange",
      "long_lived_token_exchange",
      "professional_identity_fetch",
      "credential_encrypt_or_upsert",
      "connection_finalize",
    ]);
    for (const stage of SOCIAL_OAUTH_FAILURE_STAGES) {
      expect(isSocialOAuthFailureStage(stage)).toBe(true);
    }
    expect(isSocialOAuthFailureStage("access_token")).toBe(false);
    expect(isSocialOAuthFailureStage("client_secret")).toBe(false);
    expect(isSocialOAuthFailureStage("../etc/passwd")).toBe(false);
  });
});
