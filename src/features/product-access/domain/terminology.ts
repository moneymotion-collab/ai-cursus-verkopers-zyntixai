import type { EffectiveTerminology } from "@/features/context-resolver/domain/types";

/**
 * Smallest reusable target terminology interface for shared product UI.
 * Only concepts required by the BETA1-4TG-SCOPE-FREEZE terminology decision
 * (Terminology Mode B) are represented here. New fields must correspond to
 * an already-seeded CTX terminology term key and an implemented shared
 * or an implemented target-specific module — do not add speculative terms.
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
  site: {
    singular: string;
    plural: string;
  };
  workOrder: {
    singular: string;
    plural: string;
  };
  technician: {
    singular: string;
    plural: string;
  };
};

const CUSTOMER_TERM_KEY = "customer";
const PROJECT_TERM_KEY = "project";
const SITE_TERM_KEY = "site";
const WORK_ORDER_TERM_KEY = "work_order";
const TECHNICIAN_TERM_KEY = "technician";

/**
 * System/default generic wording. Used when context is unresolved or a
 * pack does not define the term. This is Core shared language (the same
 * wording Knowledge/TG1 already uses) — not a Course Seller-specific
 * fallback, and not exposed for modules that are not visible.
 */
export const DEFAULT_PRODUCT_TERMINOLOGY: ProductTerminology = {
  customer: { singular: "Customer", plural: "Customers" },
  project: { singular: "Project", plural: "Projects" },
  site: { singular: "Site", plural: "Sites" },
  workOrder: { singular: "Work order", plural: "Work orders" },
  technician: { singular: "Technician", plural: "Technicians" },
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
  const siteTerm = terms?.find((term) => term.termKey === SITE_TERM_KEY);
  const workOrderTerm = terms?.find((term) => term.termKey === WORK_ORDER_TERM_KEY);
  const technicianTerm = terms?.find((term) => term.termKey === TECHNICIAN_TERM_KEY);

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
    site: siteTerm
      ? { singular: siteTerm.singularLabel, plural: siteTerm.pluralLabel }
      : DEFAULT_PRODUCT_TERMINOLOGY.site,
    workOrder: workOrderTerm
      ? { singular: workOrderTerm.singularLabel, plural: workOrderTerm.pluralLabel }
      : DEFAULT_PRODUCT_TERMINOLOGY.workOrder,
    technician: technicianTerm
      ? { singular: technicianTerm.singularLabel, plural: technicianTerm.pluralLabel }
      : DEFAULT_PRODUCT_TERMINOLOGY.technician,
  };
}
