import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getLeadPipelineStageCategoryLabel,
  isLeadPipelineStageCategory,
  type LeadPipelineStageCategory,
} from "@/features/leads/domain/pipeline-stage";
import type { LeadStageSummary } from "@/features/leads/domain/read-types";
import { LEAD_PIPELINE_STAGE_SELECT_COLUMNS } from "@/features/leads/server/lead-query-columns";

export const MEMBER_LABEL_UNASSIGNED = "Unassigned";
export const MEMBER_LABEL_UNAVAILABLE = "Unavailable member";
export const STAGE_LABEL_UNAVAILABLE = "Unavailable stage";
export const CUSTOMER_LABEL_UNAVAILABLE = "Unavailable customer";

export type LeadStageLabelBundle = {
  name: string;
  position: number;
  stageCategory: LeadPipelineStageCategory;
  stageCategoryLabel: string;
  isDefault: boolean;
  isArchived: boolean;
};

export type LeadConvertedCustomerRow = {
  id: string;
  display_name: string;
  archived_at: string | null;
};

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export async function resolveMemberLabels(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  memberIds: Array<string | null | undefined>,
): Promise<Record<string, string>> {
  const ids = uniqueIds(memberIds);
  if (ids.length === 0) {
    return {};
  }

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id")
    .eq("organization_id", organizationId)
    .in("id", ids);

  const memberRows = members ?? [];
  const userIds = uniqueIds(memberRows.map((row) => row.user_id));
  const profileNames: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      profileNames[profile.id] = normalizeLabel(profile.display_name, MEMBER_LABEL_UNAVAILABLE);
    }
  }

  const labels: Record<string, string> = {};
  for (const member of memberRows) {
    labels[member.id] = profileNames[member.user_id] ?? MEMBER_LABEL_UNAVAILABLE;
  }

  return labels;
}

export function resolveMemberLabel(
  memberId: string | null | undefined,
  labels: Record<string, string>,
): string {
  if (!memberId) {
    return MEMBER_LABEL_UNASSIGNED;
  }

  return labels[memberId] ?? MEMBER_LABEL_UNAVAILABLE;
}

export async function resolveStageLabelBundles(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  stageIds: Array<string | null | undefined>,
): Promise<Record<string, LeadStageLabelBundle>> {
  const ids = uniqueIds(stageIds);
  if (ids.length === 0) {
    return {};
  }

  const { data: stages } = await supabase
    .from("lead_pipeline_stages")
    .select(LEAD_PIPELINE_STAGE_SELECT_COLUMNS)
    .eq("organization_id", organizationId)
    .in("id", ids);

  const bundles: Record<string, LeadStageLabelBundle> = {};
  for (const stage of stages ?? []) {
    if (!isLeadPipelineStageCategory(stage.stage_category)) {
      continue;
    }

    bundles[stage.id] = {
      name: normalizeLabel(stage.name, STAGE_LABEL_UNAVAILABLE),
      position: stage.position,
      stageCategory: stage.stage_category,
      stageCategoryLabel: getLeadPipelineStageCategoryLabel(stage.stage_category),
      isDefault: stage.is_default,
      isArchived: stage.archived_at != null,
    };
  }

  return bundles;
}

export function resolveStageLabelBundle(
  stageId: string,
  bundles: Record<string, LeadStageLabelBundle>,
): LeadStageLabelBundle {
  return (
    bundles[stageId] ?? {
      name: STAGE_LABEL_UNAVAILABLE,
      position: 0,
      stageCategory: "new",
      stageCategoryLabel: getLeadPipelineStageCategoryLabel("new"),
      isDefault: false,
      isArchived: false,
    }
  );
}

export function toLeadStageSummary(
  stageId: string,
  bundles: Record<string, LeadStageLabelBundle>,
): LeadStageSummary {
  const bundle = resolveStageLabelBundle(stageId, bundles);
  return {
    stageId,
    name: bundle.name,
    position: bundle.position,
    stageCategory: bundle.stageCategory,
    stageCategoryLabel: bundle.stageCategoryLabel,
    isDefault: bundle.isDefault,
  };
}

export async function resolveConvertedCustomerRow(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  customerId: string,
): Promise<LeadConvertedCustomerRow | null> {
  const { data } = await supabase
    .from("customers")
    .select("id, display_name, archived_at")
    .eq("organization_id", organizationId)
    .eq("id", customerId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    display_name: data.display_name,
    archived_at: data.archived_at,
  };
}

export function resolveCustomerDisplayLabel(
  row: LeadConvertedCustomerRow | null,
): string {
  if (!row) {
    return CUSTOMER_LABEL_UNAVAILABLE;
  }

  return normalizeLabel(row.display_name, CUSTOMER_LABEL_UNAVAILABLE);
}
