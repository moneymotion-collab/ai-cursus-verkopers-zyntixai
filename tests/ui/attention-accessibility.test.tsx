import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionListPresentation } from "@/features/attention/ui/attention-list";
import { AttentionListFilters } from "@/features/attention/ui/attention-list-filters";
import { AttentionDetail } from "@/features/attention/ui/attention-detail";
import type { AttentionListWorkspaceRow } from "@/features/attention/ui/load-attention-list-page";
import type { AttentionDetailViewModel } from "@/features/attention/ui/load-attention-detail-page";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { ATTENTION_ITEM_ID, ORG_ID } from "../helpers/attention-test-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/attention/actions/lifecycle-attention-actions", () => ({
  acknowledgeAttentionItemAction: vi.fn(),
  updateAttentionSeverityAction: vi.fn(),
}));

const sampleRow: AttentionListWorkspaceRow = {
  id: ATTENTION_ITEM_ID,
  detailHref: `/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`,
  titleLabel: "No recent progress",
  statusLabel: "Open",
  severityLabel: "High",
  customerLabel: "Acme Corp",
  programLabel: "Growth Lab",
  assigneeLabel: "Unassigned",
  acknowledgementLabel: "Not acknowledged",
  lastDetectedAtLabel: "Aug 1, 2026, 10:00 AM",
  isArchived: false,
  isTerminal: false,
  summaryLabel: "Enrollment went quiet",
  attentionTypeLabel: "No recent progress",
  createdAtLabel: "Aug 1, 2026, 10:00 AM",
  severityKey: "high",
  statusKey: "open",
};

const detailViewModel: AttentionDetailViewModel = {
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
};

describe("Attention accessibility structure (B1.7.5-E)", () => {
  it("exposes labelled filters, unique list links, and pagination landmark", () => {
    const filters = renderToStaticMarkup(
      <AttentionListFilters
        urlState={{
          org: ORG_ID,
          includeArchived: false,
          sort: "last_detected_at",
          direction: "desc",
          page: 1,
          pageSize: 25,
        }}
        role="owner"
      />,
    );
    expect(filters).toContain('aria-labelledby="attention-filters-heading"');
    expect(filters).toContain('for="filter-attention-status"');
    expect(filters).toContain('for="filter-attention-severity"');
    expect(filters).toContain('for="filter-attention-sort"');

    const list = renderToStaticMarkup(
      <AttentionListPresentation rows={[sampleRow]} organizationName="Acme" />,
    );
    expect(list).toContain('aria-label="Open attention item: No recent progress"');
    expect(list).toContain("<th scope=\"col\">Title</th>");

    const pagination = renderToStaticMarkup(
      <Pagination
        page={2}
        totalPages={4}
        previousHref={`/attention?org=${ORG_ID}&page=1`}
        nextHref={`/attention?org=${ORG_ID}&page=3`}
        ariaLabel="Attention list pagination"
      />,
    );
    expect(pagination).toContain('aria-label="Attention list pagination"');
    expect(pagination).toContain('aria-current="page"');
    expect(pagination).toContain("Page 2 of 4");
  });

  it("exposes detail breadcrumb, timeline empty state, and active Attention nav", () => {
    const detail = renderToStaticMarkup(
      <AttentionDetail
        viewModel={detailViewModel}
        organizationId={ORG_ID}
        role="owner"
      />,
    );
    expect(detail).toContain('aria-label="Breadcrumb"');
    expect(detail).toContain('aria-current="page"');
    expect(detail).toContain("No timeline events yet");
    expect(detail).toContain("Overview");
    expect(detail).toContain("Timeline");
    expect(detail).toContain("Lifecycle actions");
    expect(detail).toContain(">Acknowledge<");
    expect(detail).toContain('id="attention-severity-select"');
    expect(detail).toContain("Save severity");

    const shell = renderToStaticMarkup(
      <AppShell activeNav="attention">
        <p>workspace</p>
      </AppShell>,
    );
    expect(shell).toContain('aria-label="Primary"');
    expect(shell).toContain('aria-current="page"');
    expect(shell).toContain(">Attention<");
  });
});
