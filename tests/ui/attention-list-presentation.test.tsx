import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionListPresentation } from "@/features/attention/ui/attention-list";
import type { AttentionListWorkspaceRow } from "@/features/attention/ui/load-attention-list-page";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import { canShowAttentionLifecycleActions } from "@/features/attention/ui/attention-workflow-visibility";
import { ATTENTION_ITEM_ID, ORG_ID } from "../helpers/attention-test-fixtures";

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

describe("AttentionListPresentation (B1.7.5-B)", () => {
  it("renders read-only list fields without detail links or mutations", () => {
    const html = renderToStaticMarkup(
      <AttentionListPresentation
        rows={[sampleRow]}
        organizationName="Acme"
        timeZone="UTC"
        shownCount={1}
        totalCount={1}
        pageSize={25}
      />,
    );

    expect(html).toContain("Attention");
    expect(html).toContain("No recent progress");
    expect(html).toContain("Enrollment went quiet");
    expect(html).toContain("Open");
    expect(html).toContain("High");
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Unassigned");
    expect(html).toContain("Not acknowledged");
    expect(html).toContain("Aug 1, 2026, 10:00 AM");
    expect(html).toContain("Showing 1 attention item");

    expect(html).not.toContain(`href="/attention/${ATTENTION_ITEM_ID}`);
    expect(html).not.toContain(sampleRow.detailHref);
    expect(html).not.toMatch(/>Acknowledge</);
    expect(html).not.toMatch(/>Assign</);
    expect(html).not.toMatch(/>Resolve</);
    expect(html).not.toContain("type=\"button\"");
    expect(html).not.toContain("Filter");
    expect(html).not.toContain("Pagination");
    expect(html).not.toContain("Next page");
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
  });

  it("shows bounded first-page wording when total exceeds shown count", () => {
    const html = renderToStaticMarkup(
      <AttentionListPresentation
        rows={[sampleRow]}
        organizationName="Acme"
        timeZone="UTC"
        shownCount={1}
        totalCount={40}
        pageSize={25}
      />,
    );
    expect(html).toContain("Showing 1 of 40 recent attention items");
    expect(html).not.toContain("all attention items");
  });

  it("renders empty state without create or mutation CTAs", () => {
    const html = renderToStaticMarkup(
      <AttentionListPresentation
        rows={[]}
        organizationName="Acme"
        timeZone="UTC"
        shownCount={0}
        totalCount={0}
        pageSize={25}
      />,
    );
    expect(html).toContain("No attention items yet");
    expect(html).not.toContain("Create");
    expect(html).not.toContain("Acknowledge");
  });
});
