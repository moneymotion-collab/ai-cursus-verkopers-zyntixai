import { describe, expect, it, vi } from "vitest";
import {
  createTeamInviteIntentInputSchema,
  deleteTeamInviteIntentRpcSchema,
  listTeamInviteIntentsRpcSchema,
  saveTeamInviteIntentRpcSchema,
  teamInviteIntentMessage,
} from "@/features/onboarding/domain/team-invite-intents";
import {
  createOrganizationTeamInviteIntent,
  deleteOrganizationTeamInviteIntent,
  listOrganizationTeamInviteIntents,
  updateOrganizationTeamInviteIntent,
} from "@/features/onboarding/server/team-invite-intents";

const ORG = "11111111-1111-4111-8111-111111111111";
const INTENT = "22222222-2222-4222-8222-222222222222";

function intent(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: INTENT,
    organization_id: ORG,
    email_normalized: "teammate@example.test",
    role: "staff",
    revision: 1,
    created_at: "2026-09-08T00:00:00Z",
    updated_at: "2026-09-08T00:00:00Z",
    ...overrides,
  };
}

function client(data: unknown, error: { message: string } | null = null) {
  return {
    rpc: vi.fn(async () => ({ data, error })),
    from: vi.fn(),
  };
}

describe("Team invite-intent application boundary", () => {
  it("uses the governed LIST RPC and validates its Json response", async () => {
    const supabase = client({
      ok: true,
      code: "OK",
      organization_id: ORG,
      intents: [intent()],
    });

    const result = await listOrganizationTeamInviteIntents(
      supabase as never,
      ORG,
    );

    expect(result).toEqual({
      ok: true,
      intents: [
        {
          id: INTENT,
          organizationId: ORG,
          emailNormalized: "teammate@example.test",
          role: "staff",
          revision: 1,
          createdAt: "2026-09-08T00:00:00Z",
          updatedAt: "2026-09-08T00:00:00Z",
        },
      ],
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "list_organization_onboarding_team_invite_intents",
      { p_organization_id: ORG },
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it.each(["admin", "staff", "viewer"] as const)(
    "creates a durable %s intent through the governed CREATE RPC",
    async (role) => {
      const supabase = client({
        ok: true,
        code: "OK",
        intent: intent({ role }),
      });

      const result = await createOrganizationTeamInviteIntent(
        supabase as never,
        {
          organizationId: ORG,
          email: " Teammate@Example.Test ",
          role,
        },
      );

      expect(result).toMatchObject({
        ok: true,
        intent: { role, emailNormalized: "teammate@example.test" },
      });
      expect(supabase.rpc).toHaveBeenCalledWith(
        "create_organization_onboarding_team_invite_intent",
        {
          p_organization_id: ORG,
          p_email: " Teammate@Example.Test ",
          p_role: role,
        },
      );
    },
  );

  it("updates in place with expected revision and trusts the returned revision", async () => {
    const supabase = client({
      ok: true,
      code: "OK",
      intent: intent({
        email_normalized: "updated@example.test",
        role: "viewer",
        revision: 8,
      }),
    });

    const result = await updateOrganizationTeamInviteIntent(
      supabase as never,
      {
        organizationId: ORG,
        intentId: INTENT,
        expectedRevision: 7,
        email: "updated@example.test",
        role: "viewer",
      },
    );

    expect(result).toMatchObject({
      ok: true,
      intent: { revision: 8, role: "viewer" },
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "update_organization_onboarding_team_invite_intent",
      {
        p_organization_id: ORG,
        p_intent_id: INTENT,
        p_expected_revision: 7,
        p_email: "updated@example.test",
        p_role: "viewer",
      },
    );
  });

  it("removes only the intent through revision-aware DELETE", async () => {
    const supabase = client({
      ok: true,
      code: "OK",
      intent_id: INTENT,
      deleted_revision: 4,
    });

    const result = await deleteOrganizationTeamInviteIntent(
      supabase as never,
      {
        organizationId: ORG,
        intentId: INTENT,
        expectedRevision: 4,
      },
    );

    expect(result).toEqual({
      ok: true,
      intentId: INTENT,
      deletedRevision: 4,
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "delete_organization_onboarding_team_invite_intent",
      {
        p_organization_id: ORG,
        p_intent_id: INTENT,
        p_expected_revision: 4,
      },
    );
  });

  it.each([
    ["SELF_INVITE", "The workspace Owner is already included."],
    ["DUPLICATE_INTENT", "already included in your team setup"],
    ["EXISTING_MEMBER", "already part of the workspace"],
    ["PENDING_INVITATION", "invitation for this person already exists"],
    ["STALE_REVISION", "updated elsewhere"],
  ] as const)("maps %s without exposing database internals", async (code, copy) => {
    const supabase = client({ ok: false, code });
    const result = await createOrganizationTeamInviteIntent(
      supabase as never,
      {
        organizationId: ORG,
        email: "teammate@example.test",
        role: "admin",
      },
    );

    expect(result).toMatchObject({ ok: false, code });
    if (!result.ok) {
      expect(result.message).toContain(copy);
      expect(result.message).not.toMatch(/postgres|constraint|supabase/i);
    }
  });

  it("fails closed on malformed Json and transport errors", async () => {
    const malformed = await listOrganizationTeamInviteIntents(
      client({ ok: true, intents: "not-an-array" }) as never,
      ORG,
    );
    const transport = await listOrganizationTeamInviteIntents(
      client(null, { message: "sensitive detail" }) as never,
      ORG,
    );

    expect(malformed).toEqual({
      ok: false,
      code: "INVALID_RESPONSE",
      message: teamInviteIntentMessage("INVALID_RESPONSE"),
    });
    expect(transport).toEqual({
      ok: false,
      code: "TRANSPORT_ERROR",
      message: teamInviteIntentMessage("TRANSPORT_ERROR"),
    });

    const thrown = await listOrganizationTeamInviteIntents(
      {
        rpc: vi.fn(async () => {
          throw new Error("network detail");
        }),
      } as never,
      ORG,
    );
    expect(thrown).toEqual(transport);
  });

  it("keeps no-role and invalid email input outside the mutation boundary", () => {
    expect(
      createTeamInviteIntentInputSchema.safeParse({
        organizationId: ORG,
        email: "invalid",
        role: "",
      }).success,
    ).toBe(false);
    expect(
      createTeamInviteIntentInputSchema.safeParse({
        organizationId: ORG,
        email: "valid@example.test",
        role: "owner",
      }).success,
    ).toBe(false);
  });

  it("declares exact runtime envelopes for list, save, and delete", () => {
    expect(
      listTeamInviteIntentsRpcSchema.safeParse({
        ok: true,
        code: "OK",
        organization_id: ORG,
        intents: [],
      }).success,
    ).toBe(true);
    expect(
      saveTeamInviteIntentRpcSchema.safeParse({
        ok: true,
        code: "OK",
        intent: intent(),
      }).success,
    ).toBe(true);
    expect(
      deleteTeamInviteIntentRpcSchema.safeParse({
        ok: true,
        code: "OK",
        intent_id: INTENT,
        deleted_revision: 1,
      }).success,
    ).toBe(true);
  });
});
