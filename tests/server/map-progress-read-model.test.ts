import { describe, expect, it } from "vitest";
import {
  mapProgressFactDetail,
  mapProgressFactListItem,
} from "@/features/progress/server/map-progress-read-model";
import {
  sampleProgressFactDetailRow,
  sampleProgressFactListRow,
} from "../helpers/progress-test-fixtures";

describe("mapProgressFactReadModel", () => {
  it("maps snake_case rows to domain list models with derived flags", () => {
    const mapped = mapProgressFactListItem(sampleProgressFactListRow, {
      customerDisplayName: "Acme",
      programName: "Growth",
    });
    expect(mapped.organizationId).toBe(sampleProgressFactListRow.organization_id);
    expect(mapped.enrollmentId).toBe(sampleProgressFactListRow.enrollment_id);
    expect(mapped.factType).toBe("milestone_reached");
    expect(mapped.source).toBe("manual");
    expect(mapped.derived.isVoided).toBe(false);
    expect(mapped.derived.isManual).toBe(true);
    expect(mapped.customerDisplayName).toBe("Acme");
    expect(mapped.programName).toBe("Growth");
  });

  it("maps detail nullable fields and voided/correction states", () => {
    const mapped = mapProgressFactDetail({
      ...sampleProgressFactDetailRow,
      source: "correction",
      corrected_from_fact_id: "66666666-6666-4666-8666-666666666666",
      voided_at: "2026-07-21T00:00:00.000Z",
      voided_by_member_id: "33333333-3333-4333-8333-333333333333",
      void_reason: "Entered twice",
      title: null,
      description: null,
      numeric_value: null,
      numeric_unit: null,
      is_complete: null,
      sequence_number: null,
    });

    expect(mapped.derived.isVoided).toBe(true);
    expect(mapped.derived.isCorrection).toBe(true);
    expect(mapped.derived.hasActiveLineagePredecessor).toBe(true);
    expect(mapped.title).toBeNull();
    expect(mapped.voidReason).toBe("Entered twice");
    expect(mapped.occurredAt).toBe(sampleProgressFactDetailRow.occurred_at);
    expect(mapped.recordedAt).toBe(sampleProgressFactDetailRow.recorded_at);
  });

  it("fails closed on unknown fact types for presentation", () => {
    const mapped = mapProgressFactListItem({
      ...sampleProgressFactListRow,
      fact_type: "unknown_type",
    });
    expect(mapped.factType).toBe("manual_observation");
  });
});
