import { describe, expect, it } from "vitest";
import {
  PROGRAM_DELIVERY_MODE_METADATA,
  PROGRAM_DELIVERY_MODE_ORDER,
  PROGRAM_DELIVERY_MODES,
  getProgramDeliveryModeLabel,
  isProgramDeliveryMode,
} from "@/features/programs/domain/delivery-mode";
import {
  PROGRAM_STATUS_METADATA,
  PROGRAM_STATUSES,
  getAllowedProgramStatusTransitions,
  getProgramStatusLabel,
  isAllowedProgramStatusTransition,
  isProgramStatus,
} from "@/features/programs/domain/status";

describe("program status metadata", () => {
  it("exposes exact database lifecycle statuses", () => {
    expect([...PROGRAM_STATUSES]).toEqual(["draft", "active", "paused", "retired"]);
  });

  it("labels and create default match contract", () => {
    expect(getProgramStatusLabel("draft")).toBe("Draft");
    expect(PROGRAM_STATUS_METADATA.find((item) => item.isCreateDefault)?.value).toBe(
      "draft",
    );
    expect(PROGRAM_STATUS_METADATA.every((item) => !item.isLifecycleTerminal)).toBe(
      true,
    );
  });

  it("mirrors database-allowed transitions", () => {
    expect(getAllowedProgramStatusTransitions("draft")).toEqual(["active", "retired"]);
    expect(getAllowedProgramStatusTransitions("active")).toEqual(["paused", "retired"]);
    expect(getAllowedProgramStatusTransitions("paused")).toEqual(["active", "retired"]);
    expect(getAllowedProgramStatusTransitions("retired")).toEqual(["active"]);
    expect(isAllowedProgramStatusTransition("draft", "draft")).toBe(false);
    expect(isAllowedProgramStatusTransition("draft", "paused")).toBe(false);
  });

  it("rejects invalid status values", () => {
    expect(isProgramStatus("archived")).toBe(false);
    expect(isProgramStatus("draft")).toBe(true);
  });
});

describe("program delivery mode metadata", () => {
  it("exposes exact delivery modes in stable order", () => {
    expect([...PROGRAM_DELIVERY_MODES]).toEqual([...PROGRAM_DELIVERY_MODE_ORDER]);
    expect([...PROGRAM_DELIVERY_MODES]).toEqual([
      "self_paced",
      "cohort",
      "group_coaching",
      "one_to_one",
      "membership",
      "hybrid",
    ]);
  });

  it("provides labels for form selects", () => {
    expect(getProgramDeliveryModeLabel("one_to_one")).toBe("One-to-one");
    expect(PROGRAM_DELIVERY_MODE_METADATA).toHaveLength(6);
  });

  it("rejects invalid delivery modes", () => {
    expect(isProgramDeliveryMode("live")).toBe(false);
    expect(isProgramDeliveryMode("cohort")).toBe(true);
  });
});
