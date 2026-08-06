import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { resolveAttentionLifecycleActionVisibility } from "@/features/attention/domain/lifecycle-visibility";
import type { AttentionRole } from "@/features/attention/domain/types";
import { AttentionDetail } from "@/features/attention/ui/attention-detail";
import type { AttentionDetailViewModel } from "@/features/attention/ui/load-attention-detail-page";
import {
  canShowAttentionAcknowledgeSeverityActions,
  canShowAttentionArchiveAction,
  canShowAttentionAssignmentActions,
  canShowAttentionLifecycleActions,
  canShowAttentionResolutionDismissActions,
} from "@/features/attention/ui/attention-workflow-visibility";
import {
  ATTENTION_ITEM_ID,
  MEMBER_ID,
  ORG_ID,
} from "../helpers/attention-test-fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/features/attention/actions/lifecycle-attention-actions", () => ({
  acknowledgeAttentionItemAction: vi.fn(),
  updateAttentionSeverityAction: vi.fn(),
  assignAttentionItemAction: vi.fn(),
  resolveAttentionItemAction: vi.fn(),
  dismissAttentionItemAction: vi.fn(),
  archiveAttentionItemAction: vi.fn(),
}));

const baseViewModel: AttentionDetailViewModel = {
  detail: {
    id: ATTENTION_ITEM_ID,
    titleLabel: "No recent progress",
    summaryLabel: "Enrollment went quiet",
    statusLabel: "Open",
    severityLabel: "High",
    attentionTypeLabel: "No recent progress",
    customerLabel: "Acme Corp",
    programLabel: "Growth Lab",
    enrollmentStatusLabel: "Active",
    assigneeLabel: "Unassigned",
    acknowledgementLabel: "Not acknowledged",
    firstDetectedAtLabel: "Aug 1, 2026, 10:00 AM",
    lastDetectedAtLabel: "Aug 1, 2026, 10:00 AM",
    createdAtLabel: "Aug 1, 2026, 10:00 AM",
    updatedAtLabel: "Aug 1, 2026, 10:00 AM",
    resolvedAtLabel: null,
    dismissedAtLabel: null,
    expiredAtLabel: null,
    archivedAtLabel: null,
    resolutionReasonLabel: null,
    dismissalReasonLabel: null,
    detectionCountLabel: "1",
    isArchived: false,
    isTerminal: false,
    severityKey: "high",
    statusKey: "open",
  },
  signals: [],
  timeline: [],
  timelineEmpty: true,
  customerHref: null,
  programHref: null,
  enrollmentHref: null,
  backHref: `/attention?org=${ORG_ID}`,
  organizationTimezone: "UTC",
  assigneeMemberId: null,
  assigneeOptions: [{ value: MEMBER_ID, label: "Alex Owner" }],
  assigneeOptionsFailed: false,
};

function renderDetail(
  role: AttentionRole,
  overrides: Partial<AttentionDetailViewModel> = {},
  detailOverrides: Partial<AttentionDetailViewModel["detail"]> = {},
) {
  return renderToStaticMarkup(
    <AttentionDetail
      viewModel={{
        ...baseViewModel,
        ...overrides,
        detail: {
          ...baseViewModel.detail,
          ...detailOverrides,
        },
      }}
      organizationId={ORG_ID}
      role={role}
    />,
  );
}

function actionPresence(html: string) {
  return {
    acknowledge: html.includes(">Acknowledge<"),
    severity: html.includes("Save severity"),
    assign: html.includes("Save assignment"),
    unassign: html.includes(">Unassign<"),
    resolve: html.includes(">Resolve<"),
    dismiss: html.includes(">Dismiss<"),
    archive: html.includes(">Archive<") || html.includes("Confirm archive"),
  };
}

describe("integrated attention lifecycle matrix (B1.7.6-E)", () => {
  it("keeps product gates narrow while B–E remain independently enabled", () => {
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(canShowAttentionAcknowledgeSeverityActions()).toBe(true);
    expect(canShowAttentionAssignmentActions()).toBe(true);
    expect(canShowAttentionResolutionDismissActions()).toBe(true);
    expect(canShowAttentionArchiveAction()).toBe(true);
  });

  it("matches role × state visibility for open items", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      const html = renderDetail(role);
      expect(actionPresence(html)).toEqual({
        acknowledge: true,
        severity: true,
        assign: true,
        unassign: false,
        resolve: true,
        dismiss: true,
        archive: false,
      });
    }

    const viewer = actionPresence(renderDetail("viewer"));
    expect(viewer).toEqual({
      acknowledge: false,
      severity: false,
      assign: false,
      unassign: false,
      resolve: false,
      dismiss: false,
      archive: false,
    });
  });

  it("matches acknowledged and assigned visibility", () => {
    const html = renderDetail(
      "admin",
      { assigneeMemberId: MEMBER_ID },
      {
        statusKey: "acknowledged",
        statusLabel: "Acknowledged",
        assigneeLabel: "Alex Owner",
      },
    );
    expect(actionPresence(html)).toEqual({
      acknowledge: false,
      severity: true,
      assign: true,
      unassign: true,
      resolve: true,
      dismiss: true,
      archive: false,
    });
  });

  it("shows Archive only for owner/admin on terminal non-archived items", () => {
    for (const statusKey of ["resolved", "dismissed", "expired"] as const) {
      for (const role of ["owner", "admin"] as const) {
        const html = renderDetail(
          role,
          {},
          {
            statusKey,
            statusLabel:
              statusKey === "resolved"
                ? "Resolved"
                : statusKey === "dismissed"
                  ? "Dismissed"
                  : "Expired",
            isTerminal: true,
          },
        );
        expect(actionPresence(html)).toEqual({
          acknowledge: false,
          severity: false,
          assign: false,
          unassign: false,
          resolve: false,
          dismiss: false,
          archive: true,
        });
      }

      for (const role of ["staff", "viewer"] as const) {
        const html = renderDetail(
          role,
          {},
          {
            statusKey,
            statusLabel: "Resolved",
            isTerminal: true,
          },
        );
        expect(actionPresence(html).archive).toBe(false);
        expect(actionPresence(html).resolve).toBe(false);
      }
    }
  });

  it("hides all mutation controls on archived items for every role", () => {
    for (const role of ["owner", "admin", "staff", "viewer"] as const) {
      const html = renderDetail(
        role,
        { assigneeMemberId: MEMBER_ID },
        {
          statusKey: "resolved",
          statusLabel: "Resolved",
          isTerminal: true,
          isArchived: true,
          archivedAtLabel: "Aug 5, 2026, 10:00 AM",
        },
      );
      expect(actionPresence(html)).toEqual({
        acknowledge: false,
        severity: false,
        assign: false,
        unassign: false,
        resolve: false,
        dismiss: false,
        archive: false,
      });
    }
  });

  it("aligns helper visibility with rendered product gates", () => {
    const openOwner = resolveAttentionLifecycleActionVisibility("owner", {
      status: "open",
      archivedAt: null,
      assigneeMemberId: null,
    });
    expect(openOwner.archive).toBe(false);
    expect(openOwner.resolve).toBe(true);

    const terminalStaff = resolveAttentionLifecycleActionVisibility("staff", {
      status: "expired",
      archivedAt: null,
    });
    expect(terminalStaff.archive).toBe(false);

    const terminalOwner = resolveAttentionLifecycleActionVisibility("owner", {
      status: "dismissed",
      archivedAt: null,
    });
    expect(terminalOwner.archive).toBe(true);
  });
});
