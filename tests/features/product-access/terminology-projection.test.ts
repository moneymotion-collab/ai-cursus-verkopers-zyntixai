import { describe, expect, it } from "vitest";
import { resolveEffectiveContext } from "@/features/context-resolver/domain/context-resolution";
import type {
  ContextResolutionInput,
  ResolverContextMapping,
  ResolverContextPack,
  ResolverContextVersion,
  ResolverTerminologyRow,
} from "@/features/context-resolver/domain/types";
import {
  DEFAULT_PRODUCT_TERMINOLOGY,
  projectProductTerminology,
} from "@/features/product-access/domain/terminology";
import {
  CAP_EDGES,
  CORE_KEYS,
  capabilityDefs,
  capabilityReadiness,
  qaSemanticInput,
  taxNode,
} from "../context-resolver/fixture";

/**
 * Mirrors the BETA1-4TG-CONTEXT-PACKS seed contract term keys/labels exactly
 * (see tests/security/beta1-4tg-context-packs-seed-contract.test.ts and
 * supabase/migrations/20260901100010_seed_context_pack_registry_4tg_ctx2.sql).
 */
const SERVICE_TERMS = [
  ["customer", "Client", "Clients"],
  ["project", "Project", "Projects"],
] as const;
const FIELD_TERMS = [
  ["customer", "Customer", "Customers"],
  ["project", "Job", "Jobs"],
  ["site", "Site", "Sites"],
  ["work_order", "Work order", "Work orders"],
  ["technician", "Technician", "Technicians"],
] as const;
const PRODUCT_TERMS = [["customer", "Customer", "Customers"]] as const;

function pack(packKey: string, foundationKey: string, packId: string): ResolverContextPack {
  return {
    id: packId,
    packKey,
    packKind: "foundation",
    defaultLocale: "en",
    target: { kind: "foundation", id: `tax-${foundationKey}` },
    targetKey: foundationKey,
  };
}

function version(packId: string, versionId: string): ResolverContextVersion {
  return {
    id: versionId,
    packId,
    versionNumber: 1,
    publicationStatus: "published",
    parentVersionId: null,
  };
}

function terms(
  versionId: string,
  entries: readonly (readonly [string, string, string])[],
): ResolverTerminologyRow[] {
  return entries.map(([termKey, singularLabel, pluralLabel]) => ({
    versionId,
    locale: "en",
    termKey,
    singularLabel,
    pluralLabel,
    shortLabel: null,
    helpText: null,
  }));
}

function foundationInput(input: {
  foundationKey: string;
  packKey: string;
  packId: string;
  versionId: string;
  requiredMapping: string;
  terminology: readonly (readonly [string, string, string])[];
}): ContextResolutionInput {
  const foundationNode = taxNode("foundation", input.foundationKey, `tax-${input.foundationKey}`);
  const packRef = pack(input.packKey, input.foundationKey, input.packId);
  const versionRef = version(input.packId, input.versionId);
  const mappings: ResolverContextMapping[] = [
    {
      versionId: input.versionId,
      capabilityKey: input.requiredMapping,
      mappingOp: "set",
      relevance: "required",
    },
  ];
  const allCapKeys = [...CORE_KEYS, input.requiredMapping];
  return {
    organization: { id: "org-terminology-qa" },
    activity: {
      id: "activity-terminology-qa",
      activityKey: "qa_terminology",
      displayName: "Terminology QA",
      status: "active",
      isPrimary: true,
      classification: {
        kind: "foundation",
        targetId: foundationNode.id,
        targetKey: foundationNode.key,
      },
    },
    leafVersionId: input.versionId,
    packs: [packRef],
    versions: [versionRef],
    mappings,
    terminology: terms(input.versionId, input.terminology),
    contextReadiness: [{ versionId: input.versionId, readinessStatus: "context_ready" }],
    taxonomyPath: {
      foundation: foundationNode,
      industry: null,
      niche: null,
      specialization: null,
      deepSpecialization: null,
    },
    capabilities: capabilityDefs(allCapKeys),
    dependencies: CAP_EDGES,
    capabilityReadiness: capabilityReadiness(allCapKeys),
    requestedLocale: "en",
    mode: "internal_qa",
  };
}

describe("projectProductTerminology", () => {
  it("returns the generic system default for null (unresolved) terminology", () => {
    expect(projectProductTerminology(null)).toEqual(DEFAULT_PRODUCT_TERMINOLOGY);
  });

  it("returns the generic system default for an empty terminology array", () => {
    expect(projectProductTerminology([])).toEqual(DEFAULT_PRODUCT_TERMINOLOGY);
  });

  it("falls back to generic defaults when product term keys are absent", () => {
    const result = resolveEffectiveContext(
      foundationInput({
        foundationKey: "no-terms",
        packKey: "foundation.no-terms",
        packId: "pack-no-terms",
        versionId: "ver-no-terms-1",
        requiredMapping: "shared.crm.customers",
        terminology: [],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(projectProductTerminology(result.value.terminology)).toEqual(
      DEFAULT_PRODUCT_TERMINOLOGY,
    );
  });

  it("projects Knowledge/OCB terminology as Customer/Customers (TG1 unchanged)", () => {
    const result = resolveEffectiveContext(qaSemanticInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(projectProductTerminology(result.value.terminology)).toEqual({
      ...DEFAULT_PRODUCT_TERMINOLOGY,
      customer: { singular: "Customer", plural: "Customers" },
      project: { singular: "Project", plural: "Projects" },
    });
  });

  it("projects Service terminology as Client/Clients and Project/Projects", () => {
    const result = resolveEffectiveContext(
      foundationInput({
        foundationKey: "service",
        packKey: "foundation.service",
        packId: "pack-service",
        versionId: "ver-service-1",
        requiredMapping: "shared.crm.customers",
        terminology: SERVICE_TERMS,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(projectProductTerminology(result.value.terminology)).toEqual({
      ...DEFAULT_PRODUCT_TERMINOLOGY,
      customer: { singular: "Client", plural: "Clients" },
      project: { singular: "Project", plural: "Projects" },
    });
  });

  it("projects Field terminology as Customer/Customers and Job/Jobs", () => {
    const result = resolveEffectiveContext(
      foundationInput({
        foundationKey: "field-operations",
        packKey: "foundation.field-operations",
        packId: "pack-field",
        versionId: "ver-field-1",
        requiredMapping: "shared.crm.customers",
        terminology: FIELD_TERMS,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(projectProductTerminology(result.value.terminology)).toEqual({
      ...DEFAULT_PRODUCT_TERMINOLOGY,
      customer: { singular: "Customer", plural: "Customers" },
      project: { singular: "Job", plural: "Jobs" },
    });
  });

  it("preserves Product customer terms and falls back to generic Projects", () => {
    const result = resolveEffectiveContext(
      foundationInput({
        foundationKey: "product-operations",
        packKey: "foundation.product-operations",
        packId: "pack-product",
        versionId: "ver-product-1",
        requiredMapping: "shared.crm.customers",
        terminology: PRODUCT_TERMS,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(projectProductTerminology(result.value.terminology)).toEqual({
      ...DEFAULT_PRODUCT_TERMINOLOGY,
      customer: { singular: "Customer", plural: "Customers" },
      project: { singular: "Project", plural: "Projects" },
    });
  });
});
