import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const seedMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260824180010_seed_capability_registry_cap1.sql",
  ),
  "utf8",
);

const REQUIRED_EDGES: ReadonlyArray<readonly [string, string]> = [
  ["knowledge.enrollments", "knowledge.programs"],
  ["knowledge.enrollments", "shared.crm.customers"],
  ["knowledge.progress", "knowledge.enrollments"],
  ["horizontal.social.approval", "horizontal.social.content"],
  ["horizontal.social.scheduling", "horizontal.social.content"],
  ["horizontal.social.publishing", "horizontal.social.connection"],
  ["horizontal.social.publishing", "horizontal.social.content"],
];

const FORBIDDEN_EDGES: ReadonlyArray<readonly [string, string]> = [
  ["shared.crm.leads", "shared.crm.customers"],
  ["core.attention", "core.tasks"],
  ["core.attention", "knowledge.enrollments"],
  ["core.attention", "horizontal.social.publishing"],
  ["horizontal.social.publishing", "horizontal.social.scheduling"],
  ["horizontal.social.publishing", "horizontal.social.approval"],
  ["horizontal.social.scheduling", "horizontal.social.publishing"],
  ["horizontal.social.content", "horizontal.social.connection"],
];

function tuple(dependent: string, required: string): string {
  return `('${dependent}', '${required}')`;
}

function hasDirectedCycle(edges: ReadonlyArray<readonly [string, string]>): boolean {
  const adjacency = new Map<string, string[]>();
  for (const [from, to] of edges) {
    const current = adjacency.get(from) ?? [];
    current.push(to);
    adjacency.set(from, current);
    if (!adjacency.has(to)) {
      adjacency.set(to, []);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): boolean => {
    if (visiting.has(node)) {
      return true;
    }
    if (visited.has(node)) {
      return false;
    }
    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) {
      if (dfs(next)) {
        return true;
      }
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };

  for (const node of adjacency.keys()) {
    if (dfs(node)) {
      return true;
    }
  }
  return false;
}

function reachableFrom(
  start: string,
  edges: ReadonlyArray<readonly [string, string]>,
): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const [from, to] of edges) {
    const current = adjacency.get(from) ?? [];
    current.push(to);
    adjacency.set(from, current);
  }
  const seen = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || seen.has(node)) {
      continue;
    }
    seen.add(node);
    for (const next of adjacency.get(node) ?? []) {
      queue.push(next);
    }
  }
  seen.delete(start);
  return seen;
}

describe("CAP-1B capability dependency contract", () => {
  it("seeds exactly the seven frozen requires edges", () => {
    expect(REQUIRED_EDGES).toHaveLength(7);
    for (const [dependent, required] of REQUIRED_EDGES) {
      expect(seedMigration).toContain(tuple(dependent, required));
    }
    expect(seedMigration).toContain("n_dependencies <> 7");
    expect(seedMigration).toContain("missing dependency edges");
  });

  it("does not seed the explicit non-edges", () => {
    for (const [dependent, required] of FORBIDDEN_EDGES) {
      expect(seedMigration).not.toContain(tuple(dependent, required));
    }
  });

  it("is a deterministic acyclic requires DAG including transitive closure", () => {
    expect(hasDirectedCycle(REQUIRED_EDGES)).toBe(false);
    const progressRequires = reachableFrom("knowledge.progress", REQUIRED_EDGES);
    expect(progressRequires.has("knowledge.enrollments")).toBe(true);
    expect(progressRequires.has("knowledge.programs")).toBe(true);
    expect(progressRequires.has("shared.crm.customers")).toBe(true);
    expect(progressRequires.has("core.tasks")).toBe(false);
    const publishingRequires = reachableFrom(
      "horizontal.social.publishing",
      REQUIRED_EDGES,
    );
    expect(publishingRequires.has("horizontal.social.connection")).toBe(true);
    expect(publishingRequires.has("horizontal.social.content")).toBe(true);
    expect(publishingRequires.has("horizontal.social.approval")).toBe(false);
    expect(publishingRequires.has("horizontal.social.scheduling")).toBe(false);
  });
});
