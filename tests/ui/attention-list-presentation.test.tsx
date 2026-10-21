import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionListPresentation } from "@/features/attention/ui/attention-list";
import { AttentionListFilters } from "@/features/attention/ui/attention-list-filters";
import type { AttentionListWorkspaceRow } from "@/features/attention/ui/load-attention-list-page";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import { canShowAttentionLifecycleActions } from "@/features/attention/ui/attention-workflow-visibility";
import { ATTENTION_ITEM_ID, ORG_ID } from "../helpers/attention-test-fixtures";
import { KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY } from "../features/product-access/module-access-fixtures";

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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

const defaultUrlState = {
  org: ORG_ID,
  includeArchived: false,
  sort: "last_detected_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

describe("AttentionListPresentation (B1.7.5-C/D)", () => {
  it("renders read-only list fields with semantic detail links and no mutations", () => {
    const html = renderToStaticMarkup(
      <AttentionListPresentation
        rows={[sampleRow]}
        organizationName="Acme"
      />,
    );

    expect(html).toContain("No recent progress");
    expect(html).toContain("Open");
    expect(html).toContain("High");
    expect(html).toContain(`href="${sampleRow.detailHref}"`);
    expect(html).not.toMatch(/>Acknowledge</);
    expect(html).not.toMatch(/>Assign</);
    expect(html).not.toMatch(/>Resolve</);
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
    expect(KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY.attention).toBe(true);
  });

  it("renders filtered empty state with reset link", () => {
    const html = renderToStaticMarkup(
      <AttentionListPresentation
        rows={[]}
        organizationName="Acme"
        hasActiveFilters
        clearHref={`/attention?org=${ORG_ID}`}
      />,
    );
    expect(html).toContain("No attention items match these filters");
    expect(html).toContain("Reset filters");
    expect(html).toContain(`/attention?org=${ORG_ID}`);
    expect(html).not.toContain("Create");
  });
});

describe("AttentionListFilters (B1.7.5-C)", () => {
  it("renders GET filter controls and hides archived for viewer", () => {
    const html = renderToStaticMarkup(
      <AttentionListFilters urlState={defaultUrlState} role="viewer" />,
    );
    expect(html).toContain('method="get"');
    expect(html).toContain('action="/attention"');
    expect(html).toContain('name="status"');
    expect(html).toContain('name="severity"');
    expect(html).toContain('name="assignee"');
    expect(html).toContain('name="acknowledged"');
    expect(html).toContain('name="sort"');
    expect(html).toContain('name="direction"');
    expect(html).toContain('name="page"');
    expect(html).toContain('value="1"');
    expect(html).not.toContain("includeArchived");
    expect(html).not.toContain("pageSize");
  });

  it("shows archived toggle for owner and reset when filters active", () => {
    const html = renderToStaticMarkup(
      <AttentionListFilters
        urlState={{ ...defaultUrlState, status: "open", page: 2 }}
        role="owner"
      />,
    );
    expect(html).toContain('name="includeArchived"');
    expect(html).toContain("Reset filters");
    expect(html).toContain(`/attention?org=${ORG_ID}`);
  });
});
