import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readCss(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("customers UI responsive CSS contract", () => {
  it("shows desktop table and hides cards at 1024px breakpoint", () => {
    const css = readCss("src/features/customers/ui/customer-list.module.css");
    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain(".tableWrap");
    expect(css).toContain(".cardList");
    expect(css).toMatch(/grid-template-columns:\s*7rem\s+1fr/);
  });

  it("stacks customer detail sections on smaller screens", () => {
    const css = readCss("src/features/customers/ui/customer-detail.module.css");
    expect(css).toContain(".layout");
    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain("word-break");
  });

  it("provides reduced-motion handling on customer loading states", () => {
    const listLoading = readCss("src/app/(authenticated)/customers/loading.module.css");
    const detailLoading = readCss("src/app/(authenticated)/customers/[customerId]/loading.module.css");
    expect(listLoading).toContain("prefers-reduced-motion");
    expect(detailLoading).toContain("prefers-reduced-motion");
  });

  it("uses full-width filter controls on mobile", () => {
    const css = readCss("src/features/customers/ui/customer-list-filters.module.css");
    expect(css).toContain("width: 100%");
    expect(css).toContain("min-height: 2.75rem");
  });
});
