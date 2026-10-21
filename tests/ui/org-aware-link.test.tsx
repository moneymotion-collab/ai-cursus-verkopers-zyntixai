import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OrgAwareLink } from "@/components/org-aware-link";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("org=11111111-1111-4111-8111-111111111111"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("OrgAwareLink", () => {
  it("prefers explicit organizationId over the URL org", () => {
    const html = renderToStaticMarkup(
      <OrgAwareLink href="/enrollments" organizationId="22222222-2222-4222-8222-222222222222">
        Enrollments
      </OrgAwareLink>,
    );
    expect(html).toContain(
      'href="/enrollments?org=22222222-2222-4222-8222-222222222222"',
    );
  });

  it("falls back to the URL org when organizationId is omitted", () => {
    const html = renderToStaticMarkup(
      <OrgAwareLink href="/enrollments">Enrollments</OrgAwareLink>,
    );
    expect(html).toContain(
      'href="/enrollments?org=11111111-1111-4111-8111-111111111111"',
    );
  });
});
