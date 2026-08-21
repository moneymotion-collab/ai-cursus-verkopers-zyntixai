import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const createSupabaseServerClient = vi.fn();
const resolveOrganizationContext = vi.fn();
const isSocialInstagramConnectionsFeatureEnabled = vi.fn(() => true);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext,
}));

vi.mock("@/features/social-media/server/social-connections-feature", () => ({
  isSocialInstagramConnectionsFeatureEnabled,
}));

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";
const PUB = "33333333-3333-4333-8333-333333333333";
const VERSION = "44444444-4444-4444-8444-444444444444";
const CONNECTION = "55555555-5555-4555-8555-555555555555";
const FUTURE = "2026-12-01T09:00:00.000Z";

function mockOrg(role: string, organizationId = ORG) {
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId,
      membershipId: "memb-1",
      role,
      userId: "user-1",
    },
  });
}

describe("SMM-B1.11-A schedule actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSocialInstagramConnectionsFeatureEnabled.mockReturnValue(true);
  });

  it("Owner schedules a future unambiguous instant through the RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          result_code: "success",
          publication_id: PUB,
          intended_execute_at: FUTURE,
          next_attempt_at: FUTURE,
          execution_mode: "scheduled",
          variant_version_id: VERSION,
          connection_id: CONNECTION,
        },
      ],
      error: null,
    });
    createSupabaseServerClient.mockResolvedValue({ rpc });
    mockOrg("owner");

    const { scheduleSocialPublicationAction } = await import(
      "@/features/social-media/actions/schedule-social-publication-actions"
    );
    const result = await scheduleSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
      intendedExecuteAt: FUTURE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.variantVersionId).toBe(VERSION);
      expect(result.connectionId).toBe(CONNECTION);
      expect(result.intendedExecuteAt).toBe(FUTURE);
      expect(result.nextAttemptAt).toBe(FUTURE);
    }
    expect(rpc).toHaveBeenCalledWith(
      "schedule_social_publication",
      expect.objectContaining({
        p_organization_id: ORG,
        p_publication_id: PUB,
        p_intended_execute_at: FUTURE,
      }),
    );
  });

  it("Admin may reschedule; Staff and Viewer are forbidden before RPC", async () => {
    const rpc = vi.fn();
    createSupabaseServerClient.mockResolvedValue({ rpc });

    const { rescheduleSocialPublicationAction } = await import(
      "@/features/social-media/actions/schedule-social-publication-actions"
    );

    mockOrg("admin");
    rpc.mockResolvedValue({
      data: [
        {
          result_code: "success",
          publication_id: PUB,
          intended_execute_at: FUTURE,
          next_attempt_at: FUTURE,
          execution_mode: "scheduled",
          variant_version_id: VERSION,
          connection_id: CONNECTION,
        },
      ],
      error: null,
    });
    const admin = await rescheduleSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
      intendedExecuteAt: FUTURE,
    });
    expect(admin.ok).toBe(true);

    mockOrg("staff");
    const staff = await rescheduleSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
      intendedExecuteAt: FUTURE,
    });
    expect(staff).toEqual({ ok: false, code: "forbidden" });

    mockOrg("viewer");
    const viewer = await rescheduleSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
      intendedExecuteAt: FUTURE,
    });
    expect(viewer).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects naive local timestamps and past/now instants without calling RPC", async () => {
    const rpc = vi.fn();
    createSupabaseServerClient.mockResolvedValue({ rpc });
    mockOrg("owner");
    const { scheduleSocialPublicationAction } = await import(
      "@/features/social-media/actions/schedule-social-publication-actions"
    );

    const naive = await scheduleSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
      intendedExecuteAt: "2026-10-25 02:30",
    });
    expect(naive).toEqual({ ok: false, code: "invalid_request" });

    const past = await scheduleSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
      intendedExecuteAt: "2020-01-01T00:00:00Z",
    });
    expect(past).toEqual({ ok: false, code: "invalid_time" });

    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses authoritative org from context, not a foreign org argument", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ result_code: "forbidden" }],
      error: null,
    });
    createSupabaseServerClient.mockResolvedValue({ rpc });
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: { code: "ORG_ACCESS_DENIED" },
    });

    const { scheduleSocialPublicationAction } = await import(
      "@/features/social-media/actions/schedule-social-publication-actions"
    );
    const result = await scheduleSocialPublicationAction({
      organizationId: OTHER_ORG,
      publicationId: PUB,
      intendedExecuteAt: FUTURE,
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("cancels a scheduled publication and maps second-cancel conflict", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ result_code: "success", publication_id: PUB, status: "cancelled" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ result_code: "conflict", publication_id: PUB, status: "cancelled" }],
        error: null,
      });
    createSupabaseServerClient.mockResolvedValue({ rpc });
    mockOrg("owner");

    const { cancelScheduledSocialPublicationAction } = await import(
      "@/features/social-media/actions/schedule-social-publication-actions"
    );
    const first = await cancelScheduledSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
    });
    expect(first).toEqual({
      ok: true,
      resultCode: "success",
      publicationId: PUB,
      status: "cancelled",
    });
    const second = await cancelScheduledSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
    });
    expect(second).toEqual({ ok: false, code: "conflict" });
  });

  it("denies Staff and Viewer cancel-scheduled before RPC", async () => {
    const rpc = vi.fn();
    createSupabaseServerClient.mockResolvedValue({ rpc });
    const { cancelScheduledSocialPublicationAction } = await import(
      "@/features/social-media/actions/schedule-social-publication-actions"
    );

    mockOrg("staff");
    const staff = await cancelScheduledSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
    });
    expect(staff).toEqual({ ok: false, code: "forbidden" });

    mockOrg("viewer");
    const viewer = await cancelScheduledSocialPublicationAction({
      organizationId: ORG,
      publicationId: PUB,
    });
    expect(viewer).toEqual({ ok: false, code: "forbidden" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not enable SOCIAL_PUBLISHING_ENABLED or call Execute", () => {
    const action = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/schedule-social-publication-actions.ts",
      ),
      "utf8",
    );
    expect(action).toContain("resolveOrganizationContext");
    expect(action).toContain("canScheduleSocialPublication");
    expect(action).not.toContain("SOCIAL_PUBLISHING_ENABLED");
    expect(action).not.toContain("executeB18ImagePublication");
    expect(action).not.toContain("b18_start_controlled_publication_attempt");
    expect(action).not.toContain("service_role");
  });
});
