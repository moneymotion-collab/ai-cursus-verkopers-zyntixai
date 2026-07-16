import { describe, expect, it } from "vitest";
import {
  LEAD_HISTORY_SOURCES,
  LEAD_STATUSES,
  LEAD_STATUS_TRANSITION_TARGETS,
  getAllowedLeadStatusTransitions,
  getLeadStatusLabel,
  isAllowedLeadStatusTransition,
  isConvertibleLeadStatus,
  isLeadHistorySource,
  isLeadStatus,
  isLeadStatusTransitionTarget,
  isTerminalLeadStatus,
} from "@/features/leads/domain/status";

describe("lead status domain", () => {
  it("defines exactly the database lead statuses", () => {
    expect(LEAD_STATUSES).toEqual(["open", "converted", "lost", "disqualified"]);
    for (const status of LEAD_STATUSES) {
      expect(isLeadStatus(status)).toBe(true);
      expect(getLeadStatusLabel(status)).toBeTruthy();
    }
  });

  it("rejects unknown statuses", () => {
    expect(isLeadStatus("active")).toBe(false);
    expect(isLeadStatus("")).toBe(false);
    expect(isLeadStatus("OPEN")).toBe(false);
  });

  it("exposes transition targets without converted", () => {
    expect(LEAD_STATUS_TRANSITION_TARGETS).toEqual(["open", "lost", "disqualified"]);
    expect(isLeadStatusTransitionTarget("converted")).toBe(false);
    expect(isLeadStatusTransitionTarget("lost")).toBe(true);
  });

  it("mirrors database-allowed status transitions", () => {
    const allowed: Array<[string, string]> = [
      ["open", "lost"],
      ["open", "disqualified"],
      ["lost", "open"],
      ["disqualified", "open"],
    ];

    for (const [from, to] of allowed) {
      expect(isAllowedLeadStatusTransition(from as never, to as never)).toBe(true);
    }
  });

  it("rejects prohibited and same-state transitions including conversion via status RPC", () => {
    expect(isAllowedLeadStatusTransition("open", "open")).toBe(false);
    expect(isAllowedLeadStatusTransition("open", "converted")).toBe(false);
    expect(isAllowedLeadStatusTransition("converted", "open")).toBe(false);
    expect(isAllowedLeadStatusTransition("lost", "disqualified")).toBe(false);
    expect(isAllowedLeadStatusTransition("disqualified", "lost")).toBe(false);
  });

  it("exposes allowed transitions and terminal/convertible semantics", () => {
    expect(getAllowedLeadStatusTransitions("open")).toEqual(["lost", "disqualified"]);
    expect(getAllowedLeadStatusTransitions("converted")).toEqual([]);
    expect(isTerminalLeadStatus("converted")).toBe(true);
    expect(isTerminalLeadStatus("lost")).toBe(false);
    expect(isConvertibleLeadStatus("open")).toBe(true);
    expect(isConvertibleLeadStatus("lost")).toBe(false);
  });

  it("defines history source values from the database check constraint", () => {
    expect(LEAD_HISTORY_SOURCES).toEqual(["manual", "system", "import", "conversion"]);
    expect(isLeadHistorySource("manual")).toBe(true);
    expect(isLeadHistorySource("webhook")).toBe(false);
  });
});
