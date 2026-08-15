import { beforeEach, describe, expect, it, vi } from "vitest";
import { initiateInstagramConnection } from "@/features/social-media/server/initiate-instagram-connection";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const orgId = "11111111-1111-4111-8111-111111111111";
const workspaceId = "22222222-2222-4222-8222-222222222222";
const membershipId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";

const enabledEnv = {
  SOCIAL_CONNECTIONS_ENABLED: "true",
  SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED: "true",
  SOCIAL_INSTAGRAM_CLIENT_ID: "ig-client-id",
  SOCIAL_INSTAGRAM_CLIENT_SECRET: "ig-client-secret",
  SOCIAL_CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
  NEXT_PUBLIC_SITE_URL: "https://zyntix.example",
};

function createSupabaseMock(options: {
  role?: string;
  authenticated?: boolean;
  rpcResult?: unknown;
  rpcError?: { message: string } | null;
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
    from: vi.fn(() => ({
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
    })),
    rpc: vi.fn(async () => ({
      data: options.rpcResult ?? [
        {
          result_code: "success",
          connection_id: "55555555-5555-4555-8555-555555555555",
          intent_id: "66666666-6666-4666-8666-666666666666",
        },
      ],
      error: options.rpcError ?? null,
    })),
  } as unknown as SupabaseClient<Database>;
}

describe("SMM-B1.1-C Instagram connection initiation authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies when feature gates are OFF", async () => {
    const supabase = createSupabaseMock({});
    const result = await initiateInstagramConnection(
      supabase,
      { organizationId: orgId, workspaceId, provider: "instagram" },
      { env: { ...enabledEnv, SOCIAL_CONNECTIONS_ENABLED: "false" } },
    );
    expect(result).toEqual({ ok: false, code: "feature_disabled" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("allows Owner and Admin when gates are enabled", async () => {
    for (const role of ["owner", "admin"] as const) {
      const supabase = createSupabaseMock({ role });
      const result = await initiateInstagramConnection(
        supabase,
        { organizationId: orgId, workspaceId, provider: "instagram" },
        { env: enabledEnv },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) {
        continue;
      }
      expect(result.authorizationUrl).toContain(
        "https://www.instagram.com/oauth/authorize",
      );
      expect(result.authorizationUrl).toContain("state=");
      expect(result.rawStateValue).toBeTruthy();
      expect(JSON.stringify(result)).not.toContain("ig-client-secret");
    }
  });

  it("denies Staff and Viewer", async () => {
    for (const role of ["staff", "viewer"] as const) {
      const supabase = createSupabaseMock({ role });
      const result = await initiateInstagramConnection(
        supabase,
        { organizationId: orgId, workspaceId, provider: "instagram" },
        { env: enabledEnv },
      );
      expect(result).toEqual({ ok: false, code: "forbidden" });
    }
  });

  it("denies unauthenticated callers", async () => {
    const supabase = createSupabaseMock({ authenticated: false });
    const result = await initiateInstagramConnection(
      supabase,
      { organizationId: orgId, workspaceId, provider: "instagram" },
      { env: enabledEnv },
    );
    expect(result).toEqual({ ok: false, code: "unauthorized" });
  });

  it("rejects unsupported providers and invalid workspace ids", async () => {
    const supabase = createSupabaseMock({});
    const unsupported = await initiateInstagramConnection(
      supabase,
      { organizationId: orgId, workspaceId, provider: "facebook" },
      { env: enabledEnv },
    );
    expect(unsupported).toEqual({ ok: false, code: "invalid_request" });

    const badWorkspace = await initiateInstagramConnection(
      supabase,
      {
        organizationId: orgId,
        workspaceId: "not-a-uuid",
        provider: "instagram",
      },
      { env: enabledEnv },
    );
    expect(badWorkspace).toEqual({ ok: false, code: "invalid_request" });
  });

  it("maps rate_limited from RPC", async () => {
    const supabase = createSupabaseMock({
      rpcResult: [
        { result_code: "rate_limited", connection_id: null, intent_id: null },
      ],
    });
    const result = await initiateInstagramConnection(
      supabase,
      { organizationId: orgId, workspaceId, provider: "instagram" },
      { env: enabledEnv },
    );
    expect(result).toEqual({ ok: false, code: "rate_limited" });
  });

  it("maps workspace_not_found from RPC", async () => {
    const supabase = createSupabaseMock({
      rpcResult: [
        {
          result_code: "workspace_not_found",
          connection_id: null,
          intent_id: null,
        },
      ],
    });
    const result = await initiateInstagramConnection(
      supabase,
      { organizationId: orgId, workspaceId, provider: "instagram" },
      { env: enabledEnv },
    );
    expect(result).toEqual({ ok: false, code: "workspace_not_found" });
  });

  it("fail-closes when Instagram client configuration is missing", async () => {
    const supabase = createSupabaseMock({});
    const result = await initiateInstagramConnection(
      supabase,
      { organizationId: orgId, workspaceId, provider: "instagram" },
      {
        env: {
          SOCIAL_CONNECTIONS_ENABLED: "true",
          SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED: "true",
          NEXT_PUBLIC_SITE_URL: "https://zyntix.example",
        },
      },
    );
    expect(result).toEqual({ ok: false, code: "internal_error" });
  });
});
