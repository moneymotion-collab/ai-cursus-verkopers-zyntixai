import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE,
  ATTENTION_LIFECYCLE_ACTIONS_VISIBLE,
  canShowAttentionAcknowledgeSeverityActions,
  canShowAttentionLifecycleActions,
} from "@/features/attention/ui/attention-workflow-visibility";

function readSrc(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("attention lifecycle foundation boundaries (B1.7.6-B)", () => {
  it("keeps the broad lifecycle flag false and enables only B-scoped acknowledge/severity", () => {
    expect(ATTENTION_LIFECYCLE_ACTIONS_VISIBLE).toBe(false);
    expect(canShowAttentionLifecycleActions()).toBe(false);
    expect(ATTENTION_ACKNOWLEDGE_SEVERITY_ACTIONS_VISIBLE).toBe(true);
    expect(canShowAttentionAcknowledgeSeverityActions()).toBe(true);
  });

  it("renders only acknowledge/severity on detail and keeps list free of mutation controls", () => {
    const detail = readSrc("src/features/attention/ui/attention-detail.tsx");
    const list = readSrc("src/features/attention/ui/attention-list.tsx");
    const actions = readSrc(
      "src/features/attention/ui/attention-lifecycle-actions.tsx",
    );
    const detailPage = readSrc(
      "src/app/(authenticated)/attention/[attentionItemId]/page.tsx",
    );
    const listPage = readSrc("src/app/(authenticated)/attention/page.tsx");

    expect(detail).toContain("AttentionAcknowledgeSeverityActions");
    expect(detail).toContain("canShowAttentionAcknowledgeSeverityActions");
    expect(actions).toContain("acknowledgeAttentionItemAction");
    expect(actions).toContain("updateAttentionSeverityAction");
    expect(actions).not.toContain("assignAttentionItemAction");
    expect(actions).not.toContain("resolveAttentionItemAction");
    expect(actions).not.toContain("dismissAttentionItemAction");
    expect(actions).not.toContain("archiveAttentionItemAction");

    for (const source of [list, listPage]) {
      expect(source).not.toContain("AttentionAcknowledgeSeverityActions");
      expect(source).not.toContain("acknowledgeAttentionItemAction");
      expect(source).not.toMatch(/>Acknowledge</);
    }

    expect(detailPage).toContain("organizationId={result.selectedOrganizationId}");
    expect(detailPage).toContain("role={result.role}");

    expect(list).toContain("Lifecycle actions must never render");
    expect(detail).not.toContain("Lifecycle actions must never render");
  });

  it("does not introduce Close/Reopen/Restore/Snooze/Priority or direct Supabase UI clients", () => {
    const actions = readSrc(
      "src/features/attention/ui/attention-lifecycle-actions.tsx",
    );
    const detail = readSrc("src/features/attention/ui/attention-detail.tsx");
    expect(actions).not.toMatch(/\b(close|reopen|restore|snooze)\b/i);
    expect(actions).not.toMatch(/["']priority["']/i);
    expect(actions).not.toMatch(/action:\s*["']priority["']/);
    expect(detail).not.toMatch(/createSupabaseBrowserClient|createClient\(/);
    expect(actions).not.toMatch(/createSupabaseBrowserClient|createClient\(/);
    expect(actions).not.toMatch(/\.from\(["']attention_/);
  });
});
