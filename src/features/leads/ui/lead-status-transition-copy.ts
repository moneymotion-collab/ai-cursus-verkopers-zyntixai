import type { LeadStatus } from "@/features/leads/domain/types";
import { getLeadStatusLabel } from "@/features/leads/domain/status";

const STATUS_EFFECTS: Partial<Record<LeadStatus, Partial<Record<LeadStatus, string>>>> = {
  open: {
    lost: "Marks this lead as lost while keeping the current pipeline stage.",
    disqualified: "Marks this lead as disqualified while keeping the current pipeline stage.",
  },
  lost: {
    open: "Reopens this lead for active follow-up.",
  },
  disqualified: {
    open: "Reopens this lead for active follow-up.",
  },
};

export function getLeadStatusTransitionEffectExplanation(
  fromStatus: LeadStatus,
  toStatus: LeadStatus,
): string | null {
  return STATUS_EFFECTS[fromStatus]?.[toStatus] ?? null;
}

export function getLeadStatusTransitionLabel(fromStatus: LeadStatus, toStatus: LeadStatus): string {
  return `Change from ${getLeadStatusLabel(fromStatus)} to ${getLeadStatusLabel(toStatus)}`;
}
