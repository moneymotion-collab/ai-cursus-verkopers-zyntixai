import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OperatingModelSelector } from "@/features/onboarding/ui/operating-model-selector";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/onboarding/actions/onboarding-actions", () => ({
  assignOperatingModelAction: vi.fn(),
}));

const ORG = "11111111-1111-4111-8111-111111111111";
const pageSource = readFileSync(
  join(process.cwd(), "src/app/onboarding/operating-model/page.tsx"),
  "utf8",
);

describe("operating-model onboarding UI", () => {
  it("renders four accessible business choices without internal identifiers", () => {
    const html = renderToStaticMarkup(
      <OperatingModelSelector organizationId={ORG} />,
    );

    expect(html).toContain("How does your business operate?");
    expect(html).toContain("Courses &amp; Coaching");
    expect(html).toContain("Agency &amp; Business Services");
    expect(html).toContain("Construction &amp; Field Service");
    expect(html).toContain("E-commerce &amp; Product Operations");
    expect(html.match(/type="radio"/g)).toHaveLength(4);
    expect(html).toContain("<fieldset");
    expect(html).toContain("Choose an operating model");
    expect(html).not.toContain("foundation.service");
    expect(html).not.toContain("context_ready");
    expect(html).not.toContain("beta_supported");
  });

  it("starts with Continue disabled and exposes pending-safe implementation", () => {
    const html = renderToStaticMarkup(
      <OperatingModelSelector organizationId={ORG} />,
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Continue<\/button>/);

    const componentSource = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/ui/operating-model-selector.tsx",
      ),
      "utf8",
    );
    expect(componentSource).toContain("pendingRef.current");
    expect(componentSource).toContain('aria-busy={pending}');
    expect(componentSource).toContain("Configuring workspace…");
  });

  it("provides honest member and legacy-configuration states", () => {
    expect(pageSource).toContain("Administrator setup required");
    expect(pageSource).toContain(
      "Your workspace still needs to be configured by an owner or administrator.",
    );
    expect(pageSource).toContain("Workspace configuration needs attention");
    expect(pageSource).not.toContain("Work Orders");
    expect(pageSource).not.toContain("Inventory");
  });
});
