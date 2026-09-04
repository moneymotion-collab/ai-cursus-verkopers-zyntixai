import { ATTENTION_NAV_LABEL, ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import { ENROLLMENTS_NAV_LABEL, ENROLLMENTS_ROUTE } from "@/features/enrollments/domain/enrollments-navigation";
import { MEMBERS_NAV_LABEL, MEMBERS_ROUTE } from "@/features/invitations/domain/members-navigation";
import { PROGRESS_NAV_LABEL, PROGRESS_ROUTE } from "@/features/progress/domain/progress-navigation";
import { PROGRAMS_NAV_LABEL, PROGRAMS_ROUTE } from "@/features/programs/domain/programs-navigation";
import type { ContextRelevance } from "@/features/control-plane/domain/types";
import type { ProductModuleId } from "@/features/product-access/domain/types";

export type ProductModuleCapabilityRequirement = {
  capabilityKey: string;
  minRelevance: Extract<ContextRelevance, "required" | "recommended">;
};

export type ProductModuleDefinition = {
  id: ProductModuleId;
  route: string;
  label: string;
  implemented: true;
  capabilityRequirement: ProductModuleCapabilityRequirement | null;
};

export const PRODUCT_MODULE_DEFINITIONS: readonly ProductModuleDefinition[] = [
  {
    id: "home",
    route: "/home",
    label: "Home",
    implemented: true,
    capabilityRequirement: null,
  },
  {
    id: "leads",
    route: "/leads",
    label: "Leads",
    implemented: true,
    capabilityRequirement: {
      capabilityKey: "shared.crm.leads",
      minRelevance: "recommended",
    },
  },
  {
    id: "customers",
    route: "/customers",
    label: "Customers",
    implemented: true,
    capabilityRequirement: {
      capabilityKey: "shared.crm.customers",
      minRelevance: "required",
    },
  },
  {
    id: "programs",
    route: PROGRAMS_ROUTE,
    label: PROGRAMS_NAV_LABEL,
    implemented: true,
    capabilityRequirement: {
      capabilityKey: "knowledge.programs",
      minRelevance: "required",
    },
  },
  {
    id: "enrollments",
    route: ENROLLMENTS_ROUTE,
    label: ENROLLMENTS_NAV_LABEL,
    implemented: true,
    capabilityRequirement: {
      capabilityKey: "knowledge.enrollments",
      minRelevance: "required",
    },
  },
  {
    id: "progress",
    route: PROGRESS_ROUTE,
    label: PROGRESS_NAV_LABEL,
    implemented: true,
    capabilityRequirement: {
      capabilityKey: "knowledge.progress",
      minRelevance: "required",
    },
  },
  {
    id: "attention",
    route: ATTENTION_ROUTE,
    label: ATTENTION_NAV_LABEL,
    implemented: true,
    capabilityRequirement: {
      capabilityKey: "core.attention",
      minRelevance: "required",
    },
  },
  {
    id: "tasks",
    route: "/tasks",
    label: "Tasks",
    implemented: true,
    capabilityRequirement: {
      capabilityKey: "core.tasks",
      minRelevance: "required",
    },
  },
  {
    id: "members",
    route: MEMBERS_ROUTE,
    label: MEMBERS_NAV_LABEL,
    implemented: true,
    capabilityRequirement: {
      capabilityKey: "core.member-administration",
      minRelevance: "required",
    },
  },
] as const;

export const PRODUCT_MODULE_BY_ID: Readonly<Record<ProductModuleId, ProductModuleDefinition>> =
  Object.fromEntries(
    PRODUCT_MODULE_DEFINITIONS.map((definition) => [definition.id, definition]),
  ) as Record<ProductModuleId, ProductModuleDefinition>;

export const IMPLEMENTED_PRODUCT_MODULE_IDS = PRODUCT_MODULE_DEFINITIONS.map(
  (definition) => definition.id,
);
