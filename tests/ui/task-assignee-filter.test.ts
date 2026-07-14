import { describe, expect, it } from "vitest";
import {
  buildTaskListQueryString,
  parseTaskListSearchParams,
} from "@/features/tasks/ui/task-list-search-params";
import { buildTaskDetailHref } from "@/features/tasks/ui/task-navigation";

const MEMBER_A = "33333333-3333-4333-8333-333333333333";
const MEMBER_B = "44444444-4444-4444-8444-444444444444";
const TASK_ID = "11111111-1111-4111-8111-111111111111";

describe("assignee filter search params", () => {
  it("preserves a verified assignee in list and detail URLs", () => {
    const parsed = parseTaskListSearchParams(
      { assignee: MEMBER_A, status: "open", page: "2" },
      { role: "staff", assigneeOptions: [MEMBER_A, MEMBER_B] },
    );

    expect(parsed.urlState.assignee).toBe(MEMBER_A);
    expect(parsed.listInput.filters.assigneeMemberId).toBe(MEMBER_A);
    expect(buildTaskListQueryString(parsed.urlState)).toContain(`assignee=${MEMBER_A}`);
    expect(buildTaskDetailHref(TASK_ID, parsed.urlState)).toContain(`assignee=${MEMBER_A}`);
  });

  it("normalizes invalid or foreign assignee selections", () => {
    const parsed = parseTaskListSearchParams(
      { assignee: "00000000-0000-4000-8000-000000000099" },
      { role: "staff", assigneeOptions: [MEMBER_A] },
    );

    expect(parsed.urlState.assignee).toBeUndefined();
    expect(parsed.warnings).toContain("invalid_assignee");
    expect(parsed.listInput.filters.assigneeMemberId).toBeUndefined();
  });

  it("does not expose raw UUIDs as labels in query building", () => {
    const query = buildTaskListQueryString({
      org: "22222222-2222-4222-8222-222222222222",
      status: "open",
      assignee: MEMBER_A,
      archived: false,
      page: 1,
      pageSize: 25,
    });
    expect(query).toContain("assignee=");
    expect(query).not.toContain("label=");
  });
});
