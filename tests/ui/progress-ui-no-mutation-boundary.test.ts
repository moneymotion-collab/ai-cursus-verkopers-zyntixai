import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("progress B1.6.2 no-mutation boundary", () => {
  it("does not ship working mutation routes or action forms in list/detail UI", () => {
    const listPage = read("src/app/(authenticated)/progress/page.tsx");
    const detailPage = read("src/app/(authenticated)/progress/[factId]/page.tsx");
    const listUi = read("src/features/progress/ui/progress-list.tsx");
    const detailUi = read("src/features/progress/ui/progress-detail.tsx");

    for (const source of [listPage, detailPage, listUi, detailUi]) {
      expect(source).not.toMatch(/progress-mutations/);
      expect(source).not.toMatch(/recordProgressFact/);
      expect(source).not.toMatch(/voidProgressFact/);
      expect(source).not.toMatch(/\/progress\/new/);
      expect(source).not.toMatch(/\/void"/);
      expect(source).not.toMatch(/\/correct"/);
    }
  });

  it("enables Progress nav only via the dedicated visibility flag", () => {
    const navigation = read("src/features/progress/domain/progress-navigation.ts");
    const shell = read("src/components/app-shell.tsx");
    expect(navigation).toMatch(/PROGRESS_NAV_VISIBLE = true/);
    expect(shell).toContain("PROGRESS_NAV_VISIBLE");
    expect(shell).toContain("PROGRESS_ROUTE");
  });
});
