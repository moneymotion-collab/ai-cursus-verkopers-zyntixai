import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CUSTOMER_UI_ROOTS = [
  join(process.cwd(), "src/features/customers/ui"),
  join(process.cwd(), "src/app/(authenticated)/customers"),
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

describe("customer UI mutation security boundary", () => {
  const clientFiles = CUSTOMER_UI_ROOTS.flatMap((dir) => collectSourceFiles(dir)).filter((file) =>
    readFileSync(file, "utf8").includes('"use client"'),
  );
  const clientSource = clientFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  it("does not create service-role or browser Supabase clients in workflow forms", () => {
    expect(clientSource).not.toMatch(/SERVICE_ROLE/i);
    expect(clientSource).not.toMatch(/service_role/);
    expect(clientSource).not.toMatch(/createBrowserClient/);
    expect(clientSource).not.toMatch(/@\/lib\/supabase\/client/);
  });

  it("does not dispatch arbitrary mutation operations", () => {
    expect(clientSource).not.toMatch(/supabase\.rpc\(/);
    expect(clientSource).not.toMatch(/runCustomerMutation/);
    expect(clientSource).not.toMatch(/CustomerMutationOperation/);
  });

  it("invokes bounded customer actions from client workflow forms only", () => {
    const actionImports = [
      "createCustomerAction",
      "updateCustomerProfileAction",
      "transitionCustomerStatusAction",
      "archiveCustomerAction",
      "restoreCustomerAction",
    ];
    for (const action of actionImports) {
      expect(clientSource).toContain(action);
    }
  });
});
