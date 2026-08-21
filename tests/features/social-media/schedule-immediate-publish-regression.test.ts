import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { executeB18ImagePublication } from "@/features/social-media/server/b18-execute-image-publication";

describe("SMM-B1.11-A immediate publishing regression", () => {
  it("keeps none_due on future intended_execute_at and never reaches adapter tables", async () => {
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
        return { data: [{ result_code: "none_due" }], error: null };
      }
      return { data: null, error: { message: "unexpected" } };
    });
    const from = vi.fn();
    const supabase = { rpc, from } as never;

    const result = await executeB18ImagePublication(supabase, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      publicationId: "22222222-2222-4222-8222-222222222222",
      env: { SOCIAL_PUBLISHING_ENABLED: "true" },
    });

    expect(result).toEqual({ ok: false, reason: "none_due" });
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalledWith(
      "b18_complete_controlled_publication_attempt",
      expect.anything(),
    );
  });

  it("preserves b18_start none_due gate on coalesce(next_attempt_at, intended_execute_at)", () => {
    const start = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260819120000_add_social_controlled_publish_window_binding.sql",
      ),
      "utf8",
    );
    expect(start).toContain(
      "if coalesce(v_pub.next_attempt_at, v_pub.intended_execute_at) > pg_catalog.now() then",
    );
    expect(start).toContain("'none_due'");
  });

  it("does not change immediate Prepare execution_mode", () => {
    const prepare = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/b18-prepare-image-publication.ts",
      ),
      "utf8",
    );
    expect(prepare).toContain('p_execution_mode: "immediate"');
    expect(prepare).toContain("p_intended_execute_at: null");
  });
});
