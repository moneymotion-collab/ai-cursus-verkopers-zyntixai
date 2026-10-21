import type { AttentionSeverity } from "@/features/attention/domain/types";

export const ATTENTION_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const satisfies readonly AttentionSeverity[];

export const DEFAULT_ATTENTION_SEVERITY = "medium" as const satisfies AttentionSeverity;

const SEVERITY_LABELS: Record<AttentionSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Higher rank sorts first when ordering by severity descending. */
const SEVERITY_RANK: Record<AttentionSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function isAttentionSeverity(value: string): value is AttentionSeverity {
  return (ATTENTION_SEVERITIES as readonly string[]).includes(value);
}

export function getAttentionSeverityLabel(severity: AttentionSeverity): string {
  return SEVERITY_LABELS[severity];
}

export function getAttentionSeverityRank(severity: AttentionSeverity): number {
  return SEVERITY_RANK[severity];
}

export function compareAttentionSeverityDesc(
  left: AttentionSeverity,
  right: AttentionSeverity,
): number {
  return getAttentionSeverityRank(right) - getAttentionSeverityRank(left);
}
