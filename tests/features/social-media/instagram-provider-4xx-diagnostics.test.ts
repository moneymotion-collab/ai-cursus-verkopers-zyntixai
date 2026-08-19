import { describe, expect, it, vi } from "vitest";
import { createInstagramPublishingAdapter } from "@/features/social-media/server/instagram-publishing/adapter";
import {
  buildInstagramProviderDiagnostics,
  sanitizeInstagramProviderMessage,
  sanitizeInstagramProviderErrorType,
} from "@/features/social-media/server/instagram-publishing/diagnostics";
import { mapInstagramHttpFailure } from "@/features/social-media/server/instagram-publishing/errors";
import { isRetryableFailureClass } from "@/features/social-media/domain/publishing";
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

function graphError(status: number, code: number, subcode?: number, message?: string) {
  return jsonResponse(
    {
      error: {
        message: message ?? "Safe provider message",
        type: "OAuthException",
        code,
        error_subcode: subcode ?? null,
      },
    },
    status,
  );
}

function adapter(fetchImpl: ReturnType<typeof vi.fn>) {
  return createInstagramPublishingAdapter({
    accessToken: "test-access-token-not-real",
    fetchImpl: fetchImpl as never,
    env: deliveryEnv,
    connectionCapabilities: ["publish_image"],
    connectionStatus: "connected",
    connectionHealth: "healthy",
    reauthorizationRequired: false,
    skipQuotaPreflight: true,
  });
}

describe("SMM-R1-E-R1 Instagram provider 4xx diagnostics", () => {
  it("sanitizes provider messages and rejects secrets/URLs", () => {
    expect(sanitizeInstagramProviderMessage("Image aspect ratio invalid")).toBe(
      "Image aspect ratio invalid",
    );
    expect(
      sanitizeInstagramProviderMessage("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb"),
    ).toBeNull();
    expect(
      sanitizeInstagramProviderMessage(
        "fetch failed https://zyntix.example/api/social/media-delivery/x?sig=abc",
      ),
    ).toBeNull();
    expect(
      sanitizeInstagramProviderMessage("token=supersecret access_token leak"),
    ).toBeNull();
    expect(sanitizeInstagramProviderErrorType("OAuthException")).toBe(
      "oauthexception",
    );
    expect(sanitizeInstagramProviderErrorType("Bad Type!")).toBeNull();
  });

  it("never persists signed media URL material in diagnostics", () => {
    const diagnostics = buildInstagramProviderDiagnostics({
      providerStep: "create_container",
      httpStatus: 400,
      providerErrorCode: 100,
      providerMessage:
        "Cannot download from https://zyntix.example/api/social/media-delivery/tok?sig=deadbeef",
      requestDispatched: true,
      responseReceived: true,
    });
    expect(diagnostics.safeProviderMessage).toBeNull();
    expect(JSON.stringify(diagnostics)).not.toContain("media-delivery");
    expect(JSON.stringify(diagnostics)).not.toContain("sig=");
  });

  it("maps create_container Graph 400 with step + codes", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toContain("/media");
      expect(url).not.toContain("/media_publish");
      return graphError(400, 100, 2207003, "Media could not be fetched");
    });
    const result = await adapter(fetchImpl).publish(baseInput);
    expect(result.outcome).toBe("failed_terminal");
    if (result.outcome === "succeeded") throw new Error("expected failure");
    expect(result.safeErrorCode).toBe("instagram_http_4xx");
    expect(result.failureClass).toBe("provider_permanent");
    expect(isRetryableFailureClass(result.failureClass)).toBe(false);
    expect(result.providerDiagnostics).toMatchObject({
      providerStep: "create_container",
      httpStatus: 400,
      providerErrorCode: 100,
      providerErrorSubcode: 2207003,
      providerErrorType: "oauthexception",
      safeProviderMessage: "Media could not be fetched",
      requestDispatched: true,
      responseReceived: true,
      externalContainerIdPresent: false,
      boundaryState: "definitive_rejection",
    });
    expect(JSON.stringify(result)).not.toContain("test-access-token");
    expect(JSON.stringify(result)).not.toContain("media-delivery");
  });

  it("maps create_container Graph 403 to unauthorized with step", async () => {
    const fetchImpl = vi.fn(async () =>
      graphError(403, 10, undefined, "Permission denied"),
    );
    const result = await adapter(fetchImpl).publish(baseInput);
    if (result.outcome === "succeeded") throw new Error("expected failure");
    expect(result.safeErrorCode).toBe("instagram_http_unauthorized");
    expect(result.failureClass).toBe("authorization");
    expect(result.providerDiagnostics?.providerStep).toBe("create_container");
    expect(result.providerDiagnostics?.httpStatus).toBe(403);
  });

  it("maps media_publish Graph 400 with step after container create", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/media_publish")) {
        return graphError(400, 9007, 2207020, "Media publish failed");
      }
      return jsonResponse({ id: "container_1" });
    });
    const result = await adapter(fetchImpl).publish(baseInput);
    if (result.outcome === "succeeded") throw new Error("expected failure");
    expect(result.safeErrorCode).toBe("instagram_http_4xx");
    expect(result.providerDiagnostics).toMatchObject({
      providerStep: "media_publish",
      httpStatus: 400,
      providerErrorCode: 9007,
      providerErrorSubcode: 2207020,
      externalContainerIdPresent: true,
      externalPublicationIdPresent: false,
      boundaryState: "definitive_rejection",
    });
  });

  it("maps media_publish Graph 403 to unauthorized with step", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/media_publish")) {
        return graphError(403, 10, undefined, "Not allowed");
      }
      return jsonResponse({ id: "container_1" });
    });
    const result = await adapter(fetchImpl).publish(baseInput);
    if (result.outcome === "succeeded") throw new Error("expected failure");
    expect(result.safeErrorCode).toBe("instagram_http_unauthorized");
    expect(result.providerDiagnostics?.providerStep).toBe("media_publish");
    expect(result.providerDiagnostics?.httpStatus).toBe(403);
  });

  it("keeps rate-limit and 5xx classifications", async () => {
    const rate = await adapter(
      vi.fn(async () => graphError(429, 4, undefined, "Rate limited")),
    ).publish(baseInput);
    if (rate.outcome === "succeeded") throw new Error("expected failure");
    expect(rate.safeErrorCode).toBe("instagram_http_rate_limited");
    expect(rate.failureClass).toBe("rate_limit");
    expect(isRetryableFailureClass(rate.failureClass)).toBe(true);

    const five = await adapter(
      vi.fn(async () => graphError(503, 1, undefined, "Unavailable")),
    ).publish(baseInput);
    if (five.outcome === "succeeded") throw new Error("expected failure");
    expect(five.safeErrorCode).toBe("instagram_http_5xx");
    expect(five.failureClass).toBe("provider_temporary");
    expect(isRetryableFailureClass(five.failureClass)).toBe(true);
  });

  it("fails safely on malformed provider JSON for create_container", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("not-json", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const result = await adapter(fetchImpl).publish(baseInput);
    if (result.outcome === "succeeded") throw new Error("expected failure");
    expect(result.safeErrorCode).toBe("instagram_invalid_json");
    expect(result.providerDiagnostics?.providerStep).toBe("create_container");
    expect(result.providerDiagnostics?.responseReceived).toBe(true);
  });

  it("keeps ambiguous media_publish transport separately classified", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/media_publish")) {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }
      return jsonResponse({ id: "container_1" });
    });
    const result = await adapter(fetchImpl).publish(baseInput);
    if (result.outcome === "succeeded") throw new Error("expected failure");
    expect(result.outcome).toBe("unknown_external_outcome");
    expect(result.safeErrorCode).toBe("instagram_publish_ambiguous_timeout");
    expect(result.providerDiagnostics?.providerStep).toBe("media_publish");
    expect(result.providerDiagnostics?.boundaryState).toBe("ambiguous_transport");
    expect(isRetryableFailureClass(result.failureClass)).toBe(false);
  });

  it("preserves unauthorized mapping for 401", () => {
    const mapped = mapInstagramHttpFailure({
      reason: "non_2xx",
      httpStatus: 401,
    });
    expect(mapped.safeErrorCode).toBe("instagram_http_unauthorized");
    expect(mapped.outcome).toBe("failed_terminal");
  });

  it("does not invent diagnostics on historical-shaped failure without step", () => {
    const mapped = mapInstagramHttpFailure({
      reason: "non_2xx",
      httpStatus: 400,
    });
    expect(mapped.safeErrorCode).toBe("instagram_http_4xx");
    // Adapter result without diagnostics remains readable for historical attempts.
    expect(mapped).toEqual({
      outcome: "failed_terminal",
      failureClass: "provider_permanent",
      safeErrorCode: "instagram_http_4xx",
      disposition: "definitive_rejection",
    });
  });
});
