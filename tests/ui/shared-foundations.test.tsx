import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";

describe("shared UI foundation semantics", () => {
  it("renders native buttons with a safe default type and native state", () => {
    const defaultButton = renderToStaticMarkup(
      <Button aria-busy="true" disabled>
        Save changes
      </Button>,
    );
    const submitButton = renderToStaticMarkup(
      <Button type="submit" variant="secondary" size="action">
        Continue
      </Button>,
    );
    const ghostButton = renderToStaticMarkup(
      <Button variant="ghost">Back</Button>,
    );

    expect(defaultButton).toMatch(/^<button\b/);
    expect(defaultButton).toContain('type="button"');
    expect(defaultButton).toContain('aria-busy="true"');
    expect(defaultButton).toContain("disabled");
    expect(submitButton).toContain('type="submit"');
    expect(ghostButton).toContain(">Back</button>");
  });

  it("preserves native input and select accessibility attributes", () => {
    const input = renderToStaticMarkup(
      <Input
        id="company-name"
        aria-invalid="true"
        aria-describedby="company-name-help company-name-error"
        disabled
      />,
    );
    const select = renderToStaticMarkup(
      <Select
        id="team-size"
        aria-invalid="true"
        aria-describedby="team-size-error"
        disabled
      >
        <option>A deliberately long option label remains native</option>
      </Select>,
    );
    const readOnlyInput = renderToStaticMarkup(<Input readOnly value="Saved" />);

    expect(input).toMatch(/^<input\b/);
    expect(input).toContain('aria-invalid="true"');
    expect(input).toContain(
      'aria-describedby="company-name-help company-name-error"',
    );
    expect(input).toContain("disabled");
    expect(select).toMatch(/^<select\b/);
    expect(select).toContain('aria-describedby="team-size-error"');
    expect(select).toContain("disabled");
    expect(readOnlyInput).toContain("readOnly");
  });

  it("connects a native label, helper text, and error without forced alerts", () => {
    const html = renderToStaticMarkup(
      <FormField
        id="company-name"
        label="Company name"
        helperText="Use the name customers recognize."
        error="Enter your company name."
      >
        <Input name="companyName" />
      </FormField>,
    );

    expect(html).toContain('for="company-name"');
    expect(html).toContain('id="company-name"');
    expect(html).toContain(
      'aria-describedby="company-name-help company-name-error"',
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).not.toContain('role="alert"');
  });

  it("marks optional fields visibly and lets callers choose message semantics", () => {
    const field = renderToStaticMarkup(
      <FormField id="logo" label="Company logo" optional>
        <Input type="file" />
      </FormField>,
    );
    const status = renderToStaticMarkup(
      <FormMessage role="status" aria-live="polite">
        Draft saved.
      </FormMessage>,
    );

    expect(field).toContain("Company logo");
    expect(field).toContain("(optional)");
    expect(status).toContain('role="status"');
    expect(status).toContain('aria-live="polite"');
  });

  it("renders a structural, caller-labelled surface", () => {
    const html = renderToStaticMarkup(
      <Surface role="region" aria-label="Summary">
        Content
      </Surface>,
    );
    expect(html).toMatch(/^<div\b/);
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Summary"');
  });
});

describe("shared UI foundation CSS contract", () => {
  const root = path.resolve(process.cwd());
  const globals = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  const button = readFileSync(
    path.join(root, "src/components/ui/button.module.css"),
    "utf8",
  );
  const controls = readFileSync(
    path.join(root, "src/components/ui/form-controls.module.css"),
    "utf8",
  );
  const surface = readFileSync(
    path.join(root, "src/components/ui/surface.module.css"),
    "utf8",
  );

  it("adds only the required shared control and motion tokens", () => {
    expect(globals).toContain("--control-border-color: #64748b");
    expect(globals).toContain("--control-min-height: 2.75rem");
    expect(globals).toContain("--action-control-min-height: 3rem");
    expect(globals).toContain("--control-radius: 0.5rem");
    expect(globals).toContain("--surface-radius: 0.75rem");
    expect(globals).toContain("--motion-duration-micro: 120ms");
  });

  it("keeps button variants bounded and focus visibly distinct", () => {
    expect(button).toContain(".primary");
    expect(button).toContain(".secondary");
    expect(button).toContain(".ghost");
    expect(button).toContain(
      "min-height: var(--control-min-height, 2.75rem)",
    );
    expect(button).toContain(
      "min-height: var(--action-control-min-height, 3rem)",
    );
    expect(button).toContain(".primary:focus-visible");
    expect(button).toContain("outline-color: var(--text-color, #0f172a)");
  });

  it("uses the accessible boundary for controls and structural border for surfaces", () => {
    expect(controls).toContain(
      "border: 1px solid var(--control-border-color, #64748b)",
    );
    expect(controls).toContain(
      "border-radius: var(--control-radius, 0.5rem)",
    );
    expect(controls).toContain(":disabled");
    expect(controls).toContain(":read-only");
    expect(surface).toContain(
      "border: 1px solid var(--border-color, #cbd5e1)",
    );
    expect(surface).not.toContain("--control-border-color");
    expect(surface).toContain(
      "border-radius: var(--surface-radius, 0.75rem)",
    );
  });

  it("removes new transitions when reduced motion is requested", () => {
    expect(button).toContain("@media (prefers-reduced-motion: reduce)");
    expect(button).toContain("transition: none");
    expect(controls).toContain("@media (prefers-reduced-motion: reduce)");
    expect(controls).toContain("transition: none");
  });
});
