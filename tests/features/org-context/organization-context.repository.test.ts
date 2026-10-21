import { describe, expect, it } from "vitest";
import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import { ORG_A, ORG_B } from "./catalog-fixture";
import {
  createOrgContextMemoryClient,
  type OrgContextMemoryTables,
} from "./memory-query-client";

function tables(): OrgContextMemoryTables {
  return {
    organizations: [
      { id: ORG_A, status: "active", locale: "nl-NL" },
      { id: ORG_B, status: "active", locale: null },
    ],
    organization_business_activities: [
      {
        id: "activity-a",
        organization_id: ORG_A,
        activity_key: "alpha",
        display_name: "Alpha",
        status: "active",
        is_primary: true,
        classification_kind: "niche",
        foundation_id: null,
        industry_id: null,
        niche_id: "tax-niche-ocb",
        specialization_id: null,
        deep_specialization_id: null,
        created_at: "2026-08-25T10:00:00.000Z",
        updated_at: "2026-08-25T10:00:00.000Z",
      },
      {
        id: "activity-b",
        organization_id: ORG_B,
        activity_key: "beta",
        display_name: "Beta",
        status: "draft",
        is_primary: false,
        classification_kind: null,
        foundation_id: null,
        industry_id: null,
        niche_id: null,
        specialization_id: null,
        deep_specialization_id: null,
        created_at: "2026-08-25T10:01:00.000Z",
        updated_at: "2026-08-25T10:01:00.000Z",
      },
    ],
    organization_context_assignments: [
      {
        id: "assign-old",
        organization_id: ORG_A,
        business_activity_id: "activity-a",
        context_pack_version_id: "ver-ocb-1",
        status: "superseded",
        source: "platform_operator",
        actor_user_id: "user-operator",
        actor_member_id: null,
        reason: "first pin",
        created_at: "2026-08-25T10:02:00.000Z",
        updated_at: "2026-08-25T10:03:00.000Z",
        superseded_at: "2026-08-25T10:03:00.000Z",
      },
      {
        id: "assign-active",
        organization_id: ORG_A,
        business_activity_id: "activity-a",
        context_pack_version_id: "ver-ocb-2",
        status: "active",
        source: "platform_operator",
        actor_user_id: "user-operator",
        actor_member_id: null,
        reason: "switch",
        created_at: "2026-08-25T10:03:00.000Z",
        updated_at: "2026-08-25T10:03:00.000Z",
        superseded_at: null,
      },
    ],
    organization_context_assignment_events: [],
  };
}

describe("OrganizationContextRepository tenant honesty", () => {
  const repo = new OrganizationContextRepository(createOrgContextMemoryClient(tables()));

  it("lists only the explicit Organization's activities", async () => {
    const listed = await repo.listBusinessActivities(ORG_A);
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.value.map((activity) => activity.activityId)).toEqual(["activity-a"]);
  });

  it("returns the active primary or null when zero primary exist", async () => {
    const primaryA = await repo.getPrimaryBusinessActivity(ORG_A);
    const primaryB = await repo.getPrimaryBusinessActivity(ORG_B);
    expect(primaryA).toMatchObject({
      ok: true,
      value: { activityId: "activity-a", isPrimary: true },
    });
    expect(primaryB).toMatchObject({ ok: true, value: null });
  });

  it("refuses to fetch Organization A activity through Organization B", async () => {
    const result = await repo.getBusinessActivity(ORG_B, "activity-a");
    expect(result).toMatchObject({
      ok: false,
      error: { code: "ACTIVITY_NOT_OWNED_BY_ORG" },
    });
  });

  it("returns ACTIVITY_NOT_FOUND for an unknown activity in the requested Organization", async () => {
    const result = await repo.getBusinessActivity(ORG_A, "missing");
    expect(result).toMatchObject({
      ok: false,
      error: { code: "ACTIVITY_NOT_FOUND" },
    });
  });

  it("returns assignment history as canonical rows, not audit events", async () => {
    const history = await repo.getAssignmentHistory(ORG_A, "activity-a");
    expect(history.ok).toBe(true);
    if (!history.ok) return;
    expect(history.value.map((row) => row.assignmentId)).toEqual([
      "assign-old",
      "assign-active",
    ]);
    expect(history.value.map((row) => row.status)).toEqual(["superseded", "active"]);
    const pin = await repo.getPinnedContextVersion(ORG_A, "activity-a");
    expect(pin).toMatchObject({
      ok: true,
      value: { assignmentId: "assign-active", contextPackVersionId: "ver-ocb-2" },
    });
  });

  it("loads Organization locale as optional metadata", async () => {
    const localeA = await repo.getOrganizationLocale(ORG_A);
    const localeB = await repo.getOrganizationLocale(ORG_B);
    expect(localeA).toMatchObject({ ok: true, value: "nl-NL" });
    expect(localeB).toMatchObject({ ok: true, value: null });
  });

  it("does not leak Organization B history through Organization A", async () => {
    const history = await repo.getAssignmentHistory(ORG_A, "activity-b");
    expect(history).toMatchObject({
      ok: false,
      error: { code: "ACTIVITY_NOT_OWNED_BY_ORG" },
    });
  });
});
