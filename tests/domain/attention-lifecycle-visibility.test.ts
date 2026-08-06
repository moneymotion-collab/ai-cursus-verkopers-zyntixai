import { describe, expect, it } from "vitest";
import {
  ATTENTION_LIFECYCLE_ACTIONS,
  isAttentionLifecycleAction,
} from "@/features/attention/domain/lifecycle-action-types";
import {
  attentionLifecycleVisibilityGrantsServerRights,
  resolveAttentionLifecycleActionVisibility,
} from "@/features/attention/domain/lifecycle-visibility";
import { MEMBER_ID } from "../helpers/attention-test-fixtures";

describe("attention lifecycle action identifiers", () => {
  it("includes only approved lifecycle actions", () => {
    expect([...ATTENTION_LIFECYCLE_ACTIONS]).toEqual([
      "acknowledge",
      "assign",
      "unassign",
      "update_severity",
      "resolve",
      "dismiss",
      "archive",
    ]);
    expect(isAttentionLifecycleAction("acknowledge")).toBe(true);
    expect(isAttentionLifecycleAction("close")).toBe(false);
    expect(isAttentionLifecycleAction("reopen")).toBe(false);
    expect(isAttentionLifecycleAction("restore")).toBe(false);
    expect(isAttentionLifecycleAction("snooze")).toBe(false);
    expect(isAttentionLifecycleAction("priority")).toBe(false);
  });
});

describe("resolveAttentionLifecycleActionVisibility", () => {
  it("shows owner open-item controls without archive", () => {
    const visibility = resolveAttentionLifecycleActionVisibility("owner", {
      status: "open",
      archivedAt: null,
      assigneeMemberId: null,
    });
    expect(visibility).toEqual({
      acknowledge: true,
      assign: true,
      unassign: false,
      updateSeverity: true,
      resolve: true,
      dismiss: true,
      archive: false,
    });
  });

  it("hides acknowledge on acknowledged items for admin and enables unassign when assigned", () => {
    const visibility = resolveAttentionLifecycleActionVisibility("admin", {
      status: "acknowledged",
      archivedAt: null,
      assigneeMemberId: MEMBER_ID,
    });
    expect(visibility.acknowledge).toBe(false);
    expect(visibility.assign).toBe(true);
    expect(visibility.unassign).toBe(true);
    expect(visibility.resolve).toBe(true);
    expect(visibility.dismiss).toBe(true);
    expect(visibility.archive).toBe(false);
  });

  it("allows staff lifecycle mutations but never archive", () => {
    const visibility = resolveAttentionLifecycleActionVisibility("staff", {
      status: "open",
      archivedAt: null,
      assigneeMemberId: MEMBER_ID,
    });
    expect(visibility.acknowledge).toBe(true);
    expect(visibility.assign).toBe(true);
    expect(visibility.unassign).toBe(true);
    expect(visibility.updateSeverity).toBe(true);
    expect(visibility.resolve).toBe(true);
    expect(visibility.dismiss).toBe(true);
    expect(visibility.archive).toBe(false);
  });

  it("hides all lifecycle actions for viewer", () => {
    const visibility = resolveAttentionLifecycleActionVisibility("viewer", {
      status: "open",
      archivedAt: null,
      assigneeMemberId: null,
    });
    expect(visibility).toEqual({
      acknowledge: false,
      assign: false,
      unassign: false,
      updateSeverity: false,
      resolve: false,
      dismiss: false,
      archive: false,
    });
  });

  it("allows archive only for owner/admin on terminal non-archived items", () => {
    for (const role of ["owner", "admin"] as const) {
      const visibility = resolveAttentionLifecycleActionVisibility(role, {
        status: "resolved",
        archivedAt: null,
      });
      expect(visibility.acknowledge).toBe(false);
      expect(visibility.assign).toBe(false);
      expect(visibility.updateSeverity).toBe(false);
      expect(visibility.resolve).toBe(false);
      expect(visibility.dismiss).toBe(false);
      expect(visibility.archive).toBe(true);
    }

    const staffTerminal = resolveAttentionLifecycleActionVisibility("staff", {
      status: "dismissed",
      archivedAt: null,
    });
    expect(staffTerminal.archive).toBe(false);

    const viewerTerminal = resolveAttentionLifecycleActionVisibility("viewer", {
      status: "expired",
      archivedAt: null,
    });
    expect(viewerTerminal.archive).toBe(false);
  });

  it("hides all controls for archived items", () => {
    const visibility = resolveAttentionLifecycleActionVisibility("owner", {
      status: "resolved",
      archivedAt: "2026-08-06T10:00:00.000Z",
    });
    expect(visibility).toEqual({
      acknowledge: false,
      assign: false,
      unassign: false,
      updateSeverity: false,
      resolve: false,
      dismiss: false,
      archive: false,
    });
  });

  it("does not grant server rights and omits close/reopen keys", () => {
    expect(attentionLifecycleVisibilityGrantsServerRights()).toBe(false);
    const visibility = resolveAttentionLifecycleActionVisibility("owner", {
      status: "open",
    });
    expect(visibility).not.toHaveProperty("close");
    expect(visibility).not.toHaveProperty("reopen");
    expect(visibility).not.toHaveProperty("restore");
    expect(visibility).not.toHaveProperty("snooze");
  });
});
