/**
 * Eligibility mirrors the enrollment create option filters (see
 * load-enrollment-create-options.ts) so contextual "New enrollment" links
 * from Customer/Program detail only appear when a create would actually
 * list that record as eligible. The create workflow (and its RPC) remain
 * authoritative — this only gates whether a link is shown.
 */

type EligibleCustomer = {
  status: string;
  derived: { isArchived: boolean };
};

type EligibleProgram = {
  status: string;
  derived: { isArchived: boolean };
};

const ELIGIBLE_CUSTOMER_STATUSES = new Set(["onboarding", "active"]);

export function isCustomerEligibleForEnrollmentCreate(customer: EligibleCustomer): boolean {
  return !customer.derived.isArchived && ELIGIBLE_CUSTOMER_STATUSES.has(customer.status);
}

export function isProgramEligibleForEnrollmentCreate(program: EligibleProgram): boolean {
  return !program.derived.isArchived && program.status === "active";
}
