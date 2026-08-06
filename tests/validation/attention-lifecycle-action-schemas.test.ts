import { describe, expect, it } from "vitest";
import {
  parseAcknowledgeAttentionItemActionInput,
  parseArchiveAttentionItemActionInput,
  parseAssignAttentionItemActionInput,
  parseDismissAttentionItemActionInput,
  parseResolveAttentionItemActionInput,
  parseUpdateAttentionSeverityActionInput,
} from "@/features/attention/actions/lifecycle-attention-action-schemas";
import {
  ATTENTION_ITEM_ID,
  MEMBER_ID,
  ORG_ID,
} from "../helpers/attention-test-fixtures";

describe("attention lifecycle action schemas", () => {
  it("accepts acknowledge input with optional returnPath", () => {
    const parsed = parseAcknowledgeAttentionItemActionInput({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      returnPath: `/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.returnPath).toContain("/attention/");
    }
  });

  it("rejects unknown action fields and malformed ids", () => {
    expect(
      parseAcknowledgeAttentionItemActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        action: "close",
      }).success,
    ).toBe(false);

    expect(
      parseAcknowledgeAttentionItemActionInput({
        organizationId: "not-a-uuid",
        attentionItemId: ATTENTION_ITEM_ID,
      }).success,
    ).toBe(false);

    expect(
      parseAcknowledgeAttentionItemActionInput({
        organizationId: ORG_ID,
        attentionItemId: "bad",
      }).success,
    ).toBe(false);
  });

  it("validates assign/unassign, severity, reasons, and archive", () => {
    expect(
      parseAssignAttentionItemActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        assigneeMemberId: MEMBER_ID,
      }).success,
    ).toBe(true);

    expect(
      parseAssignAttentionItemActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        assigneeMemberId: null,
      }).success,
    ).toBe(true);

    expect(
      parseUpdateAttentionSeverityActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        severity: "critical",
      }).success,
    ).toBe(true);

    expect(
      parseUpdateAttentionSeverityActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        severity: "urgent",
      }).success,
    ).toBe(false);

    expect(
      parseResolveAttentionItemActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        resolutionReason: "Handled with customer",
      }).success,
    ).toBe(true);

    expect(
      parseResolveAttentionItemActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        resolutionReason: "",
      }).success,
    ).toBe(false);

    expect(
      parseDismissAttentionItemActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        dismissalReason: "Not actionable",
      }).success,
    ).toBe(true);

    expect(
      parseArchiveAttentionItemActionInput({
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
      }).success,
    ).toBe(true);
  });

  it("rejects oversized returnPath", () => {
    const parsed = parseAcknowledgeAttentionItemActionInput({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      returnPath: `/${"a".repeat(2100)}`,
    });
    expect(parsed.success).toBe(false);
  });
});
