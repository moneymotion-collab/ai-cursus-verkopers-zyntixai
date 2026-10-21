import { describe, expect, it } from "vitest";
import {
  MEMBER_DISPLAY_FALLBACK_LABEL,
  resolveMemberDisplayLabel,
} from "@/features/tasks/domain/member-display-label";

describe("resolveMemberDisplayLabel", () => {
  it("shows a non-empty display name", () => {
    expect(
      resolveMemberDisplayLabel({
        displayName: "Jan Jansen",
        metadataDisplayName: "ignored",
      }),
    ).toBe("Jan Jansen");
  });

  it("uses metadata name when display name is blank", () => {
    expect(
      resolveMemberDisplayLabel({
        displayName: "   ",
        metadataDisplayName: "Lisa de Vries",
      }),
    ).toBe("Lisa de Vries");
  });

  it("keeps multiple nameless-profile members distinguishable via metadata names", () => {
    const first = resolveMemberDisplayLabel({
      displayName: null,
      metadataDisplayName: "Alpha Tester",
    });
    const second = resolveMemberDisplayLabel({
      displayName: null,
      metadataDisplayName: "Beta Tester",
    });
    expect(first).toBe("Alpha Tester");
    expect(second).toBe("Beta Tester");
    expect(first).not.toBe(second);
  });

  it("uses the generic fallback only when no safe name exists", () => {
    expect(
      resolveMemberDisplayLabel({
        displayName: null,
        metadataDisplayName: "",
      }),
    ).toBe(MEMBER_DISPLAY_FALLBACK_LABEL);
  });

  it("never treats a UUID-like value as a required output of the helper", () => {
    const label = resolveMemberDisplayLabel({
      displayName: "Alex Morgan",
      metadataDisplayName: "00000000-0000-4000-8000-000000000099",
    });
    expect(label).toBe("Alex Morgan");
    expect(label).not.toMatch(/[0-9a-f-]{36}/i);
  });
});
