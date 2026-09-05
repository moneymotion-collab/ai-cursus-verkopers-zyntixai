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
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import { evaluateNextBestAction } from "@/features/nba/domain/evaluate-next-best-action";
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
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";

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

vi.mock("@/features/attention/server/load-attention-assignee-options", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/attention/server/load-attention-assignee-options")
  >("@/features/attention/server/load-attention-assignee-options");
  return {
    ...actual,
    loadAttentionAssigneeOptions: vi.fn(async () => ({
      members: [{ value: MEMBER_ID, label: "Alex Owner" }],
      capped: false,
      failed: false,
    })),
  };
});

const nbaEvaluateActual = await vi.importActual<
  typeof import("@/features/nba/domain/evaluate-next-best-action")
>("@/features/nba/domain/evaluate-next-best-action");

vi.mock("@/features/nba/domain/evaluate-next-best-action", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/nba/domain/evaluate-next-best-action")
  >("@/features/nba/domain/evaluate-next-best-action");
  return {
    ...actual,
    evaluateNextBestAction: vi.fn(actual.evaluateNextBestAction),
  };
});

const pageOrgMock = vi.mocked(resolveAttentionPageOrganization);
const detailMock = vi.mocked(getAttentionItemById);
const evaluateNbaMock = vi.mocked(evaluateNextBestAction);

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
    moduleAccess: mockKnowledgeProductModuleAccess(),
  };
}

type SampleDetailOptions = {
  events?: boolean;
  signals?: boolean;
  status?: "open" | "acknowledged" | "resolved" | "dismissed" | "expired";
  archivedAt?: string | null;
  assigneeMemberId?: string | null;
  enrollment?: boolean;
  customer?: boolean;
  signalMode?: "stale" | "manual" | "none";
};

function sampleDetail(options: SampleDetailOptions | boolean = true, signalsArg = true) {
  // Backward-compatible overload used by existing tests: sampleDetail(events, signals)
  const opts: SampleDetailOptions =
    typeof options === "boolean"
      ? { events: options, signals: signalsArg }
      : options;

  const events = opts.events !== false;
  const includeSignals = opts.signals !== false && opts.signalMode !== "none";
  const status = opts.status ?? "open";
  const archivedAt = opts.archivedAt ?? null;
  const assigneeMemberId =
    opts.assigneeMemberId === undefined ? null : opts.assigneeMemberId;
  const withEnrollment = opts.enrollment !== false;
  const withCustomer = opts.customer !== false;
  const signalMode = opts.signalMode ?? (includeSignals ? "stale" : "none");

  const signalRow =
    signalMode === "manual"
      ? {
          ...sampleAttentionSignalRow,
          signal_origin: "manual",
          rule_key: null,
          explanation: "Manual note",
          evidence: { kind: "manual_note", note: "private" },
        }
      : sampleAttentionSignalRow;

  const signal = mapAttentionSignal(signalRow);
  const event = mapAttentionEvent(sampleAttentionEventRow);
  expect(signal.ok).toBe(true);
  expect(event.ok).toBe(true);
  if (!signal.ok || !event.ok) {
    throw new Error("fixture map failed");
  }

  const mapped = mapAttentionItemDetail(
    {
      ...sampleAttentionItemDetailRow,
      status,
      assignee_member_id: assigneeMemberId,
      archived_at: archivedAt,
      acknowledged_at:
        status === "acknowledged" || status === "resolved"
          ? "2026-08-02T10:00:00.000Z"
          : null,
      resolved_at: status === "resolved" ? "2026-08-03T10:00:00.000Z" : null,
      dismissed_at: status === "dismissed" ? "2026-08-03T10:00:00.000Z" : null,
      expired_at: status === "expired" ? "2026-08-03T10:00:00.000Z" : null,
    },
    {
      enrollment: withEnrollment
        ? {
            id: ENROLLMENT_ID,
            status: "active",
            archivedAt: null,
            customerId: CUSTOMER_ID,
            programId: PROGRAM_ID,
          }
        : null,
      customer: withCustomer
        ? {
            id: CUSTOMER_ID,
            displayName: "Acme Corp",
            status: "active",
            archivedAt: null,
          }
        : null,
      program: {
        id: PROGRAM_ID,
        name: "Growth Lab",
        status: "active",
        archivedAt: null,
      },
      signals: includeSignals ? [signal.data] : [],
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
    },
  );
  expect(mapped.ok).toBe(true);
  if (!mapped.ok) {
    throw new Error("detail map failed");
  }
  return mapped.data;
}

describe("attention detail page loader (B1.7.5-D)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    evaluateNbaMock.mockImplementation(nbaEvaluateActual.evaluateNextBestAction);
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
    expect(JSON.stringify(missing)).not.toContain("nextBestAction");
    expect(JSON.stringify(denied)).not.toContain("nextBestAction");
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
    expect(result.data.assigneeMemberId).toBeNull();
    expect(result.data.assigneeOptions).toEqual([
      { value: MEMBER_ID, label: "Alex Owner" },
    ]);
    expect(result.data.assigneeOptionsFailed).toBe(false);
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
    expect(result.moduleAccess.resolution).toBe("resolved");
    if (result.moduleAccess.resolution === "resolved") {
      expect(result.moduleAccess.navVisibility.attention).toBe(true);
    }
  });

  it("builds the Site link carried by Work Order Attention context", async () => {
    const workOrderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const siteId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    pageOrgMock.mockResolvedValue(readyOrg("staff"));
    detailMock.mockResolvedValue({
      ok: true,
      data: {
        ...sampleDetail(),
        workOrder: {
          id: workOrderId,
          title: "Install equipment",
          status: "scheduled",
          siteId,
          scheduledFor: "2026-09-05T10:00:00.000Z",
        },
      },
    });

    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.workOrderHref).toBe(`/work-orders/${workOrderId}?org=${ORG_ID}`);
    expect(result.data.siteHref).toBe(`/sites/${siteId}?org=${ORG_ID}`);
  });

  it("does not load assignee options for viewers", async () => {
    const { loadAttentionAssigneeOptions } = await import(
      "@/features/attention/server/load-attention-assignee-options"
    );
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    detailMock.mockResolvedValue({ ok: true, data: sampleDetail() });

    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.assigneeOptions).toEqual([]);
    expect(loadAttentionAssigneeOptions).not.toHaveBeenCalled();
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

describe("attention detail page loader NBA-I enrichment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    evaluateNbaMock.mockImplementation(nbaEvaluateActual.evaluateNextBestAction);
  });

  it("I1: open Attention yields acknowledge NBA", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({ status: "open", signalMode: "stale" }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction?.actionType).toBe("acknowledge_attention");
  });

  it("I2: acknowledged + unassigned yields assign NBA", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({
        status: "acknowledged",
        assigneeMemberId: null,
        signalMode: "manual",
      }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction?.actionType).toBe(
      "assign_attention_owner",
    );
  });

  it("I3: acknowledged + assigned + stale yields review_progress", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({
        status: "acknowledged",
        assigneeMemberId: MEMBER_ID,
        signalMode: "stale",
      }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction?.actionType).toBe("review_progress");
  });

  it("I9: terminal Attention yields null NBA", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({ status: "resolved", assigneeMemberId: MEMBER_ID }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction).toBeNull();
  });

  it("I10: archived Attention yields null NBA", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({
        status: "resolved",
        archivedAt: "2026-08-04T10:00:00.000Z",
      }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction).toBeNull();
  });

  it("I11: foreign/unavailable source keeps unavailable and leaks no NBA", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: false,
      error: {
        code: "ATTENTION_ITEM_UNAVAILABLE",
        message: "Attention item unavailable.",
        retryable: false,
        category: "not_found",
      },
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("attention_unavailable");
    expect(JSON.stringify(result)).not.toContain("nextBestAction");
    expect(evaluateNbaMock).not.toHaveBeenCalled();
  });

  it("I12: Viewer gets semantic NBA without mutation permission increase", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({ status: "open" }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction?.actionType).toBe("acknowledge_attention");
    expect(result.capabilities.canAcknowledge).toBe(false);
    expect(result.capabilities.canAssign).toBe(false);
    expect(resolveAttentionPermissions("viewer").canAcknowledge).toBe(false);
  });

  it("I13: NBA result exposes no raw signal/evidence payload", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({ status: "open", signalMode: "stale" }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    const nbaJson = JSON.stringify(result.data.nextBestAction);
    expect(nbaJson).not.toContain("private");
    expect(nbaJson).not.toContain("citedProgressFactIds");
    expect(nbaJson).not.toContain("signals");
    expect(result.data.nextBestAction).not.toHaveProperty("signals");
    expect(result.data.nextBestAction?.evidenceSummary.staleProgressEvidence).toBe(
      true,
    );
  });

  it("I14/I15: NBA path uses only getAttentionItemById and performs no writes", async () => {
    const reads = await import("@/features/attention/server/attention-read-queries");
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({ ok: true, data: sampleDetail() });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    expect(detailMock).toHaveBeenCalledTimes(1);
    expect(reads.listAttentionEventsForItem).not.toHaveBeenCalled();
    expect(evaluateNbaMock).toHaveBeenCalledTimes(1);
  });

  it("I16: open + stale still yields acknowledge", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({
        status: "open",
        assigneeMemberId: MEMBER_ID,
        signalMode: "stale",
      }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction?.actionType).toBe("acknowledge_attention");
  });

  it("I17: acknowledged + unassigned + stale still yields assign", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({
      ok: true,
      data: sampleDetail({
        status: "acknowledged",
        assigneeMemberId: null,
        signalMode: "stale",
      }),
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction?.actionType).toBe(
      "assign_attention_owner",
    );
  });

  it("I18: NBA evaluation failure yields null while detail succeeds", async () => {
    pageOrgMock.mockResolvedValue(readyOrg());
    detailMock.mockResolvedValue({ ok: true, data: sampleDetail() });
    evaluateNbaMock.mockImplementation(() => {
      throw new Error("nba boom");
    });
    const result = await loadAttentionDetailPage(
      createSupabase(),
      ATTENTION_ITEM_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.nextBestAction).toBeNull();
    expect(result.data.detail.titleLabel).toBe("No recent progress");
  });
});
