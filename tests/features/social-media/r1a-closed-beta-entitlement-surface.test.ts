import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { executeB18ImagePublication } from "@/features/social-media/server/b18-execute-image-publication";

describe("SMM-R1-A execute entitlement surface", () => {
  it("wires prepare/execute actions to closed-beta asserts and keeps publishing fail-closed", () => {
    const prepare = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/prepare-b18-instagram-image-publication-action.ts",
      ),
      "utf8",
    );
    const execute = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/execute-b18-instagram-image-publication-action.ts",
      ),
      "utf8",
    );
    const serverExecute = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/b18-execute-image-publication.ts",
      ),
      "utf8",
    );

    expect(prepare).toContain("assertClosedBetaPrepareAllowed");
    expect(prepare).toContain("closed_beta_not_enrolled");
    expect(prepare).not.toContain("SOCIAL_PUBLISHING_ENABLED=true");
    expect(prepare).not.toContain("service_role");

    expect(execute).toContain("isSocialPublishingFeatureEnabled");
    expect(execute).toContain("assertClosedBetaPublishAllowed");
    expect(execute).toContain("closed_beta_publish_not_allowed");
    expect(execute).not.toContain("service_role");

    expect(serverExecute).toContain("assertClosedBetaPublishAllowed");
    expect(serverExecute).toContain("isSocialPublishingFeatureEnabled");
  });

  it("denies execute when global publishing is OFF even if entitlement would pass", async () => {
    const rpc = vi.fn();
    const supabase = {
      rpc,
      from: vi.fn(),
    } as never;

    const result = await executeB18ImagePublication(supabase, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      publicationId: "22222222-2222-4222-8222-222222222222",
      env: { SOCIAL_PUBLISHING_ENABLED: undefined },
    });

    expect(result).toEqual({ ok: false, reason: "feature_disabled" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("denies execute before provider boundary when entitlement RPC denies", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          result_code: "success",
          enrollment_status: "approved",
          status_before_pause: null,
        },
      ],
      error: null,
    });
    const supabase = {
      rpc,
      from: vi.fn(),
    } as never;

    const result = await executeB18ImagePublication(supabase, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      publicationId: "22222222-2222-4222-8222-222222222222",
      env: { SOCIAL_PUBLISHING_ENABLED: "true" },
    });

    expect(result).toEqual({
      ok: false,
      reason: "closed_beta_publish_not_allowed",
    });
    expect(rpc).toHaveBeenCalledWith("get_social_closed_beta_enrollment_status", {
      p_organization_id: "11111111-1111-4111-8111-111111111111",
    });
    expect(rpc).not.toHaveBeenCalledWith(
      "b18_start_controlled_publication_attempt",
      expect.anything(),
    );
  });

  it("reaches start RPC only when global ON and publishing_allowed (mocked; no Meta)", async () => {
    const rpc = vi.fn(async (fn: string) => {
      if (fn === "get_social_closed_beta_enrollment_status") {
        return {
          data: [
            {
              result_code: "success",
              enrollment_status: "publishing_allowed",
              status_before_pause: null,
            },
          ],
          error: null,
        };
      }
      if (fn === "b18_start_controlled_publication_attempt") {
        return {
          data: [{ result_code: "none_due" }],
          error: null,
        };
      }
      return { data: null, error: { message: "unexpected" } };
    });
    const supabase = {
      rpc,
      from: vi.fn(),
    } as never;

    const result = await executeB18ImagePublication(supabase, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      publicationId: "22222222-2222-4222-8222-222222222222",
      env: { SOCIAL_PUBLISHING_ENABLED: "true" },
    });

    expect(result).toEqual({ ok: false, reason: "none_due" });
    expect(rpc).toHaveBeenCalledWith(
      "b18_start_controlled_publication_attempt",
      expect.objectContaining({
        p_organization_id: "11111111-1111-4111-8111-111111111111",
      }),
    );
  });
});
