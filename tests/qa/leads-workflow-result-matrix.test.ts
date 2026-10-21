import { describe, expect, it } from "vitest";
import {
  interpretLeadFormMutationResult,
  leadFormIsLocked,
} from "@/features/leads/ui/lead-form-state";
import { interpretLeadMutationResult, leadMutationFormIsLocked } from "@/features/leads/domain/mutation-interpretation";
import { LEAD_MUTATION_REFRESH_HINTS } from "@/features/leads/domain/types";
import type { LeadMutationOperation } from "@/features/leads/domain/types";
import { CUSTOMER_ID, LEAD_ID } from "../helpers/lead-read-query-mocks";
import { sampleLeadDetail } from "../helpers/lead-mutation-mocks";

const OPERATIONS: LeadMutationOperation[] = [
  "create",
  "update_profile",
  "transition_stage",
  "transition_status",
  "convert",
  "archive",
  "restore",
];

describe("leads workflow result matrix", () => {
  it("locks every mutation form after committed refresh failures", () => {
    for (const operation of OPERATIONS) {
      const state = interpretLeadMutationResult({
        ok: false,
        operation,
        committed: true,
        leadId: LEAD_ID,
        customerId: operation === "convert" ? CUSTOMER_ID : undefined,
        refreshHints: LEAD_MUTATION_REFRESH_HINTS[operation],
        error: {
          code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
          message: "raw refresh failure",
          retryable: false,
          category: "server",
          refreshRequired: true,
        },
      });

      expect(leadMutationFormIsLocked(state)).toBe(true);
      expect(leadFormIsLocked(state)).toBe(true);
      if (state.kind === "reload_required") {
        expect(state.message.toLowerCase()).not.toContain("failed");
        expect(state.committed).toBe(true);
      }
    }
  });

  it("unlocks forms after non-committed validation failures", () => {
    const state = interpretLeadFormMutationResult({
      ok: false,
      operation: "update_profile",
      committed: false,
      error: {
        code: "INVALID_INPUT",
        message: "raw",
        retryable: false,
        category: "validation",
        fieldErrors: { displayName: "Required." },
      },
    });

    expect(state.kind).toBe("field_error");
    expect(leadFormIsLocked(state)).toBe(false);
  });

  it("maps convert success with customer navigation data", () => {
    const state = interpretLeadFormMutationResult({
      ok: true,
      operation: "convert",
      leadId: LEAD_ID,
      lead: sampleLeadDetail,
      customerId: CUSTOMER_ID,
      committed: true,
      refreshRequired: false,
      refreshHints: LEAD_MUTATION_REFRESH_HINTS.convert,
    });

    expect(state).toEqual({
      kind: "success",
      leadId: LEAD_ID,
      customerId: CUSTOMER_ID,
      refreshHints: LEAD_MUTATION_REFRESH_HINTS.convert,
    });
  });
});
