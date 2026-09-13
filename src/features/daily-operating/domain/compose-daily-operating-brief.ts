/**
 * B1-C1 Daily Operating Composition — pure domain contracts.
 * No persistence. Composes existing Attention + Task read models only.
 */

import type { AttentionSeverity } from "@/features/attention/domain/types";
import type { AttentionItemListItemReadModel } from "@/features/attention/domain/read-types";
import type { TaskListItemReadModel } from "@/features/tasks/domain/read-types";
import { getAttentionSeverityRank } from "@/features/attention/domain/severity";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { PRODUCT_MODULE_BY_ID } from "@/features/product-access/domain/module-registry";
import type { ModuleNavVisibility, ProductModuleId } from "@/features/product-access/domain/types";

export const DAILY_OPERATING_ATTENTION_FETCH_LIMIT = 25;
export const DAILY_OPERATING_SECTION_LIMIT = 5;

/** Frozen H1 calm title. Bounded brief only — not organization health. */
export const DAILY_OPERATING_CALM_TITLE =
  "No priority attention or due work is showing in today\u2019s brief.";

/** Frozen H1 calm supporting sentence. */
export const DAILY_OPERATING_CALM_SUPPORTING =
  "This page lists priority Attention and due work in today\u2019s brief. Other items may exist elsewhere.";

/** Frozen Today subtitle. */
export const DAILY_OPERATING_TODAY_SUBTITLE =
  "Priority Attention and due work in today\u2019s brief.";

export const DAILY_OPERATING_CALM_ACTION_LIMIT = 3;

export const DAILY_OPERATING_ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  viewer: "Viewer",
};

/**
 * Contract §8.3 order: Attention, Tasks, then the operating-model-specific
 * third link. Visibility — not hardcoded operating-model IDs — selects which
 * of work orders / orders / projects / leads is lawful.
 */
const CALM_ACTION_CANDIDATES = [
  "attention",
  "tasks",
  "workOrders",
  "orders",
  "projects",
  "leads",
] as const satisfies readonly ProductModuleId[];

export type DailyOperatingCalmActionModuleId =
  (typeof CALM_ACTION_CANDIDATES)[number];

export type DailyOperatingCalmAction = {
  moduleId: DailyOperatingCalmActionModuleId;
  href: string;
  label: string;
};

export type DailyOperatingAttentionBucket =
  | "critical"
  | "high"
  | "assigned_other";

export type DailyOperatingTaskBucket = "overdue" | "due_today";

export type DailyOperatingAttentionRow = {
  kind: "attention";
  id: string;
  title: string;
  severity: AttentionSeverity;
  status: string;
  assigneeMemberId: string | null;
  href: string;
  bucket: DailyOperatingAttentionBucket;
  contextLabel: string | null;
};

export type DailyOperatingTaskRow = {
  kind: "task";
  id: string;
  title: string;
  href: string;
  bucket: DailyOperatingTaskBucket;
  dueAt: string;
};

export type DailyOperatingBrief = {
  organizationId: string;
  membershipId: string;
  role: OrganizationRole;
  myAttention: DailyOperatingAttentionRow[];
  organizationAttention: DailyOperatingAttentionRow[];
  overdueTasks: DailyOperatingTaskRow[];
  dueTodayTasks: DailyOperatingTaskRow[];
  hasAnyActionable: boolean;
};

export function canSeeOrganizationAttention(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

function attentionContextLabel(item: AttentionItemListItemReadModel): string | null {
  const parts = [
    item.customerDisplayName,
    item.programName,
    item.projectName,
    item.productName,
  ].filter((value): value is string => Boolean(value && value.trim()));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function compareAttentionRows(
  left: AttentionItemListItemReadModel,
  right: AttentionItemListItemReadModel,
): number {
  const severityDelta =
    getAttentionSeverityRank(right.severity) -
    getAttentionSeverityRank(left.severity);
  if (severityDelta !== 0) {
    return severityDelta;
  }
  return right.lastDetectedAt.localeCompare(left.lastDetectedAt);
}

function toAttentionRow(
  item: AttentionItemListItemReadModel,
  bucket: DailyOperatingAttentionBucket,
  organizationId: string,
): DailyOperatingAttentionRow {
  return {
    kind: "attention",
    id: item.id,
    title: item.title,
    severity: item.severity,
    status: item.status,
    assigneeMemberId: item.assigneeMemberId,
    href: `/attention/${encodeURIComponent(item.id)}?org=${encodeURIComponent(organizationId)}`,
    bucket,
    contextLabel: attentionContextLabel(item),
  };
}

function toTaskRow(
  item: TaskListItemReadModel,
  bucket: DailyOperatingTaskBucket,
  organizationId: string,
): DailyOperatingTaskRow {
  return {
    kind: "task",
    id: item.id,
    title: item.title,
    href: `/tasks/${encodeURIComponent(item.id)}?org=${encodeURIComponent(organizationId)}`,
    bucket,
    dueAt: item.dueAt,
  };
}

function isActionableAttentionStatus(status: string): boolean {
  return status === "open" || status === "acknowledged";
}

/**
 * Deterministic composition:
 * 1. Critical Attention
 * 2. High Attention
 * 3. Overdue assigned Tasks
 * 4. Tasks due today
 * 5. Other open Attention assigned to me (medium/low)
 *
 * Owner/Admin see organization critical/high (incl. unassigned).
 * Staff/Viewer see only Attention assigned to them.
 */
export function composeDailyOperatingBrief(input: {
  organizationId: string;
  membershipId: string;
  role: OrganizationRole;
  attentionItems: AttentionItemListItemReadModel[];
  overdueTasks: TaskListItemReadModel[];
  dueTodayTasks: TaskListItemReadModel[];
  sectionLimit?: number;
}): DailyOperatingBrief {
  const limit = input.sectionLimit ?? DAILY_OPERATING_SECTION_LIMIT;
  const orgVisible = canSeeOrganizationAttention(input.role);

  const actionable = input.attentionItems
    .filter(
      (item) =>
        item.organizationId === input.organizationId &&
        !item.derived.isArchived &&
        !item.derived.isTerminal &&
        isActionableAttentionStatus(item.status),
    )
    .sort(compareAttentionRows);

  const mine = actionable.filter(
    (item) => item.assigneeMemberId === input.membershipId,
  );

  const organizationPool = orgVisible
    ? actionable.filter(
        (item) =>
          item.severity === "critical" || item.severity === "high",
      )
    : [];

  const organizationAttention = organizationPool
    .slice(0, limit)
    .map((item) =>
      toAttentionRow(
        item,
        item.severity === "critical" ? "critical" : "high",
        input.organizationId,
      ),
    );

  const myCriticalHigh = mine.filter(
    (item) => item.severity === "critical" || item.severity === "high",
  );
  const myOther = mine.filter(
    (item) => item.severity === "medium" || item.severity === "low",
  );

  const myAttention = [
    ...myCriticalHigh.map((item) =>
      toAttentionRow(
        item,
        item.severity === "critical" ? "critical" : "high",
        input.organizationId,
      ),
    ),
    ...myOther.map((item) =>
      toAttentionRow(item, "assigned_other", input.organizationId),
    ),
  ].slice(0, limit);

  const overdueTasks = input.overdueTasks
    .filter(
      (task) =>
        task.organizationId === input.organizationId &&
        task.status === "open" &&
        !task.derived.archived &&
        !task.derived.terminal &&
        task.assigneeMemberId === input.membershipId &&
        task.derived.overdue,
    )
    .slice(0, limit)
    .map((task) => toTaskRow(task, "overdue", input.organizationId));

  const dueTodayTasks = input.dueTodayTasks
    .filter(
      (task) =>
        task.organizationId === input.organizationId &&
        task.status === "open" &&
        !task.derived.archived &&
        !task.derived.terminal &&
        task.assigneeMemberId === input.membershipId &&
        task.derived.dueToday,
    )
    .slice(0, limit)
    .map((task) => toTaskRow(task, "due_today", input.organizationId));

  const hasAnyActionable =
    organizationAttention.length > 0 ||
    myAttention.length > 0 ||
    overdueTasks.length > 0 ||
    dueTodayTasks.length > 0;

  return {
    organizationId: input.organizationId,
    membershipId: input.membershipId,
    role: input.role,
    myAttention,
    organizationAttention,
    overdueTasks,
    dueTodayTasks,
    hasAnyActionable,
  };
}

export function buildDailyOperatingHomePath(organizationId: string): string {
  return `/home${buildDailyOperatingOrgQuery(organizationId)}`;
}

export function isDailyOperatingHomePathname(pathname: string): boolean {
  return pathname === "/home" || pathname.startsWith("/home/");
}

export function formatDailyOperatingRoleLabel(role: OrganizationRole): string {
  return DAILY_OPERATING_ROLE_LABELS[role];
}

export function isDailyOperatingCalmState(input: {
  hasAnyActionable: boolean;
  attentionQueryFailed: boolean;
  tasksQueryFailed: boolean;
}): boolean {
  return (
    !input.hasAnyActionable &&
    !input.attentionQueryFailed &&
    !input.tasksQueryFailed
  );
}

/**
 * Preserve the active organization on Home links. Empty organizationId does
 * not invent a fallback org and does not append `org=`.
 */
export function buildDailyOperatingOrgQuery(
  organizationId: string,
  extra?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (organizationId) {
    params.set("org", organizationId);
  }
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      params.set(key, value);
    }
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export function buildDailyOperatingModuleHref(
  pathname: string,
  organizationId: string,
  extra?: Record<string, string>,
): string {
  return `${pathname}${buildDailyOperatingOrgQuery(organizationId, extra)}`;
}

export function resolveDailyOperatingCalmActions(input: {
  navVisibility: ModuleNavVisibility;
  organizationId: string;
}): DailyOperatingCalmAction[] {
  const actions: DailyOperatingCalmAction[] = [];

  for (const moduleId of CALM_ACTION_CANDIDATES) {
    if (actions.length >= DAILY_OPERATING_CALM_ACTION_LIMIT) {
      break;
    }
    if (input.navVisibility[moduleId] !== true) {
      continue;
    }
    const definition = PRODUCT_MODULE_BY_ID[moduleId];
    if (!definition.implemented) {
      continue;
    }
    actions.push({
      moduleId,
      href: buildDailyOperatingModuleHref(definition.route, input.organizationId),
      label: `Open ${definition.label}`,
    });
  }

  return actions;
}
