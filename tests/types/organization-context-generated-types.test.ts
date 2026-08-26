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

  it("includes the Production mutation RPC in Database public Functions", () => {
    type MutationFn =
      Database["public"]["Functions"]["apply_organization_context_platform_mutation"];
    const _args: MutationFn["Args"] = {
      p_actor_user_id: "00000000-0000-0000-0000-000000000000",
      p_operation: "create_activity",
      p_organization_id: "00000000-0000-0000-0000-000000000000",
      p_payload: {},
    };
    const _returns: MutationFn["Returns"] = { ok: true };
    void _args;
    void _returns;
    expect(generated).toContain("apply_organization_context_platform_mutation:");
    expect(generated).toContain("p_operation: string");
    expect(generated).toContain("p_organization_id: string");
    expect(generated).toContain("p_actor_user_id: string");
    expect(generated).toContain("p_payload: Json");
    expect(generated).toContain("Returns: Json");
    expect(generated).not.toContain("apply_organization_context_bqa_mutation");
    expect(generated).not.toContain("apply_organization_context_mutation");
  });
});
