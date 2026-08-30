/**
 * DATA-1H deterministic Customer identity resolution.
 * Exact org-scoped email only. No name, fuzzy, AI, write, or plan.
 */

import type {
  DataIntakeStagingRow,
  DataStagingResolution,
  DataStagingTargetOperation,
} from "@/features/data-intake/domain/staging";

export const DATA_CUSTOMER_MATCHER_VERSION = "customer-matcher-v1" as const;
export const DATA_CUSTOMER_MATCH_KEY = "email" as const;

export type CustomerIdentityCandidate = {
  id: string;
  organizationId: string;
  email: string | null;
  archivedAt: string | null;
};

export type DataMatchKind =
  | "exact"
  | "no_match"
  | "no_key"
  | "ambiguous"
  | "collision"
  | "skipped";

export type DataMatchRow = {
  sourceRowNumber: number;
  resolution: DataStagingResolution;
  targetOperation: DataStagingTargetOperation | null;
  targetRecordId: string | null;
  matchKind: DataMatchKind;
};

export type DataMatchSummary = {
  matcherVersion: typeof DATA_CUSTOMER_MATCHER_VERSION;
  matchKey: typeof DATA_CUSTOMER_MATCH_KEY;
  eligibleRows: number;
  exactMatches: number;
  noMatches: number;
  noKeyRows: number;
  ambiguousRows: number;
  collisions: number;
  blockedSkipped: number;
};

export function stagedMatchEmail(row: DataIntakeStagingRow): string | null {
  const value = row.normalizedValues.email;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function classifyIdentityResolutions(input: {
  organizationId: string;
  rows: readonly DataIntakeStagingRow[];
  candidates: readonly CustomerIdentityCandidate[];
}): DataMatchRow[] {
  const eligible = input.rows.filter((row) => row.lifecycle === "validated");
  const byEmail = new Map<string, DataIntakeStagingRow[]>();
  for (const row of eligible) {
    const email = stagedMatchEmail(row);
    if (!email) {
      continue;
    }
    const current = byEmail.get(email) ?? [];
    current.push(row);
    byEmail.set(email, current);
  }

  const candidatesByEmail = new Map<string, CustomerIdentityCandidate[]>();
  for (const candidate of input.candidates) {
    if (candidate.organizationId !== input.organizationId) {
      continue;
    }
    if (!candidate.email) {
      continue;
    }
    const current = candidatesByEmail.get(candidate.email) ?? [];
    current.push(candidate);
    candidatesByEmail.set(candidate.email, current);
  }

  return input.rows.map((row) => {
    if (row.lifecycle === "blocked") {
      return {
        sourceRowNumber: row.sourceRowNumber,
        resolution: "none",
        targetOperation: null,
        targetRecordId: null,
        matchKind: "skipped",
      };
    }
    const email = stagedMatchEmail(row);
    if (!email) {
      return {
        sourceRowNumber: row.sourceRowNumber,
        resolution: "none",
        targetOperation: null,
        targetRecordId: null,
        matchKind: "no_key",
      };
    }
    const siblings = byEmail.get(email) ?? [];
    const matches = candidatesByEmail.get(email) ?? [];
    if (siblings.length > 1) {
      return {
        sourceRowNumber: row.sourceRowNumber,
        resolution: "conflict",
        targetOperation: null,
        targetRecordId: null,
        matchKind: "collision",
      };
    }
    if (matches.length > 1) {
      return {
        sourceRowNumber: row.sourceRowNumber,
        resolution: "conflict",
        targetOperation: null,
        targetRecordId: null,
        matchKind: "ambiguous",
      };
    }
    if (matches.length === 1 && matches[0]) {
      return {
        sourceRowNumber: row.sourceRowNumber,
        resolution: "duplicate",
        targetOperation: "link",
        targetRecordId: matches[0].id,
        matchKind: "exact",
      };
    }
    return {
      sourceRowNumber: row.sourceRowNumber,
      resolution: "create",
      targetOperation: "create",
      targetRecordId: null,
      matchKind: "no_match",
    };
  });
}

export function summarizeIdentityResolutions(
  rows: readonly DataMatchRow[],
): DataMatchSummary {
  return {
    matcherVersion: DATA_CUSTOMER_MATCHER_VERSION,
    matchKey: DATA_CUSTOMER_MATCH_KEY,
    eligibleRows: rows.filter((row) => row.matchKind !== "skipped").length,
    exactMatches: rows.filter((row) => row.matchKind === "exact").length,
    noMatches: rows.filter((row) => row.matchKind === "no_match").length,
    noKeyRows: rows.filter((row) => row.matchKind === "no_key").length,
    ambiguousRows: rows.filter((row) => row.matchKind === "ambiguous").length,
    collisions: rows.filter((row) => row.matchKind === "collision").length,
    blockedSkipped: rows.filter((row) => row.matchKind === "skipped").length,
  };
}

export function completedMatchingStatus(input: {
  rows: readonly DataIntakeStagingRow[];
  matches: readonly DataMatchRow[];
}): "review_required" | "ready_for_approval" {
  if (input.rows.some((row) => row.lifecycle === "blocked")) {
    return "review_required";
  }
  if (
    input.matches.some(
      (row) =>
        row.matchKind === "collision" || row.matchKind === "ambiguous" || row.matchKind === "no_key",
    )
  ) {
    return "review_required";
  }
  return "ready_for_approval";
}

export function applyMatchToStagingRow(
  row: DataIntakeStagingRow,
  match: DataMatchRow,
): DataIntakeStagingRow {
  return {
    ...row,
    resolution: match.resolution,
    targetOperation: match.targetOperation,
    targetRecordId: match.targetRecordId,
  };
}
