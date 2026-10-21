import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { completeOwnerProvisioning } from "@/features/auth/server/complete-owner-provisioning";

const rpcMock = vi.fn();
const fromMock = vi.fn();
const updateMock = vi.fn();
const eqMock = vi.fn();

function createSupabaseMock(options?: {
  intent?: {
    display_name: string;
    company_name: string;
    status: string;
    organization_id: string | null;
  } | null;
  rpcImpl?: (fn: string, args: unknown) => Promise<{ data: unknown; error: unknown }>;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: options?.intent === undefined
      ? {
          user_id: "u1",
          display_name: "Ada",
          company_name: "Acme",
          status: "pending",
          organization_id: null,
          last_error_code: null,
        }
      : options.intent,
    error: null,
  });

  fromMock.mockImplementation((table: string) => {
    if (table === "registration_intents") {
      return {
        select: () => ({
          eq: () => ({ maybeSingle }),
        }),
      };
    }
    if (table === "profiles") {
      updateMock.mockReturnValue({ eq: eqMock });
      eqMock.mockResolvedValue({ error: null });
      return { update: updateMock };
    }
    return {};
  });

  rpcMock.mockImplementation(async (fn: string, args: unknown) => {
    if (options?.rpcImpl) {
      return options.rpcImpl(fn, args);
    }
    if (fn === "upsert_registration_intent") {
      return { data: null, error: null };
    }
    if (fn === "complete_owner_self_registration") {
      return { data: "11111111-1111-4111-8111-111111111111", error: null };
    }
    return { data: null, error: { message: "unknown" } };
  });

  return {
    from: fromMock,
    rpc: rpcMock,
  };
}

describe("completeOwnerProvisioning", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
  });

  const verifiedUser = {
    id: "u1",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    user_metadata: { display_name: "Ada", company_name: "Acme" },
  } as unknown as User;

  it("requires verified email before provisioning", async () => {
    const supabase = createSupabaseMock();
    const result = await completeOwnerProvisioning(supabase as never, {
      ...verifiedUser,
      email_confirmed_at: null,
    } as unknown as User);
    expect(result).toEqual({ ok: false, code: "email_verification_required" });
    expect(rpcMock).not.toHaveBeenCalledWith(
      "complete_owner_self_registration",
      expect.anything(),
    );
  });

  it("creates exactly one organization via owner RPC with server slug", async () => {
    const supabase = createSupabaseMock();
    const result = await completeOwnerProvisioning(supabase as never, verifiedUser);

    expect(result).toEqual({
      ok: true,
      organizationId: "11111111-1111-4111-8111-111111111111",
    });
    expect(rpcMock).toHaveBeenCalledWith("complete_owner_self_registration", {
      p_name: "Acme",
      p_slug: "acme",
    });
    expect(rpcMock).not.toHaveBeenCalledWith(
      "create_organization_with_owner",
      expect.anything(),
    );
  });

  it("retries slug collisions then succeeds (idempotent lost-response friendly)", async () => {
    let calls = 0;
    const supabase = createSupabaseMock({
      rpcImpl: async (fn) => {
        if (fn === "upsert_registration_intent") {
          return { data: null, error: null };
        }
        calls += 1;
        if (calls === 1) {
          return { data: null, error: { message: "organization slug already exists" } };
        }
        return { data: "11111111-1111-4111-8111-111111111111", error: null };
      },
    });

    const result = await completeOwnerProvisioning(supabase as never, verifiedUser);
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it("returns existing organization when intent already completed", async () => {
    const supabase = createSupabaseMock({
      intent: {
        display_name: "Ada",
        company_name: "Acme",
        status: "completed",
        organization_id: "11111111-1111-4111-8111-111111111111",
      },
    });

    const result = await completeOwnerProvisioning(supabase as never, verifiedUser);
    expect(result).toEqual({
      ok: true,
      organizationId: "11111111-1111-4111-8111-111111111111",
    });
    expect(rpcMock).not.toHaveBeenCalledWith(
      "complete_owner_self_registration",
      expect.anything(),
    );
  });
});
