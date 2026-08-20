import { beforeEach, describe, expect, it, vi } from "vitest";
import { disconnectSocialConnection } from "@/features/social-media/server/disconnect-social-connection";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const orgId = "11111111-1111-4111-8111-111111111111";
const foreignOrgId = "99999999-9999-4999-8999-999999999999";
const connectionId = "55555555-5555-4555-8555-555555555555";
const membershipId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";

const enabledEnv = {
  SOCIAL_CONNECTIONS_ENABLED: "true",
  SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED: "true",
};

function createSupabaseMock(options: {
  role?: string;
  authenticated?: boolean;
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
                  external_account_id: "17841400000000000",
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
      if (fn !== "disconnect_social_connection") {
        return { data: null, error: { message: "unexpected" } };
      }
      return {
        data: options.rpcResult ?? [
          { result_code: "disconnected", connection_id: connectionId },
        ],
        error: null,
      };
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("SMM-B1.1-R Instagram disconnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows Owner and Admin to disconnect their organization connection", async () => {
    for (const role of ["owner", "admin"] as const) {
      const supabase = createSupabaseMock({ role });
      const result = await disconnectSocialConnection(
        supabase,
        { organizationId: orgId, connectionId },
        { env: enabledEnv },
      );
      expect(result).toEqual({ ok: true, code: "disconnected" });
      expect(supabase.rpc).toHaveBeenCalledWith(
        "disconnect_social_connection",
        { p_connection_id: connectionId },
      );
    }
  });

  it("denies Staff, Viewer, and foreign organization", async () => {
    for (const role of ["staff", "viewer"] as const) {
      const supabase = createSupabaseMock({ role });
      const result = await disconnectSocialConnection(
        supabase,
        { organizationId: orgId, connectionId },
        { env: enabledEnv },
      );
      expect(result).toEqual({ ok: false, code: "forbidden" });
      expect(supabase.rpc).not.toHaveBeenCalled();
    }

    const foreign = await disconnectSocialConnection(
      createSupabaseMock({}),
      { organizationId: foreignOrgId, connectionId },
      { env: enabledEnv },
    );
    expect(foreign).toEqual({ ok: false, code: "forbidden" });
  });

  it("denies a connection that does not belong to the resolved organization", async () => {
    const supabase = createSupabaseMock({ connections: [] });
    const result = await disconnectSocialConnection(
      supabase,
      { organizationId: orgId, connectionId },
      { env: enabledEnv },
    );
    expect(result).toEqual({ ok: false, code: "not_found" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("returns already_disconnected without a second credential delete when already disconnected", async () => {
    const supabase = createSupabaseMock({
      connections: [
        {
          id: connectionId,
          workspace_id: "22222222-2222-4222-8222-222222222222",
          provider: "instagram",
          status: "disconnected",
          professional_account_type: "business",
          external_account_id: "17841400000000000",
          health: "healthy",
          display_name: "demo",
          capability_snapshot: [],
          reauthorization_required_at: null,
        },
      ],
    });
    const result = await disconnectSocialConnection(
      supabase,
      { organizationId: orgId, connectionId },
      { env: enabledEnv },
    );
    expect(result).toEqual({ ok: true, code: "already_disconnected" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("maps RPC already_disconnected for double submit", async () => {
    const supabase = createSupabaseMock({
      rpcResult: [
        { result_code: "already_disconnected", connection_id: connectionId },
      ],
    });
    const result = await disconnectSocialConnection(
      supabase,
      { organizationId: orgId, connectionId },
      { env: enabledEnv },
    );
    expect(result).toEqual({ ok: true, code: "already_disconnected" });
  });

  it("keeps disconnect RPC credential-delete and event-append contracts", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260815130220_add_social_connection_credential_foundation.sql",
      ),
      "utf8",
    );
    const disconnect = migration.match(
      /create or replace function public\.disconnect_social_connection[\s\S]*?grant execute on function public\.disconnect_social_connection/,
    )?.[0];
    expect(disconnect).toBeTruthy();
    expect(disconnect).toContain("delete from private.social_provider_credentials");
    expect(disconnect).toContain("status = 'disconnected'");
    expect(disconnect).toContain("'social_connection_disconnected'");
    expect(disconnect).toContain("already_disconnected");
    expect(disconnect).toContain("can_manage_social_connections");
  });
});
