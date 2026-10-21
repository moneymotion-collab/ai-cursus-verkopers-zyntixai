import { describe, expect, it } from "vitest";
import {
  buildBackToTasksHref,
  buildTaskArchiveHref,
  buildTaskCancelHref,
  buildTaskCompleteHref,
  buildTaskDetailHref,
  buildTaskRestoreHref,
  parseListReturnState,
} from "@/features/tasks/ui/task-navigation";

describe("task navigation helpers", () => {
  it("builds detail href with task ID and only allowed preserved filters", () => {
    const state = parseListReturnState(
      {
        org: "02016e91-7237-4a20-aec3-6275d2e8a67f",
        status: "completed",
        dueState: "overdue",
        source: "manual",
        q: "follow",
        archived: "true",
        page: "2",
        pageSize: "50",
        evil: "https://evil.example",
        returnTo: "/admin",
      },
      "owner",
    );

    const href = buildTaskDetailHref("11111111-1111-4111-8111-111111111111", state);
    expect(href).toContain("/tasks/11111111-1111-4111-8111-111111111111");
    expect(href).toContain("status=completed");
    expect(href).toContain("dueState=overdue");
    expect(href).toContain("source=manual");
    expect(href).toContain("q=follow");
    expect(href).toContain("archived=true");
    expect(href).toContain("page=2");
    expect(href).toContain("pageSize=50");
    expect(href).not.toContain("evil=");
    expect(href).not.toContain("returnTo=");
  });

  it("builds back href to /tasks without arbitrary return URLs", () => {
    const backHref = buildBackToTasksHref(
      parseListReturnState({ status: "open", page: "3" }, "staff"),
    );
    expect(backHref.startsWith("/tasks")).toBe(true);
    expect(backHref).not.toContain("http://");
    expect(backHref).not.toContain("https://");
  });

  it("omits unknown parameters from preserved navigation", () => {
    const href = buildTaskDetailHref(
      "11111111-1111-4111-8111-111111111111",
      parseListReturnState({ foo: "bar", status: "all" }, "staff"),
    );
    expect(href).toContain("status=all");
    expect(href).not.toContain("foo=");
  });

  it("builds lifecycle workflow hrefs with preserved list state", () => {
    const state = parseListReturnState({ org: "02016e91-7237-4a20-aec3-6275d2e8a67f", status: "open" }, "owner");
    const taskId = "11111111-1111-4111-8111-111111111111";
    expect(buildTaskCompleteHref(taskId, state)).toContain("/complete");
    expect(buildTaskCancelHref(taskId, state)).toContain("/cancel");
    expect(buildTaskArchiveHref(taskId, state)).toContain("/archive");
    expect(buildTaskRestoreHref(taskId, state)).toContain("/restore");
    expect(buildTaskCompleteHref(taskId, state)).toContain("org=02016e91-7237-4a20-aec3-6275d2e8a67f");
  });
});
