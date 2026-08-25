import "server-only";

import {
  orgContextFail,
  orgContextOk,
  type OrgContextResult,
} from "@/features/org-context/domain/errors";
import type {
  ActivityWithContextAssignment,
  BusinessActivity,
  BusinessActivityStatus,
  ContextAssignmentSource,
  ContextAssignmentStatus,
  OrganizationContextAssignment,
  OrganizationContextEvent,
  OrganizationContextEventType,
  PinnedContextVersionSummary,
} from "@/features/org-context/domain/types";
import { classificationFromXor } from "@/features/org-context/domain/validation";
import {
  asBoolean,
  asJsonObject,
  asNullableString,
  asString,
  executeOrgContextQuery,
  type OrgContextQueryClient,
} from "@/features/org-context/server/org-context-query";

const ASSIGNMENT_SOURCES = new Set<ContextAssignmentSource>([
  "platform_operator",
  "manual_owner",
  "manual_admin",
  "onboarding",
  "bqa_confirmed",
  "migration",
]);

const EVENT_TYPES = new Set<OrganizationContextEventType>([
  "business_activity_created",
  "business_activity_classified",
  "context_version_assigned",
  "context_version_changed",
  "primary_activity_changed",
  "business_activity_archived",
]);

function parseActivityStatus(value: unknown): BusinessActivityStatus | null {
  if (value === "draft" || value === "active" || value === "archived") {
    return value;
  }
  return null;
}

function parseAssignmentStatus(value: unknown): ContextAssignmentStatus | null {
  if (value === "active" || value === "superseded") {
    return value;
  }
  return null;
}

function parseSource(value: unknown): ContextAssignmentSource | null {
  return typeof value === "string" && ASSIGNMENT_SOURCES.has(value as ContextAssignmentSource)
    ? (value as ContextAssignmentSource)
    : null;
}

function parseEventType(value: unknown): OrganizationContextEventType | null {
  return typeof value === "string" && EVENT_TYPES.has(value as OrganizationContextEventType)
    ? (value as OrganizationContextEventType)
    : null;
}

function mapActivity(row: Record<string, unknown>): OrgContextResult<BusinessActivity> {
  const activityId = asString(row.id);
  const organizationId = asString(row.organization_id);
  const activityKey = asString(row.activity_key);
  const displayName = asString(row.display_name);
  const status = parseActivityStatus(row.status);
  const isPrimary = asBoolean(row.is_primary);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);
  if (
    !activityId ||
    !organizationId ||
    !activityKey ||
    !displayName ||
    !status ||
    isPrimary === null ||
    !createdAt ||
    !updatedAt
  ) {
    return orgContextFail(
      "CATALOG_INTEGRITY_ERROR",
      "Business Activity row is missing required fields",
    );
  }
  const classification = classificationFromXor({
    classificationKind: asNullableString(row.classification_kind),
    foundationId: asNullableString(row.foundation_id),
    industryId: asNullableString(row.industry_id),
    nicheId: asNullableString(row.niche_id),
    specializationId: asNullableString(row.specialization_id),
    deepSpecializationId: asNullableString(row.deep_specialization_id),
  });
  if (!classification.ok) {
    return classification;
  }
  return orgContextOk({
    activityId,
    organizationId,
    activityKey,
    displayName,
    status,
    isPrimary,
    classification: classification.value,
    createdAt,
    updatedAt,
  });
}

function mapAssignment(
  row: Record<string, unknown>,
): OrgContextResult<OrganizationContextAssignment> {
  const assignmentId = asString(row.id);
  const organizationId = asString(row.organization_id);
  const activityId = asString(row.business_activity_id);
  const contextPackVersionId = asString(row.context_pack_version_id);
  const status = parseAssignmentStatus(row.status);
  const source = parseSource(row.source);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);
  if (
    !assignmentId ||
    !organizationId ||
    !activityId ||
    !contextPackVersionId ||
    !status ||
    !source ||
    !createdAt ||
    !updatedAt
  ) {
    return orgContextFail(
      "CATALOG_INTEGRITY_ERROR",
      "Context assignment row is missing required fields",
    );
  }
  return orgContextOk({
    assignmentId,
    organizationId,
    activityId,
    contextPackVersionId,
    status,
    source,
    actorUserId: asNullableString(row.actor_user_id),
    actorMemberId: asNullableString(row.actor_member_id),
    reason: asNullableString(row.reason),
    createdAt,
    updatedAt,
    supersededAt: asNullableString(row.superseded_at),
  });
}

function mapEvent(row: Record<string, unknown>): OrgContextResult<OrganizationContextEvent> {
  const eventId = asString(row.id);
  const organizationId = asString(row.organization_id);
  const activityId = asString(row.business_activity_id);
  const eventType = parseEventType(row.event_type);
  const source = parseSource(row.source);
  const createdAt = asString(row.created_at);
  const payload = asJsonObject(row.payload) ?? {};
  if (!eventId || !organizationId || !activityId || !eventType || !source || !createdAt) {
    return orgContextFail(
      "CATALOG_INTEGRITY_ERROR",
      "ORG-CONTEXT event row is missing required fields",
    );
  }
  return orgContextOk({
    eventId,
    organizationId,
    activityId,
    assignmentId: asNullableString(row.assignment_id),
    eventType,
    actorUserId: asNullableString(row.actor_user_id),
    actorMemberId: asNullableString(row.actor_member_id),
    source,
    reason: asNullableString(row.reason),
    payload,
    createdAt,
  });
}

export class OrganizationContextRepository {
  constructor(private readonly client: OrgContextQueryClient) {}

  async getOrganizationStatus(
    organizationId: string,
  ): Promise<OrgContextResult<{ organizationId: string; status: string }>> {
    const rows = await executeOrgContextQuery(
      this.client.from("organizations").select("*").eq("id", organizationId),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return orgContextFail("ORG_NOT_FOUND", "Organization not found", {
        organizationId,
      });
    }
    if (rows.value.length > 1) {
      return orgContextFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate Organization identity results",
        { organizationId, count: rows.value.length },
      );
    }
    const status = asString(rows.value[0].status);
    const id = asString(rows.value[0].id);
    if (!id || !status) {
      return orgContextFail(
        "CATALOG_INTEGRITY_ERROR",
        "Organization row is missing required fields",
      );
    }
    return orgContextOk({ organizationId: id, status });
  }

  async listBusinessActivities(
    organizationId: string,
  ): Promise<OrgContextResult<BusinessActivity[]>> {
    const rows = await executeOrgContextQuery(
      this.client
        .from("organization_business_activities")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
    );
    if (!rows.ok) {
      return rows;
    }
    const activities: BusinessActivity[] = [];
    for (const row of rows.value) {
      const mapped = mapActivity(row);
      if (!mapped.ok) {
        return mapped;
      }
      activities.push(mapped.value);
    }
    return orgContextOk(activities);
  }

  async getPrimaryBusinessActivity(
    organizationId: string,
  ): Promise<OrgContextResult<BusinessActivity | null>> {
    const rows = await executeOrgContextQuery(
      this.client
        .from("organization_business_activities")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_primary", true)
        .eq("status", "active"),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return orgContextOk(null);
    }
    if (rows.value.length > 1) {
      return orgContextFail(
        "PRIMARY_ACTIVITY_CONFLICT",
        "Organization has more than one active primary Business Activity",
        { organizationId, count: rows.value.length },
      );
    }
    return mapActivity(rows.value[0]);
  }

  async getBusinessActivity(
    organizationId: string,
    activityId: string,
  ): Promise<OrgContextResult<BusinessActivity>> {
    const rows = await executeOrgContextQuery(
      this.client
        .from("organization_business_activities")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("id", activityId),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 1) {
      return mapActivity(rows.value[0]);
    }
    if (rows.value.length > 1) {
      return orgContextFail(
        "CATALOG_INTEGRITY_ERROR",
        "Duplicate Business Activity identity results",
        { organizationId, activityId, count: rows.value.length },
      );
    }
    const foreign = await executeOrgContextQuery(
      this.client.from("organization_business_activities").select("*").eq("id", activityId),
    );
    if (!foreign.ok) {
      return foreign;
    }
    if (foreign.value.length > 0) {
      return orgContextFail(
        "ACTIVITY_NOT_OWNED_BY_ORG",
        "Business Activity is not owned by the requested Organization",
        { organizationId, activityId },
      );
    }
    return orgContextFail("ACTIVITY_NOT_FOUND", "Business Activity not found", {
      organizationId,
      activityId,
    });
  }

  async getActivityClassification(
    organizationId: string,
    activityId: string,
  ): Promise<OrgContextResult<BusinessActivity["classification"]>> {
    const activity = await this.getBusinessActivity(organizationId, activityId);
    if (!activity.ok) {
      return activity;
    }
    return orgContextOk(activity.value.classification);
  }

  async getPinnedContextVersion(
    organizationId: string,
    activityId: string,
  ): Promise<OrgContextResult<PinnedContextVersionSummary | null>> {
    const activity = await this.getBusinessActivity(organizationId, activityId);
    if (!activity.ok) {
      return activity;
    }
    const rows = await executeOrgContextQuery(
      this.client
        .from("organization_context_assignments")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("business_activity_id", activityId)
        .eq("status", "active"),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return orgContextOk(null);
    }
    if (rows.value.length > 1) {
      return orgContextFail(
        "CATALOG_INTEGRITY_ERROR",
        "Activity has more than one active Context pin",
        { organizationId, activityId, count: rows.value.length },
      );
    }
    const assignment = mapAssignment(rows.value[0]);
    if (!assignment.ok) {
      return assignment;
    }
    return orgContextOk({
      assignmentId: assignment.value.assignmentId,
      organizationId: assignment.value.organizationId,
      activityId: assignment.value.activityId,
      contextPackVersionId: assignment.value.contextPackVersionId,
      status: assignment.value.status,
      source: assignment.value.source,
    });
  }

  async getAssignmentHistory(
    organizationId: string,
    activityId: string,
  ): Promise<OrgContextResult<OrganizationContextAssignment[]>> {
    const activity = await this.getBusinessActivity(organizationId, activityId);
    if (!activity.ok) {
      return activity;
    }
    const rows = await executeOrgContextQuery(
      this.client
        .from("organization_context_assignments")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("business_activity_id", activityId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
    );
    if (!rows.ok) {
      return rows;
    }
    const assignments: OrganizationContextAssignment[] = [];
    for (const row of rows.value) {
      const mapped = mapAssignment(row);
      if (!mapped.ok) {
        return mapped;
      }
      assignments.push(mapped.value);
    }
    return orgContextOk(assignments);
  }

  async listActivityEvents(
    organizationId: string,
    activityId: string,
  ): Promise<OrgContextResult<OrganizationContextEvent[]>> {
    const activity = await this.getBusinessActivity(organizationId, activityId);
    if (!activity.ok) {
      return activity;
    }
    const rows = await executeOrgContextQuery(
      this.client
        .from("organization_context_assignment_events")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("business_activity_id", activityId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
    );
    if (!rows.ok) {
      return rows;
    }
    const events: OrganizationContextEvent[] = [];
    for (const row of rows.value) {
      const mapped = mapEvent(row);
      if (!mapped.ok) {
        return mapped;
      }
      events.push(mapped.value);
    }
    return orgContextOk(events);
  }

  async getActivityWithActiveAssignment(
    organizationId: string,
    activityId: string,
  ): Promise<OrgContextResult<ActivityWithContextAssignment>> {
    const activity = await this.getBusinessActivity(organizationId, activityId);
    if (!activity.ok) {
      return activity;
    }
    const pin = await this.getPinnedContextVersion(organizationId, activityId);
    if (!pin.ok) {
      return pin;
    }
    if (!pin.value) {
      return orgContextOk({ activity: activity.value, assignment: null });
    }
    const pinned = pin.value;
    const history = await this.getAssignmentHistory(organizationId, activityId);
    if (!history.ok) {
      return history;
    }
    const assignment =
      history.value.find(
        (entry) => entry.assignmentId === pinned.assignmentId && entry.status === "active",
      ) ?? null;
    return orgContextOk({
      activity: activity.value,
      assignment,
    });
  }
}
