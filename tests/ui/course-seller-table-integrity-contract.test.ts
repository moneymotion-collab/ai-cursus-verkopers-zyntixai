import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readCss(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function expectLocalTableScroll(css: string): void {
  expect(css).toContain("overflow-x: auto");
  expect(css).toContain("min-width: 0");
  expect(css).toContain("min-width: max-content");
  expect(css).toContain("white-space: nowrap");
  expect(css).toContain("word-break: normal");
  expect(css).not.toMatch(/\.table td\s*\{[^}]*white-space:\s*nowrap/);
}

describe("course-seller table integrity contract", () => {
  it("keeps lead status, stage, and assignee on one line while names can wrap", () => {
    const css = readCss("src/features/leads/ui/lead-list.module.css");
    expectLocalTableScroll(css);
    expect(css).toContain(".table td:nth-child(2)");
    expect(css).toContain(".table td:nth-child(3)");
    expect(css).toContain(".table td:nth-child(4)");
    expect(css).toContain(".table td:first-child");
    expect(css).toContain("word-break: break-word");
    expect(css).toContain(".cardList");
  });

  it("keeps program status and delivery mode intact inside the table region", () => {
    const css = readCss("src/features/programs/ui/program-list.module.css");
    expectLocalTableScroll(css);
    expect(css).toContain(".table td:nth-child(2)");
    expect(css).toContain(".table td:nth-child(3)");
    expect(css).toContain("overflow-wrap: normal");
    expect(css).toContain(".table td:first-child");
    expect(css).toContain(".cardList");
  });

  it("keeps task status, due state, priority, assignee, and source intact", () => {
    const css = readCss("src/features/tasks/ui/task-list.module.css");
    expectLocalTableScroll(css);
    expect(css).toContain(".table td:nth-child(2)");
    expect(css).toContain(".table td:nth-child(5)");
    expect(css).toContain(".table td:nth-child(6)");
    expect(css).toContain(".table td:nth-child(7)");
    expect(css).toContain("word-break: break-word");
    expect(css).toContain(".cardList");
  });

  it("keeps enrollment status and owner intact while customer and program names can wrap", () => {
    const css = readCss("src/features/enrollments/ui/enrollment-list.module.css");
    expectLocalTableScroll(css);
    expect(css).toContain(".table td:first-child");
    expect(css).toContain(".table td:nth-child(2)");
    expect(css).toContain(".table td:nth-child(3)");
    expect(css).toContain(".table td:nth-child(7)");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain("overflow-wrap: normal");
    expect(css).toContain(".tableWrap:focus-visible");
    expect(css).toContain(".cardList");
  });

  it("separates task detail actions with wrapping room and a visible focus style", () => {
    const css = readCss("src/features/tasks/ui/task-detail.module.css");
    expect(css).toContain(".workflowLinks");
    expect(css).toContain("display: flex");
    expect(css).toContain("flex-wrap: wrap");
    expect(css).toContain("gap: 0.75rem");
    expect(css).toContain("min-height: 2.75rem");
    expect(css).toContain(".workflowLinks a:focus-visible");
    expect(css).toContain("outline: 2px solid var(--focus-color, #2563eb)");
  });
});
