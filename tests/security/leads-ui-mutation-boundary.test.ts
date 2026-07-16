import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LEAD_UI_ROOTS = [
  join(process.cwd(), "src/features/leads/ui"),
  join(process.cwd(), "src/app/(authenticated)/leads"),
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

describe("lead UI mutation security boundary", () => {
  const clientFiles = LEAD_UI_ROOTS.flatMap((dir) => collectSourceFiles(dir)).filter((file) =>
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
    expect(clientSource).not.toMatch(/runLeadMutation/);
    expect(clientSource).not.toMatch(/LeadMutationOperation/);
  });

  it("invokes bounded lead actions from client workflow forms only", () => {
    const actionImports = [
      "createLeadAction",
      "updateLeadProfileAction",
      "transitionLeadStageAction",
      "transitionLeadStatusAction",
      "convertLeadToCustomerAction",
      "archiveLeadAction",
      "restoreLeadAction",
    ];
    for (const action of actionImports) {
      expect(clientSource).toContain(action);
    }
    expect(clientSource).not.toContain("createCustomerAction");
  });

  it("does not expose lifecycle fields in profile edit form", () => {
    const editForm = readFileSync(
      join(process.cwd(), "src/features/leads/ui/lead-edit-form.tsx"),
      "utf8",
    );
    expect(editForm).not.toMatch(/toStatus/);
    expect(editForm).not.toMatch(/toStageId/);
    expect(editForm).not.toMatch(/existingCustomerId/);
    expect(editForm).not.toMatch(/converted/);
  });

  it("does not expose converted in generic status workflow", () => {
    const statusForm = readFileSync(
      join(process.cwd(), "src/features/leads/ui/lead-status-form.tsx"),
      "utf8",
    );
    expect(statusForm).not.toContain('"converted"');
    expect(statusForm).not.toContain("'converted'");
  });
});
