import { describe, expect, it, vi } from "vitest";
import {
  isCourseSellerContextPack,
  resolveOperatingModelSetupStatus,
} from "@/features/onboarding/server/operating-model-status";

const ORG = "11111111-1111-4111-8111-111111111111";

function clientWithActivities(rows: Array<{ id: string }>, error: unknown = null) {
  return {
    from: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.limit = vi.fn(async () => ({ data: rows, error }));
      return builder;
    }),
  };
}

function resolverResult(
  result:
    | { ok: true; packKey: string }
    | {
        ok: false;
        code:
          | "NO_PRIMARY_ACTIVITY"
          | "ACTIVITY_UNCLASSIFIED"
          | "CONTEXT_UNASSIGNED";
      },
) {
  return vi.fn(async () =>
    result.ok
      ? {
          ok: true as const,
          packKey: result.packKey,
        }
      : {
          ok: false as const,
          errorCode: result.code,
        },
  );
}

describe("resolveOperatingModelSetupStatus", () => {
  it("recognizes an existing valid TG1 context as configured", async () => {
    const supabase = clientWithActivities([]);
    const status = await resolveOperatingModelSetupStatus({
      supabase: supabase as never,
      organizationId: ORG,
      role: "owner",
      resolveContext: resolverResult({
        ok: true,
        packKey: "niche.online-course-business",
      }) as never,
    });

    expect(status).toMatchObject({
      kind: "configured",
      packKey: "niche.online-course-business",
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("allows Owner/Admin first assignment only when no Activity exists", async () => {
    for (const role of ["owner", "admin"]) {
      const status = await resolveOperatingModelSetupStatus({
        supabase: clientWithActivities([]) as never,
        organizationId: ORG,
        role,
        resolveContext: resolverResult({
          ok: false,
          code: "NO_PRIMARY_ACTIVITY",
        }) as never,
      });
      expect(status).toMatchObject({
        kind: "requires_assignment",
        canAssign: true,
      });
    }
  });

  it("shows a non-editable administrator-required state to members", async () => {
    const status = await resolveOperatingModelSetupStatus({
      supabase: clientWithActivities([]) as never,
      organizationId: ORG,
      role: "member",
      resolveContext: resolverResult({
        ok: false,
        code: "NO_PRIMARY_ACTIVITY",
      }) as never,
    });

    expect(status).toMatchObject({
      kind: "requires_assignment",
      canAssign: false,
    });
  });

  it("does not overwrite unresolved legacy Activity state", async () => {
    const status = await resolveOperatingModelSetupStatus({
      supabase: clientWithActivities([{ id: "legacy-activity" }]) as never,
      organizationId: ORG,
      role: "owner",
      resolveContext: resolverResult({
        ok: false,
        code: "NO_PRIMARY_ACTIVITY",
      }) as never,
    });

    expect(status).toEqual({
      kind: "configuration_review_required",
      organizationId: ORG,
      role: "owner",
      canAssign: false,
    });
  });

  it("fails closed for invalid primary context instead of treating it as missing", async () => {
    const status = await resolveOperatingModelSetupStatus({
      supabase: clientWithActivities([]) as never,
      organizationId: ORG,
      role: "owner",
      resolveContext: resolverResult({
        ok: false,
        code: "CONTEXT_UNASSIGNED",
      }) as never,
    });

    expect(status.kind).toBe("configuration_review_required");
  });
});

describe("TG1 compatibility", () => {
  it("recognizes both valid Knowledge context forms", () => {
    expect(isCourseSellerContextPack("foundation.knowledge")).toBe(true);
    expect(isCourseSellerContextPack("niche.online-course-business")).toBe(
      true,
    );
    expect(isCourseSellerContextPack("foundation.service")).toBe(false);
  });
});
