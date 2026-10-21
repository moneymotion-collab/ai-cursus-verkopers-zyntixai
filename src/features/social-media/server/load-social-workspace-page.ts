/**
 * Page loader for /social (SMM-B1.10 Beta 1 Social workspace).
 * Owner/Admin only. Never enables publishing. Never calls Meta.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  listActiveOrganizationMemberships,
  resolveOrganizationContext,
} from "@/features/organizations/server/resolve-organization-context";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import {
  buildOrganizationOptions,
  resolveSelectedOrganization,
  type OrganizationOption,
} from "@/features/tasks/ui/resolve-task-organization-selection";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { canManageSocialConnections, canScheduleSocialPublication } from "@/features/social-media/domain/permissions";
import {
  isSocialSection,
  type SocialSection,
} from "@/features/social-media/domain/social-navigation";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";
import { listActiveSocialWorkspaces } from "@/features/social-media/server/list-social-workspaces";
import {
  listSocialLifecycleInventory,
  type ListedLifecycleConnection,
  type ListedSocialPublication,
} from "@/features/social-media/server/list-social-lifecycle-inventory";
import type { ListedSocialWorkspace } from "@/features/social-media/server/list-social-workspaces";
import {
  isSocialOAuthOutcomeCode,
  SOCIAL_OAUTH_OUTCOME_QUERY,
} from "@/features/social-media/server/oauth-callback-redirect";
import {
  isSocialOAuthFailureStage,
  SOCIAL_OAUTH_FAILURE_STAGE_QUERY,
} from "@/features/social-media/domain/oauth-failure-stage";
import { loadSocialClosedBetaEnrollmentStatus } from "@/features/social-media/server/social-closed-beta-enrollment";
import { loadActiveControlledPublishWindow } from "@/features/social-media/server/controlled-publish-window";
import type { ActiveControlledPublishWindow } from "@/features/social-media/domain/controlled-publish-window";
import {
  buildSocialClosedBetaCustomerReadModel,
  type SocialClosedBetaCustomerReadModel,
} from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import { loadSocialCalendar } from "@/features/social-media/server/load-social-calendar";
import {
  calendarWeekBoundsOrNull,
  resolveSocialCalendarHrefState,
  summarizeScheduledOverview,
  type SocialCalendarEligiblePublication,
  type SocialCalendarItemView,
} from "@/features/social-media/domain/calendar";
import {
  isValidIanaTimeZone,
  resolveSocialCalendarTimezone,
  socialCalendarTimezoneOptions,
} from "@/features/social-media/domain/calendar-timezone";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export type SocialWorkspacePageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "feature_disabled" }
  | { kind: "forbidden"; message: string; role: OrganizationRole }
  | {
      kind: "query_error";
      message: string;
      retryable: true;
      organizationId?: string;
    }
  | {
      kind: "closed_beta_not_enrolled";
      organizationId: string;
      organizationName: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      closedBeta: SocialClosedBetaCustomerReadModel;
    }
  | {
      kind: "success";
      organizationId: string;
      organizationName: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      section: SocialSection;
      publishingEnabled: boolean;
      closedBeta: SocialClosedBetaCustomerReadModel;
      workspaces: ListedSocialWorkspace[];
      connections: ListedLifecycleConnection[];
      publications: ListedSocialPublication[];
      activePublications: ListedSocialPublication[];
      historicalPublications: ListedSocialPublication[];
      healthyConnectedCount: number;
      pendingShellCount: number;
      activeQueueCount: number;
      historicalQueueCount: number;
      succeededPublicationCount: number;
      blockedPublicationCount: number;
      oauthOutcome: string | null;
      oauthFailureStage: string | null;
      explicitPublicationId: string | null;
      controlledPublishWindow: ActiveControlledPublishWindow | null;
      canMutateSchedule: boolean;
      calendarTimeZone: string;
      calendarTimezoneConfigured: boolean;
      calendarTimezoneOptions: string[];
      calendarWeekStartDay: string;
      calendarSelectedDay: string;
      calendarVisibleStartIso: string | null;
      calendarVisibleEndIso: string | null;
      calendarItems: SocialCalendarItemView[];
      calendarEligibleToSchedule: SocialCalendarEligiblePublication[];
      calendarLoadError: string | null;
      scheduledThisWeekCount: number;
      nextScheduledAt: string | null;
    };

export async function loadSocialWorkspacePage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<SocialWorkspacePageResult> {
  if (!isSocialInstagramConnectionsFeatureEnabled()) {
    return { kind: "feature_disabled" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { kind: "auth_required" };
  }

  const membershipsResult = await listActiveOrganizationMemberships(supabase);
  if (!membershipsResult.ok) {
    return {
      kind: "query_error",
      message: "Unable to verify organization access. Please try again.",
      retryable: true,
    };
  }
  if (membershipsResult.memberships.length === 0) {
    return { kind: "no_organizations" };
  }

  const orgParam = firstSearchParam(rawSearchParams.org);
  const selection = resolveSelectedOrganization(
    membershipsResult.memberships,
    orgParam,
  );
  const orgIds = membershipsResult.memberships.map((m) => m.organizationId);
  const { data: orgRows } = await supabase
    .from("organizations")
    .select("id, name, timezone")
    .in("id", orgIds);
  const namesById = Object.fromEntries(
    (orgRows ?? []).map((row) => [row.id, row.name]),
  );
  const timezoneById = Object.fromEntries(
    (orgRows ?? []).map((row) => [row.id, row.timezone]),
  );
  const organizationOptions = buildOrganizationOptions(
    membershipsResult.memberships,
    namesById,
  );

  if (selection.requiresSelection || !selection.organizationId) {
    return { kind: "organization_required", organizations: organizationOptions };
  }

  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId: selection.organizationId,
  });
  if (!orgContext.ok) {
    return {
      kind: "org_context_missing",
      message: orgContext.error.message,
    };
  }

  const { role, organizationId } = orgContext.context;
  if (!canManageSocialConnections(role, "active")) {
    return {
      kind: "forbidden",
      message: "Only Owner or Admin may manage Social Media Management.",
      role,
    };
  }

  await redirectIfOrganizationOnboardingIncomplete(
    supabase,
    organizationId,
    role,
  );

  const organizationName =
    organizationOptions.find((o) => o.organizationId === organizationId)
      ?.displayName ?? "Organization";

  const publishingEnabled = isSocialPublishingFeatureEnabled();
  const enrollmentLoaded = await loadSocialClosedBetaEnrollmentStatus(
    supabase,
    organizationId,
  );
  if (!enrollmentLoaded.ok) {
    return {
      kind: "query_error",
      message: "Unable to load Social closed-beta access. Please try again.",
      retryable: true,
      organizationId,
    };
  }

  const closedBeta = buildSocialClosedBetaCustomerReadModel({
    enrollmentStatus: enrollmentLoaded.status,
    socialPublishingEnabled: publishingEnabled ? "true" : undefined,
  });

  if (enrollmentLoaded.status === "not_enrolled") {
    return {
      kind: "closed_beta_not_enrolled",
      organizationId,
      organizationName,
      organizationOptions,
      role,
      closedBeta,
    };
  }

  const sectionRaw = firstSearchParam(rawSearchParams.section);
  const section: SocialSection = isSocialSection(sectionRaw)
    ? sectionRaw
    : "overview";

  const oauthRaw = firstSearchParam(rawSearchParams[SOCIAL_OAUTH_OUTCOME_QUERY]);
  const oauthOutcome =
    oauthRaw && isSocialOAuthOutcomeCode(oauthRaw) ? oauthRaw : null;
  const stageRaw = firstSearchParam(
    rawSearchParams[SOCIAL_OAUTH_FAILURE_STAGE_QUERY],
  );
  const oauthFailureStage =
    stageRaw && isSocialOAuthFailureStage(stageRaw) ? stageRaw : null;

  const tzParamRaw = firstSearchParam(rawSearchParams.tz);
  const calendarTimezone = resolveSocialCalendarTimezone({
    organizationTimeZone: timezoneById[organizationId],
    selectedTimeZone:
      tzParamRaw && isValidIanaTimeZone(tzParamRaw) ? tzParamRaw : null,
  });
  const now = new Date();
  const hrefState = resolveSocialCalendarHrefState({
    weekParam: firstSearchParam(rawSearchParams.week),
    dayParam: firstSearchParam(rawSearchParams.day),
    timeZone: calendarTimezone.displayTimeZone,
    now,
  });
  const weekBounds = calendarWeekBoundsOrNull(
    hrefState.weekStartDay,
    calendarTimezone.displayTimeZone,
  );

  const [workspacesResult, inventory, controlledWindowResult, calendarResult] =
    await Promise.all([
      listActiveSocialWorkspaces(supabase, organizationId),
      listSocialLifecycleInventory(
        supabase,
        organizationId,
        now.toISOString(),
        publishingEnabled,
      ),
      loadActiveControlledPublishWindow(supabase, organizationId),
      section === "calendar" && weekBounds
        ? loadSocialCalendar({
            supabase,
            organizationId,
            role,
            timeZone: calendarTimezone.displayTimeZone,
            visibleStartIso: weekBounds.startIso,
            visibleEndIso: weekBounds.endIso,
            now,
          })
        : Promise.resolve(null),
    ]);

  if (!workspacesResult.ok || !inventory.ok || !controlledWindowResult.ok) {
    return {
      kind: "query_error",
      message: "Unable to load Social workspace. Please try again.",
      retryable: true,
      organizationId,
    };
  }

  const activePublications = inventory.publications.filter(
    (publication) => !publication.isHistoricalLeftover,
  );
  const historicalPublications = inventory.publications.filter(
    (publication) => publication.isHistoricalLeftover,
  );

  const explicitPublicationId =
    firstSearchParam(rawSearchParams.publication)?.trim() || null;

  const overviewWeekBounds =
    weekBounds ??
    calendarWeekBoundsOrNull(
      hrefState.weekStartDay,
      calendarTimezone.displayTimeZone,
    );
  const overviewSummary = summarizeScheduledOverview({
    publications: inventory.publications,
    visibleStartIso: overviewWeekBounds?.startIso ?? now.toISOString(),
    visibleEndIso:
      overviewWeekBounds?.endIso ??
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    nowIso: now.toISOString(),
  });

  const calendarLoaded =
    calendarResult && calendarResult.ok
      ? calendarResult
      : { items: [] as SocialCalendarItemView[], eligibleToSchedule: [] };
  const calendarLoadError =
    section !== "calendar"
      ? null
      : !weekBounds
        ? "Unable to resolve the calendar week for this timezone."
        : calendarResult && !calendarResult.ok
          ? "Unable to load the calendar. Try again."
          : null;

  return {
    kind: "success",
    organizationId,
    organizationName,
    organizationOptions,
    role,
    section,
    publishingEnabled,
    closedBeta,
    workspaces: workspacesResult.workspaces,
    connections: inventory.connections,
    publications: inventory.publications,
    activePublications,
    historicalPublications,
    healthyConnectedCount: inventory.connections.filter(
      (c) => c.operationalHealth === "healthy",
    ).length,
    pendingShellCount: inventory.connections.filter(
      (c) => c.operationalHealth === "pending_shell",
    ).length,
    activeQueueCount: activePublications.filter(
      (p) => p.status === "queued" || p.status === "pending",
    ).length,
    historicalQueueCount: historicalPublications.length,
    succeededPublicationCount: inventory.publications.filter(
      (p) => p.status === "succeeded",
    ).length,
    blockedPublicationCount: inventory.publications.filter(
      (p) =>
        p.status === "unknown_external_outcome" ||
        p.status === "manual_intervention" ||
        p.status === "failed_terminal",
    ).length,
    oauthOutcome,
    oauthFailureStage,
    explicitPublicationId,
    controlledPublishWindow: controlledWindowResult.window,
    canMutateSchedule: canScheduleSocialPublication(role, "active"),
    calendarTimeZone: calendarTimezone.displayTimeZone,
    calendarTimezoneConfigured: calendarTimezone.configured,
    calendarTimezoneOptions: socialCalendarTimezoneOptions(
      calendarTimezone.displayTimeZone,
    ),
    calendarWeekStartDay: hrefState.weekStartDay,
    calendarSelectedDay: hrefState.selectedDay,
    calendarVisibleStartIso: weekBounds?.startIso ?? null,
    calendarVisibleEndIso: weekBounds?.endIso ?? null,
    calendarItems: calendarLoaded.items,
    calendarEligibleToSchedule: calendarLoaded.eligibleToSchedule,
    calendarLoadError,
    scheduledThisWeekCount: overviewSummary.scheduledThisWeek,
    nextScheduledAt: overviewSummary.nextScheduledAt,
  };
}
