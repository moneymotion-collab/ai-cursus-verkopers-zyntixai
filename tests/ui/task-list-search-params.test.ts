import { describe, expect, it } from "vitest";
import {
  buildTaskListQueryString,
  canViewArchivedFilter,
  parseTaskListSearchParams,
} from "@/features/tasks/ui/task-list-search-params";

describe("parseTaskListSearchParams", () => {
  it("defaults to open non-archived operational view", () => {
    const parsed = parseTaskListSearchParams({}, { role: "staff" });
    expect(parsed.urlState.status).toBe("open");
    expect(parsed.listInput.filters.includeArchived).toBe(false);
    expect(parsed.listInput.filters.status).toBe("open");
    expect(parsed.listInput.pagination.pageSize).toBe(25);
    expect(parsed.listInput.sort).toEqual({ field: "due_at", direction: "asc" });
  });

  it("parses valid status and due-state filters", () => {
    const parsed = parseTaskListSearchParams(
      { status: "completed", dueState: "overdue", page: "2", pageSize: "50" },
      { role: "staff" },
    );
    expect(parsed.urlState.status).toBe("completed");
    expect(parsed.listInput.filters.dueState).toBe("overdue");
    expect(parsed.listInput.pagination.page).toBe(2);
    expect(parsed.listInput.pagination.pageSize).toBe(50);
  });

  it("falls back invalid status to open", () => {
    const parsed = parseTaskListSearchParams({ status: "invalid" }, { role: "staff" });
    expect(parsed.urlState.status).toBe("open");
    expect(parsed.warnings).toContain("invalid_status");
  });

  it("bounds invalid page and page size", () => {
    const parsed = parseTaskListSearchParams({ page: "-3", pageSize: "500" }, { role: "staff" });
    expect(parsed.listInput.pagination.page).toBe(1);
    expect(parsed.listInput.pagination.pageSize).toBe(100);
  });

  it("ignores invalid organization UUID", () => {
    const parsed = parseTaskListSearchParams({ org: "not-a-uuid" }, { role: "staff" });
    expect(parsed.urlState.org).toBeUndefined();
    expect(parsed.warnings).toContain("invalid_org");
  });

  it("allows archived filter for owner/admin only", () => {
    const owner = parseTaskListSearchParams({ archived: "true" }, { role: "owner" });
    expect(owner.urlState.archived).toBe(true);
    expect(owner.listInput.filters.includeArchived).toBe(true);

    const staff = parseTaskListSearchParams({ archived: "true" }, { role: "staff" });
    expect(staff.urlState.archived).toBe(false);
    expect(staff.warnings).toContain("archived_not_allowed");
  });

  it("builds pagination URLs preserving active filters", () => {
    const query = buildTaskListQueryString({
      org: "02016e91-7237-4a20-aec3-6275d2e8a67f",
      status: "all",
      dueState: "due_today",
      q: "follow",
      archived: false,
      page: 3,
      pageSize: 25,
    });
    expect(query).toContain("org=02016e91-7237-4a20-aec3-6275d2e8a67f");
    expect(query).toContain("status=all");
    expect(query).toContain("dueState=due_today");
    expect(query).toContain("q=follow");
    expect(query).toContain("page=3");
  });

  it("maps archived view to terminal statuses when default open is selected", () => {
    const parsed = parseTaskListSearchParams({ archived: "true" }, { role: "owner" });
    expect(parsed.listInput.filters.includeArchived).toBe(true);
    expect(parsed.listInput.filters.status).toEqual(["completed", "cancelled"]);
  });

  it("exposes archived capability by role", () => {
    expect(canViewArchivedFilter("owner")).toBe(true);
    expect(canViewArchivedFilter("admin")).toBe(true);
    expect(canViewArchivedFilter("staff")).toBe(false);
    expect(canViewArchivedFilter("viewer")).toBe(false);
  });
});
