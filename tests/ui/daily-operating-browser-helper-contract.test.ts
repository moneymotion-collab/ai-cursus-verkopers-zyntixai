import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const HELPER_PATH = "tests/browser/helpers/daily-operating.ts";

const FROZEN_SUBTITLE_SOURCE =
  "Priority Attention and due work in today\\u2019s brief.";
const STALE_SUBTITLE = "What needs attention and what you need to do next.";
const RETIRED_CALM = "You are clear for now.";

function readHelperSource(): string {
  return readFileSync(path.join(process.cwd(), HELPER_PATH), "utf8");
}

function expectDailyOperatingShellSource(source: string): string {
  const start = source.indexOf(
    "export async function expectDailyOperatingShell",
  );
  const end = source.indexOf(
    "export async function expectDailyOperatingSections",
  );
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("daily operating browser helper contract", () => {
  it("source-locks expectDailyOperatingShell to the frozen Today subtitle", () => {
    const source = readHelperSource();
    const shell = expectDailyOperatingShellSource(source);

    expect(shell).toContain(
      'getByRole("heading", { level: 1, name: "Today" })',
    );
    expect(shell).toContain("toBeVisible");
    expect(shell).toContain(`getByText("${FROZEN_SUBTITLE_SOURCE}")`);
    expect(shell).toContain('getByText("Loading today’s brief…")');
    expect(shell).not.toContain(STALE_SUBTITLE);
    expect(shell).not.toContain(RETIRED_CALM);
    expect(shell).not.toMatch(/getByText\([^)]*\|/);
  });

  it("does not keep the pre-TRUTH subtitle anywhere in the helper", () => {
    const source = readHelperSource();
    expect(source).not.toContain(STALE_SUBTITLE);
    expect(source).toContain(`getByText("${FROZEN_SUBTITLE_SOURCE}")`);
    expect(source).toContain("expectDailyOperatingShell");
  });
});
