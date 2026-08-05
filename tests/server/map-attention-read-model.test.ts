import { describe, expect, it } from "vitest";
import {
  mapAttentionEvent,
  mapAttentionItemDetail,
  mapAttentionItemListItem,
  mapAttentionSignal,
} from "@/features/attention/server/map-attention-read-model";
import {
  sampleAttentionEventRow,
  sampleAttentionItemDetailRow,
  sampleAttentionItemListRow,
  sampleAttentionSignalRow,
} from "../helpers/attention-test-fixtures";

describe("mapAttentionReadModel", () => {
  it("maps list rows with derived flags and optional age", () => {
    const mapped = mapAttentionItemListItem(sampleAttentionItemListRow, {
      customerDisplayName: "Acme",
      programName: "Growth",
      evaluatedAt: "2026-08-05T10:00:00.000Z",
    });
    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.data.organizationId).toBe(
        sampleAttentionItemListRow.organization_id,
      );
      expect(mapped.data.sourceType).toBe("enrollment");
      expect(mapped.data.sourceEntityId).toBe(
        sampleAttentionItemListRow.enrollment_id,
      );
      expect(mapped.data.status).toBe("open");
      expect(mapped.data.severity).toBe("high");
      expect(mapped.data.isAcknowledged).toBe(false);
      expect(mapped.data.customerDisplayName).toBe("Acme");
      expect(mapped.data.programName).toBe("Growth");
      expect(mapped.data.ageCalendarDays).toBe(4);
      expect(mapped.data.derived.isTerminal).toBe(false);
      expect(mapped.data.derived.isArchived).toBe(false);
    }
  });

  it("maps acknowledged, assigned, resolved, dismissed, and archived states", () => {
    const acknowledged = mapAttentionItemListItem({
      ...sampleAttentionItemListRow,
      status: "acknowledged",
      acknowledged_at: "2026-08-02T10:00:00.000Z",
      assignee_member_id: "33333333-3333-4333-8333-333333333333",
    });
    expect(acknowledged.ok).toBe(true);
    if (acknowledged.ok) {
      expect(acknowledged.data.isAcknowledged).toBe(true);
      expect(acknowledged.data.assigneeMemberId).toBe(
        "33333333-3333-4333-8333-333333333333",
      );
    }

    const resolved = mapAttentionItemDetail({
      ...sampleAttentionItemDetailRow,
      status: "resolved",
      resolved_at: "2026-08-03T10:00:00.000Z",
      resolution_reason: "Student returned",
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.data.derived.isResolved).toBe(true);
      expect(resolved.data.derived.isTerminal).toBe(true);
      expect(resolved.data.resolutionReason).toBe("Student returned");
    }

    const dismissed = mapAttentionItemDetail({
      ...sampleAttentionItemDetailRow,
      status: "dismissed",
      dismissed_at: "2026-08-03T10:00:00.000Z",
      dismissal_reason: "False positive",
    });
    expect(dismissed.ok).toBe(true);
    if (dismissed.ok) {
      expect(dismissed.data.derived.isDismissed).toBe(true);
      expect(dismissed.data.dismissalReason).toBe("False positive");
    }

    const archived = mapAttentionItemListItem({
      ...sampleAttentionItemListRow,
      status: "resolved",
      archived_at: "2026-08-04T10:00:00.000Z",
    });
    expect(archived.ok).toBe(true);
    if (archived.ok) {
      expect(archived.data.derived.isArchived).toBe(true);
    }
  });

  it("maps signals and events and sanitizes payload", () => {
    const signal = mapAttentionSignal(sampleAttentionSignalRow);
    expect(signal.ok).toBe(true);
    if (signal.ok) {
      expect(signal.data.signalOrigin).toBe("rule");
      expect(signal.data.ruleKey).toBe("enrollment_no_recent_progress");
      expect(signal.data.evidence.kind).toBe("stale_progress");
    }

    const event = mapAttentionEvent({
      ...sampleAttentionEventRow,
      payload: {
        rule_key: "enrollment_no_recent_progress",
        nested: { secret: true },
      },
    });
    expect(event.ok).toBe(true);
    if (event.ok) {
      expect(event.data.eventType).toBe("created");
      expect(event.data.payload).toEqual({
        rule_key: "enrollment_no_recent_progress",
      });
    }
  });

  it("fails closed on unknown status, severity, signal origin, and evidence", () => {
    expect(
      mapAttentionItemListItem({
        ...sampleAttentionItemListRow,
        status: "snoozed",
      }).ok,
    ).toBe(false);

    expect(
      mapAttentionItemListItem({
        ...sampleAttentionItemListRow,
        severity: "urgent",
      }).ok,
    ).toBe(false);

    expect(
      mapAttentionSignal({
        ...sampleAttentionSignalRow,
        signal_origin: "ai",
      }).ok,
    ).toBe(false);

    expect(
      mapAttentionSignal({
        ...sampleAttentionSignalRow,
        evidence: { kind: "unknown_kind" },
      }).ok,
    ).toBe(false);

    expect(
      mapAttentionEvent({
        ...sampleAttentionEventRow,
        event_type: "reopened",
      }).ok,
    ).toBe(false);
  });
});
