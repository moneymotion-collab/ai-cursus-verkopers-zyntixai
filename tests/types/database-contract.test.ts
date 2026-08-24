import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const generated = readFileSync(
  join(process.cwd(), "src/types/database.generated.ts"),
  "utf8",
);

describe("generated database contract", () => {
  it("includes tasks tables", () => {
    expect(generated).toContain("tasks:");
    expect(generated).toContain("task_status_history:");
  });

  it("includes all eight task RPCs", () => {
    for (const rpc of [
      "create_task",
      "update_task",
      "reassign_task",
      "reschedule_task",
      "complete_task",
      "cancel_task",
      "archive_task",
      "restore_task",
    ]) {
      expect(generated).toContain(`${rpc}:`);
    }
  });

  it("includes PX2.1 registration tables and RPCs", () => {
    expect(generated).toContain("registration_intents:");
    expect(generated).toContain("complete_owner_self_registration:");
    expect(generated).toContain("upsert_registration_intent:");
  });

  it("includes all 15 TAX/CAP/CTX control-plane tables", () => {
    for (const table of [
      "taxonomy_releases",
      "taxonomy_foundations",
      "taxonomy_industries",
      "taxonomy_niches",
      "taxonomy_specializations",
      "taxonomy_deep_specializations",
      "taxonomy_aliases",
      "capabilities",
      "capability_dependencies",
      "capability_readiness",
      "context_packs",
      "context_pack_versions",
      "context_capability_mappings",
      "context_terminology",
      "context_pack_readiness",
    ]) {
      expect(generated).toContain(`${table}:`);
    }
  });
});
