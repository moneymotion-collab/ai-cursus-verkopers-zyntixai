import { ORG_CONTEXT_BQA_MUTATION_RPC } from "@/features/org-context/server/organization-context-rpc";
import type { OrgContextBqaMutationRpcClient } from "@/features/org-context/server/organization-context-rpc";
import type { OrgContextMemoryTables } from "./memory-query-client";

export type ConfirmedMutationMember = {
  userId: string;
  organizationId: string;
  role: string;
  status: string;
};

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
    actorMemberId: string;
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
    actor_member_id: input.actorMemberId,
    source: "bqa_confirmed",
    reason: input.reason,
    payload: input.payload,
    created_at: nowIso(),
  });
  return eventId;
}

export function createMemoryOrgContextBqaMutationRpc(
  tables: OrgContextMemoryTables,
  members: ConfirmedMutationMember[],
): OrgContextBqaMutationRpcClient {
  return {
    async rpc(fn, args) {
      if (fn !== ORG_CONTEXT_BQA_MUTATION_RPC) {
        return fail("MUTATION_FAILED", "Unexpected RPC");
      }
      const organizationId = args.p_organization_id;
      const actorUserId = args.p_actor_user_id;
      const payload =
        args.p_payload &&
        typeof args.p_payload === "object" &&
        !Array.isArray(args.p_payload)
          ? { ...args.p_payload }
          : {};
      delete payload.source;

      if (!actorUserId) {
        return fail("ACTOR_NOT_AUTHORIZED", "Authenticated Owner or Admin actor is required");
      }
      if (
        args.p_operation !== "classify_activity" &&
        args.p_operation !== "activate_activity" &&
        args.p_operation !== "assign_context_version"
      ) {
        return fail("FORBIDDEN_OPERATION", "Operation is not allowed for bqa_confirmed");
      }

      const member = members.find(
        (row) =>
          row.organizationId === organizationId &&
          row.userId === actorUserId &&
          row.status === "active" &&
          (row.role === "owner" || row.role === "admin"),
      );
      if (!member) {
        return fail(
          "ACTOR_NOT_AUTHORIZED",
          "bqa_confirmed requires an active Owner or Admin membership",
        );
      }

      const org = tables.organizations.find((row) => row.id === organizationId);
      if (!org || org.status !== "active") {
        return fail("ORG_NOT_FOUND", "Organization not found");
      }

      const reason =
        typeof payload.reason === "string" && payload.reason.trim()
          ? payload.reason
          : null;
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
        if (owned.classification_kind != null) {
          return fail(
            "ACTIVITY_CLASSIFICATION_MISMATCH",
            "bqa_confirmed cannot overwrite an existing Activity classification",
          );
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
          actorMemberId: `${member.userId}:${member.role}`,
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

      if (args.p_operation === "activate_activity") {
        if (owned.status === "archived") {
          return fail("ACTIVITY_ARCHIVED", "Archived Business Activity cannot be activated");
        }
        if (owned.status === "active") {
          return ok({ idempotent: true, activityId });
        }
        if (owned.classification_kind == null) {
          return fail(
            "ACTIVITY_NOT_CLASSIFIED",
            "Unclassified Business Activity cannot be activated",
          );
        }
        owned.status = "active";
        owned.updated_at = nowIso();
        const eventId = appendEvent(tables, {
          organizationId,
          activityId,
          eventType: "business_activity_activated",
          actorUserId,
          actorMemberId: `${member.userId}:${member.role}`,
          reason,
          payload: { old_status: "draft", new_status: "active" },
        });
        return ok({
          idempotent: false,
          activityId,
          eventId,
          eventType: "business_activity_activated",
        });
      }

      const versionId = String(payload.context_pack_version_id ?? "");
      if (owned.classification_kind == null) {
        return fail(
          "CONTEXT_VERSION_NOT_ASSIGNABLE",
          "Unclassified Business Activity cannot receive a Context pin",
        );
      }
      const activePin = tables.organization_context_assignments.find(
        (row) =>
          row.organization_id === organizationId &&
          row.business_activity_id === activityId &&
          row.status === "active",
      );
      if (activePin) {
        if (activePin.context_pack_version_id === versionId) {
          return ok({
            idempotent: true,
            activityId,
            assignmentId: String(activePin.id),
          });
        }
        return fail(
          "CONTEXT_REPIN_REQUIRED",
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
        source: "bqa_confirmed",
        actor_user_id: actorUserId,
        actor_member_id: `${member.userId}:${member.role}`,
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
        actorMemberId: `${member.userId}:${member.role}`,
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
    },
  };
}
