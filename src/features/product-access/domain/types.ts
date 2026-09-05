import type { EffectiveCapability } from "@/features/context-resolver/domain/types";
import type { ProductTerminology } from "@/features/product-access/domain/terminology";

export type ProductModuleId =
  | "home"
  | "leads"
  | "customers"
  | "projects"
  | "sites"
  | "workOrders"
  | "dispatch"
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
      /** Sanitized display terminology resolved from the same effective context. Presentation only — never grants access. */
      terminology: ProductTerminology;
    }
  | {
      resolution: "unresolved";
      navVisibility: ModuleNavVisibility;
      relevantCapabilities: null;
      /** Generic system-default wording. Never a Course Seller fallback. */
      terminology: ProductTerminology;
    };
