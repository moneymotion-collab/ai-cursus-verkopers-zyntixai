import { describe, expect, it } from "vitest";
import {
  canShowCorrectProgressWorkflow,
  canShowRecordProgressWorkflow,
  canShowVoidProgressWorkflow,
} from "@/features/progress/ui/progress-workflow-visibility";
import { EMPTY_PROGRESS_PERMISSIONS } from "@/features/progress/domain/types";
import type { ProgressRole } from "@/features/progress/domain/types";

describe("canShowRecordProgressWorkflow", () => {
  it("allows owner, admin, and staff", () => {
    expect(canShowRecordProgressWorkflow("owner")).toBe(true);
    expect(canShowRecordProgressWorkflow("admin")).toBe(true);
    expect(canShowRecordProgressWorkflow("staff")).toBe(true);
  });

  it("never allows viewer", () => {
    const viewer: ProgressRole = "viewer";
    expect(canShowRecordProgressWorkflow(viewer)).toBe(false);
  });
});

describe("canShowVoidProgressWorkflow", () => {
  it("follows capabilities.canVoidFact", () => {
    expect(canShowVoidProgressWorkflow({ ...EMPTY_PROGRESS_PERMISSIONS, canVoidFact: true })).toBe(
      true,
    );
    expect(
      canShowVoidProgressWorkflow({ ...EMPTY_PROGRESS_PERMISSIONS, canVoidFact: false }),
    ).toBe(false);
  });
});

describe("canShowCorrectProgressWorkflow", () => {
  it("follows capabilities.canCorrectFact", () => {
    expect(
      canShowCorrectProgressWorkflow({ ...EMPTY_PROGRESS_PERMISSIONS, canCorrectFact: true }),
    ).toBe(true);
    expect(
      canShowCorrectProgressWorkflow({ ...EMPTY_PROGRESS_PERMISSIONS, canCorrectFact: false }),
    ).toBe(false);
  });

  it("never shows mutate CTAs for viewer-derived empty permissions", () => {
    expect(canShowVoidProgressWorkflow(EMPTY_PROGRESS_PERMISSIONS)).toBe(false);
    expect(canShowCorrectProgressWorkflow(EMPTY_PROGRESS_PERMISSIONS)).toBe(false);
  });
});
