import { describe, expect, it } from "vitest";
import { computeCapabilityClosure } from "@/features/control-plane/domain/capability-closure";
import { CapabilitiesRepository } from "@/features/control-plane/server/capabilities.repository";
import { createControlPlaneMemoryClient } from "./memory-query-client";

const CAPS = [
  capability("core.tasks", "core", "platform", "listed"),
  capability("knowledge.programs", "foundation", "knowledge", "listed"),
  capability("knowledge.enrollments", "foundation", "knowledge", "listed"),
  capability("knowledge.progress", "foundation", "knowledge", "listed"),
  capability("shared.crm.customers", "shared", "crm", "listed"),
  capability("horizontal.social.content", "horizontal", "social", "listed"),
  capability("horizontal.social.connection", "horizontal", "social", "listed"),
  capability("horizontal.social.publishing", "horizontal", "social", "listed"),
  capability("internal.hidden", "core", "platform", "internal"),
];

function capability(
  capability_key: string,
  owner_class: string,
  owner_key: string,
  catalog_visibility: string,
) {
  return {
    id: `id-${capability_key}`,
    capability_key,
    label: capability_key,
    description: capability_key,
    owner_class,
    owner_key,
    foundation_id: owner_class === "foundation" ? "tax-foundation-knowledge" : null,
    lifecycle_status: "active",
    catalog_visibility,
    superseded_by_capability_id: null,
  };
}

const EDGES = [
  {
    capability_id: "id-knowledge.enrollments",
    depends_on_capability_id: "id-knowledge.programs",
  },
  {
    capability_id: "id-knowledge.enrollments",
    depends_on_capability_id: "id-shared.crm.customers",
  },
  {
    capability_id: "id-knowledge.progress",
    depends_on_capability_id: "id-knowledge.enrollments",
  },
  {
    capability_id: "id-horizontal.social.publishing",
    depends_on_capability_id: "id-horizontal.social.connection",
  },
  {
    capability_id: "id-horizontal.social.publishing",
    depends_on_capability_id: "id-horizontal.social.content",
  },
];

function repo() {
  return new CapabilitiesRepository(
    createControlPlaneMemoryClient({
      capabilities: CAPS,
      capability_dependencies: EDGES,
      capability_readiness: CAPS.map((cap) => ({
        id: `ready-${cap.id}`,
        capability_id: cap.id,
        readiness_status: "production_verified",
        supported_scope: { journey: "closed-beta-course-sellers" },
        evidence_phase: "CAP-1B",
        verified_at: "2026-08-24T00:00:00Z",
      })),
    }),
  );
}

describe("CapabilitiesRepository", () => {
  it("finds a capability by key and returns NOT_FOUND when missing", async () => {
    const found = await repo().findByKey("knowledge.progress");
    const missing = await repo().findByKey("missing.capability");
    expect(found).toMatchObject({
      ok: true,
      value: { capabilityKey: "knowledge.progress" },
    });
    expect(missing).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("batches listByKeys and reports missing expected keys", async () => {
    const complete = await repo().listByKeys([
      "knowledge.progress",
      "knowledge.programs",
    ]);
    expect(complete.ok).toBe(true);
    if (complete.ok) {
      expect(complete.value.map((item) => item.capabilityKey)).toEqual([
        "knowledge.progress",
        "knowledge.programs",
      ]);
    }
    const missing = await repo().listByKeys(["knowledge.progress", "missing.one"]);
    expect(missing).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("defaults catalog listing to active listed and supports includeInternal", async () => {
    const listed = await repo().listCatalog();
    const allActive = await repo().listCatalog({ includeInternal: true });
    expect(listed.ok && allActive.ok).toBe(true);
    if (!listed.ok || !allActive.ok) {
      return;
    }
    expect(listed.value.some((item) => item.capabilityKey === "internal.hidden")).toBe(
      false,
    );
    expect(
      allActive.value.some((item) => item.capabilityKey === "internal.hidden"),
    ).toBe(true);
  });

  it("maps readiness as data, not entitlement", async () => {
    const readiness = await repo().getReadiness("knowledge.progress");
    expect(readiness).toMatchObject({
      ok: true,
      value: {
        capabilityKey: "knowledge.progress",
        readinessStatus: "production_verified",
      },
    });
    expect(JSON.stringify(readiness)).not.toMatch(/isCapabilityEnabled|entitlement/);
  });

  it("returns canonical direct dependency rows", async () => {
    const edges = await repo().getDirectDependencies(["knowledge.progress"]);
    expect(edges.ok).toBe(true);
    if (!edges.ok) {
      return;
    }
    expect(edges.value).toEqual([
      {
        capabilityId: "id-knowledge.progress",
        capabilityKey: "knowledge.progress",
        dependsOnCapabilityId: "id-knowledge.enrollments",
        dependsOnCapabilityKey: "knowledge.enrollments",
      },
    ]);
  });
});

describe("computeCapabilityClosure", () => {
  const edges = [
    {
      capabilityKey: "knowledge.enrollments",
      dependsOnCapabilityKey: "knowledge.programs",
    },
    {
      capabilityKey: "knowledge.enrollments",
      dependsOnCapabilityKey: "shared.crm.customers",
    },
    {
      capabilityKey: "knowledge.progress",
      dependsOnCapabilityKey: "knowledge.enrollments",
    },
    {
      capabilityKey: "horizontal.social.publishing",
      dependsOnCapabilityKey: "horizontal.social.connection",
    },
    {
      capabilityKey: "horizontal.social.publishing",
      dependsOnCapabilityKey: "horizontal.social.content",
    },
  ];

  it("computes the progress transitive closure", () => {
    const result = computeCapabilityClosure(["knowledge.progress"], edges);
    expect(result).toEqual({
      ok: true,
      value: {
        seedKeys: ["knowledge.progress"],
        closedKeys: [
          "knowledge.enrollments",
          "knowledge.programs",
          "knowledge.progress",
          "shared.crm.customers",
        ],
      },
    });
  });

  it("computes the enrollment closure", () => {
    const result = computeCapabilityClosure(["knowledge.enrollments"], edges);
    expect(result.ok && result.value.closedKeys).toEqual([
      "knowledge.enrollments",
      "knowledge.programs",
      "shared.crm.customers",
    ]);
  });

  it("computes the Social publishing closure", () => {
    const result = computeCapabilityClosure(
      ["horizontal.social.publishing"],
      edges,
    );
    expect(result.ok && result.value.closedKeys).toEqual([
      "horizontal.social.connection",
      "horizontal.social.content",
      "horizontal.social.publishing",
    ]);
  });

  it("returns only the seed when there are zero edges", () => {
    const result = computeCapabilityClosure(["core.tasks"], []);
    expect(result).toEqual({
      ok: true,
      value: { seedKeys: ["core.tasks"], closedKeys: ["core.tasks"] },
    });
  });

  it("deduplicates duplicate edges", () => {
    const result = computeCapabilityClosure(
      ["knowledge.progress"],
      [...edges, edges[2]],
    );
    expect(result.ok && result.value.closedKeys).toEqual([
      "knowledge.enrollments",
      "knowledge.programs",
      "knowledge.progress",
      "shared.crm.customers",
    ]);
  });

  it("detects cycles as catalog integrity errors", () => {
    const result = computeCapabilityClosure(["a"], [
      { capabilityKey: "a", dependsOnCapabilityKey: "b" },
      { capabilityKey: "b", dependsOnCapabilityKey: "a" },
    ]);
    expect(result).toMatchObject({
      ok: false,
      error: { code: "CATALOG_INTEGRITY_ERROR" },
    });
  });
});
