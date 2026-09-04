import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionDetail } from "@/features/attention/ui/attention-detail";
import type { AttentionDetailViewModel } from "@/features/attention/ui/load-attention-detail-page";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import {
  canShowAttentionAcknowledgeSeverityActions,
  canShowAttentionArchiveAction,
  canShowAttentionAssignmentActions,
  canShowAttentionLifecycleActions,
  canShowAttentionResolutionDismissActions,
} from "@/features/attention/ui/attention-workflow-visibility";
import { AttentionUnavailablePanel } from "@/features/attention/ui/attention-state-panels";
import {
  ATTENTION_ITEM_ID,
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
} from "../helpers/attention-test-fixtures";
import { KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY } from "../features/product-access/module-access-fixtures";

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

const viewModel: AttentionDetailViewModel = {
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
  signals: [
    {
      id: "77777777-7777-4777-8777-777777777777",
      originLabel: "Rule",
      ruleLabel: "No recent progress",
      explanationLabel: "No progress for 14 days",
      detectedAt: "2026-08-01T10:00:00.000Z",
      detectedAtLabel: "Aug 1, 2026, 10:00 AM",
    },
  ],
  timeline: [
    {
      id: "88888888-8888-4888-8888-888888888888",
      eventTypeLabel: "Created",
      createdAt: "2026-08-01T10:00:00.000Z",
      createdAtLabel: "Aug 1, 2026, 10:00 AM",
      actorLabel: null,
      summaryLabel: "Status: Open · Severity: High",
      reasonLabel: null,
      sourceLabel: "Rule",
    },
    {
      id: "99999999-9999-4999-8999-999999999999",
      eventTypeLabel: "Status changed",
      createdAt: "2026-08-02T10:00:00.000Z",
      createdAtLabel: "Aug 2, 2026, 10:00 AM",
      actorLabel: "Alex Owner",
      summaryLabel: "Status: Open → Acknowledged",
      reasonLabel: null,
      sourceLabel: "Manual",
    },
  ],
  timelineEmpty: false,
  customerHref: `/customers/${CUSTOMER_ID}?org=${ORG_ID}`,
  programHref: `/programs/${PROGRAM_ID}?org=${ORG_ID}`,
  enrollmentHref: `/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}`,
  backHref: `/attention?org=${ORG_ID}&status=open&page=2`,
  organizationTimezone: "UTC",
  assigneeMemberId: null,
  assigneeOptions: [{ value: MEMBER_ID, label: "Alex Owner" }],
  assigneeOptionsFailed: false,
  nextBestAction: null,
};

describe("AttentionDetail presentation (B1.7.6-E)", () => {
  it("renders detail timeline with B–D scoped actions for owner open items", () => {
    const html = renderToStaticMarkup(
      <AttentionDetail viewModel={viewModel} organizationId={ORG_ID} role="owner" />,
    );

    expect(html).toContain("No recent progress");
    expect(html).toContain("Enrollment went quiet");
    expect(html).toContain("Open");
    expect(html).toContain("High");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Growth Lab");
    expect(html).toContain("Active");
    expect(html).toContain("Timeline");
    expect(html).toContain("Created");
    expect(html).toContain("Status changed");
    expect(html).toContain("Alex Owner");
    expect(html).toContain("No progress for 14 days");
    expect(html).toContain(`href="${viewModel.backHref.replace(/&/g, "&amp;")}"`);
    expect(html).toContain("Breadcrumb");
    expect(html).toContain(">Attention<");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(">Acknowledge<");
    expect(html).toContain("Save severity");
    expect(html).toContain("Assignment");
    expect(html).toContain("Save assignment");
    expect(html).toContain('for="attention-assignee-select"');
    expect(html).toContain(">Resolve<");
    expect(html).toContain(">Dismiss<");
    expect(html).not.toContain("Confirm resolve");
    expect(html).not.toContain(">Unassign<");
    expect(html).not.toMatch(/>Archive</);
    expect(html).not.toMatch(/\bClose\b/);
    expect(html).not.toContain("payload");
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(canShowAttentionAcknowledgeSeverityActions()).toBe(true);
    expect(canShowAttentionAssignmentActions()).toBe(true);
    expect(canShowAttentionResolutionDismissActions()).toBe(true);
    expect(canShowAttentionArchiveAction()).toBe(true);
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
    expect(KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY.attention).toBe(true);
  });

  it("shows Unassign only when currently assigned", () => {
    const html = renderToStaticMarkup(
      <AttentionDetail
        viewModel={{
          ...viewModel,
          assigneeMemberId: MEMBER_ID,
          detail: {
            ...viewModel.detail,
            assigneeLabel: "Alex Owner",
          },
        }}
        organizationId={ORG_ID}
        role="staff"
      />,
    );
    expect(html).toContain(">Unassign<");
    expect(html).toContain("Save assignment");
    expect(html).toContain('value="33333333-3333-4333-8333-333333333333"');
    expect(html).toContain(">Resolve<");
    expect(html).toContain(">Dismiss<");
    expect(html).not.toMatch(/>Archive</);
  });

  it("hides B–E actions for viewer and archived items", () => {
    const viewer = renderToStaticMarkup(
      <AttentionDetail viewModel={viewModel} organizationId={ORG_ID} role="viewer" />,
    );
    expect(viewer).not.toMatch(/>Acknowledge</);
    expect(viewer).not.toContain("Save severity");
    expect(viewer).not.toContain("Save assignment");
    expect(viewer).not.toContain(">Unassign<");
    expect(viewer).not.toContain(">Resolve<");
    expect(viewer).not.toContain(">Dismiss<");
    expect(viewer).not.toMatch(/>Archive</);

    const archived = renderToStaticMarkup(
      <AttentionDetail
        viewModel={{
          ...viewModel,
          assigneeMemberId: MEMBER_ID,
          detail: {
            ...viewModel.detail,
            isArchived: true,
            archivedAtLabel: "Aug 3, 2026, 10:00 AM",
            statusKey: "resolved",
            statusLabel: "Resolved",
            isTerminal: true,
          },
        }}
        organizationId={ORG_ID}
        role="owner"
      />,
    );
    expect(archived).not.toMatch(/>Acknowledge</);
    expect(archived).not.toContain("Save severity");
    expect(archived).not.toContain("Save assignment");
    expect(archived).not.toContain(">Unassign<");
    expect(archived).not.toContain(">Resolve<");
    expect(archived).not.toContain(">Dismiss<");
    expect(archived).not.toMatch(/>Archive</);
  });

  it("shows Archive for owner on terminal items and hides non-terminal controls", () => {
    const resolved = renderToStaticMarkup(
      <AttentionDetail
        viewModel={{
          ...viewModel,
          detail: {
            ...viewModel.detail,
            statusKey: "resolved",
            statusLabel: "Resolved",
            isTerminal: true,
            resolvedAtLabel: "Aug 4, 2026, 10:00 AM",
            resolutionReasonLabel: "Follow-up completed",
          },
        }}
        organizationId={ORG_ID}
        role="owner"
      />,
    );
    expect(resolved).not.toMatch(/>Acknowledge</);
    expect(resolved).not.toContain("Save severity");
    expect(resolved).not.toContain("Save assignment");
    expect(resolved).not.toContain(">Resolve<");
    expect(resolved).not.toContain(">Dismiss<");
    expect(resolved).toContain(">Archive<");
    expect(resolved).toContain("Follow-up completed");

    const staffResolved = renderToStaticMarkup(
      <AttentionDetail
        viewModel={{
          ...viewModel,
          detail: {
            ...viewModel.detail,
            statusKey: "dismissed",
            statusLabel: "Dismissed",
            isTerminal: true,
          },
        }}
        organizationId={ORG_ID}
        role="staff"
      />,
    );
    expect(staffResolved).not.toMatch(/>Archive</);
  });

  it("renders empty timeline state", () => {
    const html = renderToStaticMarkup(
      <AttentionDetail
        viewModel={{
          ...viewModel,
          timeline: [],
          timelineEmpty: true,
          signals: [],
        }}
        organizationId={ORG_ID}
        role="staff"
      />,
    );
    expect(html).toContain("No timeline events yet");
    expect(html).toContain("No signals recorded for this item");
  });

  it("uses uniform unavailable copy for missing and cross-tenant cases", () => {
    const missing = renderToStaticMarkup(
      <AttentionUnavailablePanel backHref={`/attention?org=${ORG_ID}`} />,
    );
    const crossTenant = renderToStaticMarkup(
      <AttentionUnavailablePanel backHref={`/attention?org=${ORG_ID}`} />,
    );
    expect(missing).toBe(crossTenant);
    expect(missing).toContain("Attention unavailable");
    expect(missing).not.toContain("tenant");
    expect(missing).not.toContain("not found");
    expect(missing).not.toContain(ATTENTION_ITEM_ID);
  });
});
