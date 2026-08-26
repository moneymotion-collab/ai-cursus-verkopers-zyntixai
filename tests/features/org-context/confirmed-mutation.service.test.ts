import { describe, expect, it } from "vitest";
import { OrganizationContextConfirmedMutationService } from "@/features/org-context/server/confirmed-mutation.service";
import { ORG_CONTEXT_BQA_MUTATION_RPC } from "@/features/org-context/server/organization-context-rpc";
import type { OrgContextBqaMutationOperation } from "@/features/org-context/domain/types";
import {
  NICHE_TAX_ID,
  NICHE_VERSION_2_ID,
  NICHE_VERSION_ID,
  ORG_A,
  ORG_B,
} from "./catalog-fixture";
import { createMemoryOrgContextBqaMutationRpc } from "./memory-confirmed-mutation";
import {
  createOrgContextMemoryClient,
  type OrgContextMemoryTables,
} from "./memory-query-client";

const OWNER = "user-owner";
const ADMIN = "user-admin";
const STAFF = "user-staff";
const VIEWER = "user-viewer";
const SUSPENDED = "user-suspended";
const FOREIGN = "user-foreign";

function emptyTables(): OrgContextMemoryTables {
  return {
    organizations: [
      { id: ORG_A, status: "active" },
      { id: ORG_B, status: "active" },
    ],
    organization_business_activities: [],
    organization_context_assignments: [],
    organization_context_assignment_events: [],
  };
}

const members = [
  { userId: OWNER, organizationId: ORG_A, role: "owner", status: "active" },
  { userId: ADMIN, organizationId: ORG_A, role: "admin", status: "active" },
  { userId: STAFF, organizationId: ORG_A, role: "staff", status: "active" },
  { userId: VIEWER, organizationId: ORG_A, role: "viewer", status: "active" },
  { userId: SUSPENDED, organizationId: ORG_A, role: "owner", status: "suspended" },
  { userId: FOREIGN, organizationId: ORG_B, role: "owner", status: "active" },
];

function createConfirmedService(tables: OrgContextMemoryTables) {
  return {
    tables,
    service: new OrganizationContextConfirmedMutationService({
      mutate: createMemoryOrgContextBqaMutationRpc(tables, members),
    }),
    query: createOrgContextMemoryClient(tables),
  };
}

function seedDraft(tables: OrgContextMemoryTables, input?: { classified?: boolean }) {
  const activityId = "activity-draft";
  tables.organization_business_activities.push({
    id: activityId,
    organization_id: ORG_A,
    activity_key: "draft_activity",
    display_name: "Draft Activity",
    status: "draft",
    is_primary: false,
    classification_kind: input?.classified ? "niche" : null,
    foundation_id: null,
    industry_id: null,
    niche_id: input?.classified ? NICHE_TAX_ID : null,
    specialization_id: null,
    deep_specialization_id: null,
    created_at: "2026-08-26T00:00:00.000Z",
    updated_at: "2026-08-26T00:00:00.000Z",
  });
  return activityId;
}

describe("OrganizationContextConfirmedMutationService", () => {
  it("classifies, activates, and assigns with bqa_confirmed provenance for Owner and Admin", async () => {
    for (const actorUserId of [OWNER, ADMIN]) {
      const { service, tables } = createConfirmedService(emptyTables());
      const activityId = seedDraft(tables);
      const classified = await service.applyBqaConfirmedMutation({
        organizationId: ORG_A,
        actorUserId,
        operation: "classify_activity",
        payload: {
          activity_id: activityId,
          classification_kind: "niche",
          target_id: NICHE_TAX_ID,
          source: "platform_operator",
        },
      });
      expect(classified).toMatchObject({
        ok: true,
        value: { eventType: "business_activity_classified", idempotent: false },
      });
      const activated = await service.applyBqaConfirmedMutation({
        organizationId: ORG_A,
        actorUserId,
        operation: "activate_activity",
        payload: { activity_id: activityId },
      });
      expect(activated).toMatchObject({
        ok: true,
        value: { eventType: "business_activity_activated", idempotent: false },
      });
      const assigned = await service.applyBqaConfirmedMutation({
        organizationId: ORG_A,
        actorUserId,
        operation: "assign_context_version",
        payload: {
          activity_id: activityId,
          context_pack_version_id: NICHE_VERSION_ID,
        },
      });
      expect(assigned).toMatchObject({
        ok: true,
        value: { eventType: "context_version_assigned", idempotent: false },
      });
      expect(tables.organization_context_assignments[0]).toMatchObject({
        source: "bqa_confirmed",
        context_pack_version_id: NICHE_VERSION_ID,
        status: "active",
      });
      expect(
        tables.organization_context_assignment_events.every(
          (row) => row.source === "bqa_confirmed",
        ),
      ).toBe(true);
      expect(
        await service.applyBqaConfirmedMutation({
          organizationId: ORG_A,
          actorUserId,
          operation: "classify_activity",
          payload: {
            activity_id: activityId,
            classification_kind: "niche",
            target_id: NICHE_TAX_ID,
          },
        }),
      ).toMatchObject({ ok: true, value: { idempotent: true } });
      expect(
        await service.applyBqaConfirmedMutation({
          organizationId: ORG_A,
          actorUserId,
          operation: "activate_activity",
          payload: { activity_id: activityId },
        }),
      ).toMatchObject({ ok: true, value: { idempotent: true } });
      expect(
        await service.applyBqaConfirmedMutation({
          organizationId: ORG_A,
          actorUserId,
          operation: "assign_context_version",
          payload: {
            activity_id: activityId,
            context_pack_version_id: NICHE_VERSION_ID,
          },
        }),
      ).toMatchObject({ ok: true, value: { idempotent: true } });
      expect(
        tables.organization_context_assignment_events.filter(
          (row) => row.event_type === "business_activity_activated",
        ),
      ).toHaveLength(1);
    }
  });

  it("denies Staff, Viewer, suspended, foreign, and missing actors before mutation", async () => {
    const { service, tables } = createConfirmedService(emptyTables());
    const activityId = seedDraft(tables);
    const payload = {
      activity_id: activityId,
      classification_kind: "niche",
      target_id: NICHE_TAX_ID,
    };
    for (const actorUserId of [STAFF, VIEWER, SUSPENDED, FOREIGN, ""]) {
      const before = tables.organization_context_assignment_events.length;
      expect(
        await service.applyBqaConfirmedMutation({
          organizationId: ORG_A,
          actorUserId,
          operation: "classify_activity",
          payload,
        }),
      ).toMatchObject({ ok: false, error: { code: "ACTOR_NOT_AUTHORIZED" } });
      expect(tables.organization_business_activities[0]?.classification_kind).toBeNull();
      expect(tables.organization_context_assignment_events).toHaveLength(before);
    }
  });

  it("fails closed on classification mismatch without overwrite", async () => {
    const { service, tables } = createConfirmedService(emptyTables());
    const activityId = seedDraft(tables, { classified: true });
    expect(
      await service.applyBqaConfirmedMutation({
        organizationId: ORG_A,
        actorUserId: OWNER,
        operation: "classify_activity",
        payload: {
          activity_id: activityId,
          classification_kind: "foundation",
          target_id: "tax-foundation-knowledge",
        },
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "ACTIVITY_CLASSIFICATION_MISMATCH" },
    });
    expect(tables.organization_business_activities[0]).toMatchObject({
      classification_kind: "niche",
      niche_id: NICHE_TAX_ID,
    });
    expect(tables.organization_context_assignment_events).toHaveLength(0);
  });

  it("returns CONTEXT_REPIN_REQUIRED and does not supersede a different pin", async () => {
    const { service, tables } = createConfirmedService(emptyTables());
    const activityId = seedDraft(tables, { classified: true });
    tables.organization_business_activities[0]!.status = "active";
    tables.organization_context_assignments.push({
      id: "pin-1",
      organization_id: ORG_A,
      business_activity_id: activityId,
      context_pack_version_id: NICHE_VERSION_ID,
      status: "active",
      source: "platform_operator",
      actor_user_id: OWNER,
      actor_member_id: null,
      reason: null,
      created_at: "2026-08-26T00:00:00.000Z",
      updated_at: "2026-08-26T00:00:00.000Z",
      superseded_at: null,
    });
    expect(
      await service.applyBqaConfirmedMutation({
        organizationId: ORG_A,
        actorUserId: OWNER,
        operation: "assign_context_version",
        payload: {
          activity_id: activityId,
          context_pack_version_id: NICHE_VERSION_2_ID,
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_REPIN_REQUIRED" } });
    expect(tables.organization_context_assignments).toHaveLength(1);
    expect(tables.organization_context_assignments[0]).toMatchObject({
      status: "active",
      context_pack_version_id: NICHE_VERSION_ID,
    });
    expect(tables.organization_context_assignment_events).toHaveLength(0);
  });

  it("rejects forbidden operations with zero domain mutation", async () => {
    const { tables } = createConfirmedService(emptyTables());
    const activityId = seedDraft(tables, { classified: true });
    const mutate = createMemoryOrgContextBqaMutationRpc(tables, members);
    const forbidden = [
      "create_activity",
      "set_primary",
      "change_context_version",
      "archive_activity",
      "unknown_operation",
    ] as const;
    for (const operation of forbidden) {
      const result = await mutate.rpc(ORG_CONTEXT_BQA_MUTATION_RPC, {
        p_operation: operation as OrgContextBqaMutationOperation,
        p_organization_id: ORG_A,
        p_actor_user_id: OWNER,
        p_payload: {
          activity_id: activityId,
          context_pack_version_id: NICHE_VERSION_2_ID,
        },
      });
      expect(result.data).toMatchObject({ ok: false, code: "FORBIDDEN_OPERATION" });
    }
    expect(tables.organization_context_assignments).toHaveLength(0);
    expect(tables.organization_context_assignment_events).toHaveLength(0);
    expect(tables.organization_business_activities[0]).toMatchObject({
      status: "draft",
      is_primary: false,
    });
  });

  it("ignores payload source and never calls requireOperator", async () => {
    const source = await import("fs").then((fs) =>
      fs.readFileSync(
        "src/features/org-context/server/confirmed-mutation.service.ts",
        "utf8",
      ),
    );
    expect(source).toContain("applyBqaConfirmedMutation");
    expect(source).not.toContain("requireOperator(");
    expect(source).not.toContain("skipOperatorCheck");
    expect(source).not.toContain("bypassOperator");
    expect(source).toContain("delete payload.source");
  });
});
