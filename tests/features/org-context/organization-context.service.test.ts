import { describe, expect, it } from "vitest";
import { ContextRepository } from "@/features/control-plane/server/context.repository";
import { TaxonomyRepository } from "@/features/control-plane/server/taxonomy.repository";
import { OrgContextCatalogReader } from "@/features/org-context/server/catalog-reader";
import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import { OrganizationContextService } from "@/features/org-context/server/organization-context.service";
import {
  DRAFT_TAX_ID,
  FOUNDATION_TAX_ID,
  KNOWLEDGE_VERSION_ID,
  NICHE_DRAFT_VERSION_ID,
  NICHE_PLANNED_VERSION_ID,
  NICHE_TAX_ID,
  NICHE_VERSION_2_ID,
  NICHE_VERSION_ID,
  OPERATOR_USER_ID,
  ORG_A,
  ORG_B,
  createOrgContextCatalogClient,
} from "./catalog-fixture";
import { createMemoryOrgContextMutationRpc } from "./memory-mutation";
import {
  createOrgContextMemoryClient,
  type OrgContextMemoryTables,
} from "./memory-query-client";

function emptyTables(): OrgContextMemoryTables {
  return {
    organizations: [
      { id: ORG_A, status: "active" },
      { id: ORG_B, status: "active" },
      { id: "org-archived", status: "archived" },
    ],
    organization_business_activities: [],
    organization_context_assignments: [],
    organization_context_assignment_events: [],
  };
}

function createService(
  tables: OrgContextMemoryTables,
  operatorUserId = OPERATOR_USER_ID,
) {
  const catalogClient = createOrgContextCatalogClient();
  return {
    tables,
    service: new OrganizationContextService({
      operator: { actorUserId: operatorUserId, email: "ops@zyntix.test" },
      repository: new OrganizationContextRepository(
        createOrgContextMemoryClient(tables),
      ),
      catalog: new OrgContextCatalogReader(
        new TaxonomyRepository(catalogClient),
        new ContextRepository(catalogClient),
      ),
      mutate: createMemoryOrgContextMutationRpc(tables),
    }),
  };
}

const nicheClassification = {
  kind: "niche" as const,
  targetId: NICHE_TAX_ID,
};

const foundationClassification = {
  kind: "foundation" as const,
  targetId: FOUNDATION_TAX_ID,
};

describe("OrganizationContextService Business Activity actions", () => {
  it("creates a draft unclassified activity", async () => {
    const { service, tables } = createService(emptyTables());
    const created = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Draft Launch",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.eventType).toBe("business_activity_created");
    const activity = await service.getBusinessActivity(ORG_A, created.value.activityId);
    expect(activity).toMatchObject({
      ok: true,
      value: {
        status: "draft",
        classification: null,
        isPrimary: false,
        activityKey: "draft_launch",
      },
    });
    expect(tables.organization_context_assignment_events).toHaveLength(1);
  });

  it("creates an active classified activity and permits the same TAX on multiple activities", async () => {
    const { service } = createService(emptyTables());
    const first = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Main",
      status: "active",
      classification: nicheClassification,
    });
    const second = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Second",
      status: "active",
      classification: nicheClassification,
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    const listed = await service.listBusinessActivities(ORG_A);
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.value).toHaveLength(2);
  });

  it("rejects active unclassified and primary draft", async () => {
    const { service } = createService(emptyTables());
    expect(
      await service.createBusinessActivity({
        organizationId: ORG_A,
        displayName: "Broken",
        status: "active",
      }),
    ).toMatchObject({ ok: false, error: { code: "MUTATION_FAILED" } });
    expect(
      await service.createBusinessActivity({
        organizationId: ORG_A,
        displayName: "Broken primary",
        isPrimary: true,
      }),
    ).toMatchObject({ ok: false, error: { code: "PRIMARY_ACTIVITY_CONFLICT" } });
  });

  it("handles generated activity_key collisions and explicit key conflicts", async () => {
    const { service } = createService(emptyTables());
    const first = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Online Course",
    });
    const second = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Online Course",
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(await service.getBusinessActivity(ORG_A, first.value.activityId)).toMatchObject({
      ok: true,
      value: { activityKey: "online_course" },
    });
    expect(await service.getBusinessActivity(ORG_A, second.value.activityId)).toMatchObject({
      ok: true,
      value: { activityKey: "online_course_2" },
    });
    await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "One",
      activityKey: "custom_key",
    });
    expect(
      await service.createBusinessActivity({
        organizationId: ORG_A,
        displayName: "Two",
        activityKey: "custom_key",
      }),
    ).toMatchObject({ ok: false, error: { code: "MUTATION_FAILED" } });
  });

  it("denies foreign Organization access and missing operator identity", async () => {
    const { service } = createService(emptyTables());
    const created = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Owned",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(
      await service.getBusinessActivity(ORG_B, created.value.activityId),
    ).toMatchObject({ ok: false, error: { code: "ACTIVITY_NOT_OWNED_BY_ORG" } });
    expect(
      await createService(emptyTables(), "").service.createBusinessActivity({
        organizationId: ORG_A,
        displayName: "Nope",
      }),
    ).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });
});

describe("OrganizationContextService classification, primary, archive", () => {
  it("classifies a draft without assigning Context and is idempotent", async () => {
    const { service } = createService(emptyTables());
    const created = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "To classify",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(
      await service.classifyBusinessActivity({
        organizationId: ORG_A,
        activityId: created.value.activityId,
        classification: nicheClassification,
      }),
    ).toMatchObject({
      ok: true,
      value: { eventType: "business_activity_classified", idempotent: false },
    });
    expect(
      await service.getPinnedContextVersion(ORG_A, created.value.activityId),
    ).toMatchObject({ ok: true, value: null });
    expect(
      await service.classifyBusinessActivity({
        organizationId: ORG_A,
        activityId: created.value.activityId,
        classification: nicheClassification,
      }),
    ).toMatchObject({ ok: true, value: { idempotent: true, eventType: null } });
  });

  it("rejects draft taxonomy and archived reclassification", async () => {
    const { service } = createService(emptyTables());
    const created = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Draft tax",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(
      await service.classifyBusinessActivity({
        organizationId: ORG_A,
        activityId: created.value.activityId,
        classification: { kind: "niche", targetId: DRAFT_TAX_ID },
      }),
    ).toMatchObject({ ok: false, error: { code: "CLASSIFICATION_NOT_FOUND" } });
    await service.archiveBusinessActivity({
      organizationId: ORG_A,
      activityId: created.value.activityId,
    });
    expect(
      await service.classifyBusinessActivity({
        organizationId: ORG_A,
        activityId: created.value.activityId,
        classification: nicheClassification,
      }),
    ).toMatchObject({ ok: false, error: { code: "MUTATION_FAILED" } });
  });

  it("activates a classified draft, no-ops active, and rejects unclassified or archived", async () => {
    const { service, tables } = createService(emptyTables());
    const unclassified = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Unclassified draft",
    });
    expect(unclassified.ok).toBe(true);
    if (!unclassified.ok) return;
    expect(
      await service.activateBusinessActivity({
        organizationId: ORG_A,
        activityId: unclassified.value.activityId,
      }),
    ).toMatchObject({ ok: false, error: { code: "ACTIVITY_NOT_CLASSIFIED" } });

    const classified = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Classified draft",
      classification: nicheClassification,
    });
    expect(classified.ok).toBe(true);
    if (!classified.ok) return;
    expect(
      await service.activateBusinessActivity({
        organizationId: ORG_A,
        activityId: classified.value.activityId,
      }),
    ).toMatchObject({
      ok: true,
      value: { eventType: "business_activity_activated", idempotent: false },
    });
    expect(
      await service.activateBusinessActivity({
        organizationId: ORG_A,
        activityId: classified.value.activityId,
      }),
    ).toMatchObject({ ok: true, value: { idempotent: true, eventType: null } });
    const activity = await service.getBusinessActivity(ORG_A, classified.value.activityId);
    expect(activity).toMatchObject({
      ok: true,
      value: { status: "active", isPrimary: false },
    });
    expect(
      tables.organization_context_assignments.filter((row) => row.status === "active"),
    ).toHaveLength(0);
    expect(
      tables.organization_context_assignment_events.filter(
        (row) => row.event_type === "business_activity_activated",
      ),
    ).toHaveLength(1);

    await service.archiveBusinessActivity({
      organizationId: ORG_A,
      activityId: classified.value.activityId,
    });
    expect(
      await service.activateBusinessActivity({
        organizationId: ORG_A,
        activityId: classified.value.activityId,
      }),
    ).toMatchObject({ ok: false, error: { code: "ACTIVITY_ARCHIVED" } });
  });

  it("keeps platform operator identity required for activate_activity", async () => {
    const { service } = createService(emptyTables(), "");
    expect(
      await service.activateBusinessActivity({
        organizationId: ORG_A,
        activityId: "00000000-0000-0000-0000-000000000001",
      }),
    ).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("allows zero primary, sets, switches, and no-ops the same primary", async () => {
    const { service, tables } = createService(emptyTables());
    const first = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "First",
      status: "active",
      classification: nicheClassification,
    });
    const second = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Second",
      status: "active",
      classification: nicheClassification,
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(await service.getPrimaryBusinessActivity(ORG_A)).toMatchObject({
      ok: true,
      value: null,
    });
    expect(
      await service.setPrimaryBusinessActivity({
        organizationId: ORG_A,
        activityId: first.value.activityId,
      }),
    ).toMatchObject({
      ok: true,
      value: { eventType: "primary_activity_changed", idempotent: false },
    });
    expect(
      await service.setPrimaryBusinessActivity({
        organizationId: ORG_A,
        activityId: second.value.activityId,
      }),
    ).toMatchObject({
      ok: true,
      value: { eventType: "primary_activity_changed", idempotent: false },
    });
    expect(
      await service.setPrimaryBusinessActivity({
        organizationId: ORG_A,
        activityId: second.value.activityId,
      }),
    ).toMatchObject({ ok: true, value: { idempotent: true, eventType: null } });
    expect(await service.getPrimaryBusinessActivity(ORG_A)).toMatchObject({
      ok: true,
      value: { activityId: second.value.activityId },
    });
    expect(
      tables.organization_context_assignment_events.filter(
        (row) => row.event_type === "primary_activity_changed",
      ),
    ).toHaveLength(2);
  });

  it("rejects foreign, draft, and archived primary targets", async () => {
    const { service } = createService(emptyTables());
    const owned = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Owned draft",
    });
    const foreign = await service.createBusinessActivity({
      organizationId: ORG_B,
      displayName: "Foreign active",
      status: "active",
      classification: nicheClassification,
    });
    expect(owned.ok && foreign.ok).toBe(true);
    if (!owned.ok || !foreign.ok) return;
    expect(
      await service.setPrimaryBusinessActivity({
        organizationId: ORG_A,
        activityId: owned.value.activityId,
      }),
    ).toMatchObject({ ok: false, error: { code: "PRIMARY_ACTIVITY_CONFLICT" } });
    expect(
      await service.setPrimaryBusinessActivity({
        organizationId: ORG_A,
        activityId: foreign.value.activityId,
      }),
    ).toMatchObject({ ok: false, error: { code: "ACTIVITY_NOT_OWNED_BY_ORG" } });
    await service.archiveBusinessActivity({
      organizationId: ORG_A,
      activityId: owned.value.activityId,
    });
    expect(
      await service.setPrimaryBusinessActivity({
        organizationId: ORG_A,
        activityId: owned.value.activityId,
      }),
    ).toMatchObject({ ok: false, error: { code: "PRIMARY_ACTIVITY_CONFLICT" } });
  });

  it("archives idempotently and supersedes an active pin without deleting rows", async () => {
    const { service, tables } = createService(emptyTables());
    const created = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Pinned",
      status: "active",
      isPrimary: true,
      classification: nicheClassification,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    await service.assignContextVersion({
      organizationId: ORG_A,
      activityId: created.value.activityId,
      contextPackVersionId: NICHE_VERSION_ID,
    });
    expect(
      await service.archiveBusinessActivity({
        organizationId: ORG_A,
        activityId: created.value.activityId,
      }),
    ).toMatchObject({
      ok: true,
      value: { eventType: "business_activity_archived", idempotent: false },
    });
    expect(
      await service.archiveBusinessActivity({
        organizationId: ORG_A,
        activityId: created.value.activityId,
      }),
    ).toMatchObject({ ok: true, value: { idempotent: true } });
    expect(await service.getBusinessActivity(ORG_A, created.value.activityId)).toMatchObject({
      ok: true,
      value: { status: "archived", isPrimary: false },
    });
    const history = await service.getAssignmentHistory(ORG_A, created.value.activityId);
    expect(history.ok).toBe(true);
    if (!history.ok) return;
    expect(history.value.every((row) => row.status === "superseded")).toBe(true);
    expect(
      tables.organization_business_activities.some((row) => row.id === created.value.activityId),
    ).toBe(true);
  });
});

describe("OrganizationContextService Context assignment", () => {
  it("assigns a matching Niche Context under internal_qa and no-ops the same version", async () => {
    const { service } = createService(emptyTables());
    const created = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Niche",
      status: "active",
      classification: nicheClassification,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(
      await service.assignContextVersion({
        organizationId: ORG_A,
        activityId: created.value.activityId,
        contextPackVersionId: NICHE_VERSION_ID,
      }),
    ).toMatchObject({
      ok: true,
      value: { eventType: "context_version_assigned", idempotent: false },
    });
    expect(
      await service.assignContextVersion({
        organizationId: ORG_A,
        activityId: created.value.activityId,
        contextPackVersionId: NICHE_VERSION_ID,
      }),
    ).toMatchObject({ ok: true, value: { idempotent: true, eventType: null } });
  });

  it("rejects incompatible Niche, Foundation ancestor, unclassified, draft, and planned readiness", async () => {
    const { service } = createService(emptyTables());
    const unclassified = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Unclassified",
    });
    const niche = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Niche classified",
      status: "active",
      classification: nicheClassification,
    });
    const foundation = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Foundation classified",
      status: "active",
      classification: foundationClassification,
    });
    expect(unclassified.ok && niche.ok && foundation.ok).toBe(true);
    if (!unclassified.ok || !niche.ok || !foundation.ok) return;
    expect(
      await service.assignContextVersion({
        organizationId: ORG_A,
        activityId: unclassified.value.activityId,
        contextPackVersionId: NICHE_VERSION_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_VERSION_NOT_ASSIGNABLE" } });
    expect(
      await service.assignContextVersion({
        organizationId: ORG_A,
        activityId: niche.value.activityId,
        contextPackVersionId: KNOWLEDGE_VERSION_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_INCOMPATIBLE" } });
    expect(
      await service.assignContextVersion({
        organizationId: ORG_A,
        activityId: niche.value.activityId,
        contextPackVersionId: NICHE_DRAFT_VERSION_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_VERSION_NOT_ASSIGNABLE" } });
    expect(
      await service.assignContextVersion({
        organizationId: ORG_A,
        activityId: niche.value.activityId,
        contextPackVersionId: NICHE_PLANNED_VERSION_ID,
      }),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_VERSION_NOT_ASSIGNABLE" } });
    expect(
      await service.assignContextVersion({
        organizationId: ORG_A,
        activityId: foundation.value.activityId,
        contextPackVersionId: KNOWLEDGE_VERSION_ID,
      }),
    ).toMatchObject({ ok: true, value: { eventType: "context_version_assigned" } });
  });

  it("changes pin by superseding the old assignment without mutating its version id", async () => {
    const { service, tables } = createService(emptyTables());
    const created = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Switch",
      status: "active",
      classification: nicheClassification,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const first = await service.assignContextVersion({
      organizationId: ORG_A,
      activityId: created.value.activityId,
      contextPackVersionId: NICHE_VERSION_ID,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const oldId = first.value.assignmentId;
    expect(
      await service.changePinnedContextVersion({
        organizationId: ORG_A,
        activityId: created.value.activityId,
        contextPackVersionId: NICHE_VERSION_2_ID,
      }),
    ).toMatchObject({
      ok: true,
      value: { eventType: "context_version_changed", idempotent: false },
    });
    expect(
      await service.changePinnedContextVersion({
        organizationId: ORG_A,
        activityId: created.value.activityId,
        contextPackVersionId: NICHE_VERSION_2_ID,
      }),
    ).toMatchObject({ ok: true, value: { idempotent: true } });
    const history = await service.getAssignmentHistory(ORG_A, created.value.activityId);
    expect(history.ok).toBe(true);
    if (!history.ok) return;
    expect(history.value.filter((row) => row.status === "active")).toHaveLength(1);
    expect(tables.organization_context_assignments.find((row) => row.id === oldId)).toMatchObject({
      status: "superseded",
      context_pack_version_id: NICHE_VERSION_ID,
    });
    expect(
      tables.organization_context_assignment_events.filter(
        (row) => row.event_type === "context_version_assigned",
      ),
    ).toHaveLength(1);
    expect(
      tables.organization_context_assignment_events.filter(
        (row) => row.event_type === "context_version_changed",
      ),
    ).toHaveLength(1);
  });

  it("does not auto-follow latest or mutate catalog readiness", async () => {
    const { service } = createService(emptyTables());
    const created = await service.createBusinessActivity({
      organizationId: ORG_A,
      displayName: "Exact pin",
      status: "active",
      classification: nicheClassification,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    await service.assignContextVersion({
      organizationId: ORG_A,
      activityId: created.value.activityId,
      contextPackVersionId: NICHE_VERSION_ID,
    });
    expect(
      await service.getPinnedContextVersion(ORG_A, created.value.activityId),
    ).toMatchObject({
      ok: true,
      value: { contextPackVersionId: NICHE_VERSION_ID },
    });
    const readiness = await new ContextRepository(
      createOrgContextCatalogClient(),
    ).getPackReadiness(NICHE_VERSION_ID);
    expect(readiness).toMatchObject({
      ok: true,
      value: { readinessStatus: "context_ready", verifiedAt: null },
    });
  });
});
