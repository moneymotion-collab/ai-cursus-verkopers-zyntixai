import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("login submit focus ring", () => {
  it("keeps a 2px outline and reserves scroll space for the offset ring", () => {
    const css = readFileSync("src/features/auth/ui/login-form.module.css", "utf8");
    const rule = css.match(/\.submit:focus-visible\s*\{[^}]+\}/)?.[0] ?? "";
    expect(rule).toContain("outline: 2px solid var(--focus-color)");
    expect(rule).toContain("outline-offset: 2px");
    expect(css).toMatch(/\.submit\s*\{[^}]*scroll-margin:\s*6px;/s);
  });
});
