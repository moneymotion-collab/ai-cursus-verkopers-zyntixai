import { describe, expect, it } from "vitest";
import { assertCapabilityDependencyCoherence } from "@/features/context-resolver/domain/capability-resolution";
import { resolveEffectiveContext } from "@/features/context-resolver/domain/context-resolution";
import {
  CAP_EDGES,
  CORE_KEYS,
  KNOWLEDGE_REQUIRED,
  NICHE_MAPPINGS,
  OCB_V1,
  capabilityDefs,
  capabilityReadiness,
  qaSemanticInput,
} from "./fixture";

function withoutReadiness(capabilityKey: string) {
  return capabilityReadiness().filter((row) => row.capabilityKey !== capabilityKey);
}

function withReadiness(
  capabilityKey: string,
  readinessStatus: "planned" | "context_ready" | "production_verified",
) {
  return capabilityReadiness().map((row) =>
    row.capabilityKey === capabilityKey ? { ...row, readinessStatus } : row,
  );
}

describe("capability relevance / readiness separation", () => {
  it("attaches explicit production_verified readiness on a mapped capability", () => {
    const result = resolveEffectiveContext(
      qaSemanticInput({
        capabilityReadiness: withReadiness("shared.crm.leads", "production_verified"),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relevantCapabilities.find((item) => item.capabilityKey === "shared.crm.leads")).toMatchObject({
      readinessStatus: "production_verified",
      supportedScope: null,
    });
  });

  it("attaches explicit planned readiness without collapsing it to missing", () => {
    const result = resolveEffectiveContext(
      qaSemanticInput({
        capabilityReadiness: withReadiness("shared.crm.leads", "planned"),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relevantCapabilities.find((item) => item.capabilityKey === "shared.crm.leads")).toMatchObject({
      readinessStatus: "planned",
    });
  });

  it("resolves a mapped capability with no readiness row as readinessStatus null", () => {
    const result = resolveEffectiveContext(
      qaSemanticInput({
        capabilityReadiness: withoutReadiness("shared.crm.leads"),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relevantCapabilities.find((item) => item.capabilityKey === "shared.crm.leads")).toMatchObject({
      effectiveRelevance: "recommended",
      readinessStatus: null,
      supportedScope: null,
    });
    expect(result.value.relevantCapabilities).toHaveLength(
      CORE_KEYS.length + KNOWLEDGE_REQUIRED.length + NICHE_MAPPINGS.length,
    );
  });

  it("keeps Core baseline required with readinessStatus null when no Core readiness row exists", () => {
    const result = resolveEffectiveContext(
      qaSemanticInput({
        capabilityReadiness: withoutReadiness("core.tasks"),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relevantCapabilities.find((item) => item.capabilityKey === "core.tasks")).toMatchObject({
      effectiveRelevance: "required",
      provenance: { sourceKind: "system_baseline" },
      readinessStatus: null,
    });
  });

  it("passes dependency coherence when a present hard dependency has no readiness row", () => {
    const result = resolveEffectiveContext(
      qaSemanticInput({
        capabilityReadiness: withoutReadiness("knowledge.programs"),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.value.relevantCapabilities.find((item) => item.capabilityKey === "knowledge.programs"),
    ).toMatchObject({ readinessStatus: null });
    expect(
      result.value.relevantCapabilities.find((item) => item.capabilityKey === "knowledge.enrollments"),
    ).toMatchObject({ effectiveRelevance: "required" });
    expect(
      assertCapabilityDependencyCoherence({
        capabilities: result.value.relevantCapabilities,
        dependencies: CAP_EDGES,
      }),
    ).toMatchObject({ ok: true });
  });

  it("still fails when a mapped capability definition is missing", () => {
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          capabilities: capabilityDefs().filter((item) => item.capabilityKey !== "shared.crm.leads"),
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CAPABILITY_NOT_FOUND" } });
  });

  it("still fails when a mapped capability is draft", () => {
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          capabilities: capabilityDefs().map((item) =>
            item.capabilityKey === "shared.crm.leads"
              ? { ...item, lifecycleStatus: "draft" as const }
              : item,
          ),
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CATALOG_INTEGRITY_ERROR" } });
  });

  it("still fails Context leaf readiness missing or planned for internal_qa", () => {
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          contextReadiness: [{ versionId: OCB_V1.id, readinessStatus: "planned" }],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_NOT_RESOLVABLE_FOR_MODE" } });
    expect(
      resolveEffectiveContext(
        qaSemanticInput({
          contextReadiness: [],
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: "CONTEXT_NOT_RESOLVABLE_FOR_MODE" } });
  });

  it("keeps the QA semantic fixture at 13 capabilities with canonical readiness rows", () => {
    const result = resolveEffectiveContext(qaSemanticInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.relevantCapabilities).toHaveLength(13);
    expect(result.value.terminology).toHaveLength(4);
    expect(
      result.value.relevantCapabilities.every((item) => item.readinessStatus === "context_ready"),
    ).toBe(true);
  });
});
