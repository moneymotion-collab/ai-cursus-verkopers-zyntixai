import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readCss(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("mobile create form containment", () => {
  it("keeps lead choice lists inside the form", () => {
    const css = readCss("src/features/leads/ui/lead-form.module.css");

    expect(css).toContain("min-width: 0");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toMatch(/\.field select\s*\{[^}]*width:\s*0;[^}]*min-width:\s*100%;[^}]*max-width:\s*100%;/);
  });

  it("keeps project choice lists inside the form", () => {
    const css = readCss("src/features/projects/ui/projects.module.css");

    expect(css).toContain("max-width: min(48rem, 100%)");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toMatch(/\.field select\s*\{[^}]*width:\s*0;[^}]*min-width:\s*100%;[^}]*max-width:\s*100%;/);
  });

  it("keeps order lines and choice lists inside the viewport", () => {
    const css = readCss("src/features/product-operations/ui/product-operations.module.css");

    expect(css).toContain("max-width: min(720px, 100%)");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 7.5rem auto");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(css).toMatch(/\.field select\s*\{[^}]*width:\s*0;[^}]*min-width:\s*100%;[^}]*max-width:\s*100%;/);
  });
});
