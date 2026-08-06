import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ATTENTION_LIFECYCLE_ACTIONS_VISIBLE,
  canShowAttentionLifecycleActions,
} from "@/features/attention/ui/attention-workflow-visibility";

function readSrc(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("attention lifecycle foundation boundaries (B1.7.6-A)", () => {
  it("keeps product lifecycle visibility disabled", () => {
    expect(ATTENTION_LIFECYCLE_ACTIONS_VISIBLE).toBe(false);
    expect(canShowAttentionLifecycleActions()).toBe(false);
  });

  it("does not render lifecycle controls in list/detail product surfaces", () => {
    const detail = readSrc("src/features/attention/ui/attention-detail.tsx");
    const list = readSrc("src/features/attention/ui/attention-list.tsx");
    const detailPage = readSrc(
      "src/app/(authenticated)/attention/[attentionItemId]/page.tsx",
    );
    const listPage = readSrc("src/app/(authenticated)/attention/page.tsx");

    for (const source of [detail, list, detailPage, listPage]) {
      expect(source).not.toMatch(
        /acknowledgeAttentionItemAction|assignAttentionItemAction|updateAttentionSeverityAction|resolveAttentionItemAction|dismissAttentionItemAction|archiveAttentionItemAction/,
      );
      expect(source).not.toMatch(
        />Acknowledge<|>Assign<|>Resolve<|>Dismiss<|>Archive</,
      );
      expect(source).not.toMatch(/createSupabaseBrowserClient|createClient\(/);
    }

    expect(detail).toContain("Lifecycle actions must never render");
    expect(list).toContain("Lifecycle actions must never render");
  });

  it("does not introduce Close/Reopen/Restore/Snooze/Priority action identifiers", () => {
    const types = readSrc(
      "src/features/attention/domain/lifecycle-action-types.ts",
    );
    expect(types).not.toMatch(/"close"|"reopen"|"restore"|"snooze"|"priority"/);
    expect(types).toContain('"acknowledge"');
    expect(types).toContain('"archive"');
  });

  it("keeps action modules on adapters without direct table writes", () => {
    const actions = readSrc(
      "src/features/attention/actions/lifecycle-attention-actions.ts",
    );
    expect(actions).toContain('"use server"');
    expect(actions).toContain("acknowledgeAttentionItem");
    expect(actions).toContain("resolveOrganizationContext");
    expect(actions).not.toMatch(/\.from\(["']attention_/);
    expect(actions).not.toMatch(/insert_attention_item_event/);
  });
});
