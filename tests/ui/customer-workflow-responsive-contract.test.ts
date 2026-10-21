import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("customer workflow responsive contract", () => {
  const formCss = readFileSync(
    join(process.cwd(), "src/features/customers/ui/customer-form.module.css"),
    "utf8",
  );
  const lifecycleCss = readFileSync(
    join(process.cwd(), "src/features/customers/ui/customer-lifecycle.module.css"),
    "utf8",
  );

  it("bounds desktop form width", () => {
    expect(formCss).toContain("max-width: 42rem");
    expect(lifecycleCss).toContain("max-width: 42rem");
  });

  it("stacks mobile actions and removes overflow width", () => {
    expect(formCss).toContain("@media (max-width: 40rem)");
    expect(formCss).toContain("flex-direction: column");
    expect(lifecycleCss).toContain("max-width: none");
  });

  it("defines minimum touch target sizes", () => {
    expect(formCss).toContain("min-height: 2.75rem");
    expect(formCss).toContain("min-width: 2.75rem");
  });
});
