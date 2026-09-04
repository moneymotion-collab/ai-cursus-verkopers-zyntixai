import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("progress B1.6.3 mutation boundary", () => {
  it("never ships restore, delete, or generic update affordances for progress facts", () => {
    const sources = [
      "src/app/(authenticated)/progress/page.tsx",
      "src/app/(authenticated)/progress/[factId]/page.tsx",
      "src/app/(authenticated)/progress/new/page.tsx",
      "src/app/(authenticated)/progress/[factId]/void/page.tsx",
      "src/app/(authenticated)/progress/[factId]/correct/page.tsx",
      "src/features/progress/ui/progress-list.tsx",
      "src/features/progress/ui/progress-detail.tsx",
      "src/features/progress/ui/progress-record-form.tsx",
      "src/features/progress/ui/progress-void-form.tsx",
      "src/features/progress/ui/progress-correct-form.tsx",
      "src/features/progress/actions/progress-actions.ts",
    ].map(read);

    for (const source of sources) {
      expect(source).not.toMatch(/restoreProgressFact/i);
      expect(source).not.toMatch(/deleteProgressFact/i);
      expect(source).not.toMatch(/update_progress_fact/);
      expect(source).not.toMatch(/\/progress\/[^"'`]*\/restore/);
      expect(source).not.toMatch(/\/progress\/[^"'`]*\/delete/);
    }
  });

  it("does not expose raw RPC or Supabase calls from Progress route actions", () => {
    const actionsSource = read("src/features/progress/actions/progress-actions.ts");

    expect(actionsSource).not.toMatch(/\.rpc\(/);
    expect(actionsSource).not.toMatch(/from\("enrollment_progress_facts"\)/);
  });

  it("ships the record/void/correct workflow routes and actions in list/detail UI", () => {
    const listPage = read("src/app/(authenticated)/progress/page.tsx");
    const detailPage = read("src/app/(authenticated)/progress/[factId]/page.tsx");

    expect(listPage).toMatch(/buildProgressCreateHref/);
    expect(detailPage).toMatch(/buildProgressVoidHref/);
    expect(detailPage).toMatch(/buildProgressCorrectHref/);

    const actionsSource = read("src/features/progress/actions/progress-actions.ts");
    expect(actionsSource).toMatch(/recordProgressFactAction/);
    expect(actionsSource).toMatch(/voidProgressFactAction/);
    expect(actionsSource).toMatch(/correctProgressFactAction/);
  });

  it("gates Progress nav via context-driven moduleNavVisibility", () => {
    const navigation = read("src/features/progress/domain/progress-navigation.ts");
    const shell = read("src/components/app-shell.tsx");
    expect(navigation).toMatch(/PROGRESS_NAV_VISIBLE = false/);
    expect(shell).toContain("moduleNavVisibility.progress");
    expect(shell).toContain("PROGRESS_ROUTE");
  });
});
