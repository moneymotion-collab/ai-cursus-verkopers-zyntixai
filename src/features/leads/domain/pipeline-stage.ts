import type { LeadPipelineStageRow } from "@/features/leads/domain/types";

export const LEAD_PIPELINE_STAGE_CATEGORIES = [
  "new",
  "active",
  "qualified",
  "proposal",
] as const;

export type LeadPipelineStageCategory = (typeof LEAD_PIPELINE_STAGE_CATEGORIES)[number];

const CATEGORY_LABELS: Record<LeadPipelineStageCategory, string> = {
  new: "New",
  active: "Active",
  qualified: "Qualified",
  proposal: "Proposal",
};

export type LeadPipelineStageOption = {
  stageId: string;
  name: string;
  position: number;
  stageCategory: LeadPipelineStageCategory;
  stageCategoryLabel: string;
  isDefault: boolean;
  isArchived: boolean;
};

export function isLeadPipelineStageCategory(
  value: string,
): value is LeadPipelineStageCategory {
  return (LEAD_PIPELINE_STAGE_CATEGORIES as readonly string[]).includes(value);
}

export function getLeadPipelineStageCategoryLabel(
  category: LeadPipelineStageCategory,
): string {
  return CATEGORY_LABELS[category];
}

export function toLeadPipelineStageOption(
  row: Pick<
    LeadPipelineStageRow,
    "id" | "name" | "position" | "stage_category" | "is_default" | "archived_at"
  >,
): LeadPipelineStageOption | null {
  if (!isLeadPipelineStageCategory(row.stage_category)) {
    return null;
  }

  return {
    stageId: row.id,
    name: row.name,
    position: row.position,
    stageCategory: row.stage_category,
    stageCategoryLabel: getLeadPipelineStageCategoryLabel(row.stage_category),
    isDefault: row.is_default,
    isArchived: row.archived_at != null,
  };
}
