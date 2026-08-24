import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const seedMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260824190010_seed_context_pack_registry_ctx1.sql",
  ),
  "utf8",
);

const capSeedMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260824180010_seed_capability_registry_cap1.sql",
  ),
  "utf8",
);

type Relevance = "required" | "recommended" | "optional";
type MappingOp = "set" | "remove";

type StoredMapping = {
  packKey: string;
  capabilityKey: string;
  mappingOp: MappingOp;
  relevance: Relevance | null;
};

const SYSTEM_BASELINE = [
  "core.member-administration",
  "core.tasks",
  "core.attention",
] as const;

const FOUNDATION_STORED: readonly StoredMapping[] = [
  {
    packKey: "foundation.knowledge",
    capabilityKey: "shared.crm.customers",
    mappingOp: "set",
    relevance: "required",
  },
  {
    packKey: "foundation.knowledge",
    capabilityKey: "knowledge.programs",
    mappingOp: "set",
    relevance: "required",
  },
  {
    packKey: "foundation.knowledge",
    capabilityKey: "knowledge.enrollments",
    mappingOp: "set",
    relevance: "required",
  },
  {
    packKey: "foundation.knowledge",
    capabilityKey: "knowledge.progress",
    mappingOp: "set",
    relevance: "required",
  },
];

const NICHE_STORED: readonly StoredMapping[] = [
  {
    packKey: "niche.online-course-business",
    capabilityKey: "shared.crm.leads",
    mappingOp: "set",
    relevance: "recommended",
  },
  {
    packKey: "niche.online-course-business",
    capabilityKey: "horizontal.social.connection",
    mappingOp: "set",
    relevance: "optional",
  },
  {
    packKey: "niche.online-course-business",
    capabilityKey: "horizontal.social.content",
    mappingOp: "set",
    relevance: "optional",
  },
  {
    packKey: "niche.online-course-business",
    capabilityKey: "horizontal.social.approval",
    mappingOp: "set",
    relevance: "optional",
  },
  {
    packKey: "niche.online-course-business",
    capabilityKey: "horizontal.social.scheduling",
    mappingOp: "set",
    relevance: "optional",
  },
  {
    packKey: "niche.online-course-business",
    capabilityKey: "horizontal.social.publishing",
    mappingOp: "set",
    relevance: "optional",
  },
];

const STORED_MAPPINGS: readonly StoredMapping[] = [
  ...FOUNDATION_STORED,
  ...NICHE_STORED,
];

const CAP_REQUIRED_EDGES: ReadonlyArray<readonly [string, string]> = [
  ["knowledge.enrollments", "knowledge.programs"],
  ["knowledge.enrollments", "shared.crm.customers"],
  ["knowledge.progress", "knowledge.enrollments"],
  ["horizontal.social.approval", "horizontal.social.content"],
  ["horizontal.social.scheduling", "horizontal.social.content"],
  ["horizontal.social.publishing", "horizontal.social.connection"],
  ["horizontal.social.publishing", "horizontal.social.content"],
];

const PARENT_BY_PACK: Readonly<Record<string, string | null>> = {
  "foundation.knowledge": null,
  "niche.online-course-business": "foundation.knowledge",
};

function tuple(capabilityKey: string, relevance: string): string {
  return `('${capabilityKey}', '${relevance}')`;
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

function relevanceRank(relevance: Relevance): number {
  if (relevance === "optional") {
    return 1;
  }
  if (relevance === "recommended") {
    return 2;
  }
  return 3;
}

function resolvePack(
  packKey: string,
  stored: readonly StoredMapping[],
): Map<string, Relevance> {
  const parentKey = PARENT_BY_PACK[packKey];
  const resolved =
    parentKey === undefined
      ? new Map<string, Relevance>()
      : parentKey === null
        ? new Map<string, Relevance>()
        : resolvePack(parentKey, stored);

  const own = stored.filter((row) => row.packKey === packKey);
  for (const row of own) {
    if (row.mappingOp === "remove") {
      const current = resolved.get(row.capabilityKey);
      if (current === "required") {
        throw new Error(
          `FAIL CLOSED: cannot REMOVE inherited required ${row.capabilityKey}`,
        );
      }
      resolved.delete(row.capabilityKey);
      continue;
    }
    if (row.relevance === null) {
      throw new Error(`SET row missing relevance for ${row.capabilityKey}`);
    }
    const current = resolved.get(row.capabilityKey);
    if (
      current !== undefined &&
      relevanceRank(row.relevance) < relevanceRank(current)
    ) {
      throw new Error(
        `FAIL CLOSED: cannot weaken ${row.capabilityKey} from ${current} to ${row.relevance}`,
      );
    }
    resolved.set(row.capabilityKey, row.relevance);
  }
  return resolved;
}

function assertCapClosure(
  resolved: Map<string, Relevance>,
  edges: ReadonlyArray<readonly [string, string]>,
): void {
  const required = [...resolved.entries()]
    .filter(([, relevance]) => relevance === "required")
    .map(([key]) => key);
  for (const key of required) {
    for (const dependency of reachableFrom(key, edges)) {
      if (resolved.get(dependency) !== "required") {
        throw new Error(
          `FAIL CLOSED: required ${key} missing CAP dependency ${dependency} as required`,
        );
      }
    }
  }
}

describe("CTX-1B context pack inheritance and CAP closure", () => {
  it("stores exactly 10 mapping rows and does not copy CAP dependency edges", () => {
    expect(STORED_MAPPINGS).toHaveLength(10);
    expect(FOUNDATION_STORED).toHaveLength(4);
    expect(NICHE_STORED).toHaveLength(6);
    for (const row of FOUNDATION_STORED) {
      expect(seedMigration).toContain(tuple(row.capabilityKey, "required"));
    }
    for (const row of NICHE_STORED) {
      expect(row.relevance).not.toBeNull();
      expect(seedMigration).toContain(tuple(row.capabilityKey, row.relevance as string));
    }
    expect(seedMigration).not.toContain("insert into public.capability_dependencies");
    expect(seedMigration).not.toContain("('knowledge.progress', 'knowledge.enrollments')");
    expect(capSeedMigration).toContain("('knowledge.progress', 'knowledge.enrollments')");
  });

  it("resolves Niche FULL as Foundation required spine plus Niche deltas", () => {
    const resolved = resolvePack("niche.online-course-business", STORED_MAPPINGS);
    expect([...resolved.entries()].sort(([a], [b]) => a.localeCompare(b))).toEqual(
      [
        ["horizontal.social.approval", "optional"],
        ["horizontal.social.connection", "optional"],
        ["horizontal.social.content", "optional"],
        ["horizontal.social.publishing", "optional"],
        ["horizontal.social.scheduling", "optional"],
        ["knowledge.enrollments", "required"],
        ["knowledge.programs", "required"],
        ["knowledge.progress", "required"],
        ["shared.crm.customers", "required"],
        ["shared.crm.leads", "recommended"],
      ],
    );
    expect(resolved.has("core.tasks")).toBe(false);
    expect(resolved.has("core.attention")).toBe(false);
    expect(resolved.has("core.member-administration")).toBe(false);
  });

  it("keeps Core abilities as resolver-owned baseline, not stored pack rows", () => {
    expect(SYSTEM_BASELINE).toEqual([
      "core.member-administration",
      "core.tasks",
      "core.attention",
    ]);
    for (const key of SYSTEM_BASELINE) {
      expect(STORED_MAPPINGS.some((row) => row.capabilityKey === key)).toBe(false);
    }
  });

  it("validates CAP hard-dependency closure on the resolved required set", () => {
    const resolved = resolvePack("niche.online-course-business", STORED_MAPPINGS);
    expect(() => assertCapClosure(resolved, CAP_REQUIRED_EDGES)).not.toThrow();
    const progressDeps = reachableFrom("knowledge.progress", CAP_REQUIRED_EDGES);
    expect([...progressDeps].sort()).toEqual([
      "knowledge.enrollments",
      "knowledge.programs",
      "shared.crm.customers",
    ]);
    expect(resolved.get("knowledge.progress")).toBe("required");
    expect(resolved.get("knowledge.enrollments")).toBe("required");
    expect(resolved.get("knowledge.programs")).toBe("required");
    expect(resolved.get("shared.crm.customers")).toBe("required");
  });

  it("fails closed if a child were to weaken inherited required relevance", () => {
    const illegal: StoredMapping[] = [
      ...STORED_MAPPINGS,
      {
        packKey: "niche.online-course-business",
        capabilityKey: "knowledge.progress",
        mappingOp: "set",
        relevance: "optional",
      },
    ];
    expect(() => resolvePack("niche.online-course-business", illegal)).toThrow(
      /cannot weaken knowledge.progress/,
    );
  });

  it("fails closed if resolved required set omitted a CAP hard dependency", () => {
    const missingCustomer = FOUNDATION_STORED.filter(
      (row) => row.capabilityKey !== "shared.crm.customers",
    );
    const resolved = resolvePack("foundation.knowledge", missingCustomer);
    expect(() => assertCapClosure(resolved, CAP_REQUIRED_EDGES)).toThrow(
      /missing CAP dependency shared.crm.customers/,
    );
  });
});
