import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src/features/org-context");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return walk(full);
    }
    return [full];
  });
}

describe("ORG-CONTEXT-1X-B authority isolation", () => {
  it("does not introduce a generic operator bypass or caller-selected source", () => {
    for (const file of walk(ROOT).filter((path) => path.endsWith(".ts"))) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("skipOperatorCheck");
      expect(source).not.toContain("bypassOperator");
      expect(source).not.toContain("usePlatformAuthority");
      expect(source).not.toMatch(/\bisInternal\b/);
      expect(source).not.toMatch(/\btrusted\s*=\s*true/);
      expect(source).not.toContain("p_source:");
    }
    const service = readFileSync(
      join(ROOT, "server/organization-context.service.ts"),
      "utf8",
    );
    expect(service).toContain("requireOperator");
    expect(service).toContain("invokeOrgContextPlatformMutation");
    expect(service).not.toContain("invokeOrgContextBqaMutation");
    const confirmed = readFileSync(
      join(ROOT, "server/confirmed-mutation.service.ts"),
      "utf8",
    );
    expect(confirmed).toContain("invokeOrgContextBqaMutation");
    expect(confirmed).not.toContain("invokeOrgContextPlatformMutation");
    expect(confirmed).not.toContain("requireOperator(");
  });
});
