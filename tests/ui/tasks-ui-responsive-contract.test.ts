import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readCss(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("tasks UI responsive CSS contract", () => {
  it("shows desktop table and hides cards at 1024px breakpoint", () => {
    const css = readCss("src/features/tasks/ui/task-list.module.css");
    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain(".tableWrap");
    expect(css).toContain(".cardList");
  });

  it("keeps task forms within readable max width", () => {
    const formCss = readCss("src/features/tasks/ui/task-form.module.css");
    const lifecycleCss = readCss("src/features/tasks/ui/task-lifecycle.module.css");
    expect(formCss).toContain("max-width");
    expect(lifecycleCss).toContain("max-width");
  });

  it("provides reduced-motion handling on loading states", () => {
    const tasksLoading = readCss("src/app/(authenticated)/tasks/loading.module.css");
    const detailLoading = readCss("src/app/(authenticated)/tasks/[taskId]/loading.module.css");
    expect(tasksLoading).toContain("prefers-reduced-motion");
    expect(detailLoading).toContain("prefers-reduced-motion");
  });

  it("uses touch-friendly minimum control sizes in shell and forms", () => {
    const shellCss = readCss("src/components/app-shell.module.css");
    const formCss = readCss("src/features/tasks/ui/task-form.module.css");
    expect(shellCss).toContain("min-height: 2.75rem");
    expect(formCss).toContain("min-height: 2.75rem");
  });

  it("avoids fixed viewport-blocking widths in task UI modules", () => {
    const riskyPattern = /position:\s*fixed|min-width:\s*9\d{2}px|width:\s*9\d{2}px/;
    const modules = [
      "src/features/tasks/ui/task-list.module.css",
      "src/features/tasks/ui/task-detail.module.css",
      "src/features/tasks/ui/task-form.module.css",
      "src/features/tasks/ui/task-lifecycle.module.css",
      "src/features/tasks/ui/task-list-filters.module.css",
      "src/components/app-shell.module.css",
    ];
    for (const modulePath of modules) {
      expect(readCss(modulePath)).not.toMatch(riskyPattern);
    }
  });
});
