import { describe, expect, it } from "vitest";
import { mapAttentionItemListItem } from "@/features/attention/server/map-attention-read-model";
import {
  resolveAttentionAcknowledgementLabel,
  resolveAttentionAssigneeLabel,
  resolveAttentionCustomerLabel,
  resolveAttentionSeverityLabel,
  resolveAttentionStatusLabel,
  resolveAttentionTitleLabel,
  toAttentionListItemPresentation,
  toAttentionSafeErrorPresentation,
} from "@/features/attention/ui/attention-presentation";
import { resolveAttentionEmptyState } from "@/features/attention/ui/attention-empty-state";
import {
  ATTENTION_ITEM_ID,
  MEMBER_ID,
  ORG_ID,
  sampleAttentionItemListRow,
} from "../helpers/attention-test-fixtures";
import { attentionItemUnavailableError } from "@/features/attention/server/normalize-attention-error";

describe("attention presentation mapping (B1.7.5-A)", () => {
  it("maps list item read models to safe presentation labels", () => {
    const mapped = mapAttentionItemListItem(sampleAttentionItemListRow, {
      customerDisplayName: "Acme Corp",
      programName: "Growth Lab",
      assigneeDisplayName: null,
    });
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;

    const presentation = toAttentionListItemPresentation(mapped.data, {
      organizationId: ORG_ID,
      timeZone: "UTC",
    });

    expect(presentation.id).toBe(ATTENTION_ITEM_ID);
    expect(presentation.titleLabel).toBe("No recent progress");
    expect(presentation.statusLabel).toBe("Open");
    expect(presentation.severityLabel).toBe("High");
    expect(presentation.customerLabel).toBe("Acme Corp");
    expect(presentation.programLabel).toBe("Growth Lab");
    expect(presentation.assigneeLabel).toBe("Unassigned");
    expect(presentation.acknowledgementLabel).toBe("Not acknowledged");
    expect(presentation.detailHref).toContain(ATTENTION_ITEM_ID);
    expect(presentation.detailHref).toContain(`org=${ORG_ID}`);
    expect(presentation.isArchived).toBe(false);
  });

  it("uses safe fallbacks for missing optional labels", () => {
    expect(resolveAttentionTitleLabel("  ")).toBe("Untitled attention item");
    expect(resolveAttentionCustomerLabel(null)).toBe("Unknown customer");
    expect(resolveAttentionAssigneeLabel(null, null)).toBe("Unassigned");
    expect(resolveAttentionAssigneeLabel(null, MEMBER_ID)).toBe(
      "Unavailable member",
    );
    expect(resolveAttentionStatusLabel("not-a-status")).toBe("Unavailable");
    expect(resolveAttentionSeverityLabel("not-a-severity")).toBe("Unavailable");
    expect(
      resolveAttentionAcknowledgementLabel({
        isAcknowledged: true,
        acknowledgedAt: null,
        timeZone: "UTC",
      }),
    ).toBe("Acknowledged");
  });

  it("maps unavailable errors without leaking cause details", () => {
    const error = {
      ...attentionItemUnavailableError(),
      cause: "secret-tenant-leak",
    };
    const presentation = toAttentionSafeErrorPresentation(error);
    expect(presentation.title).toBe("Attention unavailable");
    expect(presentation.message).not.toContain("secret-tenant-leak");
    expect(presentation.message.toLowerCase()).not.toContain("tenant");
    expect(JSON.stringify(presentation)).not.toContain("secret-tenant-leak");
    expect(presentation.retryable).toBe(false);
  });
});

describe("attention empty state (B1.7.5-A/C)", () => {
  it("distinguishes workspace empty from filtered no-results", () => {
    const empty = resolveAttentionEmptyState();
    expect(empty.title).toBe("No attention items yet");
    expect(empty.description).toContain("detected for enrollments");
    expect(resolveAttentionEmptyState({ hasActiveFilters: true }).title).toBe(
      "No attention items match these filters",
    );
    expect(
      resolveAttentionEmptyState({
        outOfRangePage: true,
        clearHref: "/attention",
      }).clearHref,
    ).toBe("/attention");
  });
});
