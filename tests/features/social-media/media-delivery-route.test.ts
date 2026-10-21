import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/social/media-delivery/[token]/route";
import {
  mintSocialMediaProviderDeliveryUrl,
} from "@/features/social-media/server/instagram-publishing/media-delivery";
import {
  __resetSocialMediaByteSourceForTests,
  __setSocialMediaByteSourceForTests,
} from "@/features/social-media/server/instagram-publishing/media-byte-source";

const deliveryEnv = {
  SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET: "b".repeat(48),
  NEXT_PUBLIC_SITE_URL: "https://zyntix.example",
};

describe("SMM-B1.7-R1 signed media delivery route", () => {
  afterEach(() => {
    __resetSocialMediaByteSourceForTests();
    for (const key of Object.keys(deliveryEnv)) {
      delete process.env[key];
    }
  });

  it("returns exact bytes for a valid signed token", async () => {
    Object.assign(process.env, deliveryEnv);
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    __setSocialMediaByteSourceForTests({
      async getObject(input) {
        expect(input.organizationId).toBe("org-r1");
        expect(input.assetId).toBe("asset-r1");
        expect(input.storageObjectKey).toBe("org-r1/r1/test.jpg");
        return { ok: true, bytes, contentType: "image/jpeg" };
      },
    });
    const minted = mintSocialMediaProviderDeliveryUrl({
      organizationId: "org-r1",
      assetId: "asset-r1",
      storageObjectKey: "org-r1/r1/test.jpg",
      env: deliveryEnv,
    });
    expect(minted.ok).toBe(true);
    if (!minted.ok) {
      return;
    }
    const token = minted.url.split("/").pop()!;
    const response = await GET(new Request(minted.url), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("content-length")).toBe("5");
    const body = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(body)).toEqual([1, 2, 3, 4, 5]);
  });

  it("rejects tampered, expired, and missing-source cases", async () => {
    Object.assign(process.env, deliveryEnv);
    __setSocialMediaByteSourceForTests({
      async getObject() {
        return { ok: true, bytes: new Uint8Array([9]), contentType: "image/jpeg" };
      },
    });
    const minted = mintSocialMediaProviderDeliveryUrl({
      organizationId: "org-r1",
      assetId: "asset-r1",
      storageObjectKey: "org-r1/r1/test.jpg",
      env: deliveryEnv,
    });
    expect(minted.ok).toBe(true);
    if (!minted.ok) {
      return;
    }
    const token = minted.url.split("/").pop()!;
    const bad = await GET(new Request("https://zyntix.example/x"), {
      params: Promise.resolve({ token: `${token}x` }),
    });
    expect(bad.status).toBe(403);

    __setSocialMediaByteSourceForTests({
      async getObject() {
        return { ok: false, reason: "unavailable" };
      },
    });
    const unavailable = await GET(new Request(minted.url), {
      params: Promise.resolve({ token }),
    });
    expect(unavailable.status).toBe(503);
  });
});
