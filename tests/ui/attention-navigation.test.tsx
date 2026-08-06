import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/app-shell";
import {
  ATTENTION_NAV_LABEL,
  ATTENTION_NAV_VISIBLE,
  ATTENTION_ROUTE,
} from "@/features/attention/domain/attention-navigation";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Attention AppShell hidden wiring (B1.7.4-D)", () => {
  it("keeps Attention nav hidden while wiring constants into AppShell", () => {
    expect(ATTENTION_NAV_VISIBLE).toBe(false);

    const html = renderToStaticMarkup(
      <AppShell activeNav="tasks">
        <p>content</p>
      </AppShell>,
    );

    expect(html).not.toContain(`>${ATTENTION_NAV_LABEL}<`);
    expect(html).not.toContain(`href="${ATTENTION_ROUTE}"`);
    expect(html).toContain(">Progress<");
    expect(html).toContain(">Tasks<");

    const shellSource = readFileSync(
      path.join(process.cwd(), "src/components/app-shell.tsx"),
      "utf8",
    );
    expect(shellSource).toContain("ATTENTION_NAV_VISIBLE");
    expect(shellSource).toContain("ATTENTION_ROUTE");
    expect(shellSource).not.toMatch(
      /from ["']@\/features\/attention\/server\//,
    );
  });

  it("does not mark Attention as current page while visibility remains false", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="attention">
        <p>content</p>
      </AppShell>,
    );

    expect(html).not.toContain(`aria-current="page" href="${ATTENTION_ROUTE}"`);
    expect(html).not.toContain(`href="${ATTENTION_ROUTE}"`);
  });
});
