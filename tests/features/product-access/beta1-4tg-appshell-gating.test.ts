import { describe, expect, it } from "vitest";
import { resolveEffectiveContext } from "@/features/context-resolver/domain/context-resolution";
import type { EffectiveCapability } from "@/features/context-resolver/domain/types";
import {
  buildModuleNavVisibility,
  buildResolvedProductModuleAccess,
  buildUnresolvedProductModuleAccess,
  canAccessModule,
  FAIL_CLOSED_MODULE_NAV_VISIBILITY,
} from "@/features/product-access/domain/module-access";
import { PRODUCT_MODULE_DEFINITIONS } from "@/features/product-access/domain/module-registry";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import {
  CORE_KEYS,
  KNOWLEDGE_NODE,
  OCB_PATH,
  qaSemanticInput,
} from "../context-resolver/fixture";

function effectiveCapability(
  capabilityKey: string,
  relevance: EffectiveCapability["effectiveRelevance"],
): EffectiveCapability {
  return {
    capabilityKey,
    effectiveRelevance: relevance,
    provenance: {
      sourceKind: "context_mapping",
      sourceContextPackKey: "test.pack",
      sourceVersionNumber: 1,
      establishedBy: "set",
    },
    lifecycleStatus: "active",
    readinessStatus: "context_ready",
    supportedScope: null,
  };
}

function capabilitiesFromKeys(
  entries: readonly (readonly [string, EffectiveCapability["effectiveRelevance"]])[],
): readonly EffectiveCapability[] {
  return entries.map(([capabilityKey, effectiveRelevance]) =>
    effectiveCapability(capabilityKey, effectiveRelevance),
  );
}

function expectProjectsAccess(
  capabilities: readonly EffectiveCapability[],
  allowed: boolean,
): void {
  const access = buildResolvedProductModuleAccess(capabilities);
  expect(access.navVisibility.projects).toBe(allowed);
  expect(
    evaluateProductModuleRouteAccess({ moduleId: "projects", access }).allowed,
  ).toBe(allowed);
  expect(canAccessModule({ moduleId: "projects", access })).toBe(allowed);
}

describe("BETA1-4TG AppShell module access", () => {
  it("registers shared Projects without registering unimplemented future modules", () => {
    const moduleKeys = PRODUCT_MODULE_DEFINITIONS.map((row) => row.id);
    expect(moduleKeys).toContain("projects");
    expect(moduleKeys).not.toContain("products");
    expect(moduleKeys).not.toContain("orders");
    expect(moduleKeys).not.toContain("work-orders");
  });

  it("fail-closes unresolved context without Course Seller fallback", () => {
    const unresolved = buildUnresolvedProductModuleAccess();
    expect(unresolved.navVisibility).toEqual(FAIL_CLOSED_MODULE_NAV_VISIBILITY);
    expect(unresolved.navVisibility.programs).toBe(false);
    expect(unresolved.navVisibility.leads).toBe(false);
    expect(unresolved.navVisibility.customers).toBe(false);
    expect(unresolved.navVisibility.projects).toBe(false);
    expect(
      evaluateProductModuleRouteAccess({ moduleId: "projects", access: unresolved }).allowed,
    ).toBe(false);
    expect(canAccessModule({ moduleId: "projects", access: unresolved })).toBe(false);
  });

  describe("TG1 / Knowledge OCB", () => {
    it("preserves Course Seller navigation modules", () => {
      const resolved = resolveEffectiveContext(qaSemanticInput());
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) {
        throw new Error("Expected OCB context");
      }
      const nav = buildModuleNavVisibility(resolved.value.relevantCapabilities);
      expect(nav.home).toBe(true);
      expect(nav.leads).toBe(true);
      expect(nav.customers).toBe(true);
      expect(nav.programs).toBe(true);
      expect(nav.enrollments).toBe(true);
      expect(nav.progress).toBe(true);
      expect(nav.tasks).toBe(true);
      expect(nav.attention).toBe(true);
      expect(nav.members).toBe(true);
      expectProjectsAccess(resolved.value.relevantCapabilities, false);
    });
  });

  describe("TG2 / Service", () => {
    it("shows and allows shared Projects while hiding Knowledge-only modules", () => {
      const capabilities = capabilitiesFromKeys([
        ...CORE_KEYS.map((key) => [key, "required"] as const),
        ["shared.crm.customers", "required"],
        ["shared.crm.leads", "required"],
        ["shared.projects", "required"],
      ]);
      const nav = buildModuleNavVisibility(capabilities);
      expect(nav.customers).toBe(true);
      expect(nav.leads).toBe(true);
      expect(nav.tasks).toBe(true);
      expect(nav.attention).toBe(true);
      expect(nav.members).toBe(true);
      expect(nav.programs).toBe(false);
      expect(nav.enrollments).toBe(false);
      expect(nav.progress).toBe(false);
      expectProjectsAccess(capabilities, true);
    });
  });

  describe("TG3 / Field", () => {
    it("shows and allows shared Projects while hiding Knowledge modules", () => {
      const capabilities = capabilitiesFromKeys([
        ...CORE_KEYS.map((key) => [key, "required"] as const),
        ["shared.crm.customers", "required"],
        ["shared.crm.leads", "recommended"],
        ["shared.projects", "required"],
        ["field.locations", "required"],
        ["field.work-orders", "required"],
        ["field.dispatch", "required"],
      ]);
      const nav = buildModuleNavVisibility(capabilities);
      expect(nav.leads).toBe(true);
      expect(nav.customers).toBe(true);
      expect(nav.programs).toBe(false);
      expect(nav.enrollments).toBe(false);
      expect(nav.progress).toBe(false);
      expectProjectsAccess(capabilities, true);
    });
  });

  describe("TG4 / Product", () => {
    it("hides and denies Projects and Knowledge modules", () => {
      const capabilities = capabilitiesFromKeys([
        ...CORE_KEYS.map((key) => [key, "required"] as const),
        ["shared.crm.customers", "required"],
        ["product.products", "required"],
        ["product.orders", "required"],
        ["product.inventory", "required"],
        ["product.fulfillment", "required"],
      ]);
      const nav = buildModuleNavVisibility(capabilities);
      expect(nav.customers).toBe(true);
      expect(nav.leads).toBe(false);
      expect(nav.programs).toBe(false);
      expect(nav.enrollments).toBe(false);
      expect(nav.progress).toBe(false);
      expectProjectsAccess(capabilities, false);
    });
  });

  describe("route bypass protection", () => {
    it("denies Programs route for Service context", () => {
      const capabilities = capabilitiesFromKeys([
        ...CORE_KEYS.map((key) => [key, "required"] as const),
        ["shared.crm.customers", "required"],
        ["shared.crm.leads", "required"],
        ["shared.projects", "required"],
      ]);
      const access = {
        resolution: "resolved" as const,
        navVisibility: buildModuleNavVisibility(capabilities),
        relevantCapabilities: capabilities,
        terminology: DEFAULT_PRODUCT_TERMINOLOGY,
      };
      expect(
        evaluateProductModuleRouteAccess({ moduleId: "programs", access }).allowed,
      ).toBe(false);
      expect(canAccessModule({ moduleId: "programs", access })).toBe(false);
    });

    it("denies Enrollments and Progress for Field context", () => {
      const capabilities = capabilitiesFromKeys([
        ...CORE_KEYS.map((key) => [key, "required"] as const),
        ["shared.crm.customers", "required"],
        ["shared.projects", "required"],
        ["field.locations", "required"],
        ["field.work-orders", "required"],
        ["field.dispatch", "required"],
      ]);
      const access = {
        resolution: "resolved" as const,
        navVisibility: buildModuleNavVisibility(capabilities),
        relevantCapabilities: capabilities,
        terminology: DEFAULT_PRODUCT_TERMINOLOGY,
      };
      expect(
        evaluateProductModuleRouteAccess({ moduleId: "enrollments", access }).allowed,
      ).toBe(false);
      expect(
        evaluateProductModuleRouteAccess({ moduleId: "progress", access }).allowed,
      ).toBe(false);
    });
  });

  describe("resolver integration", () => {
    it("resolves Knowledge OCB context through the authoritative resolver input", () => {
      const resolved = resolveEffectiveContext(qaSemanticInput());
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) {
        return;
      }
      expect(resolved.value.context.packKey).toBe("niche.online-course-business");
      expect(resolved.value.taxonomy.canonicalPath.foundation.id).toBe(KNOWLEDGE_NODE.id);
      expect(resolved.value.taxonomy.canonicalPath).toEqual(OCB_PATH);
    });
  });
});
