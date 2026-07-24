import { describe, expect, it } from "vitest";
import {
  interpretProgramMutationResult,
  programMutationFormIsLocked,
} from "@/features/programs/domain/mutation-interpretation";
import { PROGRAM_MUTATION_REFRESH_HINTS } from "@/features/programs/domain/types";
import { PROGRAM_ID, sampleProgramDetail } from "../helpers/program-test-fixtures";

describe("interpretProgramMutationResult", () => {
  it("maps success and field validation", () => {
    const success = interpretProgramMutationResult({
      ok: true,
      operation: "create",
      programId: PROGRAM_ID,
      program: sampleProgramDetail,
      committed: true,
      refreshRequired: false,
      refreshHints: PROGRAM_MUTATION_REFRESH_HINTS.create,
    });
    expect(success.kind).toBe("success");

    const invalid = interpretProgramMutationResult({
      ok: false,
      operation: "create",
      committed: false,
      error: {
        code: "INVALID_INPUT",
        message: "x",
        retryable: false,
        category: "validation",
        fieldErrors: { name: "Program name is required." },
      },
    });
    expect(invalid.kind).toBe("field_error");
    if (invalid.kind === "field_error") {
      expect(invalid.fieldErrors.name?.[0]).toBe("Program name is required.");
    }
  });

  it("locks form after committed refresh failure", () => {
    const state = interpretProgramMutationResult({
      ok: false,
      operation: "create",
      committed: true,
      programId: PROGRAM_ID,
      refreshHints: PROGRAM_MUTATION_REFRESH_HINTS.create,
      error: {
        code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
        message: "saved",
        retryable: false,
        category: "server",
        refreshRequired: true,
      },
    });
    expect(state.kind).toBe("reload_required");
    expect(programMutationFormIsLocked(state)).toBe(true);
  });
});
