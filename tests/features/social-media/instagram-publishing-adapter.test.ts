import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  INSTAGRAM_GRAPH_API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
} from "@/features/social-media/server/instagram-oauth-config";
import { createInstagramPublishingAdapter } from "@/features/social-media/server/instagram-publishing/adapter";
import {
  buildInstagramCreateContainerBody,
  assertOfficialInstagramGraphHost,
} from "@/features/social-media/server/instagram-publishing/requests";
import {
  mapInstagramHttpFailure,
} from "@/features/social-media/server/instagram-publishing/errors";
import {
  mintSocialMediaProviderDeliveryUrl,
  verifySocialMediaProviderDeliveryToken,
} from "@/features/social-media/server/instagram-publishing/media-delivery";
import {
  deriveInstagramCapabilitiesFromGrantedPermissions,
  connectionHasInstagramPublishPermission,
} from "@/features/social-media/server/instagram-publishing/permissions";
import { INSTAGRAM_LOGIN_CONNECT_SCOPES } from "@/features/social-media/server/instagram-oauth-config";
import { SOCIAL_INSTAGRAM_PUBLISHING_ADAPTER_STATUS } from "@/features/social-media/domain/publishing";
import type { SocialPublicationExecutionInput } from "@/features/social-media/domain/publishing";

const deliveryEnv = {
  SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET: "a".repeat(48),
  NEXT_PUBLIC_SITE_URL: "https://zyntix.example",
};

const baseInput: SocialPublicationExecutionInput = {
  publicationId: "pub-1",
  organizationId: "org-1",
  workspaceId: "ws-1",
  connectionId: "conn-1",
  provider: "instagram",
  variantVersionId: "ver-1",
  contentFormat: "image",
  mediaSnapshot: [
    {
      assetId: "asset-1",
      sortOrder: 0,
      assetRole: "primary",
      storageObjectKey: "org-1/ws-1/asset-1.jpg",
      mimeType: "image/jpeg",
      mediaCategory: "image",
    },
  ],
  operationId: "op-1",
  externalAccountId: "17841400000000000",
  caption: "Hello",
  altText: "Alt",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function adapterDeps(
  fetchImpl: ReturnType<typeof vi.fn>,
  overrides?: Partial<Parameters<typeof createInstagramPublishingAdapter>[0]>,
) {
  return createInstagramPublishingAdapter({
    accessToken: "test-access-token-not-real",
    fetchImpl: fetchImpl as never,
    env: deliveryEnv,
    connectionCapabilities: [
      "publish_image",
      "publish_video",
      "publish_carousel",
      "publish_story",
      "publish_short",
    ],
    connectionStatus: "connected",
    connectionHealth: "healthy",
    reauthorizationRequired: false,
    skipQuotaPreflight: true,
    pollIntervalMs: 0,
    pollMaxAttempts: 3,
    sleep: async () => undefined,
    ...overrides,
  });
}

describe("SMM-B1.7 Instagram publishing adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("records implemented gated adapter status and least-privilege publish scopes", () => {
    expect(SOCIAL_INSTAGRAM_PUBLISHING_ADAPTER_STATUS).toBe(
      "implemented_b17_gated",
    );
    expect(INSTAGRAM_LOGIN_CONNECT_SCOPES).toEqual([
      "instagram_business_basic",
      "instagram_business_content_publish",
    ]);
    expect(INSTAGRAM_GRAPH_API_VERSION).toBe("v26.0");
    expect(INSTAGRAM_GRAPH_BASE_URL).toBe("https://graph.instagram.com");
  });

  it("derives capabilities only from granted publish permission", () => {
    expect(
      deriveInstagramCapabilitiesFromGrantedPermissions([
        "instagram_business_basic",
      ]),
    ).toEqual([]);
    expect(
      connectionHasInstagramPublishPermission([
        "instagram_business_basic",
        "instagram_business_content_publish",
      ]),
    ).toBe(true);
    expect(
      deriveInstagramCapabilitiesFromGrantedPermissions([
        "instagram_business_basic",
        "instagram_business_content_publish",
      ]),
    ).toContain("publish_image");
  });

  it("rejects non-official Graph hosts", () => {
    expect(assertOfficialInstagramGraphHost("http://graph.instagram.com/x")).toBe(
      false,
    );
    expect(
      assertOfficialInstagramGraphHost("https://evil.example/graph"),
    ).toBe(false);
    expect(
      assertOfficialInstagramGraphHost("https://graph.instagram.com/v26.0/x"),
    ).toBe(true);
  });

  it("publishes a single image only after FINISHED container status", async () => {
    const createBodies: unknown[] = [];
    let publishCalls = 0;
    let statusCalls = 0;
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain("graph.instagram.com");
      expect(url).toContain("/v26.0/");
      if (url.includes("fields=status_code")) {
        statusCalls += 1;
        return jsonResponse({ status_code: "FINISHED" });
      }
      if (url.includes("/media_publish")) {
        publishCalls += 1;
        expect(statusCalls).toBeGreaterThanOrEqual(1);
        return jsonResponse({ id: "media_999" });
      }
      if (url.includes("/media")) {
        createBodies.push(JSON.parse(String(init?.body)));
        return jsonResponse({ id: "container_1" });
      }
      return jsonResponse({}, 404);
    });
    const adapter = adapterDeps(fetchImpl);
    const result = await adapter.publish(baseInput);
    expect(result).toEqual({
      outcome: "succeeded",
      externalPublicationId: "media_999",
    });
    expect(publishCalls).toBe(1);
    expect(statusCalls).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const createBody = createBodies[0] as {
      image_url: string;
      caption: string;
      alt_text: string;
    };
    expect(createBody.image_url).toContain("/api/social/media-delivery/");
    expect(createBody.caption).toBe("Hello");
    expect(createBody.alt_text).toBe("Alt");
  });

  it("maps ambiguous media_publish timeout to unknown_external_outcome without retry", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("fields=status_code")) {
        return jsonResponse({ status_code: "FINISHED" });
      }
      if (url.includes("/media_publish")) {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }
      return jsonResponse({ id: "container_1" });
    });
    const adapter = adapterDeps(fetchImpl);
    const result = await adapter.publish(baseInput);
    expect(result).toMatchObject({
      outcome: "unknown_external_outcome",
      failureClass: "unknown_external_outcome",
      safeErrorCode: "instagram_publish_ambiguous_timeout",
      providerDiagnostics: {
        providerStep: "media_publish",
        requestDispatched: true,
        externalContainerIdPresent: true,
        boundaryState: "ambiguous_transport",
      },
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("publishes reels with status polling before media_publish", async () => {
    let statusCalls = 0;
    const createBodies: unknown[] = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("fields=status_code")) {
        statusCalls += 1;
        return jsonResponse({
          status_code: statusCalls === 1 ? "IN_PROGRESS" : "FINISHED",
        });
      }
      if (url.includes("/media_publish")) {
        return jsonResponse({ id: "media_reel" });
      }
      createBodies.push(JSON.parse(String(init?.body)));
      return jsonResponse({ id: "container_reel" });
    });
    const adapter = adapterDeps(fetchImpl);
    const result = await adapter.publish({
      ...baseInput,
      contentFormat: "short_video",
      mediaSnapshot: [
        {
          ...baseInput.mediaSnapshot[0],
          mediaCategory: "video",
          mimeType: "video/mp4",
          storageObjectKey: "org-1/ws-1/reel.mp4",
        },
      ],
    });
    expect(result).toEqual({
      outcome: "succeeded",
      externalPublicationId: "media_reel",
    });
    expect((createBodies[0] as { media_type: string }).media_type).toBe("REELS");
    expect(statusCalls).toBe(2);
  });

  it("publishes carousel with ordered children and FINISHED waits", async () => {
    const createBodies: unknown[] = [];
    let n = 0;
    let statusCalls = 0;
    let publishCalls = 0;
    const fetch2 = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("fields=status_code")) {
        statusCalls += 1;
        return jsonResponse({ status_code: "FINISHED" });
      }
      if (url.includes("/media_publish")) {
        publishCalls += 1;
        return jsonResponse({ id: "media_car" });
      }
      if (url.includes("/media")) {
        n += 1;
        createBodies.push(JSON.parse(String(init?.body)));
        return jsonResponse({ id: `c_${n}` });
      }
      return jsonResponse({}, 404);
    });
    const adapter = adapterDeps(fetch2);
    const result = await adapter.publish({
      ...baseInput,
      contentFormat: "carousel",
      mediaSnapshot: [
        {
          assetId: "a2",
          sortOrder: 1,
          assetRole: "carousel_item",
          storageObjectKey: "org-1/k2.jpg",
          mimeType: "image/jpeg",
          mediaCategory: "image",
        },
        {
          assetId: "a1",
          sortOrder: 0,
          assetRole: "carousel_item",
          storageObjectKey: "org-1/k1.jpg",
          mimeType: "image/jpeg",
          mediaCategory: "image",
        },
      ],
    });
    expect(result).toEqual({
      outcome: "succeeded",
      externalPublicationId: "media_car",
    });
    expect(createBodies).toHaveLength(3);
    expect(statusCalls).toBe(3);
    expect(publishCalls).toBe(1);
    const parent = createBodies[2] as { children: string; media_type: string };
    expect(parent.media_type).toBe("CAROUSEL");
    expect(parent.children).toBe("c_1,c_2");
  });

  it("publishes story image without caption after FINISHED", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("fields=status_code")) {
        return jsonResponse({ status_code: "FINISHED" });
      }
      if (url.includes("/media_publish")) {
        return jsonResponse({ id: "media_story" });
      }
      if (url.includes("/media")) {
        const body = JSON.parse(String(init?.body));
        expect(body.media_type).toBe("STORIES");
        expect(body.caption).toBeUndefined();
        expect(body.image_url).toBeTruthy();
        return jsonResponse({ id: "container_story" });
      }
      return jsonResponse({}, 404);
    });
    const adapter = adapterDeps(fetchImpl);
    const result = await adapter.publish({
      ...baseInput,
      contentFormat: "story",
      caption: "should-not-send",
    });
    expect(result).toEqual({
      outcome: "succeeded",
      externalPublicationId: "media_story",
    });
  });

  it("R1-E-R2-P4: image IN_PROGRESS then FINISHED before single media_publish", async () => {
    let statusCalls = 0;
    let publishCalls = 0;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("fields=status_code")) {
        statusCalls += 1;
        return jsonResponse({
          status_code: statusCalls < 3 ? "IN_PROGRESS" : "FINISHED",
        });
      }
      if (url.includes("/media_publish")) {
        publishCalls += 1;
        expect(statusCalls).toBe(3);
        return jsonResponse({ id: "media_ready" });
      }
      return jsonResponse({ id: "container_img" });
    });
    const adapter = adapterDeps(fetchImpl, { pollMaxAttempts: 5 });
    const result = await adapter.publish(baseInput);
    expect(result).toEqual({
      outcome: "succeeded",
      externalPublicationId: "media_ready",
    });
    expect(publishCalls).toBe(1);
    expect(statusCalls).toBe(3);
  });

  it("R1-E-R2-P4: image poll timeout yields zero media_publish", async () => {
    let publishCalls = 0;
    let statusCalls = 0;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("fields=status_code")) {
        statusCalls += 1;
        return jsonResponse({ status_code: "IN_PROGRESS" });
      }
      if (url.includes("/media_publish")) {
        publishCalls += 1;
        return jsonResponse({ id: "should_not" });
      }
      return jsonResponse({ id: "container_img" });
    });
    const adapter = adapterDeps(fetchImpl, { pollMaxAttempts: 3 });
    const result = await adapter.publish(baseInput);
    expect(result).toMatchObject({
      outcome: "failed_retryable",
      failureClass: "timeout",
      safeErrorCode: "instagram_container_poll_timeout",
      providerDiagnostics: { providerStep: "container_status" },
    });
    expect(publishCalls).toBe(0);
    expect(statusCalls).toBe(3);
  });

  it("R1-E-R2-P4: ERROR/EXPIRED/unknown status never call media_publish", async () => {
    for (const [status, safeCode] of [
      ["ERROR", "instagram_container_error"],
      ["EXPIRED", "instagram_container_expired"],
      ["WEIRD", "instagram_invalid_payload"],
    ] as const) {
      let publishCalls = 0;
      const fetchImpl = vi.fn(async (url: string) => {
        if (url.includes("fields=status_code")) {
          return jsonResponse({ status_code: status });
        }
        if (url.includes("/media_publish")) {
          publishCalls += 1;
          return jsonResponse({ id: "nope" });
        }
        return jsonResponse({ id: "container_x" });
      });
      const result = await adapterDeps(fetchImpl).publish(baseInput);
      expect(publishCalls).toBe(0);
      expect(result).toMatchObject({
        safeErrorCode: safeCode,
        providerDiagnostics: { providerStep: "container_status" },
      });
    }
  });

  it("R1-E-R2-P4: container_status HTTP 400/401/429/5xx block media_publish", async () => {
    for (const [httpStatus, safeCode] of [
      [400, "instagram_http_4xx"],
      [401, "instagram_http_unauthorized"],
      [429, "instagram_http_rate_limited"],
      [503, "instagram_http_5xx"],
    ] as const) {
      let publishCalls = 0;
      let statusCalls = 0;
      const fetchImpl = vi.fn(async (url: string) => {
        if (url.includes("fields=status_code")) {
          statusCalls += 1;
          return jsonResponse(
            {
              error: {
                code: 1,
                error_subcode: 2,
                type: "OAuthException",
                message: "status failed",
              },
            },
            httpStatus,
          );
        }
        if (url.includes("/media_publish")) {
          publishCalls += 1;
          return jsonResponse({ id: "nope" });
        }
        return jsonResponse({ id: "container_x" });
      });
      const result = await adapterDeps(fetchImpl).publish(baseInput);
      expect(publishCalls).toBe(0);
      expect(statusCalls).toBe(1);
      expect(result).toMatchObject({
        safeErrorCode: safeCode,
        providerDiagnostics: { providerStep: "container_status" },
      });
    }
  });

  it("R1-E-R2-P4: malformed status payload blocks media_publish", async () => {
    let publishCalls = 0;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("fields=status_code")) {
        return jsonResponse({ status_code: null });
      }
      if (url.includes("/media_publish")) {
        publishCalls += 1;
        return jsonResponse({ id: "nope" });
      }
      return jsonResponse({ id: "container_x" });
    });
    const result = await adapterDeps(fetchImpl).publish(baseInput);
    expect(publishCalls).toBe(0);
    expect(result).toMatchObject({
      safeErrorCode: "instagram_invalid_payload",
      providerDiagnostics: { providerStep: "container_status" },
    });
  });

  it("fails closed on missing capability and text format", async () => {
    const fetchImpl = vi.fn();
    const adapter = adapterDeps(fetchImpl, {
      connectionCapabilities: ["publish_image"],
    });
    expect(
      await adapter.preflight({ ...baseInput, contentFormat: "story" }),
    ).toBe("unsupported_capability");
    expect(
      await adapter.preflight({ ...baseInput, contentFormat: "text" }),
    ).toBe("unsupported_capability");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires reauthorization when connection flag is set", async () => {
    const adapter = adapterDeps(vi.fn(), {
      reauthorizationRequired: true,
    });
    expect(await adapter.preflight(baseInput)).toBe(
      "reauthorization_required",
    );
  });

  it("maps container expired and rate limit classes", () => {
    expect(mapInstagramHttpFailure({ reason: "container_expired" }).outcome).toBe(
      "failed_terminal",
    );
    expect(mapInstagramHttpFailure({ reason: "quota_exhausted" }).failureClass).toBe(
      "rate_limit",
    );
  });

  it("builds typed container bodies", () => {
    expect(
      buildInstagramCreateContainerBody({
        kind: "carousel",
        children: ["1", "2"],
        caption: "c",
      }),
    ).toEqual({
      media_type: "CAROUSEL",
      children: "1,2",
      caption: "c",
    });
  });

  it("mints and verifies signed media delivery tokens; rejects tamper/expiry/unsafe keys", () => {
    const minted = mintSocialMediaProviderDeliveryUrl({
      organizationId: "org-1",
      assetId: "asset-1",
      storageObjectKey: "org-1/path/a.jpg",
      env: deliveryEnv,
    });
    expect(minted.ok).toBe(true);
    if (!minted.ok) {
      return;
    }
    const token = minted.url.split("/").pop()!;
    expect(
      verifySocialMediaProviderDeliveryToken({
        token,
        env: deliveryEnv,
        expectedStorageObjectKey: "org-1/path/a.jpg",
      }).ok,
    ).toBe(true);
    expect(
      verifySocialMediaProviderDeliveryToken({
        token: token.slice(0, -2) + "xx",
        env: deliveryEnv,
      }).ok,
    ).toBe(false);
    expect(
      verifySocialMediaProviderDeliveryToken({
        token,
        env: deliveryEnv,
        now: new Date(Date.now() + 2 * 60 * 60 * 1000),
      }).ok,
    ).toBe(false);
    expect(
      mintSocialMediaProviderDeliveryUrl({
        organizationId: "org-1",
        assetId: "asset-1",
        storageObjectKey: "../etc/passwd",
        env: deliveryEnv,
      }).ok,
    ).toBe(false);
    expect(
      mintSocialMediaProviderDeliveryUrl({
        organizationId: "org-1",
        assetId: "asset-1",
        storageObjectKey: "other-org/path.jpg",
        env: deliveryEnv,
      }).ok,
    ).toBe(false);
  });
});
