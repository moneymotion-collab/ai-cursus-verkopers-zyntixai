import { describe, expect, it } from "vitest";
import {
  LEAD_PIPELINE_STAGE_CATEGORIES,
  getLeadPipelineStageCategoryLabel,
  isLeadPipelineStageCategory,
  toLeadPipelineStageOption,
} from "@/features/leads/domain/pipeline-stage";

describe("lead pipeline stage domain", () => {
  it("defines exact database stage categories", () => {
    expect(LEAD_PIPELINE_STAGE_CATEGORIES).toEqual(["new", "active", "qualified", "proposal"]);
    for (const category of LEAD_PIPELINE_STAGE_CATEGORIES) {
      expect(isLeadPipelineStageCategory(category)).toBe(true);
      expect(getLeadPipelineStageCategoryLabel(category)).toBeTruthy();
    }
  });

  it("rejects unknown stage categories", () => {
    expect(isLeadPipelineStageCategory("won")).toBe(false);
    expect(isLeadPipelineStageCategory("NEW")).toBe(false);
  });

  it("maps pipeline stage rows to form options", () => {
    const option = toLeadPipelineStageOption({
      id: "11111111-1111-4111-8111-111111111111",
      name: "New",
      position: 1,
      stage_category: "new",
      is_default: true,
      archived_at: null,
    });

    expect(option).toEqual({
      stageId: "11111111-1111-4111-8111-111111111111",
      name: "New",
      position: 1,
      stageCategory: "new",
      stageCategoryLabel: "New",
      isDefault: true,
      isArchived: false,
    });
  });

  it("returns null for unknown stage categories on rows", () => {
    const option = toLeadPipelineStageOption({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Broken",
      position: 1,
      stage_category: "won",
      is_default: false,
      archived_at: null,
    });
    expect(option).toBeNull();
  });
});
