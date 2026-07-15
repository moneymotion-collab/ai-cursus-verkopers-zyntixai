import { describe, expect, it } from "vitest";
import {
  customerMutationFormIsLocked,
  interpretCustomerMutationResult,
} from "@/features/customers/domain/mutation-interpretation";
import { CUSTOMER_MUTATION_REFRESH_HINTS } from "@/features/customers/domain/types";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";

const sampleCustomer = {
  id: CUSTOMER_ID,
  organizationId: ORG_ID,
  displayName: "Acme",
  firstName: null,
  lastName: null,
  email: null,
  phone: null,
  status: "active",
  statusLabel: "Active",
  ownerMemberId: null,
  ownerLabel: "Unassigned",
  createdByMemberId: null,
  createdByLabel: "Unassigned",
  startedAt: "2026-07-14T10:00:00.000Z",
  endedAt: null,
  archivedAt: null,
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  derived: { isArchived: false, allowedTransitions: [] },
} satisfies CustomerDetailReadModel;

describe("interpretCustomerMutationResult", () => {
  it("permits navigation on success", () => {
    const state = interpretCustomerMutationResult({
      ok: true,
      operation: "create",
      customerId: CUSTOMER_ID,
      customer: sampleCustomer,
      committed: true,
      refreshRequired: false,
      refreshHints: CUSTOMER_MUTATION_REFRESH_HINTS.create,
    });

    expect(state.kind).toBe("success");
    if (state.kind === "success") {
      expect(state.customerId).toBe(CUSTOMER_ID);
      expect(state.refreshHints.history).toBe(true);
    }
    expect(customerMutationFormIsLocked(state)).toBe(false);
  });

  it("permits correction on normal validation failure", () => {
    const state = interpretCustomerMutationResult({
      ok: false,
      operation: "update_profile",
      committed: false,
      error: {
        code: "INVALID_INPUT",
        message: "Please check the highlighted fields.",
        retryable: false,
        category: "validation",
        fieldErrors: { displayName: "Display name is required." },
      },
    });

    expect(state.kind).toBe("field_error");
    expect(customerMutationFormIsLocked(state)).toBe(false);
  });

  it("locks resubmission on committed refresh failure", () => {
    const state = interpretCustomerMutationResult({
      ok: false,
      operation: "transition_status",
      committed: true,
      customerId: CUSTOMER_ID,
      refreshHints: CUSTOMER_MUTATION_REFRESH_HINTS.transition_status,
      error: {
        code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
        message: "Your change was saved. Refresh to see the latest customer.",
        retryable: false,
        category: "server",
        refreshRequired: true,
      },
    });

    expect(state.kind).toBe("reload_required");
    if (state.kind === "reload_required") {
      expect(state.customerId).toBe(CUSTOMER_ID);
      expect(state.committed).toBe(true);
    }
    expect(customerMutationFormIsLocked(state)).toBe(true);
  });
});
