import { describe, expect, it } from "vitest";
import {
  validateSocialConnectRequest,
  validateSocialDisconnectRequest,
  validateSocialReauthorizeRequest,
} from "@/features/social-media/validation/mutation-schemas";

const WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
const CONNECTION_ID = "22222222-2222-4222-8222-222222222222";

describe("social connect request schema", () => {
  it("accepts workspaceId and implemented provider only", () => {
    const result = validateSocialConnectRequest({
      workspaceId: WORKSPACE_ID,
      provider: "instagram",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        workspaceId: WORKSPACE_ID,
        provider: "instagram",
      });
    }
  });

  it("rejects extra authority fields from the browser", () => {
    const extraFields = [
      "organizationId",
      "externalAccountId",
      "accessToken",
      "refreshToken",
      "scopes",
      "callbackUrl",
      "returnUrl",
      "authorizationCode",
      "loginProduct",
    ];
    for (const field of extraFields) {
      const result = validateSocialConnectRequest({
        workspaceId: WORKSPACE_ID,
        provider: "instagram",
        [field]: "attacker-controlled",
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects unsupported providers and non-uuid workspace ids", () => {
    expect(
      validateSocialConnectRequest({
        workspaceId: WORKSPACE_ID,
        provider: "facebook",
      }).success,
    ).toBe(false);
    expect(
      validateSocialConnectRequest({
        workspaceId: "17841405309211844",
        provider: "instagram",
      }).success,
    ).toBe(false);
  });
});

describe("social disconnect and reauthorize schemas", () => {
  it("accepts only connectionId", () => {
    expect(
      validateSocialDisconnectRequest({ connectionId: CONNECTION_ID }).success,
    ).toBe(true);
    expect(
      validateSocialReauthorizeRequest({ connectionId: CONNECTION_ID }).success,
    ).toBe(true);
  });

  it("rejects organization, external account, and credential authority fields", () => {
    for (const extra of [
      { organizationId: WORKSPACE_ID },
      { externalAccountId: "17841405309211844" },
      { accessToken: "secret" },
    ]) {
      expect(
        validateSocialDisconnectRequest({
          connectionId: CONNECTION_ID,
          ...extra,
        }).success,
      ).toBe(false);
      expect(
        validateSocialReauthorizeRequest({
          connectionId: CONNECTION_ID,
          ...extra,
        }).success,
      ).toBe(false);
    }
  });
});
