import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CUSTOMER_UI_ROOTS = [
  join(process.cwd(), "src/features/customers/ui"),
  join(process.cwd(), "src/app/(authenticated)/customers"),
];

const APPROVED_ACTIONS = [
  "createCustomerAction",
  "updateCustomerProfileAction",
  "transitionCustomerStatusAction",
  "archiveCustomerAction",
  "restoreCustomerAction",
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

describe("customers UI mutation boundary", () => {
  const sourceFiles = CUSTOMER_UI_ROOTS.flatMap((dir) => collectSourceFiles(dir));
  const source = sourceFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  const clientSource = sourceFiles
    .filter((file) => readFileSync(file, "utf8").includes('"use client"'))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  it("imports only approved customer server actions for mutations", () => {
    for (const action of APPROVED_ACTIONS) {
      expect(source).toContain(action);
    }
    expect(source).not.toMatch(/deleteCustomerAction/);
    expect(source).not.toMatch(/enrollment.*Action/i);
  });

  it("does not import customer mutation services or RPC adapters in UI", () => {
    expect(source).not.toMatch(/customer-mutations/);
    expect(source).not.toMatch(/customer-rpc-adapters/);
  });

  it("does not use direct Supabase mutation calls in client components", () => {
    expect(clientSource).not.toMatch(/@\/lib\/supabase\/client/);
    expect(clientSource).not.toMatch(/createBrowserClient/);
    expect(clientSource).not.toMatch(/\.from\([^)]+\)\.(insert|update|delete)/);
    expect(clientSource).not.toMatch(/\.rpc\(/);
  });

  it("defines only approved workflow routes", () => {
    expect(source).toContain("/customers/new");
    expect(source).toContain("/edit");
    expect(source).toContain("/status");
    expect(source).toContain("/archive");
    expect(source).toContain("/restore");
    expect(source).not.toMatch(/\/customers\/\[customerId\]\/delete/);
    expect(source).not.toMatch(/\/customers\/\[customerId\]\/enrollment/);
  });
});
