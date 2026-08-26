import { describe, expect, it } from "vitest";
import {
  resolveBusinessActivityContext,
  resolvePrimaryBusinessActivityContext,
} from "@/features/context-resolver/server/context-resolver";
import {
  ACTIVITY_ID,
  DRAFT_VERSION_ID,
  FOREIGN_ACTIVITY_ID,
  FOREIGN_ORG_ID,
  KNOWLEDGE_VERSION_ID,
  NICHE_LATEST_ID,
  NICHE_VERSION_ID,
  ORG_ID,
  SECONDARY_ACTIVITY_ID,
  SUPERSEDED_VERSION_ID,
  USER_ID,
  createResolverRuntime,
  defaultCatalog,
} from "./server-fixture";

const BASE = {
  organizationId: ORG_ID,
  activityId: ACTIVITY_ID,
  mode: "internal_qa" as const,
};

describe("context resolver server authorization", () => {
  it("denies unauthenticated callers before Control Plane reads", async () => {
    const { runtime, controlPlaneCalls } = createResolverRuntime();
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
    expect(controlPlaneCalls.count).toBe(0);
  });

  it("denies users with no Organization membership", async () => {
    const { runtime, controlPlaneCalls } = createResolverRuntime({
      userId: USER_ID,
      extraMemberships: [],
      organizationId: FOREIGN_ORG_ID,
    });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result).toMatchObject({ ok: false, error: { code: "ORG_NOT_FOUND" } });
    expect(controlPlaneCalls.count).toBe(0);
  });

  it("denies suspended membership without Control Plane access", async () => {
    const { runtime, controlPlaneCalls } = createResolverRuntime({
      userId: USER_ID,
      membershipStatus: "suspended",
    });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result).toMatchObject({ ok: false, error: { code: "ORG_NOT_FOUND" } });
    expect(controlPlaneCalls.count).toBe(0);
  });

  it.each(["owner", "admin", "staff", "viewer"] as const)(
    "allows active %s members",
    async (role) => {
      const { runtime } = createResolverRuntime({ userId: USER_ID, role });
      const result = await resolveBusinessActivityContext(BASE, runtime);
      expect(result.ok).toBe(true);
    },
  );

  it("denies a foreign Organization without leaking Control Plane work", async () => {
    const { runtime, controlPlaneCalls } = createResolverRuntime({ userId: USER_ID });
    const result = await resolveBusinessActivityContext(
      { ...BASE, organizationId: FOREIGN_ORG_ID },
      runtime,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "ORG_NOT_FOUND" } });
    expect(controlPlaneCalls.count).toBe(0);
  });

  it("fails closed when Organization and Activity are from different tenants", async () => {
    const { runtime } = createResolverRuntime({ userId: USER_ID });
    const result = await resolveBusinessActivityContext(
      { ...BASE, activityId: FOREIGN_ACTIVITY_ID },
      runtime,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(["ACTIVITY_NOT_OWNED_BY_ORG", "ACTIVITY_NOT_FOUND"]).toContain(result.error.code);
    }
  });
});

describe("context resolver tenant loader", () => {
  it("resolves the exact Activity and active assignment pin", async () => {
    const { runtime } = createResolverRuntime({ userId: USER_ID });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.businessActivity.id).toBe(ACTIVITY_ID);
    expect(result.value.context.packKey).toBe("niche.online-course-business");
    expect(result.value.context.versionNumber).toBe(1);
    expect(result.value.relevantCapabilities).toHaveLength(13);
    expect(result.value.terminology).toHaveLength(4);
    expect(result.value.relevantCapabilities.some((item) => item.capabilityKey === "internal.hidden")).toBe(
      false,
    );
  });

  it("returns ACTIVITY_NOT_FOUND for a missing Activity", async () => {
    const { runtime } = createResolverRuntime({ userId: USER_ID });
    const result = await resolveBusinessActivityContext(
      { ...BASE, activityId: "77777777-7777-4777-8777-777777777777" },
      runtime,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "ACTIVITY_NOT_FOUND" } });
  });

  it("returns CONTEXT_UNASSIGNED when no active assignment exists", async () => {
    const { runtime } = createResolverRuntime({
      userId: USER_ID,
      extraActivities: [
        {
          id: SECONDARY_ACTIVITY_ID,
          organization_id: ORG_ID,
          activity_key: "unassigned",
          display_name: "Unassigned",
          status: "active",
          is_primary: false,
          classification_kind: "niche",
          foundation_id: null,
          industry_id: null,
          niche_id: "tax-niche-ocb",
          specialization_id: null,
          deep_specialization_id: null,
          created_at: "2026-08-26T00:00:00.000Z",
          updated_at: "2026-08-26T00:00:00.000Z",
        },
      ],
    });
    const result = await resolveBusinessActivityContext(
      { ...BASE, activityId: SECONDARY_ACTIVITY_ID },
      runtime,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "CONTEXT_UNASSIGNED" } });
  });

  it("fails closed on multiple active assignments", async () => {
    const { runtime } = createResolverRuntime({
      userId: USER_ID,
      extraAssignments: [
        {
          id: "assign-dup",
          organization_id: ORG_ID,
          business_activity_id: ACTIVITY_ID,
          context_pack_version_id: NICHE_LATEST_ID,
          status: "active",
          source: "platform_operator",
          actor_user_id: USER_ID,
          actor_member_id: null,
          reason: "dup",
          created_at: "2026-08-26T00:00:01.000Z",
          updated_at: "2026-08-26T00:00:01.000Z",
          superseded_at: null,
        },
      ],
    });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });
});

describe("context resolver primary convenience", () => {
  it("delegates a single primary Activity to the core resolver", async () => {
    const { runtime } = createResolverRuntime({ userId: USER_ID });
    const result = await resolvePrimaryBusinessActivityContext(
      { organizationId: ORG_ID, mode: "internal_qa" },
      runtime,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.businessActivity.id).toBe(ACTIVITY_ID);
    expect(result.value.businessActivity.isPrimary).toBe(true);
  });

  it("returns NO_PRIMARY_ACTIVITY when none exist", async () => {
    const { runtime } = createResolverRuntime({
      userId: USER_ID,
      activityIsPrimary: false,
    });
    const result = await resolvePrimaryBusinessActivityContext(
      { organizationId: ORG_ID, mode: "internal_qa" },
      runtime,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "NO_PRIMARY_ACTIVITY" } });
  });

  it("never selects a non-primary Activity or a foreign Organization primary", async () => {
    const { runtime } = createResolverRuntime({
      userId: USER_ID,
      extraActivities: [
        {
          id: SECONDARY_ACTIVITY_ID,
          organization_id: ORG_ID,
          activity_key: "secondary",
          display_name: "Secondary",
          status: "active",
          is_primary: false,
          classification_kind: "niche",
          foundation_id: null,
          industry_id: null,
          niche_id: "tax-niche-ocb",
          specialization_id: null,
          deep_specialization_id: null,
          created_at: "2026-08-26T00:00:00.000Z",
          updated_at: "2026-08-26T00:00:00.000Z",
        },
      ],
    });
    const result = await resolvePrimaryBusinessActivityContext(
      { organizationId: ORG_ID, mode: "internal_qa" },
      runtime,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.businessActivity.id).not.toBe(SECONDARY_ACTIVITY_ID);
    expect(result.value.businessActivity.id).toBe(ACTIVITY_ID);

    const foreign = await resolvePrimaryBusinessActivityContext(
      { organizationId: FOREIGN_ORG_ID, mode: "internal_qa" },
      runtime,
    );
    expect(foreign).toMatchObject({ ok: false, error: { code: "ORG_NOT_FOUND" } });
  });

  it("fails closed when multiple primaries are observed", async () => {
    const { runtime } = createResolverRuntime({
      userId: USER_ID,
      extraActivities: [
        {
          id: SECONDARY_ACTIVITY_ID,
          organization_id: ORG_ID,
          activity_key: "second_primary",
          display_name: "Second primary",
          status: "active",
          is_primary: true,
          classification_kind: "niche",
          foundation_id: null,
          industry_id: null,
          niche_id: "tax-niche-ocb",
          specialization_id: null,
          deep_specialization_id: null,
          created_at: "2026-08-26T00:00:00.000Z",
          updated_at: "2026-08-26T00:00:00.000Z",
        },
      ],
    });
    const result = await resolvePrimaryBusinessActivityContext(
      { organizationId: ORG_ID, mode: "internal_qa" },
      runtime,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });
});

describe("context resolver pin and chain", () => {
  it("uses the exact active assignment pin and ignores a newer version", async () => {
    const { runtime } = createResolverRuntime({ userId: USER_ID });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.context.versionNumber).toBe(1);
    expect(result.value.context.ancestry.map((entry) => `${entry.packKey}@${entry.versionNumber}`)).toEqual([
      "foundation.knowledge@1",
      "niche.online-course-business@1",
    ]);
    expect(NICHE_LATEST_ID).toBe("ver-ocb-99");
  });

  it("resolves a superseded exact pin", async () => {
    const { runtime } = createResolverRuntime({
      userId: USER_ID,
      pinVersionId: SUPERSEDED_VERSION_ID,
    });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.context.publicationStatus).toBe("superseded");
    expect(result.value.context.versionNumber).toBe(2);
  });

  it("fails a draft exact pin", async () => {
    const { runtime } = createResolverRuntime({
      userId: USER_ID,
      pinVersionId: DRAFT_VERSION_ID,
    });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });

  it("fails when a pinned parent version is missing", async () => {
    const catalog = defaultCatalog();
    catalog.context_pack_versions = (catalog.context_pack_versions ?? []).map((row) =>
      row.id === NICHE_VERSION_ID ? { ...row, parent_version_id: "missing-parent" } : row,
    );
    const { runtime } = createResolverRuntime({ userId: USER_ID, catalog });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result).toMatchObject({ ok: false, error: { code: "PARENT_CONTEXT_NOT_FOUND" } });
  });
});

describe("context resolver CAP and locale", () => {
  it("passes missing mapped and Core CAP readiness through as null", async () => {
    const catalog = defaultCatalog();
    catalog.capability_readiness = (catalog.capability_readiness ?? []).filter(
      (row) =>
        row.capability_id !== "cap-shared.crm.leads" && row.capability_id !== "cap-core.tasks",
    );
    const { runtime } = createResolverRuntime({ userId: USER_ID, catalog });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relevantCapabilities.find((item) => item.capabilityKey === "shared.crm.leads")).toMatchObject({
      readinessStatus: null,
    });
    expect(result.value.relevantCapabilities.find((item) => item.capabilityKey === "core.tasks")).toMatchObject({
      effectiveRelevance: "required",
      provenance: { sourceKind: "system_baseline" },
      readinessStatus: null,
    });
  });

  it("copies explicit planned CAP readiness and fails missing definitions", async () => {
    const catalog = defaultCatalog();
    catalog.capability_readiness = (catalog.capability_readiness ?? []).map((row) =>
      row.capability_id === "cap-shared.crm.leads"
        ? { ...row, readiness_status: "planned" }
        : row,
    );
    const planned = createResolverRuntime({ userId: USER_ID, catalog });
    const plannedResult = await resolveBusinessActivityContext(BASE, planned.runtime);
    expect(plannedResult.ok).toBe(true);
    if (plannedResult.ok) {
      expect(
        plannedResult.value.relevantCapabilities.find((item) => item.capabilityKey === "shared.crm.leads"),
      ).toMatchObject({ readinessStatus: "planned" });
    }

    const missingDef = defaultCatalog();
    missingDef.capabilities = (missingDef.capabilities ?? []).filter(
      (row) => row.capability_key !== "shared.crm.leads",
    );
    const missing = createResolverRuntime({ userId: USER_ID, catalog: missingDef });
    const missingResult = await resolveBusinessActivityContext(BASE, missing.runtime);
    expect(missingResult).toMatchObject({
      ok: false,
      error: { code: "CAPABILITY_NOT_FOUND" },
    });
  });

  it("fails missing or planned leaf Context readiness and allows per-capability gaps", async () => {
    const plannedLeaf = defaultCatalog();
    plannedLeaf.context_pack_readiness = (plannedLeaf.context_pack_readiness ?? []).map((row) =>
      row.version_id === NICHE_VERSION_ID ? { ...row, readiness_status: "planned" } : row,
    );
    const planned = createResolverRuntime({ userId: USER_ID, catalog: plannedLeaf });
    expect(await resolveBusinessActivityContext(BASE, planned.runtime)).toMatchObject({
      ok: false,
      error: { code: "CONTEXT_NOT_RESOLVABLE_FOR_MODE" },
    });

    const missingLeaf = defaultCatalog();
    missingLeaf.context_pack_readiness = (missingLeaf.context_pack_readiness ?? []).filter(
      (row) => row.version_id !== NICHE_VERSION_ID,
    );
    const missing = createResolverRuntime({ userId: USER_ID, catalog: missingLeaf });
    expect(await resolveBusinessActivityContext(BASE, missing.runtime)).toMatchObject({
      ok: false,
      error: { code: "CONTEXT_NOT_RESOLVABLE_FOR_MODE" },
    });
  });

  it("preserves requested locale so the engine can record fallback metadata", async () => {
    const { runtime } = createResolverRuntime({ userId: USER_ID, locale: "nl-NL" });
    const inherited = await resolveBusinessActivityContext(BASE, runtime);
    expect(inherited.ok).toBe(true);
    if (!inherited.ok) return;
    expect(inherited.value.resolution).toMatchObject({
      requestedLocale: "nl-NL",
      resolvedLocale: "en",
      fallbackUsed: true,
    });

    const explicit = await resolveBusinessActivityContext(
      { ...BASE, locale: "en" },
      runtime,
    );
    expect(explicit.ok).toBe(true);
    if (!explicit.ok) return;
    expect(explicit.value.resolution).toMatchObject({
      requestedLocale: "en",
      resolvedLocale: "en",
      fallbackUsed: false,
    });
  });

  it("does not treat membership as entitlement and does not invent Social execution", async () => {
    const { runtime } = createResolverRuntime({ userId: USER_ID });
    const result = await resolveBusinessActivityContext(BASE, runtime);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toHaveProperty("enabledCapabilities");
    expect(result.value).not.toHaveProperty("permissions");
    expect(
      result.value.relevantCapabilities
        .filter((item) => item.capabilityKey.startsWith("horizontal.social."))
        .every((item) => item.effectiveRelevance === "optional"),
    ).toBe(true);
    expect(KNOWLEDGE_VERSION_ID).toBe("ver-knowledge-1");
  });
});
