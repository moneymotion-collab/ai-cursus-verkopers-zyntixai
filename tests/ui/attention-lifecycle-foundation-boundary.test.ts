import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE,
  ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE,
  ATTENTION_LIFECYCLE_ACTIONS_VISIBLE,
  ATTENTION_RESOLUTION_DISMISS_ACTIONS_VISIBLE,
  canShowAttentionAcknowledgeSeverityActions,
  canShowAttentionAssignmentActions,
  canShowAttentionLifecycleActions,
  canShowAttentionResolutionDismissActions,
} from "@/features/attention/ui/attention-workflow-visibility";

function readSrc(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("attention lifecycle foundation boundaries (B1.7.6-D)", () => {
  it("keeps the broad lifecycle flag false and enables narrow B, C, and D gates only", () => {
    expect(ATTENTION_LIFECYCLE_ACTIONS_VISIBLE).toBe(false);
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionAcknowledgeSeverityActions()).toBe(true);
    expect(ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionAssignmentActions()).toBe(true);
    expect(ATTENTION_RESOLUTION_DISMISS_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionResolutionDismissActions()).toBe(true);
  });

  it("wires B/C/D actions on detail only and keeps list free of mutation controls", () => {
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
    expect(detail).toContain("canShowAttentionResolutionDismissActions");

    expect(bActions).toContain("acknowledgeAttentionItemAction");
    expect(bActions).toContain("updateAttentionSeverityAction");
    expect(bActions).not.toContain("resolveAttentionItemAction");
    expect(bActions).not.toContain("dismissAttentionItemAction");
    expect(bActions).not.toContain("archiveAttentionItemAction");

    expect(cActions).toContain("assignAttentionItemAction");
    expect(cActions).not.toContain("resolveAttentionItemAction");
    expect(cActions).not.toContain("dismissAttentionItemAction");
    expect(cActions).not.toContain("archiveAttentionItemAction");

    expect(dActions).toContain("resolveAttentionItemAction");
    expect(dActions).toContain("dismissAttentionItemAction");
    expect(dActions).toContain("resolutionReason");
    expect(dActions).toContain("dismissalReason");
    expect(dActions).toContain("Confirm resolve");
    expect(dActions).toContain("Confirm dismiss");
    expect(dActions).toContain("Cancel");
    expect(dActions).not.toContain("archiveAttentionItemAction");
    expect(dActions).not.toMatch(/\bClose\b/);
    expect(dActions).not.toMatch(/window\.confirm/);

    expect(visibility).toContain("ATTENTION_LIFECYCLE_ACTIONS_VISIBLE = false");
    expect(visibility).toContain(
      "ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE = true",
    );
    expect(visibility).toContain("ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE = true");
    expect(visibility).toContain(
      "ATTENTION_RESOLUTION_DISMISS_ACTIONS_VISIBLE = true",
    );

    for (const source of [list, listPage]) {
      expect(source).not.toContain("AttentionAcknowledgeSeverityActions");
      expect(source).not.toContain("AttentionAssignmentActions");
      expect(source).not.toContain("AttentionResolutionDismissActions");
      expect(source).not.toContain("resolveAttentionItemAction");
      expect(source).not.toContain("dismissAttentionItemAction");
      expect(source).not.toMatch(/>Resolve</);
      expect(source).not.toMatch(/>Dismiss</);
      expect(source).not.toContain("Confirm resolve");
    }

    expect(detailPage).toContain("organizationId={result.selectedOrganizationId}");
    expect(detailPage).toContain("role={result.role}");
    expect(list).toContain("Lifecycle actions must never render");
  });

  it("does not introduce Archive CTA, Close/Reopen/Restore/Snooze/Priority, or direct Supabase UI clients", () => {
    const bActions = readSrc(
      "src/features/attention/ui/attention-lifecycle-actions.tsx",
    );
    const cActions = readSrc(
      "src/features/attention/ui/attention-assignment-actions.tsx",
    );
    const dActions = readSrc(
      "src/features/attention/ui/attention-resolution-dismiss-actions.tsx",
    );
    const detail = readSrc("src/features/attention/ui/attention-detail.tsx");

    for (const source of [bActions, cActions, dActions, detail]) {
      expect(source).not.toMatch(/\b(reopen|restore|snooze)\b/i);
      expect(source).not.toMatch(/["']priority["']/i);
      expect(source).not.toMatch(/action:\s*["']priority["']/);
      expect(source).not.toMatch(/createSupabaseBrowserClient|createClient\(/);
      expect(source).not.toMatch(/\.from\(["']attention_/);
    }

    expect(detail).not.toMatch(/>Archive</);
    expect(dActions).not.toMatch(/>Archive</);
    expect(dActions).not.toContain("archiveAttentionItemAction");
    expect(detail).not.toMatch(/\bClose\b/);
    expect(dActions).not.toMatch(/\bClose\b/);
  });
});
