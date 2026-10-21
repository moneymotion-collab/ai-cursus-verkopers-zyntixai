import { describe, expect, it, vi } from "vitest";
import {
  isLegalClosedBetaTransition,
  nextClosedBetaStatusAfterAction,
} from "@/features/social-media/domain/closed-beta-enrollment";
import { buildSocialClosedBetaCustomerReadModel } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import { mutateOperatorClosedBetaEnrollment } from "@/features/social-media/server/platform-closed-beta-operator";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("SMM-R1-B enrollment action graph and mutations", () => {
  it("covers legal lifecycle transitions and revoked terminal", () => {
    expect(
      isLegalClosedBetaTransition({
        current: null,
        action: "enroll_approved",
      }),
    ).toBe(true);
    expect(
      nextClosedBetaStatusAfterAction({
        current: null,
        action: "enroll_approved",
      }),
    ).toBe("approved");

    expect(
      nextClosedBetaStatusAfterAction({
        current: "approved",
        action: "allow_publishing",
      }),
    ).toBe("publishing_allowed");
    expect(
      nextClosedBetaStatusAfterAction({
        current: "approved",
        action: "pause",
      }),
    ).toBe("paused");
    expect(
      nextClosedBetaStatusAfterAction({
        current: "publishing_allowed",
        action: "pause",
      }),
    ).toBe("paused");
    expect(
      nextClosedBetaStatusAfterAction({
        current: "paused",
        action: "resume",
        statusBeforePause: "publishing_allowed",
      }),
    ).toBe("publishing_allowed");
    expect(
      nextClosedBetaStatusAfterAction({
        current: "approved",
        action: "revoke",
      }),
    ).toBe("revoked");
    expect(
      isLegalClosedBetaTransition({
        current: "revoked",
        action: "enroll_approved",
      }),
    ).toBe(false);
    expect(
      isLegalClosedBetaTransition({
        current: "approved",
        action: "resume",
      }),
    ).toBe(false);
  });

  it("maps read-model statuses including readiness diagnostics", () => {
    expect(
      buildSocialClosedBetaCustomerReadModel({
        enrollmentStatus: "not_enrolled",
      }).diagnosticSummary,
    ).toBe("Not enrolled");
    expect(
      buildSocialClosedBetaCustomerReadModel({
        enrollmentStatus: "paused",
      }).prepareAllowed,
    ).toBe(false);
    expect(
      buildSocialClosedBetaCustomerReadModel({
        enrollmentStatus: "revoked",
      }).publishingEntitlementAllowed,
    ).toBe(false);
    expect(
      buildSocialClosedBetaCustomerReadModel({
        enrollmentStatus: "publishing_allowed",
        socialPublishingEnabled: "true",
      }).executeBlockedReason,
    ).toBeNull();
  });

  it("routes mutations through operator RPC wrappers and maps stale rejection", async () => {
    const rpc = vi.fn(async () => ({
      data: [
        {
          result_code: "invalid_transition",
          enrollment_id: null,
          previous_status: "approved",
          next_status: null,
        },
      ],
      error: null,
    }));
    const service = { rpc } as unknown as SupabaseClient<Database>;
    const result = await mutateOperatorClosedBetaEnrollment(service, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      action: "allow_publishing",
      reason: "Approved after readiness check",
      actorUserId: "22222222-2222-4222-8222-222222222222",
    });
    expect(result).toEqual({ ok: false, code: "invalid_transition" });
    expect(rpc).toHaveBeenCalledWith(
      "operator_allow_social_closed_beta_publishing",
      expect.objectContaining({
        p_organization_id: "11111111-1111-4111-8111-111111111111",
        p_reason: "Approved after readiness check",
      }),
    );
  });

  it("accepts successful enroll mutation results", async () => {
    const rpc = vi.fn(async () => ({
      data: [
        {
          result_code: "success",
          enrollment_id: "33333333-3333-4333-8333-333333333333",
          previous_status: null,
          next_status: "approved",
        },
      ],
      error: null,
    }));
    const service = { rpc } as unknown as SupabaseClient<Database>;
    const result = await mutateOperatorClosedBetaEnrollment(service, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      action: "enroll_approved",
      actorUserId: "22222222-2222-4222-8222-222222222222",
    });
    expect(result).toEqual({
      ok: true,
      previousStatus: null,
      nextStatus: "approved",
      enrollmentId: "33333333-3333-4333-8333-333333333333",
    });
  });

  it("rejects oversized operator reasons", async () => {
    const rpc = vi.fn();
    const service = { rpc } as unknown as SupabaseClient<Database>;
    const result = await mutateOperatorClosedBetaEnrollment(service, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      action: "pause",
      reason: "x".repeat(501),
      actorUserId: "22222222-2222-4222-8222-222222222222",
    });
    expect(result).toEqual({ ok: false, code: "invalid_request" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("keeps confirmation gate and no provider execute in operator UI", () => {
    const action = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/mutate-social-closed-beta-enrollment-action.ts",
      ),
      "utf8",
    );
    const ui = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/ui/platform-closed-beta-operator-actions.tsx",
      ),
      "utf8",
    );
    const detail = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/ui/platform-closed-beta-operator-detail.tsx",
      ),
      "utf8",
    );
    expect(action).toContain('actionRaw === "allow_publishing"');
    expect(action).toContain("input.confirm !== true");
    expect(ui).toContain("REQUIRES_CONFIRM");
    expect(ui).toContain("Revocation removes closed-beta operational authority");
    expect(detail).toMatch(/never enables the global publishing kill switch/);
    expect(detail).toMatch(/never\s+calls Meta/);
    expect(detail).not.toContain("graph.facebook.com");
    expect(ui).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
