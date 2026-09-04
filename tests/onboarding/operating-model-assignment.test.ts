import { describe, expect, it, vi } from "vitest";
import { assignOrganizationOperatingModel } from "@/features/onboarding/server/assign-operating-model";

const ORG = "11111111-1111-4111-8111-111111111111";
const FOREIGN_ORG = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";

function authenticatedClient(input: {
  role?: string;
  organizationId?: string;
}) {
  const membership = {
    organization_id: input.organizationId ?? ORG,
    role: input.role ?? "owner",
    status: "active",
  };
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER } },
        error: null,
      })),
    },
    from: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      let eqCount = 0;
      builder.select = vi.fn(() => builder);
      builder.eq = vi.fn(() => {
        eqCount += 1;
        return eqCount >= 2
          ? Promise.resolve({ data: [membership], error: null })
          : builder;
      });
      return builder;
    }),
  };
}

function resolvedContext(packKey: string) {
  return vi.fn(async () => ({
    ok: true as const,
    packKey,
  }));
}

describe("assignOrganizationOperatingModel", () => {
  it("submits only the approved model and verifies Service through the resolver", async () => {
    const mutationClient = {
      rpc: vi.fn(async () => ({
        data: {
          ok: true,
          idempotent: false,
          organization_id: ORG,
          operating_model: "service",
          resolved_pack: "foundation.service",
        },
        error: null,
      })),
    };
    const resolveContext = resolvedContext("foundation.service");

    const result = await assignOrganizationOperatingModel(
      authenticatedClient({}) as never,
      { organizationId: ORG, operatingModel: "service" },
      { mutationClient, resolveContext: resolveContext as never },
    );

    expect(result).toEqual({
      ok: true,
      idempotent: false,
      organizationId: ORG,
      operatingModel: "service",
      packKey: "foundation.service",
    });
    expect(mutationClient.rpc).toHaveBeenCalledWith(
      "assign_organization_operating_model",
      {
        p_organization_id: ORG,
        p_actor_user_id: USER,
        p_operating_model: "service",
      },
    );
    expect(resolveContext).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG,
        authenticatedClient: expect.anything(),
      }),
    );
  });

  it("returns an idempotent success for a repeated identical assignment", async () => {
    const mutationClient = {
      rpc: vi.fn(async () => ({
        data: {
          ok: true,
          idempotent: true,
          resolved_pack: "foundation.field-operations",
        },
        error: null,
      })),
    };

    const result = await assignOrganizationOperatingModel(
      authenticatedClient({ role: "admin" }) as never,
      { organizationId: ORG, operatingModel: "field_operations" },
      {
        mutationClient,
        resolveContext: resolvedContext(
          "foundation.field-operations",
        ) as never,
      },
    );

    expect(result).toMatchObject({ ok: true, idempotent: true });
    expect(mutationClient.rpc).toHaveBeenCalledTimes(1);
  });

  it("rejects a normal member before any privileged write", async () => {
    const mutationClient = { rpc: vi.fn() };
    const result = await assignOrganizationOperatingModel(
      authenticatedClient({ role: "member" }) as never,
      { organizationId: ORG, operatingModel: "product_operations" },
      { mutationClient },
    );

    expect(result).toMatchObject({ ok: false, code: "not_authorized" });
    expect(mutationClient.rpc).not.toHaveBeenCalled();
  });

  it("rejects a cross-organization target before any privileged write", async () => {
    const mutationClient = { rpc: vi.fn() };
    const result = await assignOrganizationOperatingModel(
      authenticatedClient({ organizationId: ORG }) as never,
      { organizationId: FOREIGN_ORG, operatingModel: "service" },
      { mutationClient },
    );

    expect(result).toMatchObject({
      ok: false,
      code: "organization_not_found",
    });
    expect(mutationClient.rpc).not.toHaveBeenCalled();
  });

  it("fails closed when the post-write resolver does not confirm the pack", async () => {
    const mutationClient = {
      rpc: vi.fn(async () => ({
        data: {
          ok: true,
          idempotent: false,
          resolved_pack: "foundation.product-operations",
        },
        error: null,
      })),
    };

    const result = await assignOrganizationOperatingModel(
      authenticatedClient({}) as never,
      { organizationId: ORG, operatingModel: "product_operations" },
      {
        mutationClient,
        resolveContext: resolvedContext("foundation.service") as never,
      },
    );

    expect(result).toMatchObject({ ok: false, code: "assignment_failed" });
  });

  it("does not expose raw database failures", async () => {
    const result = await assignOrganizationOperatingModel(
      authenticatedClient({}) as never,
      { organizationId: ORG, operatingModel: "course_seller" },
      {
        mutationClient: {
          rpc: vi.fn(async () => ({
            data: null,
            error: { message: "sensitive database detail" },
          })),
        },
      },
    );

    expect(result).toEqual({
      ok: false,
      code: "assignment_failed",
      message: "We could not save the operating model. Please try again.",
    });
  });
});
