import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE,
  ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE,
  ATTENTION_LIFECYCLE_ACTIONS_VISIBLE,
  canShowAttentionAcknowledgeSeverityActions,
  canShowAttentionAssignmentActions,
  canShowAttentionLifecycleActions,
} from "@/features/attention/ui/attention-workflow-visibility";

function readSrc(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("attention lifecycle foundation boundaries (B1.7.6-C)", () => {
  it("keeps the broad lifecycle flag false and enables narrow B and C gates only", () => {
    expect(ATTENTION_LIFECYCLE_ACTIONS_VISIBLE).toBe(false);
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionAcknowledgeSeverityActions()).toBe(true);
    expect(ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionAssignmentActions()).toBe(true);
  });

  it("wires B and C actions on detail only and keeps list free of mutation controls", () => {
    const detail = readSrc("src/features/attention/ui/attention-detail.tsx");
    const list = readSrc("src/features/attention/ui/attention-list.tsx");
    const bActions = readSrc(
      "src/features/attention/ui/attention-lifecycle-actions.tsx",
    );
    const cActions = readSrc(
      "src/features/attention/ui/attention-assignment-actions.tsx",
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
    expect(detail).toContain("canShowAttentionAcknowledgeSeverityActions");
    expect(detail).toContain("canShowAttentionAssignmentActions");

    expect(bActions).toContain("acknowledgeAttentionItemAction");
    expect(bActions).toContain("updateAttentionSeverityAction");
    expect(bActions).not.toContain("assignAttentionItemAction");
    expect(bActions).not.toContain("resolveAttentionItemAction");
    expect(bActions).not.toContain("dismissAttentionItemAction");
    expect(bActions).not.toContain("archiveAttentionItemAction");

    expect(cActions).toContain("assignAttentionItemAction");
    expect(cActions).toContain("runAssignment(null");
    expect(cActions).toContain("Unassign");
    expect(cActions).toContain("Save assignment");
    expect(cActions).not.toContain("resolveAttentionItemAction");
    expect(cActions).not.toContain("dismissAttentionItemAction");
    expect(cActions).not.toContain("archiveAttentionItemAction");
    expect(cActions).not.toMatch(/type=["']text["']/);
    expect(cActions).not.toMatch(/input[^>]*uuid/i);

    expect(visibility).toContain("ATTENTION_LIFECYCLE_ACTIONS_VISIBLE = false");
    expect(visibility).toContain(
      "ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE = true",
    );
    expect(visibility).toContain("ATTENTION_ASSIGNMENT_ACTIONS_VISIBLE = true");

    for (const source of [list, listPage]) {
      expect(source).not.toContain("AttentionAcknowledgeSeverityActions");
      expect(source).not.toContain("AttentionAssignmentActions");
      expect(source).not.toContain("acknowledgeAttentionItemAction");
      expect(source).not.toContain("assignAttentionItemAction");
      expect(source).not.toMatch(/>Acknowledge</);
      expect(source).not.toMatch(/>Unassign</);
      expect(source).not.toContain("Save assignment");
    }

    expect(detailPage).toContain("organizationId={result.selectedOrganizationId}");
    expect(detailPage).toContain("role={result.role}");

    expect(list).toContain("Lifecycle actions must never render");
    expect(detail).not.toContain("Lifecycle actions must never render");
  });

  it("does not introduce Close/Reopen/Restore/Snooze/Priority, Resolve/Dismiss/Archive CTAs, or direct Supabase UI clients", () => {
    const bActions = readSrc(
      "src/features/attention/ui/attention-lifecycle-actions.tsx",
    );
    const cActions = readSrc(
      "src/features/attention/ui/attention-assignment-actions.tsx",
    );
    const detail = readSrc("src/features/attention/ui/attention-detail.tsx");
    const assigneeLoader = readSrc(
      "src/features/attention/server/load-attention-assignee-options.ts",
    );

    for (const source of [bActions, cActions, detail]) {
      expect(source).not.toMatch(/\b(close|reopen|restore|snooze)\b/i);
      expect(source).not.toMatch(/["']priority["']/i);
      expect(source).not.toMatch(/action:\s*["']priority["']/);
      expect(source).not.toMatch(/createSupabaseBrowserClient|createClient\(/);
      expect(source).not.toMatch(/\.from\(["']attention_/);
    }

    expect(detail).not.toMatch(/>Resolve</);
    expect(detail).not.toMatch(/>Dismiss</);
    expect(detail).not.toMatch(/>Archive</);
    expect(cActions).not.toMatch(/>Resolve</);
    expect(cActions).not.toMatch(/>Dismiss</);
    expect(cActions).not.toMatch(/>Archive</);

    expect(assigneeLoader).toContain('.eq("organization_id", organizationId)');
    expect(assigneeLoader).toContain('.eq("status", "active")');
    expect(assigneeLoader).not.toContain("rpc(");
  });
});
