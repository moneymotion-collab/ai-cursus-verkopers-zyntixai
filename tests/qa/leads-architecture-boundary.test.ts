import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DOMAIN_ROOT = join(process.cwd(), "src/features/leads/domain");
const VALIDATION_ROOT = join(process.cwd(), "src/features/leads/validation");
const UI_ROOT = join(process.cwd(), "src/features/leads/ui");

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("leads architecture boundaries", () => {
  const domainSource = collectFiles(DOMAIN_ROOT)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const validationSource = collectFiles(VALIDATION_ROOT)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const uiSource = collectFiles(UI_ROOT)
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const clientUiSource = collectFiles(UI_ROOT)
    .filter((file) => readFileSync(file, "utf8").includes('"use client"'))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  it("keeps domain and validation free of database and UI imports", () => {
    expect(domainSource).not.toMatch(/@supabase/);
    expect(domainSource).not.toMatch(/lead-read-queries/);
    expect(domainSource).not.toMatch(/lead-mutations/);
    expect(validationSource).not.toMatch(/@supabase/);
    expect(validationSource).not.toMatch(/lead-mutations/);
    expect(validationSource).not.toMatch(/"use client"/);
  });

  it("keeps client UI free of mutation services and browser Supabase", () => {
    expect(clientUiSource).not.toMatch(/lead-mutations/);
    expect(clientUiSource).not.toMatch(/lead-rpc-adapters/);
    expect(clientUiSource).not.toMatch(/@\/lib\/supabase\/client/);
    expect(clientUiSource).not.toMatch(/createBrowserClient/);
  });

  it("keeps workflow loaders in server modules without client directives", () => {
    const loaderSource = readFileSync(
      join(UI_ROOT, "load-lead-workflow-page.ts"),
      "utf8",
    );
    expect(loaderSource).toContain("loadLeadEditPage");
    expect(loaderSource).toContain("loadLeadConvertCustomerOptions");
    expect(loaderSource).not.toContain('"use client"');
  });
});
