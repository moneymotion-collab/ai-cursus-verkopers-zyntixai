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
});
