import { describe, expect, it } from "vitest";
import {
  customerFormIsLocked,
  interpretCustomerFormMutationResult,
} from "@/features/customers/ui/customer-form-state";
import { interpretCustomerMutationResult } from "@/features/customers/domain/mutation-interpretation";
import { sampleCustomerDetail } from "../helpers/customer-mutation-mocks";

const customerId = "22222222-2222-4222-8222-222222222222";

describe("customer workflow result matrix", () => {
  it("maps create success with refresh hints", () => {
    const result = interpretCustomerFormMutationResult({
      ok: true,
      operation: "create",
      customerId,
      customer: sampleCustomerDetail,
      committed: true,
      refreshRequired: false,
      refreshHints: { detail: true, list: true, history: true, relatedTasks: false },
    });
    expect(result).toEqual({
      kind: "success",
      customerId,
      refreshHints: { detail: true, list: true, history: true, relatedTasks: false },
    });
  });

  it("locks forms after committed refresh failures", () => {
    for (const operation of ["create", "update_profile", "transition_status", "archive", "restore"] as const) {
      const state = interpretCustomerMutationResult({
        ok: false,
        operation,
        committed: true,
        customerId,
        refreshHints: { detail: true, list: true, history: false, relatedTasks: false },
        error: {
          code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
          message: "raw",
          retryable: false,
          category: "server",
          refreshRequired: true,
        },
      });
      expect(customerFormIsLocked(state)).toBe(true);
      if (state.kind === "reload_required") {
        expect(state.message.toLowerCase()).not.toContain("failed");
      }
    }
  });

  it("maps duplicate and validation failures to field errors", () => {
    const duplicate = interpretCustomerFormMutationResult({
      ok: false,
      operation: "create",
      committed: false,
      error: {
        code: "DUPLICATE_CUSTOMER",
        message: "raw duplicate",
        retryable: false,
        category: "conflict",
      },
    });
    expect(duplicate.kind).toBe("field_error");
    if (duplicate.kind === "field_error") {
      expect(duplicate.fieldErrors.email?.[0]).toContain("email already exists");
    }
  });
});
