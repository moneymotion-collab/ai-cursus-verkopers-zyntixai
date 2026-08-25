import type { OrgContextMutationRpcClient } from "@/features/org-context/server/organization-context-rpc";
import type { OrgContextMemoryTables } from "./memory-query-client";

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function fail(code: string, message: string) {
  return { data: { ok: false, code, message }, error: null };
}

function ok(input: {
  idempotent: boolean;
  activityId: string;
  assignmentId?: string | null;
  eventId?: string | null;
  eventType?: string | null;
}) {
  return {
    data: {
      ok: true,
      idempotent: input.idempotent,
      activity_id: input.activityId,
      assignment_id: input.assignmentId ?? null,
      event_id: input.eventId ?? null,
      event_type: input.eventType ?? null,
    },
    error: null,
  };
}

function xorFromKind(kind: string | null, targetId: string | null) {
  return {
    classification_kind: kind,
    foundation_id: kind === "foundation" ? targetId : null,
    industry_id: kind === "industry" ? targetId : null,
    niche_id: kind === "niche" ? targetId : null,
    specialization_id: kind === "specialization" ? targetId : null,
    deep_specialization_id: kind === "deep_specialization" ? targetId : null,
  };
}

function appendEvent(
  tables: OrgContextMemoryTables,
  input: {
    organizationId: string;
    activityId: string;
    assignmentId?: string | null;
    eventType: string;
    actorUserId: string;
    payload: Record<string, unknown>;
    reason: string | null;
  },
) {
  const eventId = id("event");
  tables.organization_context_assignment_events.push({
    id: eventId,
    organization_id: input.organizationId,
    business_activity_id: input.activityId,
    assignment_id: input.assignmentId ?? null,
    event_type: input.eventType,
    actor_user_id: input.actorUserId,
    actor_member_id: null,
    source: "platform_operator",
    reason: input.reason,
    payload: input.payload,
    created_at: nowIso(),
  });
  return eventId;
}

export function createMemoryOrgContextMutationRpc(
  tables: OrgContextMemoryTables,
): OrgContextMutationRpcClient {
  return {
    async rpc(_fn, args) {
      const organizationId = args.p_organization_id;
      const actorUserId = args.p_actor_user_id;
      const payload =
        args.p_payload &&
        typeof args.p_payload === "object" &&
        !Array.isArray(args.p_payload)
          ? (args.p_payload as Record<string, unknown>)
          : {};
      const org = tables.organizations.find((row) => row.id === organizationId);
      if (!org) {
        return fail("ORG_NOT_FOUND", "Organization not found");
      }
      if (org.status !== "active") {
        return fail("ORG_NOT_FOUND", "Organization is not active");
      }
      const reason =
        typeof payload.reason === "string" && payload.reason.trim()
          ? payload.reason
          : null;

      if (args.p_operation === "create_activity") {
        const activityId = id("activity");
        const createdAt = nowIso();
        tables.organization_business_activities.push({
          id: activityId,
          organization_id: organizationId,
          activity_key: payload.activity_key,
          display_name: payload.display_name,
          status: payload.status,
          is_primary: payload.is_primary === true,
          classification_kind: payload.classification_kind ?? null,
          foundation_id: payload.foundation_id ?? null,
          industry_id: payload.industry_id ?? null,
          niche_id: payload.niche_id ?? null,
          specialization_id: payload.specialization_id ?? null,
          deep_specialization_id: payload.deep_specialization_id ?? null,
          created_at: createdAt,
          updated_at: createdAt,
        });
        if (payload.is_primary === true) {
          for (const row of tables.organization_business_activities) {
            if (row.organization_id === organizationId && row.id !== activityId) {
              row.is_primary = false;
            }
          }
        }
        const eventId = appendEvent(tables, {
          organizationId,
          activityId,
          eventType: "business_activity_created",
          actorUserId,
          reason,
          payload: {
            display_name: payload.display_name,
            activity_key: payload.activity_key,
            status: payload.status,
            is_primary: payload.is_primary === true,
            classification_kind: payload.classification_kind ?? null,
          },
        });
        return ok({
          idempotent: false,
          activityId,
          eventId,
          eventType: "business_activity_created",
        });
      }

      const activityId = String(payload.activity_id ?? "");
      const owned = tables.organization_business_activities.find(
        (row) => row.organization_id === organizationId && row.id === activityId,
      );
      if (!owned) {
        const foreign = tables.organization_business_activities.find(
          (row) => row.id === activityId,
        );
        if (foreign) {
          return fail(
            "ACTIVITY_NOT_OWNED_BY_ORG",
            "Business Activity is not owned by the requested Organization",
          );
        }
        return fail("ACTIVITY_NOT_FOUND", "Business Activity not found");
      }

      if (args.p_operation === "classify_activity") {
        if (owned.status === "archived") {
          return fail("MUTATION_FAILED", "Archived Business Activity cannot be reclassified");
        }
        const kind = String(payload.classification_kind ?? "");
        const targetId = String(payload.target_id ?? "");
        const next = xorFromKind(kind, targetId);
        if (
          owned.classification_kind === next.classification_kind &&
          owned.foundation_id === next.foundation_id &&
          owned.industry_id === next.industry_id &&
          owned.niche_id === next.niche_id &&
          owned.specialization_id === next.specialization_id &&
          owned.deep_specialization_id === next.deep_specialization_id
        ) {
          return ok({ idempotent: true, activityId });
        }
        const activePin = tables.organization_context_assignments.find(
          (row) =>
            row.organization_id === organizationId &&
            row.business_activity_id === activityId &&
            row.status === "active",
        );
        if (activePin) {
          return fail(
            "CONTEXT_INCOMPATIBLE",
            "Cannot reclassify a Business Activity that already has an active Context pin",
          );
        }
        Object.assign(owned, next, { updated_at: nowIso() });
        const eventId = appendEvent(tables, {
          organizationId,
          activityId,
          eventType: "business_activity_classified",
          actorUserId,
          reason,
          payload: { new_classification_kind: kind, target_id: targetId },
        });
        return ok({
          idempotent: false,
          activityId,
          eventId,
          eventType: "business_activity_classified",
        });
      }

      if (args.p_operation === "set_primary") {
        if (owned.status !== "active") {
          return fail("PRIMARY_ACTIVITY_CONFLICT", "Primary Business Activity must be active");
        }
        if (owned.is_primary === true) {
          return ok({ idempotent: true, activityId });
        }
        const previous = tables.organization_business_activities.find(
          (row) =>
            row.organization_id === organizationId &&
            row.is_primary === true &&
            row.status === "active",
        );
        for (const row of tables.organization_business_activities) {
          if (row.organization_id === organizationId) {
            row.is_primary = row.id === activityId;
          }
        }
        const eventId = appendEvent(tables, {
          organizationId,
          activityId,
          eventType: "primary_activity_changed",
          actorUserId,
          reason,
          payload: {
            old_primary_activity_id: previous?.id ?? null,
            new_primary_activity_id: activityId,
          },
        });
        return ok({
          idempotent: false,
          activityId,
          eventId,
          eventType: "primary_activity_changed",
        });
      }

      if (args.p_operation === "archive_activity") {
        if (owned.status === "archived") {
          return ok({ idempotent: true, activityId });
        }
        const activePin = tables.organization_context_assignments.find(
          (row) =>
            row.organization_id === organizationId &&
            row.business_activity_id === activityId &&
            row.status === "active",
        );
        if (activePin) {
          activePin.status = "superseded";
          activePin.superseded_at = nowIso();
        }
        owned.status = "archived";
        owned.is_primary = false;
        owned.updated_at = nowIso();
        const eventId = appendEvent(tables, {
          organizationId,
          activityId,
          assignmentId: activePin ? String(activePin.id) : null,
          eventType: "business_activity_archived",
          actorUserId,
          reason,
          payload: {
            superseded_assignment_id: activePin ? activePin.id : null,
            was_primary: false,
          },
        });
        return ok({
          idempotent: false,
          activityId,
          assignmentId: activePin ? String(activePin.id) : null,
          eventId,
          eventType: "business_activity_archived",
        });
      }

      const versionId = String(payload.context_pack_version_id ?? "");
      const activePin = tables.organization_context_assignments.find(
        (row) =>
          row.organization_id === organizationId &&
          row.business_activity_id === activityId &&
          row.status === "active",
      );

      if (args.p_operation === "assign_context_version") {
        if (owned.classification_kind == null) {
          return fail(
            "CONTEXT_VERSION_NOT_ASSIGNABLE",
            "Unclassified Business Activity cannot receive a Context pin",
          );
        }
        if (activePin) {
          if (activePin.context_pack_version_id === versionId) {
            return ok({
              idempotent: true,
              activityId,
              assignmentId: String(activePin.id),
            });
          }
          return fail(
            "MUTATION_FAILED",
            "Activity already has a different active Context pin",
          );
        }
        const assignmentId = id("assignment");
        const createdAt = nowIso();
        tables.organization_context_assignments.push({
          id: assignmentId,
          organization_id: organizationId,
          business_activity_id: activityId,
          context_pack_version_id: versionId,
          status: "active",
          source: "platform_operator",
          actor_user_id: actorUserId,
          actor_member_id: null,
          reason,
          created_at: createdAt,
          updated_at: createdAt,
          superseded_at: null,
        });
        const eventId = appendEvent(tables, {
          organizationId,
          activityId,
          assignmentId,
          eventType: "context_version_assigned",
          actorUserId,
          reason,
          payload: { context_pack_version_id: versionId },
        });
        return ok({
          idempotent: false,
          activityId,
          assignmentId,
          eventId,
          eventType: "context_version_assigned",
        });
      }

      if (args.p_operation === "change_context_version") {
        if (!activePin) {
          return fail("MUTATION_FAILED", "No active Context pin exists to change");
        }
        if (activePin.context_pack_version_id === versionId) {
          return ok({
            idempotent: true,
            activityId,
            assignmentId: String(activePin.id),
          });
        }
        const oldVersion = activePin.context_pack_version_id;
        activePin.status = "superseded";
        activePin.superseded_at = nowIso();
        const assignmentId = id("assignment");
        const createdAt = nowIso();
        tables.organization_context_assignments.push({
          id: assignmentId,
          organization_id: organizationId,
          business_activity_id: activityId,
          context_pack_version_id: versionId,
          status: "active",
          source: "platform_operator",
          actor_user_id: actorUserId,
          actor_member_id: null,
          reason,
          created_at: createdAt,
          updated_at: createdAt,
          superseded_at: null,
        });
        const eventId = appendEvent(tables, {
          organizationId,
          activityId,
          assignmentId,
          eventType: "context_version_changed",
          actorUserId,
          reason,
          payload: {
            old_assignment_id: activePin.id,
            old_context_pack_version_id: oldVersion,
            new_context_pack_version_id: versionId,
          },
        });
        return ok({
          idempotent: false,
          activityId,
          assignmentId,
          eventId,
          eventType: "context_version_changed",
        });
      }

      return fail("MUTATION_FAILED", "Unknown operation");
    },
  };
}
