import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { validateV2CoreForm } from "@/features/onboarding/domain/v2-core-form";
import { V2YouCompanyForm } from "@/features/onboarding/ui/v2-you-company-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/onboarding/actions/onboarding-actions", () => ({
  saveV2CoreDraftAction: vi.fn(),
}));

const ORG = "11111111-1111-4111-8111-111111111111";

describe("V2 You & Company form", () => {
  it("loads persisted core values and approved content", () => {
    const html = renderToStaticMarkup(
      <V2YouCompanyForm
        organizationId={ORG}
        initialValues={{
          displayName: "Ada Lovelace",
          organizationName: "Analytical Engines",
          teamSizeBand: "6_20",
        }}
      />,
    );

    expect(html).toContain("Step 1 of 5: You &amp; Company");
    expect(html).toContain("Set up your workspace");
    expect(html).toContain(
      "We’ll configure ZyntixAI around the way your business operates. Start with a few basics about you and your company.",
    );
    expect(html).toContain('value="Ada Lovelace"');
    expect(html).toContain('value="Analytical Engines"');
    expect(html).toContain('<option value="6_20" selected="">6–20</option>');
    expect(html).toContain(">Continue</button>");
  });

  it("renders only the three authorized V2 fields", () => {
    const html = renderToStaticMarkup(
      <V2YouCompanyForm
        organizationId={ORG}
        initialValues={{
          displayName: "",
          organizationName: "Acme",
          teamSizeBand: "",
        }}
      />,
    );

    expect(html).toContain('name="displayName"');
    expect(html).toContain('name="organizationName"');
    expect(html).toContain('name="teamSizeBand"');
    for (const forbidden of [
      "businessType",
      "primaryAudience",
      "primaryOffering",
      "primaryGoal",
      "country",
      "logo",
    ]) {
      expect(html).not.toContain(`name="${forbidden}"`);
    }
  });

  it("associates labels, required semantics, and unique IDs", () => {
    const html = renderToStaticMarkup(
      <V2YouCompanyForm
        organizationId={ORG}
        initialValues={{
          displayName: "Ada",
          organizationName: "Acme",
          teamSizeBand: "solo",
        }}
      />,
    );
    const names = ["displayName", "organizationName", "teamSizeBand"];
    const ids = names.map((name) => {
      const tag = html.match(
        new RegExp(`<(?:input|select)[^>]*name="${name}"[^>]*>`),
      )?.[0];
      const id = tag?.match(/id="([^"]+)"/)?.[1];
      expect(id).toBeTruthy();
      return id!;
    });

    for (const id of ids) {
      expect(html).toContain(`for="${id}"`);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect((html.match(/ required=""/g) ?? []).length).toBe(3);
    expect(html).toContain('role="status"');
  });

  it.each([
    ["empty display name", { displayName: "", organizationName: "Acme", teamSizeBand: "solo" }, "displayName"],
    ["whitespace display name", { displayName: "  ", organizationName: "Acme", teamSizeBand: "solo" }, "displayName"],
    ["empty company", { displayName: "Ada", organizationName: "", teamSizeBand: "solo" }, "organizationName"],
    ["whitespace company", { displayName: "Ada", organizationName: "  ", teamSizeBand: "solo" }, "organizationName"],
    ["missing team size", { displayName: "Ada", organizationName: "Acme", teamSizeBand: "" }, "teamSizeBand"],
  ] as const)("blocks %s", (_label, values, expectedField) => {
    const result = validateV2CoreForm(ORG, values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors[expectedField]?.length).toBeGreaterThan(0);
    }
  });

  it("accepts trimmed core values without a company uniqueness check", () => {
    const first = validateV2CoreForm(ORG, {
      displayName: " Ada ",
      organizationName: " Acme ",
      teamSizeBand: "21_plus",
    });
    const sameCompanyAgain = validateV2CoreForm(ORG, {
      displayName: "Grace",
      organizationName: "Acme",
      teamSizeBand: "2_5",
    });
    expect(first).toMatchObject({
      success: true,
      input: {
        displayName: "Ada",
        organizationName: "Acme",
        teamSizeBand: "21_plus",
      },
    });
    expect(sameCompanyAgain.success).toBe(true);
  });

  it("keeps explicit-validation focus and navigation behind successful flush", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/ui/v2-you-company-form.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("fieldRefs[firstInvalid].current?.focus()");
    expect(source).toContain("queueRef.current!.flush()");
    expect(source.indexOf("await queueRef.current!.flush()")).toBeLessThan(
      source.indexOf("router.replace("),
    );
    expect(source).toContain("continuingRef.current");
    expect(source).toContain('disabled={isContinuing}');
    expect(source.match(/\.focus\(\)/g)).toHaveLength(1);
    expect(source.indexOf(".focus()")).toBeLessThan(
      source.indexOf("await queueRef.current!.flush()"),
    );
  });

  it("uses lifecycle routing without Ready, Complete, or context assignment mutations", () => {
    const formSource = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/ui/v2-you-company-form.tsx",
      ),
      "utf8",
    );
    const pageSource = readFileSync(
      join(process.cwd(), "src/app/onboarding/page.tsx"),
      "utf8",
    );
    expect(pageSource).toContain(
      'lifecycle.state.kind === "v2_core_incomplete"',
    );
    expect(pageSource).toContain("<V2YouCompanyForm");
    expect(pageSource).toContain(
      'lifecycle.state.kind === "v2_context_required"',
    );
    expect(pageSource).toContain(
      'lifecycle.state.kind === "v2_completed"',
    );
    expect(pageSource).toContain(
      'lifecycle.state.kind === "grandfathered"',
    );
    expect(pageSource).toContain("<OnboardingWizard");
    expect(formSource).toContain("buildOperatingModelOnboardingPath");
    expect(formSource).not.toContain(
      "markV2OnboardingSetupReadyAction",
    );
    expect(formSource).not.toContain("completeV2OnboardingAction");
    expect(formSource).not.toContain("assignOperatingModelAction");
  });

  it("keeps the approved responsive bands and touch-sized action primitive", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/ui/v2-you-company-form.module.css",
      ),
      "utf8",
    );
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/ui/v2-you-company-form.tsx",
      ),
      "utf8",
    );
    expect(css).toContain("max-width: 35rem");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (min-width: 768px)");
    expect(css).not.toMatch(/@media[^{}]*1151px/);
    expect(css).not.toContain("overflow: auto");
    expect(source).toContain('size="action"');
  });
});
