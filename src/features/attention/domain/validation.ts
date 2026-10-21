import {
  DEFAULT_ATTENTION_SEVERITY,
  isAttentionSeverity,
} from "@/features/attention/domain/severity";
import {
  isAttentionRuleKey,
  isAttentionSignalOrigin,
} from "@/features/attention/domain/signal";
import { isAttentionSourceType } from "@/features/attention/domain/source";
import { isAttentionItemStatus } from "@/features/attention/domain/status";
import type {
  AttentionDomainResult,
  AttentionSeverity,
  AttentionSignalEvidence,
  AssignAttentionItemInput,
  CreateManualAttentionItemInput,
  DismissAttentionItemInput,
  ResolveAttentionItemInput,
} from "@/features/attention/domain/types";

/** Align with Tasks title constraints. */
export const ATTENTION_TITLE_MAX_LENGTH = 200;
export const ATTENTION_SUMMARY_MAX_LENGTH = 2000;
export const ATTENTION_REASON_MAX_LENGTH = 2000;
export const ATTENTION_EXPLANATION_MAX_LENGTH = 2000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAttentionUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

function requireNonEmptyTrimmed(
  value: string | null | undefined,
  code:
    | "INVALID_TITLE"
    | "DISMISSAL_REASON_REQUIRED"
    | "RESOLUTION_REASON_REQUIRED"
    | "INVALID_SUMMARY"
    | "INVALID_EVIDENCE",
  message: string,
  maxLength: number,
): AttentionDomainResult<string> {
  if (value == null) {
    return { ok: false, error: { code, message } };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { code, message } };
  }
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: { code, message: `${message} (max ${maxLength} characters)` },
    };
  }
  return { ok: true, value: trimmed };
}

export function validateAttentionStatusValue(
  value: string,
): AttentionDomainResult<string> {
  if (!isAttentionItemStatus(value)) {
    return {
      ok: false,
      error: { code: "INVALID_STATUS", message: "Invalid Attention Item status." },
    };
  }
  return { ok: true, value };
}

export function validateAttentionSeverityValue(
  value: string,
): AttentionDomainResult<AttentionSeverity> {
  if (!isAttentionSeverity(value)) {
    return {
      ok: false,
      error: { code: "INVALID_SEVERITY", message: "Invalid Attention severity." },
    };
  }
  return { ok: true, value };
}

export function validateAttentionSignalOriginValue(
  value: string,
): AttentionDomainResult<string> {
  if (!isAttentionSignalOrigin(value)) {
    return {
      ok: false,
      error: {
        code: "INVALID_SIGNAL_ORIGIN",
        message: "Invalid Attention Signal origin.",
      },
    };
  }
  return { ok: true, value };
}

export function validateAttentionRuleKeyValue(
  value: string,
): AttentionDomainResult<string> {
  if (!isAttentionRuleKey(value)) {
    return {
      ok: false,
      error: { code: "INVALID_RULE_KEY", message: "Invalid Attention rule key." },
    };
  }
  return { ok: true, value };
}

export function validateAttentionSourceTypeValue(
  value: string,
): AttentionDomainResult<string> {
  if (!isAttentionSourceType(value)) {
    return {
      ok: false,
      error: {
        code: "INVALID_SOURCE_TYPE",
        message: "Invalid Attention source type.",
      },
    };
  }
  return { ok: true, value };
}

export function validateEnrollmentId(
  enrollmentId: string,
): AttentionDomainResult<string> {
  const trimmed = enrollmentId.trim();
  if (!isAttentionUuid(trimmed)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENROLLMENT_ID",
        message: "Enrollment ID must be a UUID.",
      },
    };
  }
  return { ok: true, value: trimmed };
}

export function validateAttentionItemId(
  attentionItemId: string,
): AttentionDomainResult<string> {
  const trimmed = attentionItemId.trim();
  if (!isAttentionUuid(trimmed)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ATTENTION_ITEM_ID",
        message: "Attention Item ID must be a UUID.",
      },
    };
  }
  return { ok: true, value: trimmed };
}

export function validateAssigneeMemberId(
  assigneeMemberId: string | null,
): AttentionDomainResult<string | null> {
  if (assigneeMemberId == null) {
    return { ok: true, value: null };
  }
  const trimmed = assigneeMemberId.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_ASSIGNEE",
        message: "Assignee member ID cannot be empty.",
      },
    };
  }
  if (!isAttentionUuid(trimmed)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ASSIGNEE",
        message: "Assignee member ID must be a UUID.",
      },
    };
  }
  return { ok: true, value: trimmed };
}

export function validateAttentionSignalEvidence(
  evidence: AttentionSignalEvidence,
): AttentionDomainResult<AttentionSignalEvidence> {
  if (
    evidence.kind !== "manual_note" &&
    evidence.kind !== "stale_progress" &&
    evidence.kind !== "generic"
  ) {
    return {
      ok: false,
      error: { code: "INVALID_EVIDENCE", message: "Invalid evidence kind." },
    };
  }
  if (
    evidence.note != null &&
    evidence.note.trim().length > ATTENTION_REASON_MAX_LENGTH
  ) {
    return {
      ok: false,
      error: { code: "INVALID_EVIDENCE", message: "Evidence note is too long." },
    };
  }
  if (evidence.citedProgressFactIds) {
    for (const id of evidence.citedProgressFactIds) {
      if (!isAttentionUuid(id)) {
        return {
          ok: false,
          error: {
            code: "INVALID_EVIDENCE",
            message: "Cited Progress fact IDs must be UUIDs.",
          },
        };
      }
    }
  }
  return { ok: true, value: evidence };
}

export type ValidatedManualAttentionCreate = {
  enrollmentId: string;
  title: string;
  summary: string | null;
  severity: AttentionSeverity;
  explanation: string;
  evidenceNote: string | null;
};

export function validateCreateManualAttentionItemInput(
  input: CreateManualAttentionItemInput,
): AttentionDomainResult<ValidatedManualAttentionCreate> {
  const enrollmentId = validateEnrollmentId(input.enrollmentId);
  if (!enrollmentId.ok) {
    return enrollmentId;
  }

  const title = requireNonEmptyTrimmed(
    input.title,
    "INVALID_TITLE",
    "Title is required.",
    ATTENTION_TITLE_MAX_LENGTH,
  );
  if (!title.ok) {
    return title;
  }

  let summary: string | null = null;
  if (input.summary != null && input.summary.trim().length > 0) {
    const summaryResult = requireNonEmptyTrimmed(
      input.summary,
      "INVALID_SUMMARY",
      "Summary is invalid.",
      ATTENTION_SUMMARY_MAX_LENGTH,
    );
    if (!summaryResult.ok) {
      return summaryResult;
    }
    summary = summaryResult.value;
  }

  const severityValue = input.severity ?? DEFAULT_ATTENTION_SEVERITY;
  const severity = validateAttentionSeverityValue(severityValue);
  if (!severity.ok) {
    return severity;
  }

  const explanation = requireNonEmptyTrimmed(
    input.explanation,
    "INVALID_EVIDENCE",
    "Explanation is required.",
    ATTENTION_EXPLANATION_MAX_LENGTH,
  );
  if (!explanation.ok) {
    return explanation;
  }

  let evidenceNote: string | null = null;
  if (input.evidenceNote != null && input.evidenceNote.trim().length > 0) {
    if (input.evidenceNote.trim().length > ATTENTION_REASON_MAX_LENGTH) {
      return {
        ok: false,
        error: {
          code: "INVALID_EVIDENCE",
          message: "Evidence note is too long.",
        },
      };
    }
    evidenceNote = input.evidenceNote.trim();
  }

  return {
    ok: true,
    value: {
      enrollmentId: enrollmentId.value,
      title: title.value,
      summary,
      severity: severity.value,
      explanation: explanation.value,
      evidenceNote,
    },
  };
}

export function validateDismissAttentionItemInput(
  input: DismissAttentionItemInput,
): AttentionDomainResult<{ attentionItemId: string; dismissalReason: string }> {
  const itemId = validateAttentionItemId(input.attentionItemId);
  if (!itemId.ok) {
    return itemId;
  }
  const reason = requireNonEmptyTrimmed(
    input.dismissalReason,
    "DISMISSAL_REASON_REQUIRED",
    "Dismissal reason is required.",
    ATTENTION_REASON_MAX_LENGTH,
  );
  if (!reason.ok) {
    return reason;
  }
  return {
    ok: true,
    value: {
      attentionItemId: itemId.value,
      dismissalReason: reason.value,
    },
  };
}

export function validateResolveAttentionItemInput(
  input: ResolveAttentionItemInput,
): AttentionDomainResult<{ attentionItemId: string; resolutionReason: string }> {
  const itemId = validateAttentionItemId(input.attentionItemId);
  if (!itemId.ok) {
    return itemId;
  }
  const reason = requireNonEmptyTrimmed(
    input.resolutionReason,
    "RESOLUTION_REASON_REQUIRED",
    "Resolution reason is required.",
    ATTENTION_REASON_MAX_LENGTH,
  );
  if (!reason.ok) {
    return reason;
  }
  return {
    ok: true,
    value: {
      attentionItemId: itemId.value,
      resolutionReason: reason.value,
    },
  };
}

export function validateAssignAttentionItemInput(
  input: AssignAttentionItemInput,
): AttentionDomainResult<{
  attentionItemId: string;
  assigneeMemberId: string | null;
}> {
  const itemId = validateAttentionItemId(input.attentionItemId);
  if (!itemId.ok) {
    return itemId;
  }
  const assignee = validateAssigneeMemberId(input.assigneeMemberId);
  if (!assignee.ok) {
    return assignee;
  }
  return {
    ok: true,
    value: {
      attentionItemId: itemId.value,
      assigneeMemberId: assignee.value,
    },
  };
}
