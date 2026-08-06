import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionDetail } from "@/features/attention/ui/attention-detail";
import type { AttentionDetailViewModel } from "@/features/attention/ui/load-attention-detail-page";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import { canShowAttentionLifecycleActions } from "@/features/attention/ui/attention-workflow-visibility";
import { AttentionUnavailablePanel } from "@/features/attention/ui/attention-state-panels";
import {
  ATTENTION_ITEM_ID,
  CUSTOMER_ID,
  ENROLLMENT_ID,
  ORG_ID,
  PROGRAM_ID,
} from "../helpers/attention-test-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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
};

describe("AttentionDetail presentation (B1.7.5-D)", () => {
  it("renders detail, signals, and timeline without mutation controls", () => {
    const html = renderToStaticMarkup(<AttentionDetail viewModel={viewModel} />);

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
    expect(html).not.toMatch(/>Acknowledge</);
    expect(html).not.toMatch(/>Assign</);
    expect(html).not.toMatch(/>Resolve</);
    expect(html).not.toMatch(/>Dismiss</);
    expect(html).not.toMatch(/>Archive</);
    expect(html).not.toContain("payload");
    expect(html).not.toContain(ATTENTION_ITEM_ID);
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_NAV_VISIBLE).toBe(true);
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
