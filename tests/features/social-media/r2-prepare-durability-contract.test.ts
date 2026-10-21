import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const uploadMock = vi.fn();

vi.mock("@/features/social-media/server/private-media-upload", () => ({
  uploadPrivateSocialJpeg: (...args: unknown[]) => uploadMock(...args),
}));

import { prepareB18ImagePublication } from "@/features/social-media/server/b18-prepare-image-publication";

const ORG = "2fc07699-ece5-44b9-bbb3-abbc23e9fffb";
const BRAND = "11111111-1111-4111-8111-111111111111";
const WORKSPACE = "22222222-2222-4222-8222-222222222222";
const CONNECTION = "24420652-d0b4-4237-9a75-51d89be50c65";
const HISTORICAL = "bdd8a0dc-936d-419a-ac35-4a5d8801fc27";

/** Minimal valid JPEG SOI + EOI (dimension helpers are bypassed via upload mock). */
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

type ExistingRow = {
  id: string;
  status: string;
  content_id: string;
  variant_id: string;
  variant_version_id: string;
  connection_id: string;
};

function createSupabaseMock(options: {
  existing: ExistingRow | null;
  publicationIdOnCreate?: string;
}) {
  const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
  let fromCalls = 0;

  const supabase = {
    from: (table: string) => {
      expect(table).toBe("social_publications");
      fromCalls += 1;
      return {
        select: () => ({
          eq: () => ({
            eq: async () => ({
              data: options.existing ? [options.existing] : [],
              error: null,
            }),
          }),
        }),
      };
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      if (fn === "register_social_media_asset") {
        return {
          data: [{ result_code: "success", asset_id: "asset-new" }],
          error: null,
        };
      }
      if (fn === "create_social_content_item") {
        return {
          data: [{ result_code: "success", content_id: "content-new" }],
          error: null,
        };
      }
      if (fn === "create_social_content_variant") {
        return {
          data: [{ result_code: "success", variant_id: "variant-new" }],
          error: null,
        };
      }
      if (fn === "set_social_variant_media_attachments") {
        return { data: [{ result_code: "success" }], error: null };
      }
      if (fn === "create_social_content_variant_version") {
        return {
          data: [{ result_code: "success", version_id: "version-new" }],
          error: null,
        };
      }
      if (fn === "submit_social_approval_decision") {
        return { data: [{ result_code: "success" }], error: null };
      }
      if (fn === "evaluate_social_variant_version_workflow_readiness") {
        return {
          data: [{ result_code: "success", workflow_ready: true }],
          error: null,
        };
      }
      if (fn === "create_social_publication") {
        return {
          data: [
            {
              result_code: "success",
              publication_id:
                options.publicationIdOnCreate ?? "pub-created-new",
            },
          ],
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected rpc ${fn}` } };
    },
  };

  return { supabase, rpcCalls, getFromCalls: () => fromCalls };
}

describe("SMM-R1-E-R2-P1 Prepare durability / idempotency", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    uploadMock.mockResolvedValue({
      ok: true,
      storageObjectKey: "org/private/test.jpg",
      mimeType: "image/jpeg",
      byteSize: JPEG_BYTES.byteLength,
      widthPx: 1080,
      heightPx: 1080,
    });
  });

  it("reuses an active queued publication without uploading again", async () => {
    const { supabase, rpcCalls } = createSupabaseMock({
      existing: {
        id: "queued-pub",
        status: "queued",
        content_id: "c1",
        variant_id: "v1",
        variant_version_id: "vv1",
        connection_id: CONNECTION,
      },
    });

    const result = await prepareB18ImagePublication(supabase as never, {
      organizationId: ORG,
      brandId: BRAND,
      workspaceId: WORKSPACE,
      connectionId: CONNECTION,
      jpegBytes: JPEG_BYTES,
    });

    expect(result).toEqual({
      ok: true,
      publicationId: "queued-pub",
      created: false,
      idempotencyOutcome: "reused_active",
      connectionId: CONNECTION,
      contentId: "c1",
      variantId: "v1",
      variantVersionId: "vv1",
      assetId: "reused",
      brandId: BRAND,
      workspaceId: WORKSPACE,
    });
    expect(uploadMock).not.toHaveBeenCalled();
    expect(rpcCalls).toHaveLength(0);
  });

  it("does not reuse manual_intervention; creates a fresh publication UUID", async () => {
    const { supabase, rpcCalls } = createSupabaseMock({
      existing: {
        id: HISTORICAL,
        status: "manual_intervention",
        content_id: "c-hist",
        variant_id: "v-hist",
        variant_version_id: "vv-hist",
        connection_id: CONNECTION,
      },
      publicationIdOnCreate: "pub-fresh-r2",
    });

    const result = await prepareB18ImagePublication(supabase as never, {
      organizationId: ORG,
      brandId: BRAND,
      workspaceId: WORKSPACE,
      connectionId: CONNECTION,
      jpegBytes: JPEG_BYTES,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.publicationId).toBe("pub-fresh-r2");
    expect(result.publicationId).not.toBe(HISTORICAL);
    expect(result.created).toBe(true);
    expect(result.idempotencyOutcome).toBe("created");
    expect(result.assetId).toBe("asset-new");
    expect(uploadMock).toHaveBeenCalledOnce();

    const createCall = rpcCalls.find((c) => c.fn === "create_social_publication");
    expect(createCall).toBeDefined();
    const key = String(createCall?.args.p_idempotency_key ?? "");
    expect(key).toMatch(/^b18_24420652d0b4_[0-9a-f]{40}_[0-9a-f]{8}$/);
    expect(rpcCalls.some((c) => c.fn === "register_social_media_asset")).toBe(
      true,
    );
  });

  it("prepares Story IMAGE on the existing publication aggregate with story format", async () => {
    const { supabase, rpcCalls } = createSupabaseMock({
      existing: null,
      publicationIdOnCreate: "pub-story-new",
    });

    const result = await prepareB18ImagePublication(supabase as never, {
      organizationId: ORG,
      brandId: BRAND,
      workspaceId: WORKSPACE,
      connectionId: CONNECTION,
      jpegBytes: JPEG_BYTES,
      placement: "story",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.publicationId).toBe("pub-story-new");
    expect(result.created).toBe(true);
    expect(uploadMock).toHaveBeenCalledWith(
      expect.objectContaining({ placement: "story" }),
    );
    const variantCall = rpcCalls.find((c) => c.fn === "create_social_content_variant");
    expect(variantCall?.args.p_content_format).toBe("story");
    const createCall = rpcCalls.find((c) => c.fn === "create_social_publication");
    expect(String(createCall?.args.p_idempotency_key ?? "")).toMatch(
      /^b18story_24420652d0b4_/,
    );
  });

  it("creates a new publication when no existing idempotency row matches", async () => {
    const { supabase, rpcCalls } = createSupabaseMock({
      existing: null,
      publicationIdOnCreate: "pub-byte-unique",
    });

    const result = await prepareB18ImagePublication(supabase as never, {
      organizationId: ORG,
      brandId: BRAND,
      workspaceId: WORKSPACE,
      connectionId: CONNECTION,
      jpegBytes: JPEG_BYTES,
    });

    expect(result).toMatchObject({
      ok: true,
      publicationId: "pub-byte-unique",
      created: true,
      idempotencyOutcome: "created",
      assetId: "asset-new",
    });
    expect(uploadMock).toHaveBeenCalledOnce();
    const createCall = rpcCalls.find((c) => c.fn === "create_social_publication");
    expect(String(createCall?.args.p_idempotency_key)).toMatch(
      /^b18_24420652d0b4_[0-9a-f]{40}$/,
    );
  });

  it("wires action + UI durability contract: UUID required; no stale prepared banner", () => {
    const prepareAction = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/prepare-b18-instagram-image-publication-action.ts",
      ),
      "utf8",
    );
    const prepareServer = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/b18-prepare-image-publication.ts",
      ),
      "utf8",
    );
    const panel = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/ui/b18-instagram-publish-panel.tsx",
      ),
      "utf8",
    );

    expect(prepareServer).toContain("isPrepareIdempotentReuseStatus");
    expect(prepareServer).not.toContain("!isTerminalPublicationStatus");
    expect(prepareAction).toContain("created: prepared.created");
    expect(prepareAction).toContain("idempotencyOutcome: prepared.idempotencyOutcome");
    expect(prepareAction).not.toContain("SOCIAL_PUBLISHING_ENABLED=true");
    expect(prepareAction).not.toContain("instagram.com");
    expect(prepareAction).not.toContain("graph.facebook.com");

    expect(panel).toContain('kind: "selected"');
    expect(panel).toContain("Publication ID:");
    expect(panel).toContain("Publication already prepared.");
    expect(panel).toContain("result.created");
    expect(panel).not.toMatch(
      /initialPublicationId\s*\?\s*\{\s*kind:\s*"prepared"/,
    );
    expect(panel).toContain("!result.publicationId");
  });
});
