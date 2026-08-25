import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

const generated = readFileSync(
  join(process.cwd(), "src/types/database.generated.ts"),
  "utf8",
);

const TABLES = [
  "organization_business_activities",
  "organization_context_assignments",
  "organization_context_assignment_events",
] as const;

describe("ORG-CONTEXT generated Production types", () => {
  it("includes the three ORG-CONTEXT tables in Database public Tables", () => {
    type PublicTables = Database["public"]["Tables"];
    const _tables: Pick<PublicTables, (typeof TABLES)[number]> = {} as Pick<
      PublicTables,
      (typeof TABLES)[number]
    >;
    void _tables;
    for (const table of TABLES) {
      expect(generated).toContain(`${table}:`);
    }
  });

  it("does not pretend the unapplied 1C mutation RPC exists in linked types", () => {
    expect(generated).not.toContain("apply_organization_context_platform_mutation");
  });
});
