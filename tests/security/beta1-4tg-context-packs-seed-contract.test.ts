import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
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
  CAP_EDGES,
  CORE_KEYS,
  capabilityDefs,
  capabilityReadiness,
  taxNode,
} from "../features/context-resolver/fixture";

const CAP1_SEED = "20260824180010_seed_capability_registry_cap1.sql";
const CAP4TG_SEED = "20260901100000_seed_capability_registry_4tg_cap2.sql";
const CTX1_SEED = "20260824190010_seed_context_pack_registry_ctx1.sql";
const CTX4TG_SEED = "20260901100010_seed_context_pack_registry_4tg_ctx2.sql";

const cap1Seed = readFileSync(join(process.cwd(), "supabase/migrations", CAP1_SEED), "utf8");
const cap4tgSeed = readFileSync(join(process.cwd(), "supabase/migrations", CAP4TG_SEED), "utf8");
const ctx1Seed = readFileSync(join(process.cwd(), "supabase/migrations", CTX1_SEED), "utf8");
const ctx4tgSeed = readFileSync(join(process.cwd(), "supabase/migrations", CTX4TG_SEED), "utf8");

const FROZEN_4TG_CAPABILITY_KEYS = [
  "shared.projects",
  "field.locations",
  "field.work-orders",
  "field.dispatch",
  "product.products",
  "product.orders",
  "product.inventory",
  "product.fulfillment",
] as const;

const FOUNDATION_PACKS = [
  "foundation.service",
  "foundation.field-operations",
  "foundation.product-operations",
] as const;

const SERVICE_REQUIRED = [
  "shared.crm.customers",
  "shared.crm.leads",
  "shared.projects",
] as const;

const FIELD_REQUIRED = [
  "shared.crm.customers",
  "shared.projects",
  "field.locations",
  "field.work-orders",
  "field.dispatch",
] as const;

const FIELD_RECOMMENDED = ["shared.crm.leads"] as const;

const PRODUCT_REQUIRED = [
  "shared.crm.customers",
  "product.products",
  "product.orders",
  "product.inventory",
  "product.fulfillment",
] as const;

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

const PRODUCT_TERMS = [
  ["customer", "Customer", "Customers"],
  ["product", "Product", "Products"],
  ["order", "Order", "Orders"],
  ["inventory", "Inventory", "Inventory"],
  ["fulfillment", "Fulfillment", "Fulfillment"],
] as const;

const ALL_CAP_KEYS = [
  ...CORE_KEYS,
  "shared.crm.leads",
  "shared.crm.customers",
  "knowledge.programs",
  "knowledge.enrollments",
  "knowledge.progress",
  "horizontal.social.connection",
  "horizontal.social.content",
  "horizontal.social.approval",
  "horizontal.social.scheduling",
  "horizontal.social.publishing",
  ...FROZEN_4TG_CAPABILITY_KEYS,
];

function pack(
  packKey: string,
  foundationKey: string,
  packId: string,
): ResolverContextPack {
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

function mappings(
  versionId: string,
  entries: readonly (readonly [string, "required" | "recommended" | "optional"])[],
): ResolverContextMapping[] {
  return entries.map(([capabilityKey, relevance]) => ({
    versionId,
    capabilityKey,
    mappingOp: "set" as const,
    relevance,
  }));
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
  requiredMappings: readonly (readonly [string, "required" | "recommended" | "optional"])[];
  terminology: readonly (readonly [string, string, string])[];
}): ContextResolutionInput {
  const foundationNode = taxNode("foundation", input.foundationKey, `tax-${input.foundationKey}`);
  const packRef = pack(input.packKey, input.foundationKey, input.packId);
  const versionRef = version(input.packId, input.versionId);
  return {
    organization: { id: "org-4tg" },
    activity: {
      id: "activity-4tg",
      activityKey: "qa_4tg",
      displayName: "4TG QA",
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
    mappings: mappings(input.versionId, input.requiredMappings),
    terminology: terms(input.versionId, input.terminology),
    contextReadiness: [{ versionId: input.versionId, readinessStatus: "context_ready" }],
    taxonomyPath: {
      foundation: foundationNode,
      industry: null,
      niche: null,
      specialization: null,
      deepSpecialization: null,
    },
    capabilities: capabilityDefs(ALL_CAP_KEYS),
    dependencies: [
      ...CAP_EDGES,
      { capabilityKey: "shared.projects", dependsOnCapabilityKey: "shared.crm.customers" },
      { capabilityKey: "field.work-orders", dependsOnCapabilityKey: "shared.projects" },
      { capabilityKey: "field.work-orders", dependsOnCapabilityKey: "field.locations" },
      { capabilityKey: "field.dispatch", dependsOnCapabilityKey: "field.work-orders" },
      { capabilityKey: "product.orders", dependsOnCapabilityKey: "shared.crm.customers" },
      { capabilityKey: "product.orders", dependsOnCapabilityKey: "product.products" },
      { capabilityKey: "product.fulfillment", dependsOnCapabilityKey: "product.orders" },
      { capabilityKey: "product.inventory", dependsOnCapabilityKey: "product.products" },
    ],
    capabilityReadiness: capabilityReadiness(ALL_CAP_KEYS),
    requestedLocale: "en",
    mode: "internal_qa",
  };
}

describe("BETA1-4TG CAP additive seed contract", () => {
  it("registers the additive migration after frozen CAP-1 without rewriting CAP-1", () => {
    const capability = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("capability"))
      .sort();
    expect(capability[0]).toBe("20260824180000_create_capability_registry.sql");
    expect(capability[1]).toBe(CAP1_SEED);
    expect(capability[2]).toBe(CAP4TG_SEED);
    expect(cap1Seed).toContain("n_capabilities <> 13");
    expect(cap4tgSeed).toContain("CAP-1 capability inventory drift");
    expect(cap4tgSeed).not.toContain("update public.capabilities");
    expect(cap4tgSeed).not.toContain("delete from public.capabilities");
  });

  it("seeds exactly eight frozen capability keys once each", () => {
    expect(FROZEN_4TG_CAPABILITY_KEYS).toHaveLength(8);
    for (const key of FROZEN_4TG_CAPABILITY_KEYS) {
      expect(cap4tgSeed).toContain(`'${key}'`);
    }
    expect(cap4tgSeed).toContain("expected 8 new capabilities");
    expect(cap4tgSeed).toContain("expected 21 total capabilities");
  });

  it("keeps new capabilities context_ready and not production_verified or beta_supported", () => {
    expect(cap4tgSeed).toContain("'context_ready'");
    expect(cap4tgSeed).toContain("'BETA1-4TG-CONTEXT-PACKS'");
    expect(cap4tgSeed).toContain("new capabilities must not be beta_supported");
    expect(cap4tgSeed).toContain("new capabilities must not be production_verified");
    expect(cap4tgSeed).toContain("expected 8 context_ready readiness rows");
  });
});

describe("BETA1-4TG CTX additive seed contract", () => {
  it("registers the additive migration after frozen CTX-1 without rewriting CTX-1", () => {
    const context = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter((name) => name.includes("context_pack") || name.includes("context-pack"))
      .sort();
    expect(context[0]).toBe("20260824190000_create_context_pack_registry.sql");
    expect(context[1]).toBe(CTX1_SEED);
    expect(context.at(-1)).toBe(CTX4TG_SEED);
    expect(ctx1Seed).toContain("n_packs <> 2");
    expect(ctx4tgSeed).toContain("expected 5 context_packs");
    expect(ctx4tgSeed).not.toContain("update public.context_packs");
    expect(ctx4tgSeed).not.toContain("foundation.knowledge");
    expect(ctx4tgSeed).not.toContain("niche.online-course-business");
  });

  it("seeds three foundation packs at context_ready without new niches", () => {
    for (const packKey of FOUNDATION_PACKS) {
      expect(ctx4tgSeed).toContain(`'${packKey}'`);
    }
    expect(ctx4tgSeed).toContain("expected exactly 1 niche pack");
    expect(ctx4tgSeed).toContain("new foundation packs must not be beta_supported");
    expect(ctx4tgSeed).not.toMatch(/'niche\.[^']+'/);
  });

  it("maps service, field, and product foundations to frozen capability sets", () => {
    for (const key of SERVICE_REQUIRED) {
      expect(ctx4tgSeed).toContain(`('${key}', 'required')`);
    }
    for (const key of FIELD_REQUIRED) {
      expect(ctx4tgSeed).toContain(`('${key}', 'required')`);
    }
    for (const key of FIELD_RECOMMENDED) {
      expect(ctx4tgSeed).toContain(`('${key}', 'recommended')`);
    }
    for (const key of PRODUCT_REQUIRED) {
      expect(ctx4tgSeed).toContain(`('${key}', 'required')`);
    }
    expect(ctx4tgSeed).toContain("product-operations must not map shared.projects");
    expect(ctx4tgSeed).toContain("'foundation.product-operations'");
  });

  it("seeds minimum terminology contracts for the three foundations", () => {
    for (const [termKey, singular, plural] of SERVICE_TERMS) {
      expect(ctx4tgSeed).toContain(`('${termKey}', '${singular}', '${plural}')`);
    }
    for (const [termKey, singular, plural] of FIELD_TERMS) {
      expect(ctx4tgSeed).toContain(`('${termKey}', '${singular}', '${plural}')`);
    }
    for (const [termKey, singular, plural] of PRODUCT_TERMS) {
      expect(ctx4tgSeed).toContain(`('${termKey}', '${singular}', '${plural}')`);
    }
    expect(ctx4tgSeed).toContain("expected 16 context_terminology rows");
  });
});

describe("BETA1-4TG resolver resolvability", () => {
  it("resolves service foundation with Client terminology and projects capability", () => {
    const result = resolveEffectiveContext(
      foundationInput({
        foundationKey: "service",
        packKey: "foundation.service",
        packId: "pack-service",
        versionId: "ver-service-1",
        requiredMappings: SERVICE_REQUIRED.map((key) => [key, "required"] as const),
        terminology: SERVICE_TERMS,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.context.packKey).toBe("foundation.service");
    expect(result.value.context.readinessStatus).toBe("context_ready");
    expect(
      result.value.relevantCapabilities.some(
        (capability) => capability.capabilityKey === "shared.projects",
      ),
    ).toBe(true);
    expect(
      result.value.relevantCapabilities.some(
        (capability) => capability.capabilityKey === "knowledge.programs",
      ),
    ).toBe(false);
    expect(result.value.terminology.find((term) => term.termKey === "customer")?.singularLabel).toBe(
      "Client",
    );
  });

  it("resolves field-operations foundation with Job terminology and field capabilities", () => {
    const result = resolveEffectiveContext(
      foundationInput({
        foundationKey: "field-operations",
        packKey: "foundation.field-operations",
        packId: "pack-field",
        versionId: "ver-field-1",
        requiredMappings: [
          ...FIELD_REQUIRED.map((key) => [key, "required"] as const),
          ...FIELD_RECOMMENDED.map((key) => [key, "recommended"] as const),
        ],
        terminology: FIELD_TERMS,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.context.packKey).toBe("foundation.field-operations");
    expect(
      result.value.relevantCapabilities.some(
        (capability) => capability.capabilityKey === "field.dispatch",
      ),
    ).toBe(true);
    expect(result.value.terminology.find((term) => term.termKey === "project")?.pluralLabel).toBe(
      "Jobs",
    );
  });

  it("resolves product-operations foundation without projects capability", () => {
    const result = resolveEffectiveContext(
      foundationInput({
        foundationKey: "product-operations",
        packKey: "foundation.product-operations",
        packId: "pack-product",
        versionId: "ver-product-1",
        requiredMappings: PRODUCT_REQUIRED.map((key) => [key, "required"] as const),
        terminology: PRODUCT_TERMS,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.context.packKey).toBe("foundation.product-operations");
    expect(
      result.value.relevantCapabilities.some(
        (capability) => capability.capabilityKey === "product.fulfillment",
      ),
    ).toBe(true);
    expect(
      result.value.relevantCapabilities.some(
        (capability) => capability.capabilityKey === "shared.projects",
      ),
    ).toBe(false);
  });
});

describe("BETA1-4TG TG1 preservation", () => {
  it("leaves frozen CTX-1 Knowledge and OCB contracts untouched", () => {
    expect(ctx1Seed).toContain("n_packs <> 2");
    expect(ctx1Seed).toContain("n_mappings <> 10");
    expect(ctx1Seed).toContain("n_terms <> 4");
    expect(ctx4tgSeed).not.toContain("foundation.knowledge");
    expect(ctx4tgSeed).not.toContain("niche.online-course-business");
    expect(cap4tgSeed).toContain("CAP-1 capability inventory drift");
  });
});
