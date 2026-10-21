import { describe, expect, it } from "vitest";
import {
  buildProgramArchiveHref,
  buildProgramDetailHref,
  buildProgramEditHref,
  buildProgramRestoreHref,
  buildProgramStatusHref,
} from "@/features/programs/ui/program-navigation";
import { getAllowedProgramStatusTransitions } from "@/features/programs/domain/status";
import { ORG_ID, PROGRAM_ID } from "../helpers/program-test-fixtures";

const listState = {
  org: ORG_ID,
  q: "growth",
  archived: false,
  sort: "updated_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

describe("program mutation navigation hrefs", () => {
  it("builds edit/status/archive/restore routes with list return state", () => {
    expect(buildProgramEditHref(PROGRAM_ID, listState)).toContain(
      `/programs/${PROGRAM_ID}/edit`,
    );
    expect(buildProgramStatusHref(PROGRAM_ID, listState)).toContain("/status");
    expect(buildProgramArchiveHref(PROGRAM_ID, listState)).toContain("/archive");
    expect(buildProgramRestoreHref(PROGRAM_ID, listState)).toContain("/restore");
    expect(buildProgramDetailHref(PROGRAM_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildProgramEditHref(PROGRAM_ID, listState)).toContain("q=growth");
  });
});

describe("exact allowed program lifecycle transition matrix", () => {
  it("mirrors private.is_allowed_program_status_transition", () => {
    expect(getAllowedProgramStatusTransitions("draft")).toEqual(["active", "retired"]);
    expect(getAllowedProgramStatusTransitions("active")).toEqual(["paused", "retired"]);
    expect(getAllowedProgramStatusTransitions("paused")).toEqual(["active", "retired"]);
    expect(getAllowedProgramStatusTransitions("retired")).toEqual(["active"]);
  });
});
