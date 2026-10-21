import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SOCIAL_CONNECTION_CLIENT_FORBIDDEN_KEYS,
  socialConnectionClientReadModelLooksSafe,
  toSocialConnectionClientReadModel,
  type SocialAccountConnection,
  type SocialConnectionClientReadModel,
} from "@/features/social-media/domain/connection";
import { resolveSocialTokenExpiryWarningState } from "@/features/social-media/domain/credentials";
import {
  SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
  SOCIAL_CREDENTIAL_ENCRYPTION_VERSION,
  isRawSocialOAuthStateSecret,
  type EncryptedSocialCredentialMaterial,
  type RawSocialOAuthStateSecret,
} from "@/features/social-media/server/credential-secrets";

const NOW = "2026-08-14T12:00:00.000Z";

function connection(
  overrides: Partial<SocialAccountConnection> = {},
): SocialAccountConnection {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    organizationId: "11111111-1111-4111-8111-111111111111",
    workspaceId: "33333333-3333-4333-8333-333333333333",
    provider: "instagram",
    loginProduct: "instagram_login",
    externalAccountId: "17841405309211844",
    displayName: "Brand",
    professionalAccountType: "business",
    status: "connected",
    health: "healthy",
    capabilitySnapshot: {
      provider: "instagram",
      externalAccountId: "17841405309211844",
      capabilities: ["publish_image"],
      observedAt: NOW,
    },
    credential: {
      credentialReferenceId: "44444444-4444-4444-8444-444444444444",
      provider: "instagram",
      tokenExpiresAt: "2026-09-14T12:00:00.000Z",
      lastRefreshedAt: NOW,
      credentialVersion: 1,
      reauthorizationRequired: false,
    },
    connectedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    reauthorizationRequiredAt: null,
    ...overrides,
  };
}

describe("client-safe social connection read model", () => {
  it("exposes operational fields without credential material", () => {
    const readModel = toSocialConnectionClientReadModel(connection(), NOW);
    expect(readModel).toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      provider: "instagram",
      displayName: "Brand",
      professionalAccountType: "business",
      status: "connected",
      health: "healthy",
      capabilities: ["publish_image"],
      tokenExpiryWarning: "valid",
      needsReauthorization: false,
      connectedAt: NOW,
    });
    expect(
      socialConnectionClientReadModelLooksSafe(
        readModel as unknown as Record<string, unknown>,
      ),
    ).toBe(true);
    for (const key of SOCIAL_CONNECTION_CLIENT_FORBIDDEN_KEYS) {
      expect(key in readModel).toBe(false);
    }
  });

  it("flags reauthorization without exposing tokens", () => {
    const readModel = toSocialConnectionClientReadModel(
      connection({
        status: "reauthorization_required",
        credential: {
          credentialReferenceId: "44444444-4444-4444-8444-444444444444",
          provider: "instagram",
          tokenExpiresAt: "2026-08-01T00:00:00.000Z",
          lastRefreshedAt: NOW,
          credentialVersion: 3,
          reauthorizationRequired: true,
        },
      }),
      NOW,
    );
    expect(readModel.needsReauthorization).toBe(true);
    expect(readModel.tokenExpiryWarning).toBe("expired");
    expect("accessToken" in readModel).toBe(false);
    expect("credentialVersion" in readModel).toBe(false);
  });
});

describe("token expiry metadata", () => {
  it("classifies expiry without exposing token values", () => {
    expect(
      resolveSocialTokenExpiryWarningState({
        tokenExpiresAt: null,
        nowIso: NOW,
      }),
    ).toBe("unknown");
    expect(
      resolveSocialTokenExpiryWarningState({
        tokenExpiresAt: "2026-08-14T13:00:00.000Z",
        nowIso: NOW,
        expiringSoonWindowMs: 2 * 60 * 60 * 1000,
      }),
    ).toBe("expiring_soon");
  });
});

describe("secret-bearing type boundary", () => {
  it("keeps encrypted credential and raw OAuth state off the client read model", () => {
    const encrypted: EncryptedSocialCredentialMaterial = {
      encryptionVersion: SOCIAL_CREDENTIAL_ENCRYPTION_VERSION,
      keyPurpose: SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
      keyVersion: 1,
      ciphertext: "opaque",
      iv: "opaque",
      authTag: "opaque",
    };
    const raw: RawSocialOAuthStateSecret = {
      __brand: "RawSocialOAuthStateSecret",
      value: "one-time-secret",
    };
    expect(isRawSocialOAuthStateSecret(raw)).toBe(true);

    const readModel: SocialConnectionClientReadModel =
      toSocialConnectionClientReadModel(connection(), NOW);
    const readKeys = Object.keys(readModel);
    expect(readKeys).not.toContain("ciphertext");
    expect(readKeys).not.toContain("iv");
    expect(readKeys).not.toContain("authTag");
    expect(readKeys).not.toContain("value");
    expect(encrypted.ciphertext).toBe("opaque");
  });

  it("does not import server-only secrets from the domain barrel", () => {
    const domainIndex = readFileSync(
      join(process.cwd(), "src/features/social-media/domain/index.ts"),
      "utf8",
    );
    expect(domainIndex).not.toContain("credential-secrets");
    expect(domainIndex).not.toContain("server-only");
    expect(domainIndex).not.toContain("RawSocialOAuthStateSecret");
    expect(domainIndex).not.toContain("EncryptedSocialCredentialMaterial");
    expect(domainIndex).not.toContain("INVITE_CONTINUATION_SECRET");
  });

  it("marks credential secret module as server-only and non-crypto", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/credential-secrets.ts",
      ),
      "utf8",
    );
    expect(source).toContain('import "server-only"');
    expect(source).not.toContain("createCipheriv");
    expect(source).not.toContain("createDecipheriv");
    expect(source).not.toContain("randomBytes");
    expect(source).toContain("never persist");
    expect(source).toContain("never logged");
  });
});
