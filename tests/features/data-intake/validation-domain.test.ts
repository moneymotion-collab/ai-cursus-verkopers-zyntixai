import { describe, expect, it } from "vitest";
import {
  stagingRowFingerprint,
  summarizeStagingRows,
  completedStagingStatus,
} from "@/features/data-intake/domain/staging";
import {
  validateDisplayName,
  validateEmail,
  validateBoundedOptionalText,
  validateMappedTargetValue,
} from "@/features/data-intake/domain/validation";

describe("DATA-1G deterministic field validation", () => {
  it("requires a trimmed display_name of at most 200 characters", () => {
    expect(validateDisplayName("  Alice Example  ").normalized).toBe("Alice Example");
    expect(validateDisplayName("").issues.map((issue) => issue.code)).toEqual([
      "REQUIRED_VALUE_MISSING",
    ]);
    expect(validateDisplayName("A".repeat(200)).issues).toEqual([]);
    expect(validateDisplayName("A".repeat(201)).issues.map((issue) => issue.code)).toEqual([
      "VALUE_TOO_LONG",
    ]);
    expect(validateDisplayName(1).issues.map((issue) => issue.code)).toEqual(["INVALID_TYPE"]);
  });

  it("validates email syntax only and accepts synthetic .invalid addresses", () => {
    expect(validateEmail("  Alice@Example.INVALID  ").normalized).toBe("alice@example.invalid");
    expect(validateEmail("").normalized).toBeNull();
    expect(validateEmail("not-an-email").issues.map((issue) => issue.code)).toEqual([
      "INVALID_EMAIL",
    ]);
    expect(validateEmail(`a@${"b".repeat(198)}.com`).issues.map((issue) => issue.code)).toEqual([
      "VALUE_TOO_LONG",
    ]);
  });

  it("applies bounded optional text rules without phone or name semantics", () => {
    expect(validateBoundedOptionalText("phone", "  +1 (555) 0100  ", 50).normalized).toBe(
      "+1 (555) 0100",
    );
    expect(validateBoundedOptionalText("phone", "not-a-phone", 50).issues).toEqual([]);
    expect(validateBoundedOptionalText("phone", "1".repeat(51), 50).issues[0]?.code).toBe(
      "VALUE_TOO_LONG",
    );
    expect(validateBoundedOptionalText("first_name", "", 200).normalized).toBeNull();
    expect(validateBoundedOptionalText("last_name", "B".repeat(200), 200).issues).toEqual([]);
  });

  it("rejects unknown or excluded target fields before value checks", () => {
    expect(validateMappedTargetValue({ targetField: "organization_id", raw: "x" })).toEqual({
      ok: false,
      code: "TARGET_FIELD_FORBIDDEN",
    });
    expect(validateMappedTargetValue({ targetField: "customer.email", raw: "x" })).toEqual({
      ok: false,
      code: "TARGET_FIELD_UNKNOWN",
    });
  });

  it("builds a stable DATA-1B row fingerprint from source identity and mapped raw values", () => {
    const first = stagingRowFingerprint({
      sourceSha256: "a".repeat(64),
      sheetName: "People",
      sourceRowNumber: 2,
      rawValues: { "csv:1": "alice@example.com", "csv:0": "Alice" },
    });
    const second = stagingRowFingerprint({
      sourceSha256: "a".repeat(64),
      sheetName: "People",
      sourceRowNumber: 2,
      rawValues: { "csv:0": "Alice", "csv:1": "alice@example.com" },
    });
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
    const summary = summarizeStagingRows({
      sourceDataRows: 2,
      mappingHash: "b".repeat(64),
      sourceSha256: "a".repeat(64),
      rows: [
        {
          sourceRowNumber: 2,
          rawValues: {},
          normalizedValues: {},
          rowFingerprint: first,
          lifecycle: "validated",
          resolution: "none",
          targetOperation: null,
          targetRecordId: null,
          errorCodes: [],
          warningCodes: [],
          errorDetails: [],
        },
        {
          sourceRowNumber: 3,
          rawValues: {},
          normalizedValues: {},
          rowFingerprint: "c".repeat(64),
          lifecycle: "blocked",
          resolution: "none",
          targetOperation: null,
          targetRecordId: null,
          errorCodes: ["INVALID_EMAIL"],
          warningCodes: [],
          errorDetails: [],
        },
      ],
    });
    expect(summary.validRows).toBe(1);
    expect(summary.invalidRows).toBe(1);
    expect(completedStagingStatus(summary)).toBe("review_required");
  });
});
