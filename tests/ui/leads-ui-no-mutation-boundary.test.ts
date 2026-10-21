import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LEAD_UI_ROOTS = [
  join(process.cwd(), "src/features/leads/ui"),
  join(process.cwd(), "src/app/(authenticated)/leads"),
];

const APPROVED_ACTIONS = [
  "createLeadAction",
  "updateLeadProfileAction",
  "transitionLeadStageAction",
  "transitionLeadStatusAction",
  "convertLeadToCustomerAction",
  "archiveLeadAction",
  "restoreLeadAction",
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    if (SOURCE_EXTENSIONS.has(fullPath.slice(fullPath.lastIndexOf(".")))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("leads UI mutation boundary", () => {
  const sourceFiles = LEAD_UI_ROOTS.flatMap((dir) => collectSourceFiles(dir));
  const source = sourceFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  const clientSource = sourceFiles
    .filter((file) => readFileSync(file, "utf8").includes('"use client"'))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  it("imports only approved lead server actions for mutations", () => {
    for (const action of APPROVED_ACTIONS) {
      expect(source).toContain(action);
    }
    expect(source).not.toMatch(/deleteLeadAction/);
    expect(source).not.toMatch(/transitionLeadPipelineAdminAction/);
  });

  it("does not import lead mutation services or RPC adapters in UI", () => {
    expect(source).not.toMatch(/lead-mutations/);
    expect(source).not.toMatch(/lead-rpc-adapters/);
  });

  it("does not use direct Supabase mutation calls in client components", () => {
    expect(clientSource).not.toMatch(/@\/lib\/supabase\/client/);
    expect(clientSource).not.toMatch(/createBrowserClient/);
    expect(clientSource).not.toMatch(/\.from\([^)]+\)\.(insert|update|delete)/);
    expect(clientSource).not.toMatch(/\.rpc\(/);
  });

  it("does not expose service-role credentials", () => {
    expect(source).not.toMatch(/service.role/i);
    expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE/);
  });

  it("defines approved lifecycle workflow routes", () => {
    expect(source).toContain("/leads/new");
    expect(source).toContain("/edit");
    expect(source).toContain("/stage");
    expect(source).toContain("/status");
    expect(source).toContain("/convert");
    expect(source).toContain("/archive");
    expect(source).toContain("/restore");
    expect(source).not.toMatch(/\/leads\/\[leadId\]\/delete/);
    expect(source).not.toMatch(/pipeline-stage-admin/i);
  });
});
