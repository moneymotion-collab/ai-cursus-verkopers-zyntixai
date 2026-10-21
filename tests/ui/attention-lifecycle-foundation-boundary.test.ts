import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE,
  ATTENTION_ARCHIVE_ACTION_VISIBLE,
  ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE,
  ATTENTION_LIFECYCLE_ACTIONS_VISIBLE,
  ATTENTION_RESOLUTION_DISMISS_ACTIONS_VISIBLE,
  canShowAttentionAcknowledgeSeverityActions,
  canShowAttentionArchiveAction,
  canShowAttentionAssignmentActions,
  canShowAttentionLifecycleActions,
  canShowAttentionResolutionDismissActions,
} from "@/features/attention/ui/attention-workflow-visibility";

function readSrc(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("attention lifecycle foundation boundaries (B1.7.6-E)", () => {
  it("keeps the broad lifecycle flag false and enables narrow B–E gates only", () => {
    expect(ATTENTION_LIFECYCLE_ACTIONS_VISIBLE).toBe(false);
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionAcknowledgeSeverityActions()).toBe(true);
    expect(ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionAssignmentActions()).toBe(true);
    expect(ATTENTION_RESOLUTION_DISMISS_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionResolutionDismissActions()).toBe(true);
    expect(ATTENTION_ARCHIVE_ACTION_VISIBLE).toBe(true);
    expect(canShowAttentionArchiveAction()).toBe(true);
  });

  it("wires B–E actions on detail only and keeps list free of mutation controls", () => {
    const detail = readSrc("src/features/attention/ui/attention-detail.tsx");
    const list = readSrc("src/features/attention/ui/attention-list.tsx");
    const bActions = readSrc(
      "src/features/attention/ui/attention-lifecycle-actions.tsx",
    );
    const cActions = readSrc(
      "src/features/attention/ui/attention-assignment-actions.tsx",
    );
    const dActions = readSrc(
      "src/features/attention/ui/attention-resolution-dismiss-actions.tsx",
    );
    const eActions = readSrc(
      "src/features/attention/ui/attention-archive-actions.tsx",
    );
    const detailPage = readSrc(
      "src/app/(authenticated)/attention/[attentionItemId]/page.tsx",
    );
    const listPage = readSrc("src/app/(authenticated)/attention/page.tsx");
    const visibility = readSrc(
      "src/features/attention/ui/attention-workflow-visibility.ts",
    );

    expect(detail).toContain("AttentionAcknowledgeSeverityActions");
    expect(detail).toContain("AttentionAssignmentActions");
    expect(detail).toContain("AttentionResolutionDismissActions");
    expect(detail).toContain("AttentionArchiveActions");
    expect(detail).toContain("canShowAttentionArchiveAction");

    expect(bActions).not.toContain("archiveAttentionItemAction");
    expect(cActions).not.toContain("archiveAttentionItemAction");
    expect(dActions).not.toContain("archiveAttentionItemAction");

    expect(eActions).toContain("archiveAttentionItemAction");
    expect(eActions).toContain("Confirm archive");
    expect(eActions).toContain("Cancel");
    expect(eActions).not.toContain("resolutionReason");
    expect(eActions).not.toContain("dismissalReason");
    expect(eActions).not.toMatch(/window\.confirm/);
    expect(eActions).not.toMatch(/\b(Close|Delete|Reopen|Restore|Snooze)\b/);

    expect(visibility).toContain("ATTENTION_LIFECYCLE_ACTIONS_VISIBLE = false");
    expect(visibility).toContain("ATTENTION_ARCHIVE_ACTION_VISIBLE = true");

    for (const source of [list, listPage]) {
      expect(source).not.toContain("AttentionArchiveActions");
      expect(source).not.toContain("archiveAttentionItemAction");
      expect(source).not.toMatch(/>Archive</);
      expect(source).not.toContain("Confirm archive");
    }

    expect(detailPage).toContain("organizationId={result.selectedOrganizationId}");
    expect(detailPage).toContain("role={result.role}");
    expect(list).toContain("Lifecycle actions must never render");
  });

  it("does not introduce Close/Reopen/Restore/Snooze/Priority or direct Supabase UI clients", () => {
    const sources = [
      "src/features/attention/ui/attention-lifecycle-actions.tsx",
      "src/features/attention/ui/attention-assignment-actions.tsx",
      "src/features/attention/ui/attention-resolution-dismiss-actions.tsx",
      "src/features/attention/ui/attention-archive-actions.tsx",
      "src/features/attention/ui/attention-detail.tsx",
    ].map(readSrc);

    for (const source of sources) {
      expect(source).not.toMatch(/\b(reopen|restore|snooze)\b/i);
      expect(source).not.toMatch(/["']priority["']/i);
      expect(source).not.toMatch(/createSupabaseBrowserClient|createClient\(/);
      expect(source).not.toMatch(/\.from\(["']attention_/);
    }
  });
});
