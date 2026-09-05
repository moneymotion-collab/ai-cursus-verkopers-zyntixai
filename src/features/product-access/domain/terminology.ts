import type { EffectiveTerminology } from "@/features/context-resolver/domain/types";

/**
 * Smallest reusable target terminology interface for shared product UI.
 * Only concepts required by the BETA1-4TG-SCOPE-FREEZE terminology decision
 * (Terminology Mode B) are represented here. New fields must correspond to
 * an already-seeded CTX terminology term key and an implemented shared
 * module — do not add speculative terms for unimplemented modules.
 */
export type ProductTerminology = {
  customer: {
    singular: string;
    plural: string;
  };
  project: {
    singular: string;
    plural: string;
  };
};

const CUSTOMER_TERM_KEY = "customer";
const PROJECT_TERM_KEY = "project";

/**
 * System/default generic wording. Used when context is unresolved or a
 * pack does not define the term. This is Core shared language (the same
 * wording Knowledge/TG1 already uses) — not a Course Seller-specific
 * fallback, and not exposed for modules that are not visible.
 */
export const DEFAULT_PRODUCT_TERMINOLOGY: ProductTerminology = {
  customer: { singular: "Customer", plural: "Customers" },
  project: { singular: "Project", plural: "Projects" },
};

/**
 * Projects resolver-authoritative EffectiveTerminology rows into the sanitized
 * ProductTerminology view model consumed by product UI. Pure and side-effect
 * free; does not read raw resolver internals beyond termKey/labels, and does
 * not affect access/security decisions.
 */
export function projectProductTerminology(
  terms: readonly EffectiveTerminology[] | null,
): ProductTerminology {
  const customerTerm = terms?.find((term) => term.termKey === CUSTOMER_TERM_KEY);
  const projectTerm = terms?.find((term) => term.termKey === PROJECT_TERM_KEY);

  return {
    customer: customerTerm
      ? {
          singular: customerTerm.singularLabel,
          plural: customerTerm.pluralLabel,
        }
      : DEFAULT_PRODUCT_TERMINOLOGY.customer,
    project: projectTerm
      ? {
          singular: projectTerm.singularLabel,
          plural: projectTerm.pluralLabel,
        }
      : DEFAULT_PRODUCT_TERMINOLOGY.project,
  };
}
