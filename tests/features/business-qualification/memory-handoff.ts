import { ORG_CONTEXT_BQA_MUTATION_RPC } from "@/features/org-context/server/organization-context-rpc";
import type { OrgContextBqaMutationOperation } from "@/features/org-context/domain/types";
import type { BqaHandoffRpcClient } from "@/features/business-qualification/server/bqa-handoff-rpc";
import { BQA_HANDOFF_RPC } from "@/features/business-qualification/server/bqa-handoff-rpc";
import type { OrgContextMemoryTables } from "../org-context/memory-query-client";
import { createMemoryOrgContextBqaMutationRpc } from "../org-context/memory-confirmed-mutation";
import type { BqaMemoryTables } from "./memory-query-client";

export type MemoryBqaHandoffOptions = {
  failAfter?: "assign" | "completed";
  lockTrace?: string[];
  versions?: readonly {
    id: string;
    packId: string;
    publicationStatus: string;
  }[];
};

const lockTails = new Map<string, Promise<void>>();

function nowIso() {
  return new Date().toISOString();
}

function cloneBqa(tables: BqaMemoryTables): BqaMemoryTables {
  return JSON.parse(JSON.stringify(tables)) as BqaMemoryTables;
}

function cloneOrg(tables: OrgContextMemoryTables): OrgContextMemoryTables {
  return JSON.parse(JSON.stringify(tables)) as OrgContextMemoryTables;
}

function restoreBqa(tables: BqaMemoryTables, snapshot: BqaMemoryTables) {
  for (const key of Object.keys(tables) as (keyof BqaMemoryTables)[]) {
    tables[key].splice(0, tables[key].length, ...snapshot[key]);
  }
}

function restoreOrg(tables: OrgContextMemoryTables, snapshot: OrgContextMemoryTables) {
  for (const key of Object.keys(tables) as (keyof OrgContextMemoryTables)[]) {
    tables[key].splice(0, tables[key].length, ...snapshot[key]);
  }
}

function fail(code: string, message: string) {
  return { data: { ok: false, code, message }, error: null };
}

function nestedRaise(code: string): never {
  throw new Error(`HANDOFF_NESTED:${code}`);
}

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = lockTails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  lockTails.set(key, previous.then(() => held));
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
}

function activityTarget(row: Record<string, unknown>): string | null {
  const kind = row.classification_kind;
  if (kind === "foundation") {
    return typeof row.foundation_id === "string" ? row.foundation_id : null;
  }
  if (kind === "industry") {
    return typeof row.industry_id === "string" ? row.industry_id : null;
  }
  if (kind === "niche") {
    return typeof row.niche_id === "string" ? row.niche_id : null;
  }
  if (kind === "specialization") {
    return typeof row.specialization_id === "string" ? row.specialization_id : null;
  }
  if (kind === "deep_specialization") {
    return typeof row.deep_specialization_id === "string"
      ? row.deep_specialization_id
      : null;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function createMemoryBqaHandoffRpc(
  tables: BqaMemoryTables,
  orgTables: OrgContextMemoryTables,
  options: MemoryBqaHandoffOptions = {},
): BqaHandoffRpcClient {
  const versions = options.versions ?? [
    {
      id: "1b942da6-9472-4520-a004-3d68096b44ff",
      packId: "aa942da6-9472-4520-a004-3d68096b4401",
      publicationStatus: "published",
    },
  ];

  return {
    async rpc(fn, args) {
      if (fn !== BQA_HANDOFF_RPC) {
        return fail("HANDOFF_FAILED", "Unexpected RPC");
      }
      const orgLock = `872011:${args.p_organization_id}`;
      const activityLock = `872012:${args.p_organization_id}:${args.p_business_activity_id}`;
      return withLock(orgLock, async () => {
        options.lockTrace?.push("872011");
        return withLock(activityLock, async () => {
          options.lockTrace?.push("872012");
          await Promise.resolve();
          const bqaSnapshot = cloneBqa(tables);
          const orgSnapshot = cloneOrg(orgTables);
          try {
            return await runHandoff(tables, orgTables, args, options, versions);
          } catch (error) {
            restoreBqa(tables, bqaSnapshot);
            restoreOrg(orgTables, orgSnapshot);
            const message = error instanceof Error ? error.message : "HANDOFF_FAILED";
            if (message.startsWith("HANDOFF_NESTED:")) {
              return { data: null, error: { message, code: "P0001" } };
            }
            return { data: null, error: { message } };
          }
        });
      });
    },
  };
}

async function runHandoff(
  tables: BqaMemoryTables,
  orgTables: OrgContextMemoryTables,
  args: {
    p_organization_id: string;
    p_business_activity_id: string;
    p_actor_user_id: string;
    p_admission_decision_id: string;
    p_rollout_mode: string;
  },
  options: MemoryBqaHandoffOptions,
  versions: readonly { id: string; packId: string; publicationStatus: string }[],
) {
  if (args.p_rollout_mode === "open_beta") {
    return fail("ROLLOUT_POLICY_UNDEFINED", "Open Beta has no handoff policy");
  }

  const org = tables.organizations.find((row) => row.id === args.p_organization_id);
  if (!org || org.status !== "active") {
    return fail("ORG_NOT_FOUND", "Organization not found or access denied");
  }

  const actor = tables.organization_members.find(
    (row) =>
      row.organization_id === args.p_organization_id &&
      row.user_id === args.p_actor_user_id &&
      row.status === "active" &&
      (row.role === "owner" || row.role === "admin"),
  );
  if (!actor) {
    return fail(
      "FORBIDDEN_ROLE",
      "Assignment handoff requires an active Owner or Admin membership",
    );
  }

  const activity = orgTables.organization_business_activities.find(
    (row) =>
      row.organization_id === args.p_organization_id &&
      row.id === args.p_business_activity_id,
  );
  if (!activity) {
    return fail("ACTIVITY_NOT_FOUND", "Business Activity not found or access denied");
  }
  if (activity.status === "archived") {
    return fail("ACTIVITY_ARCHIVED", "Archived Business Activity cannot be handed off");
  }

  const qualification = tables.business_activity_qualifications.find(
    (row) =>
      row.organization_id === args.p_organization_id &&
      row.business_activity_id === args.p_business_activity_id,
  );
  if (!qualification) {
    return fail("QUALIFICATION_NOT_FOUND", "Qualification has not been started");
  }
  if (qualification.progress_status === "requalifying") {
    return fail("REQUALIFICATION_REQUIRED", "Requalifying qualification cannot be handed off");
  }
  if (
    qualification.review_status === "required" ||
    qualification.review_status === "requested" ||
    qualification.split_recommended === true ||
    qualification.progress_status !== "confirmed"
  ) {
    return fail(
      "CLASSIFICATION_NOT_CONFIRMED",
      "Qualification is not in a confirmed handoff-ready state",
    );
  }

  const admission = tables.business_activity_admission_decisions.find(
    (row) => row.id === args.p_admission_decision_id,
  );
  if (
    !admission ||
    admission.organization_id !== args.p_organization_id ||
    admission.business_activity_id !== args.p_business_activity_id ||
    admission.qualification_id !== qualification.id
  ) {
    return fail("ADMISSION_NOT_FOUND", "Admission decision was not found");
  }
  if (admission.rollout_mode !== args.p_rollout_mode) {
    return fail(
      "ROLLOUT_MISMATCH",
      "Admission decision rollout does not match the requested rollout",
    );
  }
  if (admission.admission_status !== "admitted" || admission.reason_code !== "eligible") {
    return fail("ADMISSION_NOT_ELIGIBLE", "Admission decision is not eligible for handoff");
  }
  if (!admission.support_assessment_id) {
    return fail(
      "SUPPORT_ASSESSMENT_NOT_READY",
      "Admission decision is missing its support assessment",
    );
  }

  const support = tables.business_activity_support_assessments.find(
    (row) => row.id === admission.support_assessment_id,
  );
  if (
    !support ||
    support.organization_id !== args.p_organization_id ||
    support.business_activity_id !== args.p_business_activity_id ||
    support.qualification_id !== qualification.id ||
    support.rollout_mode !== args.p_rollout_mode ||
    support.superseded_at
  ) {
    return fail(
      "SUPPORT_ASSESSMENT_NOT_READY",
      "Linked support assessment is not ready for handoff",
    );
  }
  if (
    support.support_status !== "supported_for_requested_rollout" ||
    support.reason_code !== "eligible" ||
    !support.context_pack_id ||
    !support.context_pack_version_id ||
    !support.classification_decision_id
  ) {
    return fail(
      "SUPPORT_ASSESSMENT_NOT_READY",
      "Linked support assessment is not eligible for handoff",
    );
  }

  const decision = tables.business_activity_classification_decisions.find(
    (row) => row.id === support.classification_decision_id,
  );
  if (
    !decision ||
    decision.organization_id !== args.p_organization_id ||
    decision.business_activity_id !== args.p_business_activity_id ||
    decision.qualification_id !== qualification.id
  ) {
    return fail("CLASSIFICATION_NOT_CONFIRMED", "Linked classification decision was not found");
  }
  if (
    qualification.current_classification_decision_id !== decision.id ||
    decision.decision_status !== "confirmed" ||
    decision.classification_outcome !== "classified" ||
    !decision.taxonomy_target_kind ||
    !decision.taxonomy_target_id
  ) {
    return fail(
      "ADMISSION_STALE",
      "Admission no longer matches the current confirmed classification",
    );
  }

  const version = versions.find((entry) => entry.id === support.context_pack_version_id);
  if (
    !version ||
    version.packId !== support.context_pack_id ||
    version.publicationStatus !== "published"
  ) {
    return fail(
      "CONTEXT_VERSION_INVALID",
      "Admitted Context version is missing, unpublished, or not on the expected pack",
    );
  }

  const completed = tables.business_activity_qualification_events.find(
    (row) =>
      row.organization_id === args.p_organization_id &&
      row.idempotency_key === `handoff-completed:${args.p_admission_decision_id}`,
  );
  const currentTarget = activityTarget(activity);
  const activePin = orgTables.organization_context_assignments.find(
    (row) =>
      row.organization_id === args.p_organization_id &&
      row.business_activity_id === args.p_business_activity_id &&
      row.status === "active",
  );
  if (completed) {
    if (
      activity.status !== "active" ||
      activity.classification_kind !== decision.taxonomy_target_kind ||
      currentTarget !== decision.taxonomy_target_id ||
      !activePin ||
      activePin.context_pack_version_id !== support.context_pack_version_id
    ) {
      return fail(
        "HANDOFF_FAILED",
        "Prior handoff completion no longer matches canonical Activity state",
      );
    }
    return {
      data: {
        ok: true,
        idempotent: true,
        organization_id: args.p_organization_id,
        business_activity_id: args.p_business_activity_id,
        admission_decision_id: args.p_admission_decision_id,
        qualification_id: qualification.id,
        classification_applied: false,
        activation_applied: false,
        assignment_applied: false,
        assignment_id: activePin.id,
        context_pack_version_id: support.context_pack_version_id,
        event_id: completed.id,
        event_type: "assignment_handoff_completed",
      },
      error: null,
    };
  }

  if (
    activity.classification_kind != null &&
    (activity.classification_kind !== decision.taxonomy_target_kind ||
      currentTarget !== decision.taxonomy_target_id)
  ) {
    return fail(
      "ACTIVITY_CLASSIFICATION_MISMATCH",
      "Business Activity classification does not match the confirmed BQA target",
    );
  }

  const requestedId = crypto.randomUUID();
  tables.business_activity_qualification_events.push({
    id: requestedId,
    organization_id: args.p_organization_id,
    business_activity_id: args.p_business_activity_id,
    qualification_id: qualification.id,
    event_type: "assignment_handoff_requested",
    actor_user_id: args.p_actor_user_id,
    actor_member_id: actor.id,
    payload: {
      admission_decision_id: args.p_admission_decision_id,
      support_assessment_id: support.id,
      classification_decision_id: decision.id,
      rollout_mode: args.p_rollout_mode,
      taxonomy_target_id: decision.taxonomy_target_id,
      context_pack_version_id: support.context_pack_version_id,
      business_activity_id: args.p_business_activity_id,
    },
    idempotency_key: `handoff-requested:${args.p_admission_decision_id}`,
    created_at: nowIso(),
  });

  const nested = createMemoryOrgContextBqaMutationRpc(
    orgTables,
    tables.organization_members.map((row) => ({
      userId: String(row.user_id),
      organizationId: String(row.organization_id),
      role: String(row.role),
      status: String(row.status),
    })),
  );

  async function nestedOp(
    operation: OrgContextBqaMutationOperation,
    payload: Record<string, unknown>,
  ) {
    if (options.failAfter === "assign" && operation === "assign_context_version") {
      nestedRaise("HANDOFF_FAILED");
    }
    const result = await nested.rpc(ORG_CONTEXT_BQA_MUTATION_RPC, {
      p_operation: operation,
      p_organization_id: args.p_organization_id,
      p_actor_user_id: args.p_actor_user_id,
      p_payload: payload,
    } as Parameters<typeof nested.rpc>[1]);
    const row = asRecord(result.data);
    if (!row || row.ok !== true) {
      nestedRaise(typeof row?.code === "string" ? row.code : "HANDOFF_FAILED");
    }
    return row;
  }

  const classify = await nestedOp("classify_activity", {
    activity_id: args.p_business_activity_id,
    classification_kind: decision.taxonomy_target_kind,
    target_id: decision.taxonomy_target_id,
  });
  const activate = await nestedOp("activate_activity", {
    activity_id: args.p_business_activity_id,
  });
  const assign = await nestedOp("assign_context_version", {
    activity_id: args.p_business_activity_id,
    context_pack_version_id: support.context_pack_version_id,
  });

  if (options.failAfter === "completed") {
    throw new Error("forced completed event failure");
  }

  const completedId = crypto.randomUUID();
  const assignmentId = typeof assign.assignment_id === "string" ? assign.assignment_id : null;
  tables.business_activity_qualification_events.push({
    id: completedId,
    organization_id: args.p_organization_id,
    business_activity_id: args.p_business_activity_id,
    qualification_id: qualification.id,
    event_type: "assignment_handoff_completed",
    actor_user_id: args.p_actor_user_id,
    actor_member_id: actor.id,
    payload: {
      admission_decision_id: args.p_admission_decision_id,
      support_assessment_id: support.id,
      classification_decision_id: decision.id,
      rollout_mode: args.p_rollout_mode,
      taxonomy_target_id: decision.taxonomy_target_id,
      context_pack_version_id: support.context_pack_version_id,
      business_activity_id: args.p_business_activity_id,
      assignment_id: assignmentId,
      requested_event_id: requestedId,
      classification_applied: classify.idempotent !== true,
      activation_applied: activate.idempotent !== true,
      assignment_applied: assign.idempotent !== true,
    },
    idempotency_key: `handoff-completed:${args.p_admission_decision_id}`,
    created_at: nowIso(),
  });

  return {
    data: {
      ok: true,
      idempotent: false,
      organization_id: args.p_organization_id,
      business_activity_id: args.p_business_activity_id,
      admission_decision_id: args.p_admission_decision_id,
      qualification_id: qualification.id,
      classification_applied: classify.idempotent !== true,
      activation_applied: activate.idempotent !== true,
      assignment_applied: assign.idempotent !== true,
      assignment_id: assignmentId,
      context_pack_version_id: support.context_pack_version_id,
      event_id: completedId,
      event_type: "assignment_handoff_completed",
    },
    error: null,
  };
}
