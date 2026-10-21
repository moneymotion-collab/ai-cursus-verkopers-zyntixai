import { describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

describe("Projects generated database contract", () => {
  it("exposes the shared Project tables and Task project relation", () => {
    const tables = [
      "projects",
      "project_status_history",
      "tasks",
    ] satisfies (keyof Database["public"]["Tables"])[];

    type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
    const projectLink: TaskRow["project_id"] = null;

    expect(tables).toEqual(["projects", "project_status_history", "tasks"]);
    expect(projectLink).toBeNull();
  });

  it("exposes the controlled Project and Project-task RPCs", () => {
    const functions = [
      "create_project",
      "update_project",
      "transition_project_status",
      "archive_project",
      "restore_project",
      "create_project_task",
    ] satisfies (keyof Database["public"]["Functions"])[];

    expect(functions).toHaveLength(6);
  });
});
