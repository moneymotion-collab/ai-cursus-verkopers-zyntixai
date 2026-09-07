import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG = "11111111-1111-4111-8111-111111111111";
const createServerClientMock = vi.hoisted(() => vi.fn());
const saveCoreMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));
vi.mock("@/features/onboarding/server/save-v2-core-draft", () => ({
  saveV2CoreDraft: saveCoreMock,
}));

import { saveV2CoreDraftAction } from "@/features/onboarding/actions/onboarding-actions";

describe("saveV2CoreDraftAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({ kind: "session-client" });
    saveCoreMock.mockResolvedValue({
      ok: true,
      context: {
        organizationId: ORG,
        displayName: "Ada",
        organizationName: "Acme",
        teamSizeBand: "2_5",
      },
    });
  });

  it("trims and delegates exactly the three authorized core fields", async () => {
    await expect(
      saveV2CoreDraftAction({
        organizationId: ORG,
        displayName: " Ada ",
        organizationName: " Acme ",
        teamSizeBand: "2_5",
      }),
    ).resolves.toMatchObject({ ok: true });
    expect(saveCoreMock).toHaveBeenCalledWith(
      { kind: "session-client" },
      {
        organizationId: ORG,
        displayName: "Ada",
        organizationName: "Acme",
        teamSizeBand: "2_5",
      },
    );
  });

  it.each([
    {
      input: {
        organizationId: ORG,
        displayName: "",
        organizationName: "Acme",
        teamSizeBand: "solo",
      },
      field: "displayName",
    },
    {
      input: {
        organizationId: ORG,
        displayName: "Ada",
        organizationName: " ",
        teamSizeBand: "solo",
      },
      field: "organizationName",
    },
    {
      input: {
        organizationId: ORG,
        displayName: "Ada",
        organizationName: "Acme",
        teamSizeBand: "",
      },
      field: "teamSizeBand",
    },
  ])("returns safe server validation for $field", async ({ input, field }) => {
    const result = await saveV2CoreDraftAction(input);
    expect(result).toMatchObject({
      ok: false,
      code: "validation_error",
      message: "Check the highlighted fields and try again.",
    });
    if (!result.ok) {
      expect(result.fieldErrors?.[field]?.length).toBeGreaterThan(0);
    }
    expect(saveCoreMock).not.toHaveBeenCalled();
  });

  it("rejects legacy, country, and logo keys instead of persisting them", async () => {
    const result = await saveV2CoreDraftAction({
      organizationId: ORG,
      displayName: "Ada",
      organizationName: "Acme",
      teamSizeBand: "solo",
      businessType: "course_seller",
      country: "NL",
      logo: "fake",
    });
    expect(result).toMatchObject({ ok: false, code: "validation_error" });
    expect(saveCoreMock).not.toHaveBeenCalled();
  });

  it("maps thrown server failures without leaking their message", async () => {
    saveCoreMock.mockRejectedValue(new Error("sensitive database detail"));
    await expect(
      saveV2CoreDraftAction({
        organizationId: ORG,
        displayName: "Ada",
        organizationName: "Acme",
        teamSizeBand: "solo",
      }),
    ).resolves.toEqual({
      ok: false,
      code: "unexpected_error",
      message: "Something went wrong. Try again.",
    });
  });
});
