import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CSS_FILES = [
  "src/features/leads/ui/lead-list.module.css",
  "src/features/leads/ui/lead-detail.module.css",
  "src/features/leads/ui/lead-form.module.css",
  "src/features/leads/ui/lead-lifecycle.module.css",
];

describe("leads UI responsive contract", () => {
  for (const relativePath of CSS_FILES) {
    it(`includes responsive breakpoints in ${relativePath}`, () => {
      const css = readFileSync(join(process.cwd(), relativePath), "utf8");
      expect(css).toMatch(/@media/);
    });
  }

  it("uses table on desktop and cards on mobile for lead list", () => {
    const css = readFileSync(
      join(process.cwd(), "src/features/leads/ui/lead-list.module.css"),
      "utf8",
    );
    expect(css).toContain(".tableWrap");
    expect(css).toContain(".cardList");
    expect(css).toContain("1024px");
  });
});
