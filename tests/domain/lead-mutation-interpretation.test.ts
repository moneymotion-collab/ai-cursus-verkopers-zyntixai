import { describe, expect, it } from "vitest";
import {
  interpretLeadMutationResult,
  leadMutationFormIsLocked,
} from "@/features/leads/domain/mutation-interpretation";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadMutationResult } from "@/features/leads/domain/types";
import { LEAD_MUTATION_REFRESH_HINTS } from "@/features/leads/domain/types";

const LEAD_ID = "22222222-2222-4222-8222-222222222222";

const leadStub = {
  id: LEAD_ID,
} as LeadDetailReadModel;

describe("interpretLeadMutationResult", () => {
  it("maps success results", () => {
    const result: LeadMutationResult = {
      ok: true,
      operation: "create",
      leadId: LEAD_ID,
      lead: leadStub,
      committed: true,
      refreshRequired: false,
      refreshHints: LEAD_MUTATION_REFRESH_HINTS.create,
    };

    expect(interpretLeadMutationResult(result)).toEqual({
      kind: "success",
      leadId: LEAD_ID,
      customerId: undefined,
      refreshHints: LEAD_MUTATION_REFRESH_HINTS.create,
    });
  });

  it("maps already converted and existing customer match codes", () => {
    const alreadyConverted = interpretLeadMutationResult({
      ok: false,
      operation: "convert",
      committed: false,
      error: {
        code: "ALREADY_CONVERTED",
        message: "converted",
        retryable: false,
        category: "conflict",
      },
    });
    expect(alreadyConverted.kind).toBe("error");
    if (alreadyConverted.kind === "error") {
      expect(alreadyConverted.message).toMatch(/already been converted/i);
    }

    const matchRequired = interpretLeadMutationResult({
      ok: false,
      operation: "convert",
      committed: false,
      error: {
        code: "EXISTING_CUSTOMER_MATCH_REQUIRED",
        message: "match",
        retryable: false,
        category: "conflict",
      },
    });
    expect(matchRequired.kind).toBe("field_error");
  });

  it("locks forms after committed refresh failures", () => {
    const state = interpretLeadMutationResult({
      ok: false,
      operation: "update_profile",
      committed: true,
      leadId: LEAD_ID,
      refreshHints: LEAD_MUTATION_REFRESH_HINTS.update_profile,
      error: {
        code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
        message: "refresh",
        retryable: false,
        category: "server",
        refreshRequired: true,
      },
    });

    expect(leadMutationFormIsLocked(state)).toBe(true);
  });
});
