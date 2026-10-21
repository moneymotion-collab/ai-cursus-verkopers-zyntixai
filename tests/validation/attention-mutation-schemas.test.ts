import { describe, expect, it } from "vitest";
import {
  validateAcknowledgeAttentionItemAdapterInput,
  validateArchiveAttentionItemAdapterInput,
  validateAssignAttentionItemAdapterInput,
  validateCreateManualAttentionItemAdapterInput,
  validateDismissAttentionItemAdapterInput,
  validateEvaluateAttentionRulesAdapterInput,
  validateRecordAttentionSignalAdapterInput,
  validateResolveAttentionItemAdapterInput,
  validateUpdateAttentionSeverityAdapterInput,
} from "@/features/attention/validation/mutation-schemas";
import {
  ATTENTION_ITEM_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
} from "../helpers/attention-test-fixtures";

describe("attention mutation schemas", () => {
  it("accepts valid create/signal/lifecycle inputs", () => {
    expect(
      validateCreateManualAttentionItemAdapterInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        title: "Follow up",
        explanation: "Manual review needed",
        severity: "high",
      }).success,
    ).toBe(true);

    expect(
      validateRecordAttentionSignalAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        explanation: "Still quiet",
        evidence: { kind: "manual_note", note: "Called twice" },
      }).success,
    ).toBe(true);

    expect(
      validateAcknowledgeAttentionItemAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
      }).success,
    ).toBe(true);

    expect(
      validateAssignAttentionItemAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        assigneeMemberId: MEMBER_ID,
      }).success,
    ).toBe(true);

    expect(
      validateUpdateAttentionSeverityAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        severity: "critical",
      }).success,
    ).toBe(true);

    expect(
      validateResolveAttentionItemAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        resolutionReason: "Student returned",
      }).success,
    ).toBe(true);

    expect(
      validateDismissAttentionItemAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        dismissalReason: "False positive",
      }).success,
    ).toBe(true);

    expect(
      validateArchiveAttentionItemAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
      }).success,
    ).toBe(true);

    expect(
      validateEvaluateAttentionRulesAdapterInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid UUIDs, enums, empty reasons, and extras", () => {
    expect(
      validateCreateManualAttentionItemAdapterInput({
        organizationId: "bad",
        enrollmentId: ENROLLMENT_ID,
        title: "x",
        explanation: "y",
      }).success,
    ).toBe(false);

    expect(
      validateUpdateAttentionSeverityAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        severity: "urgent",
      }).success,
    ).toBe(false);

    expect(
      validateResolveAttentionItemAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        resolutionReason: "   ",
      }).success,
    ).toBe(false);

    expect(
      validateCreateManualAttentionItemAdapterInput({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        title: "x",
        explanation: "y",
        unexpected: true,
      }).success,
    ).toBe(false);

    expect(
      validateRecordAttentionSignalAdapterInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        explanation: "x",
        evidence: { kind: "unknown" },
      }).success,
    ).toBe(false);
  });
});
