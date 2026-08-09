import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionDetail } from "@/features/attention/ui/attention-detail";
import type { AttentionDetailViewModel } from "@/features/attention/ui/load-attention-detail-page";
import { AttentionNextBestActionPanel } from "@/features/nba/ui/attention-next-best-action-panel";
import { resolveNbaDetailCta } from "@/features/nba/ui/resolve-nba-detail-cta";
import type { NextBestAction } from "@/features/nba/domain/types";
import { buildProgressListHref } from "@/features/progress/domain/progress-navigation";
import {
  ATTENTION_ITEM_ID,
  CUSTOMER_ID,
  ENROLLMENT_ID,
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

function sampleNba(
  overrides: Partial<NextBestAction> & Pick<NextBestAction, "actionType" | "reasonCode" | "destination">,
): NextBestAction {
  return {
    title: "Sample title",
    explanation: "Sample explanation",
    attentionItemId: ATTENTION_ITEM_ID,
    evidenceSummary: {
      status: "open",
      staleProgressEvidence: false,
    },
    ...overrides,
  };
}

const acknowledgeNba = sampleNba({
  actionType: "acknowledge_attention",
  reasonCode: "attention_open_needs_acknowledge",
  title: "Acknowledge this attention item",
  explanation:
    "This attention item is open and should be acknowledged before further operational follow-up.",
  destination: { kind: "attention_control", control: "acknowledge" },
  evidenceSummary: { status: "open", staleProgressEvidence: true },
});

const assignNba = sampleNba({
  actionType: "assign_attention_owner",
  reasonCode: "attention_unassigned_needs_owner",
  title: "Assign an owner",
  explanation:
    "This attention item is acknowledged and has no assignee. Assign an owner to continue follow-up.",
  destination: { kind: "attention_control", control: "assign" },
  evidenceSummary: { status: "acknowledged", staleProgressEvidence: false },
});

const reviewProgressNba = sampleNba({
  actionType: "review_progress",
  reasonCode: "attention_stale_progress_needs_review",
  title: "Review progress",
  explanation:
    "Authorized stale or no-recent-progress evidence indicates Progress should be reviewed for this enrollment.",
  destination: { kind: "navigate", target: "progress_list" },
  relatedEnrollmentId: ENROLLMENT_ID,
  evidenceSummary: { status: "acknowledged", staleProgressEvidence: true },
});

const openEnrollmentNba = sampleNba({
  actionType: "open_enrollment",
  reasonCode: "attention_open_enrollment_context",
  title: "Open enrollment",
  explanation:
    "No stronger next action matched. Review the authorized enrollment context for this attention item.",
  destination: { kind: "navigate", target: "enrollment_detail" },
  relatedEnrollmentId: ENROLLMENT_ID,
  evidenceSummary: { status: "acknowledged", staleProgressEvidence: false },
});

const openCustomerNba = sampleNba({
  actionType: "open_customer",
  reasonCode: "attention_open_customer_context",
  title: "Open customer",
  explanation:
    "No stronger next action matched. Review the authorized customer context for this attention item.",
  destination: { kind: "navigate", target: "customer_detail" },
  relatedCustomerId: CUSTOMER_ID,
  evidenceSummary: { status: "acknowledged", staleProgressEvidence: false },
});

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
  ],
  timelineEmpty: false,
  customerHref: `/customers/${CUSTOMER_ID}?org=${ORG_ID}`,
  programHref: null,
  enrollmentHref: `/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}`,
  backHref: `/attention?org=${ORG_ID}`,
  organizationTimezone: "UTC",
  assigneeMemberId: null,
  assigneeOptions: [{ value: MEMBER_ID, label: "Alex Owner" }],
  assigneeOptionsFailed: false,
  nextBestAction: null,
};

function renderDetail(
  overrides: Partial<AttentionDetailViewModel> = {},
  role: "owner" | "admin" | "staff" | "viewer" = "owner",
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

describe("resolveNbaDetailCta", () => {
  it("U3: review_progress resolves authorized Progress href", () => {
    const cta = resolveNbaDetailCta(reviewProgressNba, {
      organizationId: ORG_ID,
      enrollmentHref: `/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}`,
      customerHref: `/customers/${CUSTOMER_ID}?org=${ORG_ID}`,
      capabilities: { canAcknowledge: true, canAssign: true },
    });
    expect(cta).toEqual({
      kind: "navigate",
      href: buildProgressListHref({
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
      }),
      label: "Review progress",
    });
  });

  it("omits Progress CTA when related enrollment id is unavailable", () => {
    const cta = resolveNbaDetailCta(
      { ...reviewProgressNba, relatedEnrollmentId: undefined },
      {
        organizationId: ORG_ID,
        enrollmentHref: null,
        customerHref: null,
        capabilities: { canAcknowledge: true, canAssign: true },
      },
    );
    expect(cta).toEqual({ kind: "none" });
  });

  it("U4/U5: open_enrollment and open_customer reuse authorized hrefs", () => {
    expect(
      resolveNbaDetailCta(openEnrollmentNba, {
        organizationId: ORG_ID,
        enrollmentHref: `/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}`,
        customerHref: null,
        capabilities: { canAcknowledge: false, canAssign: false },
      }),
    ).toEqual({
      kind: "navigate",
      href: `/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}`,
      label: "Open enrollment",
    });

    expect(
      resolveNbaDetailCta(openCustomerNba, {
        organizationId: ORG_ID,
        enrollmentHref: null,
        customerHref: `/customers/${CUSTOMER_ID}?org=${ORG_ID}`,
        capabilities: { canAcknowledge: false, canAssign: false },
      }),
    ).toEqual({
      kind: "navigate",
      href: `/customers/${CUSTOMER_ID}?org=${ORG_ID}`,
      label: "Open customer",
    });
  });

  it("capability mismatch yields read-only note for mutation actions", () => {
    expect(
      resolveNbaDetailCta(acknowledgeNba, {
        organizationId: ORG_ID,
        enrollmentHref: null,
        customerHref: null,
        capabilities: { canAcknowledge: false, canAssign: true },
      }),
    ).toEqual({
      kind: "read_only",
      message: "View only — you cannot perform this action.",
    });
  });
});

describe("AttentionNextBestActionPanel", () => {
  it("U1: acknowledge recommendation renders panel", () => {
    const html = renderToStaticMarkup(
      <AttentionNextBestActionPanel
        nextBestAction={acknowledgeNba}
        ctaContext={{
          organizationId: ORG_ID,
          enrollmentHref: null,
          customerHref: null,
          capabilities: { canAcknowledge: true, canAssign: true },
        }}
      />,
    );
    expect(html).toContain("Next Best Action");
    expect(html).toContain("Acknowledge this attention item");
    expect(html).toContain("Why this is recommended");
    expect(html).toContain("Go to Acknowledge");
    expect(html).toContain('href="#attention-acknowledge-heading"');
  });

  it("U2: assign recommendation renders panel", () => {
    const html = renderToStaticMarkup(
      <AttentionNextBestActionPanel
        nextBestAction={assignNba}
        ctaContext={{
          organizationId: ORG_ID,
          enrollmentHref: null,
          customerHref: null,
          capabilities: { canAcknowledge: false, canAssign: true },
        }}
      />,
    );
    expect(html).toContain("Assign an owner");
    expect(html).toContain("Go to Assign");
    expect(html).toContain('href="#attention-assign-heading"');
  });

  it("U6: null nextBestAction renders nothing", () => {
    const html = renderToStaticMarkup(
      <AttentionNextBestActionPanel
        nextBestAction={null}
        ctaContext={{
          organizationId: ORG_ID,
          enrollmentHref: null,
          customerHref: null,
          capabilities: { canAcknowledge: true, canAssign: true },
        }}
      />,
    );
    expect(html).toBe("");
  });

  it("U9/U10: Viewer sees mutation recommendation without executable CTA", () => {
    const html = renderToStaticMarkup(
      <AttentionNextBestActionPanel
        nextBestAction={acknowledgeNba}
        ctaContext={{
          organizationId: ORG_ID,
          enrollmentHref: null,
          customerHref: null,
          capabilities: { canAcknowledge: false, canAssign: false },
        }}
      />,
    );
    expect(html).toContain("Acknowledge this attention item");
    expect(html).toContain("View only — you cannot perform this action.");
    expect(html).not.toContain("Go to Acknowledge");
    expect(html).not.toContain("#attention-acknowledge-heading");
  });

  it("U12: panel does not render raw signals/evidence/internal IDs", () => {
    const html = renderToStaticMarkup(
      <AttentionNextBestActionPanel
        nextBestAction={acknowledgeNba}
        ctaContext={{
          organizationId: ORG_ID,
          enrollmentHref: `/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}`,
          customerHref: null,
          capabilities: { canAcknowledge: true, canAssign: false },
        }}
      />,
    );
    expect(html).not.toContain("signals");
    expect(html).not.toContain("citedProgressFactIds");
    expect(html).not.toContain("evidenceSummary");
    expect(html).not.toContain(ATTENTION_ITEM_ID);
    expect(html).not.toContain("stale_progress");
  });

  it("U14: long recommendation copy remains in wrapping structure", () => {
    const longTitle = `Acknowledge ${"this ".repeat(40)}attention item`;
    const longExplanation = `Why ${"because ".repeat(60)}follow-up is needed.`;
    const html = renderToStaticMarkup(
      <AttentionNextBestActionPanel
        nextBestAction={{
          ...acknowledgeNba,
          title: longTitle,
          explanation: longExplanation,
        }}
        ctaContext={{
          organizationId: ORG_ID,
          enrollmentHref: null,
          customerHref: null,
          capabilities: { canAcknowledge: true, canAssign: false },
        }}
      />,
    );
    expect(html).toContain(longTitle);
    expect(html).toContain(longExplanation);
    expect(html).toContain("nbaPanel");
  });
});

describe("AttentionDetail NBA-U integration", () => {
  it("U1/U11/U15: owner acknowledge NBA anchors to existing lifecycle control", () => {
    const html = renderDetail({ nextBestAction: acknowledgeNba }, "owner");
    expect(html).toContain("Next Best Action");
    expect(html).toContain('href="#attention-acknowledge-heading"');
    expect(html).toContain('id="attention-acknowledge-heading"');
    expect(html).toContain(">Acknowledge<");
  });

  it("U2/U11: owner assign NBA anchors to existing assignment control", () => {
    const html = renderDetail(
      {
        nextBestAction: assignNba,
        assigneeMemberId: null,
      },
      "owner",
      {
        statusKey: "acknowledged",
        statusLabel: "Acknowledged",
        acknowledgementLabel: "Acknowledged",
      },
    );
    expect(html).toContain("Go to Assign");
    expect(html).toContain('href="#attention-assign-heading"');
    expect(html).toContain('id="attention-assign-heading"');
  });

  it("U3: review_progress CTA uses Progress list helper", () => {
    const html = renderDetail(
      {
        nextBestAction: reviewProgressNba,
        assigneeMemberId: MEMBER_ID,
      },
      "owner",
      {
        statusKey: "acknowledged",
        statusLabel: "Acknowledged",
      },
    );
    const expected = buildProgressListHref({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    }).replace(/&/g, "&amp;");
    expect(html).toContain(`href="${expected}"`);
    expect(html).toContain("Review progress");
  });

  it("U4/U5: enrollment and customer CTAs reuse authorized hrefs", () => {
    const enrollmentHtml = renderDetail(
      { nextBestAction: openEnrollmentNba },
      "owner",
      { statusKey: "acknowledged", statusLabel: "Acknowledged" },
    );
    expect(enrollmentHtml).toContain(
      `href="/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}"`,
    );

    const customerHtml = renderDetail(
      {
        nextBestAction: openCustomerNba,
        enrollmentHref: null,
      },
      "owner",
      { statusKey: "acknowledged", statusLabel: "Acknowledged" },
    );
    expect(customerHtml).toContain(
      `href="/customers/${CUSTOMER_ID}?org=${ORG_ID}"`,
    );
  });

  it("U6/U7/U8: null NBA hides section for terminal/archive-style view models", () => {
    const terminal = renderDetail(
      { nextBestAction: null },
      "owner",
      {
        statusKey: "resolved",
        statusLabel: "Resolved",
        isTerminal: true,
        resolvedAtLabel: "Aug 3, 2026, 10:00 AM",
      },
    );
    expect(terminal).not.toContain("Next Best Action");

    const archived = renderDetail(
      { nextBestAction: null },
      "owner",
      {
        statusKey: "resolved",
        statusLabel: "Resolved",
        isTerminal: true,
        isArchived: true,
        archivedAtLabel: "Aug 4, 2026, 10:00 AM",
      },
    );
    expect(archived).not.toContain("Next Best Action");
  });

  it("U9/U10: Viewer sees acknowledge NBA without mutation CTA", () => {
    const html = renderDetail({ nextBestAction: acknowledgeNba }, "viewer");
    expect(html).toContain("Next Best Action");
    expect(html).toContain("Acknowledge this attention item");
    expect(html).toContain("View only — you cannot perform this action.");
    expect(html).not.toContain("Go to Acknowledge");
    expect(html).not.toContain('id="attention-acknowledge-heading"');
  });

  it("missing navigation href omits CTA while keeping recommendation", () => {
    const html = renderDetail(
      {
        nextBestAction: openEnrollmentNba,
        enrollmentHref: null,
      },
      "owner",
      { statusKey: "acknowledged", statusLabel: "Acknowledged" },
    );
    expect(html).toContain("Open enrollment");
    expect(html).toContain("Why this is recommended");
    expect(html).not.toContain(">Open enrollment</a>");
  });

  it("U16/U17: lifecycle, Signals, and Timeline remain after NBA insertion", () => {
    const html = renderDetail({ nextBestAction: acknowledgeNba }, "owner");
    expect(html).toContain("Lifecycle actions");
    expect(html).toContain("Signals");
    expect(html).toContain("Timeline");
    expect(html).toContain("No progress for 14 days");
    expect(html.indexOf("Next Best Action")).toBeGreaterThan(-1);
    expect(html.indexOf("Next Best Action")).toBeLessThan(html.indexOf("Signals"));
    expect(html.indexOf("Signals")).toBeLessThan(html.indexOf("Timeline"));
  });

  it("U18: rendering NBA imports no mutation server actions under nba/ui", async () => {
    const nbaUi = await import("@/features/nba/ui/attention-next-best-action-panel");
    const resolver = await import("@/features/nba/ui/resolve-nba-detail-cta");
    expect(nbaUi.AttentionNextBestActionPanel).toBeTypeOf("function");
    expect(resolver.resolveNbaDetailCta).toBeTypeOf("function");
    const source = `${AttentionNextBestActionPanel.toString()}${resolveNbaDetailCta.toString()}`;
    expect(source).not.toContain("acknowledgeAttentionItemAction");
    expect(source).not.toContain("assignAttentionItemAction");
  });
});
