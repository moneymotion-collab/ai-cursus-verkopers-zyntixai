import { describe, expect, it } from "vitest";

import type { TaskListItemReadModel } from "@/features/tasks/domain/read-types";

import {

  formatTaskDueAt,

  formatDueStateLabel,

  presentationContainsUuid,

  toTaskListPresentationRow,

} from "@/features/tasks/ui/task-presentation";

import {

  buildOrganizationOptions,

  resolveSelectedOrganization,

} from "@/features/tasks/ui/resolve-task-organization-selection";

import type { TaskDisplayLabelBundle } from "@/features/tasks/ui/resolve-task-display-labels";



const sampleTask = (overrides: Partial<TaskListItemReadModel> = {}): TaskListItemReadModel => ({

  id: "11111111-1111-4111-8111-111111111111",

  organizationId: "22222222-2222-4222-8222-222222222222",

  title: "Follow up call",

  status: "open",

  taskType: "general",

  priority: "normal",

  source: "manual",

  dueAt: "2026-07-15T14:30:00.000Z",

  assigneeMemberId: "33333333-3333-4333-8333-333333333333",

  linkedContext: { kind: "lead", leadId: "44444444-4444-4444-8444-444444444444" },

  archivedAt: null,

  createdAt: "2026-07-10T10:00:00.000Z",

  derived: {

    terminal: false,

    archived: false,

    overdue: false,

    dueToday: false,

    upcoming: true,

    dueState: "upcoming",

  },

  ...overrides,

});



const labels: TaskDisplayLabelBundle = {

  members: { "33333333-3333-4333-8333-333333333333": "Alex Morgan" },

  leads: { "44444444-4444-4444-8444-444444444444": "Acme Lead" },

  customers: {},

  programs: {},

};



const listState = {

  org: "22222222-2222-4222-8222-222222222222",

  status: "open" as const,

  archived: false,

  page: 1,

  pageSize: 25,

};



describe("task presentation helpers", () => {

  it("maps lifecycle labels", () => {

    const row = toTaskListPresentationRow(sampleTask(), "UTC", {

      labels,

      detailHref: "/tasks/11111111-1111-4111-8111-111111111111",

    });

    expect(row.statusLabel).toBe("Open");

  });



  it("does not show due-state label for terminal tasks", () => {

    const row = toTaskListPresentationRow(

      sampleTask({

        status: "completed",

        derived: {

          terminal: true,

          archived: false,

          overdue: false,

          dueToday: false,

          upcoming: false,

          dueState: "none",

        },

      }),

      "UTC",

      { labels, detailHref: "/tasks/11111111-1111-4111-8111-111111111111" },

    );

    expect(formatDueStateLabel(sampleTask({ status: "completed", derived: {

      terminal: true,

      archived: false,

      overdue: false,

      dueToday: false,

      upcoming: false,

      dueState: "none",

    }}))).toBeNull();

    expect(row.dueStateLabel).toBeNull();

  });



  it("shows archived label separately", () => {

    const row = toTaskListPresentationRow(

      sampleTask({

        derived: {

          terminal: true,

          archived: true,

          overdue: false,

          dueToday: false,

          upcoming: false,

          dueState: "none",

        },

      }),

      "UTC",

      { labels, detailHref: "/tasks/11111111-1111-4111-8111-111111111111" },

    );

    expect(row.archivedLabel).toBe("Archived");

  });



  it("uses resolved assignee and linked-context labels", () => {

    const row = toTaskListPresentationRow(sampleTask(), "UTC", {

      labels,

      detailHref: "/tasks/11111111-1111-4111-8111-111111111111?status=open",

    });

    expect(row.assigneeLabel).toBe("Alex Morgan");

    expect(row.linkedContextLabel).toBe("Acme Lead");

    expect(row.detailHref).toContain("/tasks/11111111-1111-4111-8111-111111111111");

    expect(row.detailHref).toContain("status=open");

  });



  it("uses unassigned and fallback labels without UUIDs", () => {

    const row = toTaskListPresentationRow(

      sampleTask({ assigneeMemberId: null, linkedContext: { kind: "customer", customerId: "x" } }),

      "UTC",

      { detailHref: "/tasks/11111111-1111-4111-8111-111111111111" },

    );

    expect(row.assigneeLabel).toBe("Unassigned");

    expect(row.linkedContextLabel).toBe("Linked customer");

  });



  it("formats due timestamps in organization timezone with UTC fallback", () => {

    const formatted = formatTaskDueAt("2026-07-15T14:30:00.000Z", "UTC");

    expect(formatted).toContain("2026");

    expect(presentationContainsUuid(formatted)).toBe(false);

  });



  it("keeps UUIDs out of visible presentation row strings", () => {

    const row = toTaskListPresentationRow(sampleTask(), "UTC", {

      labels,

      detailHref: "/tasks/11111111-1111-4111-8111-111111111111",

    });

    const { id: _id, detailHref: _href, ...visibleFields } = row;

    const visible = Object.values(visibleFields).filter((value) => typeof value === "string").join(" ");

    expect(presentationContainsUuid(visible)).toBe(false);

  });

});



describe("organization selection", () => {

  const memberships = [

    { organizationId: "02016e91-7237-4a20-aec3-6275d2e8a67f", role: "staff" as const },

    { organizationId: "e6e4c376-697c-4863-bb30-fd52b7256ff9", role: "owner" as const },

  ];



  it("auto-selects the only organization", () => {

    const result = resolveSelectedOrganization([memberships[0]], undefined);

    expect(result.organizationId).toBe(memberships[0].organizationId);

  });



  it("verifies requested organization against memberships", () => {

    const valid = resolveSelectedOrganization(memberships, memberships[1].organizationId);

    expect(valid.organizationId).toBe(memberships[1].organizationId);

    expect(valid.invalidSelection).toBe(false);



    const invalid = resolveSelectedOrganization(memberships, "00000000-0000-4000-8000-000000000001");

    expect(invalid.organizationId).toBeNull();
    expect(invalid.requiresSelection).toBe(true);
    expect(invalid.invalidSelection).toBe(true);

  });



  it("builds organization options without exposing UUIDs in display names", () => {

    const options = buildOrganizationOptions(memberships, {

      [memberships[0].organizationId]: "Org Alpha",

    });

    expect(options[0].displayName).toBe("Org Alpha");

    expect(options[1].displayName).toBe("Organization 2");

    expect(options.every((option) => !presentationContainsUuid(option.displayName))).toBe(true);

  });

});

