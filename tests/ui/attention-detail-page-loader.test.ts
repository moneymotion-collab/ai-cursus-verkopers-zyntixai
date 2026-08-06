import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadAttentionDetailPage } from "@/features/attention/ui/load-attention-detail-page";
import { resolveAttentionPageOrganization } from "@/features/attention/server/resolve-attention-page-organization";
import { getAttentionItemById } from "@/features/attention/server/attention-read-queries";
import {
  mapAttentionEvent,
  mapAttentionItemDetail,
  mapAttentionSignal,
} from "@/features/attention/server/map-attention-read-model";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import { canShowAttentionLifecycleActions } from "@/features/attention/ui/attention-workflow-visibility";
import {
  ATTENTION_ITEM_ID,
  CUSTOMER_ID,
  ENROLLMENT_ID,
  EVENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  sampleAttentionEventRow,
  sampleAttentionItemDetailRow,
  sampleAttentionSignalRow,
} from "../helpers/attention-test-fixtures";

vi.mock("@/features/attention/server/resolve-attention-page-organization", () => ({
  resolveAttentionPageOrganization: vi.fn(),
}));

vi.mock("@/features/attention/server/attention-read-queries", () => ({
  getAttentionItemById: vi.fn(),
  listAttentionEventsForItem: vi.fn(),
}));

vi.mock("@/features/enrollments/server/resolve-enrollment-labels", () => ({
  resolveMemberLabels: vi.fn(async () => ({ [MEMBER_ID]: "Alex Owner" })),
  resolveMemberLabel: vi.fn((memberId: string | null | undefined, labels: Record<string, string>) => {
    if (!memberId) return "Unassigned";
    return labels[memberId] ?? "Unavailable member";
  }),
}));

const pageOrgMock = vi.mocked(resolveAttentionPageOrganization);
const detailMock = vi.mocked(getAttentionItemById);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

function readyOrg(role: "owner" | "admin" | "staff" | "viewer" = "owner") {
  return {
    kind: "ready" as const,
    organizationId: ORG_ID,
    organizationName: "Acme",
    organizationOptions: [
      { organizationId: ORG_ID, displayName: "Acme", role },
    ],
    role,
    timezone: "UTC",
    isMultiOrganization: false,
  };
}

function sampleDetail(events = true, signals = true) {
  const signal = mapAttentionSignal(sampleAttentionSignalRow);
  const event = mapAttentionEvent(sampleAttentionEventRow);
  expect(signal.ok).toBe(true);
  expect(event.ok).toBe(true);
  if (!signal.ok || !event.ok) {
    throw new Error("fixture map failed");
  }

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
    signals: signals ? [signal.data] : [],
    events: events
      ? [
          event.data,
          {
            ...event.data,
            id: "99999999-9999-4999-8999-999999999999",
            eventType: "status_changed",
            fromStatus: "open",
            toStatus: "acknowledged",
            createdAt: "2026-08-02T10:00:00.000Z",
            actorMemberId: MEMBER_ID,
            payload: { secret: "must-not-leak" },
          },
        ]
      : [],
  });
  expect(mapped.ok).toBe(true);
  if (!mapped.ok) {
    throw new Error("detail map failed");
  }
  return mapped.data;
}

describe("attention detail page loader (B1.7.5-D)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps organization gate states without calling getAttentionItemById", async () => {
    pageOrgMock.mockResolvedValue({ kind: "auth_required" });
    expect(
      await loadAttentionDetailPage(createSupabase(), ATTENTION_ITEM_ID, {}),
    ).toEqual({ kind: "auth_required" });
    expect(detailMock).not.toHaveBeenCalled();
  });

  it("returns uniform unavailable for malformed ids without calling the read service", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    const result = await loadAttentionDetailPage(
      createSupabase(),
      "not-a-uuid",
      { org: ORG_ID },
    );
    expect(result.kind).toBe("attention_unavailable");
    if (result.kind !== "attention_unavailable") return;
    expect(result.backHref).toBe(`/attention?org=${ORG_ID}`);
    expect(detailMock).not.toHaveBeenCalled();
  });

  it("returns uniform unavailable for missing and cross-tenant style errors", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    detailMock.mockResolvedValue({
      ok: false,
      error: {
        code: "ATTENTION_ITEM_UNAVAILABLE",
        message: "Attention item unavailable.",
        retryable: false,
        category: "not_found",
      },
    });

    const missing = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(missing.kind).toBe("attention_unavailable");

    detailMock.mockResolvedValue({
      ok: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "Permission denied.",
        retryable: false,
        category: "permission",
      },
    });
    const denied = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(denied.kind).toBe("attention_unavailable");
    expect(JSON.stringify(missing)).not.toContain("tenant");
    expect(JSON.stringify(denied)).not.toContain("tenant");
  });

  it("loads authorized detail with timeline order and safe return list state", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    detailMock.mockResolvedValue({ ok: true, data: sampleDetail() });

    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      {
        org: ORG_ID,
        status: "open",
        page: "2",
        sort: "severity",
        direction: "asc",
      },
    );

    expect(detailMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;

    expect(result.data.detail.titleLabel).toBe("No recent progress");
    expect(result.data.detail.statusLabel).toBe("Open");
    expect(result.data.detail.customerLabel).toBe("Acme Corp");
    expect(result.data.backHref).toContain(`org=${ORG_ID}`);
    expect(result.data.backHref).toContain("status=open");
    expect(result.data.backHref).toContain("page=2");
    expect(result.data.backHref).toContain("sort=severity");
    expect(result.data.backHref).toContain("direction=asc");
    expect(result.data.backHref.startsWith("/attention?")).toBe(true);
    expect(result.data.backHref).not.toMatch(/^https?:/);
    expect(result.data.timeline).toHaveLength(2);
    expect(result.data.timeline[0]?.eventTypeLabel).toBe("Created");
    expect(result.data.timeline[1]?.eventTypeLabel).toBe("Status changed");
    expect(result.data.timeline[1]?.actorLabel).toBe("Alex Owner");
    expect(JSON.stringify(result.data.timeline)).not.toContain("must-not-leak");
    expect(JSON.stringify(result.data.timeline)).not.toContain("payload");
    expect(result.data.signals).toHaveLength(1);
    expect(result.data.signals[0]?.explanationLabel).toContain("No progress");
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_NAV_VISIBLE).toBe(true);
  });

  it("supports empty timeline and ignores unsafe external return destinations", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail(false, false),
    });

    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      {
        org: ORG_ID,
        returnTo: "https://evil.example/phish",
        next: "//evil.example",
      },
    );

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.timelineEmpty).toBe(true);
    expect(result.data.timeline).toEqual([]);
    expect(result.data.backHref).toBe(`/attention?org=${ORG_ID}`);
    expect(result.data.backHref).not.toContain("evil");
    expect(result.data.backHref).not.toContain("returnTo");
  });

  it("maps application errors without leaking technical causes", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Service temporarily unavailable.",
        retryable: true,
        category: "server",
        cause: "secret-db-detail",
      },
    });

    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("query_error");
    if (result.kind !== "query_error") return;
    expect(result.message).not.toContain("secret-db-detail");
  });

  it("does not import or call listAttentionEventsForItem for the detail page", async () => {
    const reads = await import("@/features/attention/server/attention-read-queries");
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({ ok: true, data: sampleDetail() });
    await loadAttentionDetailPage(createSupabase(), ATTENTION_ITEM_ID, {
      org: ORG_ID,
    });
    expect(reads.listAttentionEventsForItem).not.toHaveBeenCalled();
    expect(EVENT_ID).toBeTruthy();
  });
});
