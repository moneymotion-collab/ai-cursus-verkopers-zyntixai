/**
 * Short-lived signed media delivery for Instagram provider fetch (SMM-B1.7-R1).
 * Meta servers fetch this URL — no session cookies. HMAC + purpose + expiry.
 */

import { verifySocialMediaProviderDeliveryToken } from "@/features/social-media/server/instagram-publishing/media-delivery";
import { getSocialMediaByteSource } from "@/features/social-media/server/instagram-publishing/media-byte-source";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { token: rawToken } = await context.params;
  const token = decodeURIComponent(rawToken ?? "").trim();
  if (!token) {
    return new Response("Not Found", { status: 404 });
  }

  const verified = verifySocialMediaProviderDeliveryToken({ token });
  if (!verified.ok) {
    const status =
      verified.reason === "expired"
        ? 410
        : verified.reason === "missing_signing_secret"
          ? 503
          : 403;
    return new Response("Forbidden", { status });
  }

  const object = await getSocialMediaByteSource().getObject({
    organizationId: verified.claims.organizationId,
    assetId: verified.claims.assetId,
    storageObjectKey: verified.claims.storageObjectKey,
  });
  if (!object.ok) {
    if (object.reason === "not_found") {
      return new Response("Not Found", { status: 404 });
    }
    if (object.reason === "forbidden") {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("Service Unavailable", { status: 503 });
  }

  return new Response(Buffer.from(object.bytes), {
    status: 200,
    headers: {
      "content-type": object.contentType,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-length": String(object.bytes.byteLength),
    },
  });
}
