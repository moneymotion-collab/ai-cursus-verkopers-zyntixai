/**
 * DATA-1G deterministic Customer.v1 field validation.
 * Derived from DATA-1B + the canonical Customer writer contract.
 * No Customer lookup. No AI. No speculative transforms.
 */

import {
  isExcludedCustomerImportField,
  resolveCustomerImportField,
  type DataCustomerImportFieldKey,
} from "@/features/data-intake/domain/target-catalog";
import { DATA_EXECUTABLE_TARGET_DOMAIN } from "@/features/data-intake/domain/constants";

export const DATA_VALIDATION_ISSUE_CODES = [
  "REQUIRED_VALUE_MISSING",
  "VALUE_TOO_LONG",
  "INVALID_EMAIL",
  "INVALID_TYPE",
] as const;

export type DataValidationIssueCode = (typeof DATA_VALIDATION_ISSUE_CODES)[number];

export type DataValidationIssue = {
  code: DataValidationIssueCode;
  field: DataCustomerImportFieldKey;
  message: string;
};

const EMAIL_SYNTAX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

function asTrimmedString(value: unknown): { ok: true; value: string } | { ok: false } {
  if (value == null) {
    return { ok: true, value: "" };
  }
  if (typeof value !== "string") {
    return { ok: false };
  }
  return { ok: true, value: value.trim() };
}

function issue(
  code: DataValidationIssueCode,
  field: DataCustomerImportFieldKey,
  message: string,
): DataValidationIssue {
  return { code, field, message };
}

export function validateDisplayName(value: unknown): {
  normalized: string | null;
  issues: DataValidationIssue[];
} {
  const parsed = asTrimmedString(value);
  if (!parsed.ok) {
    return {
      normalized: null,
      issues: [issue("INVALID_TYPE", "display_name", "display_name must be a string")],
    };
  }
  if (parsed.value.length === 0) {
    return {
      normalized: null,
      issues: [issue("REQUIRED_VALUE_MISSING", "display_name", "display_name is required")],
    };
  }
  if (parsed.value.length > 200) {
    return {
      normalized: null,
      issues: [issue("VALUE_TOO_LONG", "display_name", "display_name exceeds 200 characters")],
    };
  }
  return { normalized: parsed.value, issues: [] };
}

export function validateEmail(value: unknown): {
  normalized: string | null;
  issues: DataValidationIssue[];
} {
  const parsed = asTrimmedString(value);
  if (!parsed.ok) {
    return {
      normalized: null,
      issues: [issue("INVALID_TYPE", "email", "email must be a string")],
    };
  }
  if (parsed.value.length === 0) {
    return { normalized: null, issues: [] };
  }
  const lowered = parsed.value.toLowerCase();
  if (lowered.length > 200) {
    return {
      normalized: null,
      issues: [issue("VALUE_TOO_LONG", "email", "email exceeds 200 characters")],
    };
  }
  if (!EMAIL_SYNTAX.test(lowered)) {
    return {
      normalized: null,
      issues: [issue("INVALID_EMAIL", "email", "email is not a valid address")],
    };
  }
  return { normalized: lowered, issues: [] };
}

export function validateBoundedOptionalText(
  field: Extract<DataCustomerImportFieldKey, "phone" | "first_name" | "last_name">,
  value: unknown,
  maxLength: number,
): {
  normalized: string | null;
  issues: DataValidationIssue[];
} {
  const parsed = asTrimmedString(value);
  if (!parsed.ok) {
    return {
      normalized: null,
      issues: [issue("INVALID_TYPE", field, `${field} must be a string`)],
    };
  }
  if (parsed.value.length === 0) {
    return { normalized: null, issues: [] };
  }
  if (parsed.value.length > maxLength) {
    return {
      normalized: null,
      issues: [issue("VALUE_TOO_LONG", field, `${field} exceeds ${maxLength} characters`)],
    };
  }
  return { normalized: parsed.value, issues: [] };
}

export function validateMappedTargetValue(input: {
  targetField: string;
  raw: unknown;
}): {
  ok: true;
  field: DataCustomerImportFieldKey;
  normalized: string | null;
  issues: DataValidationIssue[];
} | {
  ok: false;
  code: "TARGET_FIELD_UNKNOWN" | "TARGET_FIELD_FORBIDDEN";
} {
  if (resolveCustomerImportField(DATA_EXECUTABLE_TARGET_DOMAIN, input.targetField)) {
    const field = input.targetField as DataCustomerImportFieldKey;
    if (field === "display_name") {
      const result = validateDisplayName(input.raw);
      return { ok: true, field, ...result };
    }
    if (field === "email") {
      const result = validateEmail(input.raw);
      return { ok: true, field, ...result };
    }
    if (field === "phone") {
      const result = validateBoundedOptionalText("phone", input.raw, 50);
      return { ok: true, field, ...result };
    }
    if (field === "first_name") {
      const result = validateBoundedOptionalText("first_name", input.raw, 200);
      return { ok: true, field, ...result };
    }
    const result = validateBoundedOptionalText("last_name", input.raw, 200);
    return { ok: true, field, ...result };
  }
  if (isExcludedCustomerImportField(input.targetField)) {
    return { ok: false, code: "TARGET_FIELD_FORBIDDEN" };
  }
  return { ok: false, code: "TARGET_FIELD_UNKNOWN" };
}
