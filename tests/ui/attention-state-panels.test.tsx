import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AttentionAuthRequiredPanel,
  AttentionEmptyPanel,
  AttentionOrganizationRequiredPanel,
  AttentionOrganizationUnavailablePanel,
  AttentionQueryErrorPanel,
  AttentionUnavailablePanel,
} from "@/features/attention/ui/attention-state-panels";
import { AttentionFoundationShell } from "@/features/attention/ui/attention-foundation-shell";
import { canShowAttentionLifecycleActions } from "@/features/attention/ui/attention-workflow-visibility";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import { ORG_ID } from "../helpers/attention-test-fixtures";

vi.mock("@/components/ui/alert", () => ({
  Alert: ({
    title,
    children,
  }: {
    title: string;
    children?: string;
  }) => (
    <div role="alert">
      <p>{title}</p>
      {children ? <p>{children}</p> : null}
    </div>
  ),
}));

describe("attention shared state panels (B1.7.5-A)", () => {
  it("renders distinct loading-adjacent foundation states without existence leaks", () => {
    expect(renderToStaticMarkup(<AttentionAuthRequiredPanel />)).toContain(
      "Sign in required",
    );
    expect(
      renderToStaticMarkup(<AttentionOrganizationUnavailablePanel />),
    ).toContain("Organization unavailable");

    const unavailable = renderToStaticMarkup(
      <AttentionUnavailablePanel backHref="/attention" />,
    );
    expect(unavailable).toContain("Attention unavailable");
    expect(unavailable).not.toContain("archived");
    expect(unavailable).not.toContain("tenant");
    expect(unavailable).not.toContain("cross-tenant");
    expect(unavailable).toContain("Back to Attention");
    expect(unavailable).toContain('href="/attention"');

    const empty = renderToStaticMarkup(<AttentionEmptyPanel />);
    expect(empty).toContain("No attention items yet");
    expect(empty).not.toContain("Create");
    expect(empty).not.toContain("Acknowledge");

    const filtered = renderToStaticMarkup(
      <AttentionEmptyPanel hasActiveFilters />,
    );
    expect(filtered).toContain("No attention items match these filters");

    const error = renderToStaticMarkup(
      <AttentionQueryErrorPanel message="Service temporarily unavailable. Please try again." />,
    );
    expect(error).toContain("Unable to load Attention");
    expect(error).not.toContain("postgres");
    expect(error).not.toContain("RPC");
  });

  it("renders organization selection without inventing orgs", () => {
    const html = renderToStaticMarkup(
      <AttentionOrganizationRequiredPanel
        organizations={[
          { organizationId: ORG_ID, displayName: "Acme", role: "owner" },
        ]}
      />,
    );
    expect(html).toContain("Organization selection required");
    expect(html).toContain(`org=${ORG_ID}`);
    expect(html).toContain("Acme");
  });

  it("keeps foundation shell free of list/detail/mutation product claims", () => {
    const capabilities = resolveAttentionPermissions("viewer");
    const html = renderToStaticMarkup(
      <AttentionFoundationShell
        page={{
          kind: "success",
          organizationOptions: [
            { organizationId: ORG_ID, displayName: "Acme", role: "viewer" },
          ],
          selectedOrganizationId: ORG_ID,
          organizationName: "Acme",
          role: "viewer",
          capabilities,
          timeZone: "UTC",
          isMultiOrganization: false,
        }}
      />,
    );

    expect(html).toContain("Attention");
    expect(html).toContain("presentation foundation is ready");
    expect(html).toContain("hidden for your role");
    expect(html).not.toContain("Acknowledge");
    expect(html).not.toContain("Assign");
    expect(html).not.toContain("Resolve");
    expect(html).not.toContain("Filter");
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
  });
});
