import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const DOMAIN_ROOT = join(process.cwd(), "src/features/context-resolver/domain");

const FORBIDDEN = [
  /from\s+["']server-only["']/,
  /import\s+["']server-only["']/,
  /@supabase\//,
  /from\s+["']next\//,
  /from\s+["']next["']/,
  /process\.env/,
  /features\/social-media/,
  /org-context\/server/,
  /organization-context\.service/,
  /createClient/,
  /cookies\(\)/,
  /headers\(\)/,
];

function walkFiles(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) {
        stack.push(join(current, entry));
      }
      continue;
    }
    if (/\.(ts|tsx)$/.test(current)) {
      out.push(current);
    }
  }
  return out;
}

describe("context-resolver domain isolation", () => {
  it("contains no server, Supabase, Next, Social execution, ORG-CONTEXT mutation, or env imports", () => {
    const files = walkFiles(DOMAIN_ROOT);
    expect(files.length).toBeGreaterThan(0);
    const hits: string[] = [];
    for (const filePath of files) {
      const contents = readFileSync(filePath, "utf8");
      for (const pattern of FORBIDDEN) {
        if (pattern.test(contents)) {
          hits.push(
            `${relative(process.cwd(), filePath).replaceAll("\\", "/")} matches ${pattern}`,
          );
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("imports only pure control-plane/org-context domain and local resolver domain modules", () => {
    const allowed = [
      /^@\/features\/context-resolver\/domain(\/|$)/,
      /^@\/features\/control-plane\/domain(\/|$)/,
      /^@\/features\/org-context\/domain\/(types|validation|errors)$/,
      /^\.\//,
    ];
    const hits: string[] = [];
    for (const filePath of walkFiles(DOMAIN_ROOT)) {
      const contents = readFileSync(filePath, "utf8");
      const imports = [
        ...contents.matchAll(/from\s+["']([^"']+)["']/g),
        ...contents.matchAll(/import\s+["']([^"']+)["']/g),
      ];
      for (const match of imports) {
        const specifier = match[1];
        if (!specifier || allowed.some((pattern) => pattern.test(specifier))) {
          continue;
        }
        hits.push(
          `${relative(process.cwd(), filePath).replaceAll("\\", "/")} imports ${specifier}`,
        );
      }
    }
    expect(hits).toEqual([]);
  });
});
