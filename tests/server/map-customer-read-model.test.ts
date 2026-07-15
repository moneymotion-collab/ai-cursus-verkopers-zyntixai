import { describe, expect, it } from "vitest";
import {
  mapCustomerDetail,
  mapCustomerEnrollmentSummary,
  mapCustomerListItem,
  mapCustomerStatusHistoryEntry,
} from "@/features/customers/server/map-customer-read-model";

const NOW = "2026-07-14T10:00:00.000Z";

describe("mapCustomerReadModel", () => {
  it("maps list items with owner labels", () => {
    const item = mapCustomerListItem(
      {
        id: "11111111-1111-4111-8111-111111111111",
        organization_id: "22222222-2222-4222-8222-222222222222",
        display_name: "Acme Corp",
        status: "active",
        email: "ops@acme.test",
        owner_member_id: "33333333-3333-4333-8333-333333333333",
        started_at: NOW,
        updated_at: NOW,
        archived_at: null,
      },
      "Taylor Owner",
    );

    expect(item.displayName).toBe("Acme Corp");
    expect(item.statusLabel).toBe("Active");
    expect(item.ownerLabel).toBe("Taylor Owner");
    expect(item.derived.isArchived).toBe(false);
  });

  it("maps detail with allowed transitions when not archived", () => {
    const detail = mapCustomerDetail(
      {
        id: "11111111-1111-4111-8111-111111111111",
        organization_id: "22222222-2222-4222-8222-222222222222",
        display_name: "Acme Corp",
        first_name: "Acme",
        last_name: "Corp",
        email: "ops@acme.test",
        phone: "+1",
        status: "onboarding",
        owner_member_id: null,
        created_by_member_id: "33333333-3333-4333-8333-333333333333",
        started_at: NOW,
        ended_at: null,
        archived_at: null,
        created_at: NOW,
        updated_at: NOW,
      },
      { ownerLabel: "Unassigned", createdByLabel: "Creator" },
    );

    expect(detail.derived.allowedTransitions).toEqual(["active", "cancelled"]);
    expect(detail.createdByLabel).toBe("Creator");
  });

  it("clears allowed transitions for archived customers", () => {
    const detail = mapCustomerDetail(
      {
        id: "11111111-1111-4111-8111-111111111111",
        organization_id: "22222222-2222-4222-8222-222222222222",
        display_name: "Archived",
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        status: "active",
        owner_member_id: null,
        created_by_member_id: null,
        started_at: NOW,
        ended_at: null,
        archived_at: NOW,
        created_at: NOW,
        updated_at: NOW,
      },
      { ownerLabel: "Unassigned", createdByLabel: "Unassigned" },
    );

    expect(detail.derived.isArchived).toBe(true);
    expect(detail.derived.allowedTransitions).toEqual([]);
  });

  it("maps status history with labels", () => {
    const entry = mapCustomerStatusHistoryEntry(
      {
        id: "44444444-4444-4444-8444-444444444444",
        organization_id: "22222222-2222-4222-8222-222222222222",
        customer_id: "11111111-1111-4111-8111-111111111111",
        from_status: "onboarding",
        to_status: "active",
        changed_by_member_id: "33333333-3333-4333-8333-333333333333",
        reason: "Started",
        source: "manual",
        changed_at: NOW,
      },
      "Taylor Owner",
    );

    expect(entry.fromStatusLabel).toBe("Onboarding");
    expect(entry.toStatusLabel).toBe("Active");
    expect(entry.changedByLabel).toBe("Taylor Owner");
  });

  it("maps enrollment summaries with program names", () => {
    const summary = mapCustomerEnrollmentSummary(
      {
        id: "55555555-5555-4555-8555-555555555555",
        program_id: "66666666-6666-4666-8666-666666666666",
        status: "active",
        enrolled_at: NOW,
      },
      "Trading Foundations",
    );

    expect(summary.programName).toBe("Trading Foundations");
    expect(summary.statusLabel).toBe("Active");
  });
});
