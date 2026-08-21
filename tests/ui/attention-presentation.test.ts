import { describe, expect, it } from "vitest";
import {
  mapAttentionEvent,
  mapAttentionItemDetail,
  mapAttentionItemListItem,
  mapAttentionSignal,
} from "@/features/attention/server/map-attention-read-model";
import {
  resolveAttentionAcknowledgementLabel,
  resolveAttentionAssigneeLabel,
  resolveAttentionCustomerLabel,
  resolveAttentionEventTypeLabel,
  resolveAttentionSeverityLabel,
  resolveAttentionStatusLabel,
  resolveAttentionTitleLabel,
  toAttentionDetailPresentation,
  toAttentionListItemPresentation,
  toAttentionSafeErrorPresentation,
  toAttentionTimelineEventPresentation,
} from "@/features/attention/ui/attention-presentation";
import { resolveAttentionEmptyState } from "@/features/attention/ui/attention-empty-state";
import {
  ATTENTION_ITEM_ID,
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  sampleAttentionEventRow,
  sampleAttentionItemDetailRow,
  sampleAttentionItemListRow,
  sampleAttentionSignalRow,
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

describe("attention detail and timeline presentation (B1.7.5-D)", () => {
  it("maps detail fields and timeline without exposing event payload", () => {
    const signal = mapAttentionSignal(sampleAttentionSignalRow);
    const event = mapAttentionEvent({
      ...sampleAttentionEventRow,
      payload: { rule_key: "enrollment_no_recent_progress", secret: "x" },
    });
    expect(signal.ok).toBe(true);
    expect(event.ok).toBe(true);
    if (!signal.ok || !event.ok) return;

    const mapped = mapAttentionItemDetail(sampleAttentionItemDetailRow, {
      enrollment: {
        id: ENROLLMENT_ID,
        status: "active",
        archivedAt: null,
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
      },
      customer: {
        id: CUSTOMER_ID,
        displayName: "Acme Corp",
        status: "active",
        archivedAt: null,
      },
      program: {
        id: PROGRAM_ID,
        name: "Growth Lab",
        status: "active",
        archivedAt: null,
      },
      signals: [signal.data],
      events: [event.data],
    });
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;

    const detail = toAttentionDetailPresentation(mapped.data, {
      timeZone: "UTC",
      assigneeDisplayName: null,
    });
    expect(detail.titleLabel).toBe("No recent progress");
    expect(detail.attentionTypeLabel).toBe("No recent progress");
    expect(detail.enrollmentStatusLabel).toBe("Active");
    expect(detail.detectionCountLabel).toBe("1");

    const timeline = toAttentionTimelineEventPresentation(event.data, {
      timeZone: "UTC",
      actorLabel: null,
      fromAssigneeLabel: null,
      toAssigneeLabel: null,
    });
    expect(timeline.eventTypeLabel).toBe("Created");
    expect(resolveAttentionEventTypeLabel("assigned")).toBe("Assigned");
    expect(JSON.stringify(timeline)).not.toContain("payload");
    expect(JSON.stringify(timeline)).not.toContain("secret");
    expect(JSON.stringify(timeline)).not.toContain("rule_key");
  });
});

describe("attention empty state (B1.7.5-A/C)", () => {
  it("distinguishes workspace empty from filtered no-results", () => {
    const empty = resolveAttentionEmptyState();
    expect(empty.title).toBe("No attention items yet");
    expect(empty.description).toContain("detected for enrollments or Social operations");
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
