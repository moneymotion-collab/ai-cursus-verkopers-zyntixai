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

describe("Attention AppShell navigation (B1.7.5-E)", () => {
  it("shows Attention nav with active state when visibility is enabled", () => {
    expect(ATTENTION_NAV_VISIBLE).toBe(true);

    const html = renderToStaticMarkup(
      <AppShell activeNav="attention" membersNavVisible={false}>
        <p>content</p>
      </AppShell>,
    );

    expect(html).toContain(`>${ATTENTION_NAV_LABEL}<`);
    expect(html).toContain(`href="${ATTENTION_ROUTE}"`);
    expect(html).toContain(`aria-current="page"`);
    expect(html).toContain(">Progress<");
    expect(html).toContain(">Tasks<");

    const shellSource = readFileSync(
      path.join(process.cwd(), "src/components/app-shell.tsx"),
      "utf8",
    );
    expect(shellSource).toContain("ATTENTION_NAV_VISIBLE");
    expect(shellSource).toContain("buildAttentionListHref");
    expect(shellSource).not.toMatch(
      /from ["']@\/features\/attention\/server\//,
    );
  });

  it("keeps Attention inactive when another nav section is active", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="tasks" membersNavVisible={false}>
        <p>content</p>
      </AppShell>,
    );

    expect(html).toContain(`href="${ATTENTION_ROUTE}"`);
    expect(html).toContain(`>${ATTENTION_NAV_LABEL}<`);
    expect(html).not.toMatch(
      new RegExp(
        `aria-current="page"[^>]*href="${ATTENTION_ROUTE}"|href="${ATTENTION_ROUTE}"[^>]*aria-current="page"`,
      ),
    );
  });
});
