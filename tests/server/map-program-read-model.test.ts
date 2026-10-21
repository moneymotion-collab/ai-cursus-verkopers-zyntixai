import { describe, expect, it } from "vitest";
import {
  mapProgramDetail,
  mapProgramListItem,
  mapProgramStatusHistoryEntry,
} from "@/features/programs/server/map-program-read-model";

describe("mapProgramReadModel", () => {
  it("maps list and detail rows into domain models", () => {
    const list = mapProgramListItem(
      {
        id: "22222222-2222-4222-8222-222222222222",
        organization_id: "11111111-1111-4111-8111-111111111111",
        name: "Growth Lab",
        status: "active",
        delivery_mode: "cohort",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        archived_at: null,
      },
      3,
    );

    expect(list.statusLabel).toBe("Active");
    expect(list.deliveryModeLabel).toBe("Cohort");
    expect(list.openEnrollmentCount).toBe(3);
    expect(list.derived.isArchived).toBe(false);

    const detail = mapProgramDetail(
      {
        id: list.id,
        organization_id: list.organizationId,
        name: list.name,
        description: "Desc",
        status: "draft",
        delivery_mode: "self_paced",
        created_by_member_id: "33333333-3333-4333-8333-333333333333",
        created_at: list.createdAt,
        updated_at: list.updatedAt,
        archived_at: null,
      },
      0,
    );

    expect(detail.derived.allowedTransitions).toEqual(["active", "retired"]);
  });

  it("maps history rows including null from_status", () => {
    const entry = mapProgramStatusHistoryEntry({
      id: "44444444-4444-4444-8444-444444444444",
      organization_id: "11111111-1111-4111-8111-111111111111",
      program_id: "22222222-2222-4222-8222-222222222222",
      from_status: null,
      to_status: "draft",
      changed_by_member_id: null,
      reason: null,
      source: "manual",
      changed_at: "2026-01-01T00:00:00.000Z",
    });

    expect(entry.fromStatus).toBeNull();
    expect(entry.toStatusLabel).toBe("Draft");
  });
});
