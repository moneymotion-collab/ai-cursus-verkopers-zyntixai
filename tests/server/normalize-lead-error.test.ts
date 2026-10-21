import { describe, expect, it } from "vitest";
import {
  authRequiredError,
  invalidInputError,
  leadUnavailableError,
  mapOrganizationContextError,
  normalizeLeadError,
} from "@/features/leads/server/normalize-lead-error";

describe("normalizeLeadError", () => {
  it("maps authentication and organization context messages", () => {
    expect(normalizeLeadError(new Error("not authenticated")).code).toBe("AUTH_REQUIRED");
    expect(normalizeLeadError(new Error("active organization membership required")).code).toBe(
      "ORG_CONTEXT_MISSING",
    );
  });

  it("maps lead unavailable messages without exposing raw text", () => {
    const error = normalizeLeadError(new Error("lead not found"));
    expect(error.code).toBe("LEAD_UNAVAILABLE");
    expect(error.message).toBe("Lead not found or access denied.");
  });

  it("maps network transport failures", () => {
    const error = normalizeLeadError(new Error("fetch failed"));
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.retryable).toBe(true);
  });

  it("maps organization context task errors", () => {
    expect(
      mapOrganizationContextError({
        code: "AUTH_REQUIRED",
        message: "Please sign in to continue.",
        retryable: false,
        category: "auth",
      }).code,
    ).toBe("AUTH_REQUIRED");

    expect(
      mapOrganizationContextError({
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      }).code,
    ).toBe("ORG_CONTEXT_MISSING");
  });

  it("exposes stable helper constructors", () => {
    expect(authRequiredError().code).toBe("AUTH_REQUIRED");
    expect(leadUnavailableError().code).toBe("LEAD_UNAVAILABLE");
    expect(invalidInputError({ leadId: "Required" }).fieldErrors?.leadId).toBe("Required");
  });
});
