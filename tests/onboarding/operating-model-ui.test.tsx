import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { OperatingModelSelector } from "@/features/onboarding/ui/operating-model-selector";
import {
  OPERATING_MODEL_IDS,
  operatingModelFromPackKey,
} from "@/features/onboarding/domain/operating-model";

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
const componentSource = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/operating-model-selector.tsx",
  ),
  "utf8",
);
const cssSource = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/operating-model-selector.module.css",
  ),
  "utf8",
);

describe("operating-model onboarding UI", () => {
  it("renders the frozen content and exactly four approved choices", () => {
    const html = renderToStaticMarkup(
      <OperatingModelSelector organizationId={ORG} />,
    );

    expect(html).toContain("How does your business operate?");
    expect(html).toContain(
      "Choose the option that best matches how your company works.",
    );
    expect(html).toContain("Courses &amp; Coaching");
    expect(html).toContain("Agency &amp; Business Services");
    expect(html).toContain("Construction &amp; Field Operations");
    expect(html).toContain("Product Operations");
    expect(html.match(/type="radio"/g)).toHaveLength(4);
    expect(html).toContain("<fieldset");
    expect(html).toContain("Choose an operating model");
    expect(html).not.toContain(">Other<");
    expect(html).not.toContain(">Hybrid<");
    expect(html).not.toContain("Workspace Confirmation");
    expect(html).not.toContain("WorkflowPreview");
    expect(html).not.toContain("foundation.service");
    expect(html).not.toContain("context_ready");
    expect(html).not.toContain("beta_supported");
  });

  it("starts without an invented default and with Continue disabled", () => {
    const html = renderToStaticMarkup(
      <OperatingModelSelector organizationId={ORG} />,
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Continue<\/button>/);
    expect(html).not.toContain('checked=""');
    expect(html).not.toContain("saved");
  });

  it("reflects each authoritative supported initial selection without remapping", () => {
    for (const model of OPERATING_MODEL_IDS) {
      const html = renderToStaticMarkup(
        <OperatingModelSelector
          organizationId={ORG}
          initialSelection={model}
        />,
      );
      expect(html.match(/checked=""/g)).toHaveLength(1);
      const selectedInput = html.match(
        new RegExp(`<input[^>]*value="${model}"[^>]*>`),
      )?.[0];
      expect(selectedInput).toContain('checked=""');
    }
  });

  it("maps known authoritative packs and fails closed for unknown context", () => {
    expect(operatingModelFromPackKey("foundation.knowledge")).toBe(
      "course_seller",
    );
    expect(operatingModelFromPackKey("niche.online-course-business")).toBe(
      "course_seller",
    );
    expect(operatingModelFromPackKey("foundation.service")).toBe("service");
    expect(operatingModelFromPackKey("foundation.field-operations")).toBe(
      "field_operations",
    );
    expect(operatingModelFromPackKey("foundation.product-operations")).toBe(
      "product_operations",
    );
    expect(operatingModelFromPackKey("foundation.unknown")).toBeNull();
  });

  it("uses native radio semantics and distinguishes selected from focus", () => {
    expect(componentSource).toContain('type="radio"');
    expect(componentSource).toContain("<fieldset");
    expect(componentSource).toContain("<legend");
    expect(componentSource).toContain("optionSelected");
    expect(cssSource).toContain(".option:focus-within");
    expect(cssSource).toContain(".optionSelected");
    expect(cssSource).toContain(".selectedIndicator");
    expect(cssSource).toContain("outline:");
  });

  it("freezes controls during confirmation and exposes busy semantics", () => {
    expect(componentSource).toContain("submissionRef.current.isActive");
    expect(componentSource).toContain('aria-busy={pending}');
    expect(componentSource).toContain("<fieldset");
    expect(componentSource).toContain(
      "disabled={pending || Boolean(confirmedSelection)}",
    );
    expect(componentSource).toContain('aria-busy={pending}');
    expect(componentSource).toContain("aria-disabled={pending || !selected}");
    expect(componentSource).toContain("Confirming…");
  });

  it("uses responsive CTA copy and the established onboarding breakpoint", () => {
    const html = renderToStaticMarkup(
      <OperatingModelSelector
        organizationId={ORG}
        initialSelection="field_operations"
      />,
    );
    expect(html).toContain("Continue with Construction &amp; Field Operations");
    expect(cssSource).toContain("@media (max-width: 767px)");
    expect(cssSource).toContain(".desktopCta");
    expect(cssSource).toContain(".mobileCta");
    expect(cssSource).not.toContain("overflow-x");
  });

  it("uses lifecycle authority and preserves safe compatibility routes", () => {
    expect(pageSource).toContain("resolveOrganizationOnboardingLifecycle");
    expect(pageSource).toContain("resolveOnboardingLifecycleDestination");
    expect(pageSource).toContain('lifecycle.state.kind !== "legacy"');
    expect(pageSource).toContain('destination.stageRoute !== "operating_model"');
    expect(pageSource).toContain("buildOnboardingStagePath");
    expect(pageSource).toContain("Administrator setup required");
    expect(pageSource).toContain(
      "Your workspace still needs to be configured by an owner or administrator.",
    );
    expect(pageSource).toContain("Workspace configuration needs attention");
    expect(pageSource).not.toContain("Work Orders");
    expect(pageSource).not.toContain("Inventory");
  });

  it("continues only through current onboarding authority after confirmation", () => {
    expect(componentSource).toContain(
      'if (outcome.kind === "confirmed")',
    );
    expect(componentSource).toContain(
      'flow === "legacy" && outcome.model !== "course_seller"',
    );
    expect(componentSource).toContain("buildOnboardingPath(organizationId)");
    expect(componentSource).toContain("buildProductDestination(organizationId)");
    expect(componentSource).toContain(
      "buildWorkspaceConfirmationOnboardingPath(organizationId)",
    );
    expect(pageSource).toContain("confirmedSelection={confirmedSelection}");
    expect(pageSource).toContain(
      'flow={lifecycle.state.kind === "legacy" ? "legacy" : "v2"}',
    );
    expect(componentSource).not.toContain("markV2OnboardingSetupReadyAction");
    expect(componentSource).not.toContain("completeV2OnboardingAction");
  });
});
