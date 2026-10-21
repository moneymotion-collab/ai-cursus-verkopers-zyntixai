import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ONBOARDING_PROGRESS_STEPS,
  OnboardingProgress,
} from "@/features/onboarding/ui/onboarding-progress";
import { OnboardingShell } from "@/features/onboarding/ui/onboarding-shell";

describe("onboarding shell semantics", () => {
  it("renders one labelled main landmark with task content before context", () => {
    const html = renderToStaticMarkup(
      <OnboardingShell
        currentStep="workspace"
        headingId="screen-title"
        context={<p>Context preview</p>}
        contextLabel="Workspace context"
      >
        <h1 id="screen-title" tabIndex={-1}>
          Main task
        </h1>
      </OnboardingShell>,
    );

    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html).toContain('aria-labelledby="screen-title"');
    expect(html).toContain('aria-label="Workspace context"');
    expect(html.indexOf("Main task")).toBeLessThan(
      html.indexOf("Context preview"),
    );
    expect(html.match(/Context preview/g)).toHaveLength(1);
    expect(html).toContain('tabindex="-1"');
  });

  it("supports a centered composition and optional action region", () => {
    const html = renderToStaticMarkup(
      <OnboardingShell
        headingId="single-title"
        actions={<button type="button">Continue</button>}
      >
        <h1 id="single-title">Single column</h1>
      </OnboardingShell>,
    );

    expect(html).toContain("Single column");
    expect(html).toContain(">Continue</button>");
    expect(html).not.toContain("<aside");
  });
});

describe("onboarding progress semantics", () => {
  it("renders the five authoritative, informational stages", () => {
    const html = renderToStaticMarkup(
      <OnboardingProgress currentStep="business" />,
    );

    for (const step of ONBOARDING_PROGRESS_STEPS) {
      expect(html).toContain(step.label.replace("&", "&amp;"));
    }
    expect(html).toContain('aria-label="Onboarding progress"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('aria-label="Step 2 of 5: Business"');
    expect(html).toContain("Step 2 of 5: Business");
    expect(html).not.toContain("<a");
    expect(html).not.toContain("<button");
    expect(html.match(/<li\b/g)).toHaveLength(5);
  });
});

describe("onboarding shell responsive CSS contract", () => {
  const root = path.resolve(process.cwd());
  const css = readFileSync(
    path.join(
      root,
      "src/features/onboarding/ui/onboarding-shell.module.css",
    ),
    "utf8",
  );

  it("uses only the frozen responsive band boundaries", () => {
    expect(css).toContain("@media (min-width: 768px)");
    expect(css).toContain("@media (min-width: 1152px)");
    expect(css).toContain("@media (max-width: 360px)");
    expect(css).not.toContain("1024px");

    const splitIndex = css.indexOf(".withContext");
    const desktopIndex = css.indexOf("@media (min-width: 1152px)");
    expect(splitIndex).toBeGreaterThan(desktopIndex);
  });

  it("locks the desktop shell and split to the frozen geometry", () => {
    expect(css).toContain("max-width: 72rem");
    expect(css).toContain("grid-template-columns: 35rem 30rem");
    expect(css).toContain("column-gap: 4rem");
    expect(css).toContain("padding-inline: 1.5rem");
  });

  it("keeps tablet labels visible and mobile progress compact", () => {
    expect(css).toContain(
      "grid-template-columns: repeat(5, minmax(0, 1fr))",
    );
    expect(css).toContain(".mobileProgressLabel");
    expect(css).toContain("height: 0.25rem");
    expect(css).toContain("transition: width 220ms ease");
  });

  it("provides grow-safe mobile action and reduced-motion contracts", () => {
    expect(css).toContain(
      "min-height: calc(4.5rem + env(safe-area-inset-bottom))",
    );
    expect(css).toContain("padding: 0.75rem 1.25rem");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transition: none");
  });
});

describe("onboarding route composition contract", () => {
  const root = path.resolve(process.cwd());
  const page = readFileSync(
    path.join(root, "src/app/onboarding/page.tsx"),
    "utf8",
  );
  const operatingModelPage = readFileSync(
    path.join(root, "src/app/onboarding/operating-model/page.tsx"),
    "utf8",
  );
  const wizard = readFileSync(
    path.join(
      root,
      "src/features/onboarding/ui/onboarding-wizard.tsx",
    ),
    "utf8",
  );

  it("keeps route behavior while delegating the single main landmark", () => {
    expect(page).toContain("readOnboardingContext");
    expect(page).toContain("resolveOperatingModelSetupStatus");
    expect(page).toContain("OnboardingWizard");
    expect(page).not.toContain("<main");
    expect(operatingModelPage).toContain("resolveOperatingModelSetupStatus");
    expect(operatingModelPage).toContain("OperatingModelSelector");
    expect(operatingModelPage).not.toContain("<main");
    expect(wizard).toContain("<OnboardingShell");
    expect(wizard).toContain('tabIndex={-1}');
  });
});
