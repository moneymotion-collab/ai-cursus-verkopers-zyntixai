import type { EffectiveCapability } from "@/features/context-resolver/domain/types";

export type ProductModuleId =
  | "home"
  | "leads"
  | "customers"
  | "programs"
  | "enrollments"
  | "progress"
  | "attention"
  | "tasks"
  | "members";

export type ModuleNavVisibility = Record<ProductModuleId, boolean>;

export type ProductModuleAccessState =
  | {
      resolution: "resolved";
      navVisibility: ModuleNavVisibility;
      relevantCapabilities: readonly EffectiveCapability[];
    }
  | {
      resolution: "unresolved";
      navVisibility: ModuleNavVisibility;
      relevantCapabilities: null;
    };
