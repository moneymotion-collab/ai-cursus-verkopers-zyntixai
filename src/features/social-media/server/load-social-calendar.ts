/**
 * SMM-B1.11-B range-bounded Social Calendar loader.
 * Reads social_publications.intended_execute_at only. No slot planned_at.
 * Does not return credentials, storage keys, or provider secrets.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import {
  projectPublicationToCalendarItem,
  summarizeCalendarContent,
  contentFormatDisplayLabel,
  providerDisplayLabel,
  resolveCalendarMutationFlags,
  type SocialCalendarEligiblePublication,
  type SocialCalendarItemView,
} from "@/features/social-media/domain/calendar";
import { resolveSocialPublicationScheduleEligibility } from "@/features/social-media/domain/scheduling";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function snapshotHasMedia(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

type QueryResult = {
  data: unknown;
  error: { message?: string } | null;
};

type LooseFilter = PromiseLike<QueryResult> & {
  eq: (column: string, value: string) => LooseFilter;
  in: (column: string, values: string[]) => LooseFilter;
  gte: (column: string, value: string) => LooseFilter;
  lt: (column: string, value: string) => LooseFilter;
  order: (column: string, opts?: { ascending: boolean }) => LooseFilter;
  limit: (count: number) => LooseFilter;
};

type LooseClient = {
  from: (table: string) => {
    select: (columns: string) => LooseFilter;
  };
};

export type SocialCalendarLoadResult =
  | {
      ok: true;
      items: SocialCalendarItemView[];
      eligibleToSchedule: SocialCalendarEligiblePublication[];
    }
  | { ok: false; reason: "transport_error" | "invalid_range" };

export async function loadSocialCalendar(input: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: OrganizationRole | string;
  timeZone: string;
  visibleStartIso: string;
  visibleEndIso: string;
  now: Date;
}): Promise<SocialCalendarLoadResult> {
  if (
    !input.visibleStartIso ||
    !input.visibleEndIso ||
    input.visibleStartIso >= input.visibleEndIso
  ) {
    return { ok: false, reason: "invalid_range" };
  }

  const client = input.supabase as unknown as LooseClient;
  try {
    const [scheduledResult, eligibleResult] = await Promise.all([
      client
        .from("social_publications")
        .select(
          "id, organization_id, connection_id, provider, status, execution_mode, intended_execute_at, variant_version_id, last_failure_class",
        )
        .eq("organization_id", input.organizationId)
        .eq("execution_mode", "scheduled")
        .gte("intended_execute_at", input.visibleStartIso)
        .lt("intended_execute_at", input.visibleEndIso)
        .order("intended_execute_at", { ascending: true }),
      client
        .from("social_publications")
        .select(
          "id, organization_id, connection_id, provider, status, execution_mode, intended_execute_at, variant_version_id, last_failure_class",
        )
        .eq("organization_id", input.organizationId)
        .eq("execution_mode", "immediate")
        .in("status", ["pending", "queued", "failed_retryable"])
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (
      scheduledResult.error ||
      eligibleResult.error ||
      !Array.isArray(scheduledResult.data) ||
      !Array.isArray(eligibleResult.data)
    ) {
      return { ok: false, reason: "transport_error" };
    }

    const scheduledRows = scheduledResult.data.filter(
      (row): row is Record<string, unknown> =>
        Boolean(row) && typeof row === "object",
    );
    const eligibleRows = eligibleResult.data.filter(
      (row): row is Record<string, unknown> =>
        Boolean(row) && typeof row === "object",
    );
    const allRows = [...scheduledRows, ...eligibleRows];
    const connectionIds = uniqueStrings(
      allRows.map((row) => asString(row.connection_id)),
    );
    const versionIds = uniqueStrings(
      allRows.map((row) => asString(row.variant_version_id)),
    );

    const [connectionsResult, versionsResult] = await Promise.all([
      connectionIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : client
            .from("social_account_connections")
            .select("id, display_name, provider")
            .eq("organization_id", input.organizationId)
            .in("id", connectionIds)
            .order("created_at", { ascending: false }),
      versionIds.length === 0
        ? Promise.resolve({ data: [], error: null })
        : client
            .from("social_content_variant_versions")
            .select("id, content_format, title, caption, media_snapshot")
            .eq("organization_id", input.organizationId)
            .in("id", versionIds)
            .order("created_at", { ascending: false }),
    ]);

    if (connectionsResult.error || versionsResult.error) {
      return { ok: false, reason: "transport_error" };
    }

    const connectionsById = new Map<string, { displayName: string | null }>();
    for (const raw of Array.isArray(connectionsResult.data)
      ? connectionsResult.data
      : []) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const id = asString(record.id);
      if (!id) continue;
      connectionsById.set(id, {
        displayName: asString(record.display_name),
      });
    }

    const versionsById = new Map<
      string,
      {
        contentFormat: string | null;
        title: string | null;
        caption: string | null;
        hasMedia: boolean;
      }
    >();
    for (const raw of Array.isArray(versionsResult.data)
      ? versionsResult.data
      : []) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const id = asString(record.id);
      if (!id) continue;
      versionsById.set(id, {
        contentFormat: asString(record.content_format),
        title: asString(record.title),
        caption: asString(record.caption),
        hasMedia: snapshotHasMedia(record.media_snapshot),
      });
    }

    const items: SocialCalendarItemView[] = [];
    for (const record of scheduledRows) {
      const publicationId = asString(record.id);
      const provider = asString(record.provider);
      const status = asString(record.status);
      const executionMode = asString(record.execution_mode);
      const intendedExecuteAt = asString(record.intended_execute_at);
      const connectionId = asString(record.connection_id);
      const versionId = asString(record.variant_version_id);
      if (
        !publicationId ||
        !provider ||
        !status ||
        !executionMode ||
        !intendedExecuteAt
      ) {
        continue;
      }
      if (asString(record.organization_id) !== input.organizationId) {
        continue;
      }
      const version = versionId ? versionsById.get(versionId) : undefined;
      const connection = connectionId
        ? connectionsById.get(connectionId)
        : undefined;
      const item = projectPublicationToCalendarItem({
        publicationId,
        provider,
        executionMode,
        intendedExecuteAt,
        status,
        contentFormat: version?.contentFormat ?? null,
        title: version?.title ?? null,
        caption: version?.caption ?? null,
        hasMedia: version?.hasMedia ?? false,
        connectionDisplayName: connection?.displayName ?? null,
        timeZone: input.timeZone,
        now: input.now,
        role: input.role,
        lastFailureClass: asString(record.last_failure_class),
      });
      if (item) {
        items.push(item);
      }
    }

    const eligibleToSchedule: SocialCalendarEligiblePublication[] = [];
    for (const record of eligibleRows) {
      const publicationId = asString(record.id);
      const provider = asString(record.provider) ?? "instagram";
      const status = asString(record.status);
      const executionMode = asString(record.execution_mode) ?? "immediate";
      if (!publicationId || !status) continue;
      if (asString(record.organization_id) !== input.organizationId) continue;
      const eligibility = resolveSocialPublicationScheduleEligibility({
        status,
        executionMode,
      });
      const flags = resolveCalendarMutationFlags({
        role: input.role,
        eligibility,
      });
      if (!eligibility.schedule) continue;
      const versionId = asString(record.variant_version_id);
      const version = versionId ? versionsById.get(versionId) : undefined;
      const connectionId = asString(record.connection_id);
      const connection = connectionId
        ? connectionsById.get(connectionId)
        : undefined;
      eligibleToSchedule.push({
        publicationId,
        providerLabel: providerDisplayLabel(provider),
        contentFormatLabel: contentFormatDisplayLabel(
          version?.contentFormat ?? null,
        ),
        contentSummary: summarizeCalendarContent({
          title: version?.title ?? null,
          caption: version?.caption ?? null,
          contentFormat: version?.contentFormat ?? null,
        }),
        accountLabel:
          connection?.displayName?.trim() ||
          `${providerDisplayLabel(provider)} account`,
        status,
        canSchedule: flags.canSchedule,
      });
    }

    return { ok: true, items, eligibleToSchedule };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

function uniqueStrings(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
