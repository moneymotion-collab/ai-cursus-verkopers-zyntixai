import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAttentionDetailHref,
  buildAttentionListHref,
} from "@/features/attention/domain/attention-navigation";
import { evaluateEnrollmentNoRecentProgress } from "@/features/attention/domain/eligibility";
import { isKnownAttentionRole } from "@/features/attention/domain/permissions";
import type { AttentionSeverity } from "@/features/attention/domain/types";
import { getAttentionSeverityRank } from "@/features/attention/domain/severity";
import {
  enrollmentProgressHealthLabel,
  type EnrollmentListOperationalHints,
  type EnrollmentOpenAttentionSummaryItem,
  type EnrollmentOperationalNextAction,
  type EnrollmentOperationalSnapshot,
  type EnrollmentProgressHealth,
} from "@/features/enrollments/domain/operational-metadata";
import {
  getProgressFactTypeLabel,
  isProgressFactType,
} from "@/features/progress/domain/fact-types";
import { buildProgressListHref } from "@/features/progress/domain/progress-navigation";
import type { Database } from "@/types/database";

const OPEN_ATTENTION_STATUSES = ["open", "acknowledged"] as const;
const MAX_ATTENTION_SUMMARY = 5;
const MAX_RECENT_FACTS_SCAN = 40;

type ProgressFactRow = {
  id: string;
  enrollment_id: string;
  title: string;
  fact_type: string;
  occurred_at: string;
};

type AttentionItemRow = {
  id: string;
  enrollment_id: string;
  title: string;
  severity: string;
  status: string;
};

function isAttentionSeverity(value: string): value is AttentionSeverity {
  return (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  );
}

function resolveHealth(params: {
  enrollmentArchivedAt: string | null;
  enrollmentStatus: string;
  hasLatestFact: boolean;
  staleEligible: boolean;
  stale: boolean;
}): EnrollmentProgressHealth {
  if (params.enrollmentArchivedAt != null) {
    return "not_applicable";
  }
  if (
    params.enrollmentStatus === "completed" ||
    params.enrollmentStatus === "cancelled" ||
    params.enrollmentStatus === "pending"
  ) {
    return "not_applicable";
  }
  if (params.staleEligible && params.stale) {
    return "no_recent_progress";
  }
  if (!params.hasLatestFact) {
    return "no_progress_yet";
  }
  return "healthy";
}

function resolveNextAction(params: {
  organizationId: string;
  enrollmentId: string;
  health: EnrollmentProgressHealth;
  openAttention: EnrollmentOpenAttentionSummaryItem[];
  canViewAttention: boolean;
}): EnrollmentOperationalNextAction | null {
  const highestAttention = [...params.openAttention].sort(
    (left, right) =>
      getAttentionSeverityRank(right.severity) -
      getAttentionSeverityRank(left.severity),
  )[0];

  if (highestAttention && params.canViewAttention) {
    return {
      label: "Open Attention",
      href: highestAttention.href,
      reason:
        params.health === "no_recent_progress"
          ? "This enrollment has open Attention for no recent progress."
          : "This enrollment has open Attention that needs review.",
    };
  }

  if (
    params.health === "no_recent_progress" ||
    params.health === "no_progress_yet"
  ) {
    return {
      label: "Review progress",
      href: buildProgressListHref({
        organizationId: params.organizationId,
        enrollmentId: params.enrollmentId,
      }),
      reason:
        params.health === "no_recent_progress"
          ? "No qualifying progress within the 14 UTC-day stale threshold."
          : "No progress has been recorded for this enrollment yet.",
    };
  }

  if (params.canViewAttention) {
    return {
      label: "View Attention for enrollment",
      href: buildAttentionListHref({
        organizationId: params.organizationId,
        enrollmentId: params.enrollmentId,
      }),
      reason: "Review related Attention in the Attention workspace.",
    };
  }

  return null;
}

async function loadLatestProgressFactsByEnrollment(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  enrollmentIds: string[];
}): Promise<Map<string, ProgressFactRow>> {
  const map = new Map<string, ProgressFactRow>();
  if (params.enrollmentIds.length === 0) {
    return map;
  }

  const { data, error } = await params.supabase
    .from("enrollment_progress_facts")
    .select("id, enrollment_id, title, fact_type, occurred_at")
    .eq("organization_id", params.organizationId)
    .in("enrollment_id", params.enrollmentIds)
    .is("voided_at", null)
    .order("occurred_at", { ascending: false })
    .limit(Math.min(params.enrollmentIds.length * 3, 300));

  if (error || !data) {
    return map;
  }

  for (const row of data as ProgressFactRow[]) {
    if (!map.has(row.enrollment_id)) {
      map.set(row.enrollment_id, row);
    }
  }

  return map;
}

async function loadOpenAttentionByEnrollment(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  enrollmentIds: string[];
}): Promise<Map<string, AttentionItemRow[]>> {
  const map = new Map<string, AttentionItemRow[]>();
  if (params.enrollmentIds.length === 0) {
    return map;
  }

  const { data, error } = await params.supabase
    .from("attention_items")
    .select("id, enrollment_id, title, severity, status")
    .eq("organization_id", params.organizationId)
    .in("enrollment_id", params.enrollmentIds)
    .in("status", [...OPEN_ATTENTION_STATUSES])
    .is("archived_at", null)
    .order("last_detected_at", { ascending: false })
    .limit(Math.min(params.enrollmentIds.length * 20, 500));

  if (error || !data) {
    return map;
  }

  for (const row of data as AttentionItemRow[]) {
    const current = map.get(row.enrollment_id) ?? [];
    current.push(row);
    map.set(row.enrollment_id, current);
  }

  return map;
}

async function countOpenAttentionForEnrollment(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  enrollmentId: string;
}): Promise<number> {
  const { count, error } = await params.supabase
    .from("attention_items")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", params.organizationId)
    .eq("enrollment_id", params.enrollmentId)
    .in("status", [...OPEN_ATTENTION_STATUSES])
    .is("archived_at", null);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

async function countNonVoidedFacts(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  enrollmentId: string;
}): Promise<number> {
  const { count, error } = await params.supabase
    .from("enrollment_progress_facts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", params.organizationId)
    .eq("enrollment_id", params.enrollmentId)
    .is("voided_at", null);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

async function loadRecentFactsForDetail(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  enrollmentId: string;
}): Promise<ProgressFactRow[]> {
  const { data, error } = await params.supabase
    .from("enrollment_progress_facts")
    .select("id, enrollment_id, title, fact_type, occurred_at")
    .eq("organization_id", params.organizationId)
    .eq("enrollment_id", params.enrollmentId)
    .is("voided_at", null)
    .order("occurred_at", { ascending: false })
    .limit(MAX_RECENT_FACTS_SCAN);

  if (error || !data) {
    return [];
  }
  return data as ProgressFactRow[];
}

/**
 * Bounded org-scoped operational snapshot for one enrollment detail page.
 */
export async function loadEnrollmentOperationalSnapshot(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  enrollmentId: string;
  enrollmentStatus: string;
  enrollmentCreatedAt: string;
  enrollmentArchivedAt: string | null;
  role: string;
  evaluatedAt?: string;
}): Promise<EnrollmentOperationalSnapshot> {
  const evaluatedAt = params.evaluatedAt ?? new Date().toISOString();
  const canViewAttention = isKnownAttentionRole(params.role);

  const [facts, attentionMap, nonVoidedFactCount, openAttentionCount] =
    await Promise.all([
      loadRecentFactsForDetail({
        supabase: params.supabase,
        organizationId: params.organizationId,
        enrollmentId: params.enrollmentId,
      }),
      canViewAttention
        ? loadOpenAttentionByEnrollment({
            supabase: params.supabase,
            organizationId: params.organizationId,
            enrollmentIds: [params.enrollmentId],
          })
        : Promise.resolve(new Map<string, AttentionItemRow[]>()),
      countNonVoidedFacts({
        supabase: params.supabase,
        organizationId: params.organizationId,
        enrollmentId: params.enrollmentId,
      }),
      canViewAttention
        ? countOpenAttentionForEnrollment({
            supabase: params.supabase,
            organizationId: params.organizationId,
            enrollmentId: params.enrollmentId,
          })
        : Promise.resolve(0),
    ]);

  const latestRow = facts[0] ?? null;
  const latestOccurredAt = latestRow?.occurred_at ?? null;

  const evaluation = evaluateEnrollmentNoRecentProgress({
    enrollmentStatus: params.enrollmentStatus,
    enrollmentArchivedAt: params.enrollmentArchivedAt,
    enrollmentCreatedAt: params.enrollmentCreatedAt,
    latestNonVoidedProgressOccurredAt: latestOccurredAt,
    evaluatedAt,
  });

  const health = resolveHealth({
    enrollmentArchivedAt: params.enrollmentArchivedAt,
    enrollmentStatus: params.enrollmentStatus,
    hasLatestFact: latestRow != null,
    staleEligible: evaluation.eligible,
    stale: evaluation.eligible ? evaluation.stale : false,
  });

  const openRows = attentionMap.get(params.enrollmentId) ?? [];
  const attentionItems: EnrollmentOpenAttentionSummaryItem[] = openRows
    .filter(
      (row) =>
        (row.status === "open" || row.status === "acknowledged") &&
        isAttentionSeverity(row.severity),
    )
    .slice(0, MAX_ATTENTION_SUMMARY)
    .map((row) => ({
      id: row.id,
      title: row.title,
      severity: row.severity as AttentionSeverity,
      status: row.status as "open" | "acknowledged",
      href: buildAttentionDetailHref(row.id, params.organizationId),
    }));

  const factType = latestRow && isProgressFactType(latestRow.fact_type)
    ? latestRow.fact_type
    : null;

  return {
    enrollmentId: params.enrollmentId,
    organizationId: params.organizationId,
    progress: {
      nonVoidedFactCount,
      latest:
        latestRow && factType
          ? {
              factId: latestRow.id,
              title: latestRow.title,
              factType,
              factTypeLabel: getProgressFactTypeLabel(factType),
              occurredAt: latestRow.occurred_at,
            }
          : null,
      progressReferenceAt: evaluation.eligible
        ? evaluation.referenceTimestamp
        : latestOccurredAt ?? params.enrollmentCreatedAt,
      ageCalendarDays: evaluation.eligible ? evaluation.ageCalendarDays : null,
      health,
      healthLabel: enrollmentProgressHealthLabel(health),
      staleEligible: evaluation.eligible,
      stale: evaluation.eligible ? evaluation.stale : false,
    },
    attention: {
      openCount: openAttentionCount,
      items: attentionItems,
    },
    nextAction: resolveNextAction({
      organizationId: params.organizationId,
      enrollmentId: params.enrollmentId,
      health,
      openAttention: attentionItems,
      canViewAttention,
    }),
  };
}

/**
 * Batch operational hints for the current enrollment list page (no N+1).
 */
export async function loadEnrollmentListOperationalHints(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  enrollments: Array<{
    id: string;
    status: string;
    createdAt: string;
    archivedAt: string | null;
  }>;
  role: string;
  evaluatedAt?: string;
}): Promise<EnrollmentListOperationalHints> {
  const evaluatedAt = params.evaluatedAt ?? new Date().toISOString();
  const enrollmentIds = params.enrollments.map((item) => item.id);
  const canViewAttention = isKnownAttentionRole(params.role);

  const [latestFacts, attentionMap] = await Promise.all([
    loadLatestProgressFactsByEnrollment({
      supabase: params.supabase,
      organizationId: params.organizationId,
      enrollmentIds,
    }),
    canViewAttention
      ? loadOpenAttentionByEnrollment({
          supabase: params.supabase,
          organizationId: params.organizationId,
          enrollmentIds,
        })
      : Promise.resolve(new Map<string, AttentionItemRow[]>()),
  ]);

  const byEnrollmentId: EnrollmentListOperationalHints["byEnrollmentId"] = {};

  for (const enrollment of params.enrollments) {
    const latest = latestFacts.get(enrollment.id) ?? null;
    const evaluation = evaluateEnrollmentNoRecentProgress({
      enrollmentStatus: enrollment.status,
      enrollmentArchivedAt: enrollment.archivedAt,
      enrollmentCreatedAt: enrollment.createdAt,
      latestNonVoidedProgressOccurredAt: latest?.occurred_at ?? null,
      evaluatedAt,
    });
    const health = resolveHealth({
      enrollmentArchivedAt: enrollment.archivedAt,
      enrollmentStatus: enrollment.status,
      hasLatestFact: latest != null,
      staleEligible: evaluation.eligible,
      stale: evaluation.eligible ? evaluation.stale : false,
    });

    const openItems = attentionMap.get(enrollment.id) ?? [];
    let highest: AttentionSeverity | null = null;
    for (const item of openItems) {
      if (!isAttentionSeverity(item.severity)) {
        continue;
      }
      if (
        highest == null ||
        getAttentionSeverityRank(item.severity) > getAttentionSeverityRank(highest)
      ) {
        highest = item.severity;
      }
    }

    byEnrollmentId[enrollment.id] = {
      latestProgressOccurredAt: latest?.occurred_at ?? null,
      latestProgressTitle: latest?.title ?? null,
      health,
      healthLabel: enrollmentProgressHealthLabel(health),
      openAttentionCount: openItems.length,
      highestOpenAttentionSeverity: highest,
    };
  }

  return { byEnrollmentId };
}
