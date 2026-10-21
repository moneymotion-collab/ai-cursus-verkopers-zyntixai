import { beforeEach, describe, expect, it, vi } from "vitest";
import { initiateInstagramReauthorization } from "@/features/social-media/server/initiate-instagram-reauthorization";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const orgId = "11111111-1111-4111-8111-111111111111";
const foreignOrgId = "99999999-9999-4999-8999-999999999999";
const connectionId = "55555555-5555-4555-8555-555555555555";
const membershipId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";
const expectedExternalAccountId = "17841400000000000";

const enabledEnv = {
  SOCIAL_CONNECTIONS_ENABLED: "true",
  SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED: "true",
  SOCIAL_INSTAGRAM_CLIENT_ID: "ig-client-id",
  SOCIAL_INSTAGRAM_CLIENT_SECRET: "ig-client-secret",
  NEXT_PUBLIC_SITE_URL: "https://zyntix.example",
};

function createSupabaseMock(options: {
  role?: string;
  authenticated?: boolean;
  enrollmentStatus?: string;
  connections?: Array<Record<string, unknown>>;
  rpcResult?: unknown;
}) {
  const authenticated = options.authenticated ?? true;
  const role = options.role ?? "owner";
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: authenticated ? { id: userId, email_confirmed_at: "t" } : null,
        },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "social_account_connections") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(async () => ({
              data: options.connections ?? [
                {
                  id: connectionId,
                  workspace_id: "22222222-2222-4222-8222-222222222222",
                  provider: "instagram",
                  status: "connected",
                  professional_account_type: "business",
                  external_account_id: expectedExternalAccountId,
                  health: "healthy",
                  display_name: "demo",
                  capability_snapshot: ["publish_image"],
                  reauthorization_required_at: null,
                },
              ],
              error: null,
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(async () => ({
              data: authenticated
                ? [
                    {
                      id: membershipId,
                      organization_id: orgId,
                      role,
                      status: "active",
                      user_id: userId,
                    },
                  ]
                : [],
              error: null,
            })),
          })),
        })),
      };
    }),
    rpc: vi.fn(async (fn: string) => {
      if (fn === "get_social_closed_beta_enrollment_status") {
        return {
          data: [
            {
              result_code: "success",
              enrollment_status: options.enrollmentStatus ?? "approved",
              status_before_pause: null,
            },
          ],
          error: null,
        };
      }
      return {
        data: options.rpcResult ?? [
          {
            result_code: "success",
            connection_id: connectionId,
            intent_id: "66666666-6666-4666-8666-666666666666",
            expected_external_account_id: expectedExternalAccountId,
          },
        ],
        error: null,
      };
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("SMM-B1.1-R Instagram reauthorization initiation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts reauthorization for an existing connection without create-intent", async () => {
    const supabase = createSupabaseMock({});
    const result = await initiateInstagramReauthorization(
      supabase,
      { organizationId: orgId, connectionId },
      { env: enabledEnv },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.connectionId).toBe(connectionId);
    expect(result.expectedExternalAccountId).toBe(expectedExternalAccountId);
    expect(result.authorizationUrl).toContain("force_reauth=true");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "create_social_reauthorization_intent",
      expect.objectContaining({ p_connection_id: connectionId }),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "create_social_connection_intent",
      expect.anything(),
    );
  });

  it("denies Staff, Viewer, foreign org, and closed-beta not enrolled", async () => {
    for (const role of ["staff", "viewer"] as const) {
      const supabase = createSupabaseMock({ role });
      const result = await initiateInstagramReauthorization(
        supabase,
        { organizationId: orgId, connectionId },
        { env: enabledEnv },
      );
      expect(result).toEqual({ ok: false, code: "forbidden" });
    }

    const foreign = await initiateInstagramReauthorization(
      createSupabaseMock({}),
      { organizationId: foreignOrgId, connectionId },
      { env: enabledEnv },
    );
    expect(foreign).toEqual({ ok: false, code: "forbidden" });

    const unenrolled = await initiateInstagramReauthorization(
      createSupabaseMock({ enrollmentStatus: "not_enrolled" }),
      { organizationId: orgId, connectionId },
      { env: enabledEnv },
    );
    expect(unenrolled).toEqual({
      ok: false,
      code: "closed_beta_not_enrolled",
    });
  });

  it("denies reconnect of a connection that does not belong to the organization", async () => {
    const supabase = createSupabaseMock({ connections: [] });
    const result = await initiateInstagramReauthorization(
      supabase,
      { organizationId: orgId, connectionId },
      { env: enabledEnv },
    );
    expect(result).toEqual({ ok: false, code: "connection_not_found" });
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "create_social_reauthorization_intent",
      expect.anything(),
    );
  });

  it("browser-facing reauthorize action does not return provider account identity", () => {
    const action = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/initiate-instagram-reauthorization-action.ts",
      ),
      "utf8",
    );
    const results = readFileSync(
      join(process.cwd(), "src/features/social-media/domain/results.ts"),
      "utf8",
    );
    const successReturn = action.slice(action.lastIndexOf("return {"));
    expect(successReturn).toContain("authorizationUrl");
    expect(successReturn).not.toContain("expectedExternalAccountId");
    expect(results).not.toMatch(
      /SocialReauthorizeResult[\s\S]*?expectedExternalAccountId/,
    );
  });
});
