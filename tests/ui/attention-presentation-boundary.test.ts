import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import { canShowAttentionLifecycleActions } from "@/features/attention/ui/attention-workflow-visibility";

function readSrc(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("attention presentation foundation boundaries (B1.7.5-A)", () => {
  it("keeps navigation and lifecycle actions disabled", () => {
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
    expect(canShowAttentionLifecycleActions()).toBe(false);
  });

  it("does not introduce UI Supabase queries, mutations, or B1.7.4 default edits", () => {
    const presentationOnlyFiles = [
      "src/features/attention/ui/attention-presentation.ts",
      "src/features/attention/ui/attention-empty-state.ts",
      "src/features/attention/ui/attention-state-panels.tsx",
      "src/features/attention/ui/attention-foundation-shell.tsx",
      "src/features/attention/ui/load-attention-shell-page.ts",
      "src/features/attention/ui/attention-workflow-visibility.ts",
      "src/features/attention/ui/attention-list.tsx",
      "src/features/attention/ui/attention-list-filters.tsx",
      "src/features/attention/ui/attention-list-search-params.ts",
    ];

    for (const file of presentationOnlyFiles) {
      const source = readSrc(file);
      expect(source).not.toMatch(/\.from\(["']attention_/);
      expect(source).not.toMatch(
        /create_manual_attention_item|acknowledge_attention_item|assign_attention_item|resolve_attention_item|dismiss_attention_item|archive_attention_item/,
      );
      expect(source).not.toContain("ATTENTION_NAV_VISIBLE = true");
    }

    expect(readSrc("src/features/attention/ui/attention-list.tsx")).not.toMatch(
      /listAttentionItems|getAttentionItemById/,
    );
    expect(
      readSrc("src/features/attention/ui/load-attention-list-page.ts"),
    ).toContain("listAttentionItems");
    expect(
      readSrc("src/features/attention/ui/load-attention-list-page.ts"),
    ).toContain("parseAttentionListSearchParams");
    expect(
      readSrc("src/features/attention/ui/attention-list-search-params.ts"),
    ).toContain('ATTENTION_LIST_DEFAULT_SORT_FIELD');
    expect(
      readSrc("src/features/attention/ui/attention-list.tsx"),
    ).not.toMatch(/href=\{[^}]*detailHref/);

    const page = readSrc("src/app/(authenticated)/attention/page.tsx");
    expect(page).not.toMatch(/\.from\(["']attention_/);
    expect(page).toContain("AttentionListFilters");
    expect(page).toContain("Pagination");
    expect(page).not.toMatch(/attention\/\[/);

    const schema = readSrc(
      "src/features/attention/validation/read-query-schemas.ts",
    );
    expect(schema).toContain('.default("created_at")');
    expect(schema).not.toContain("ATTENTION_NAV_VISIBLE");

    const navigation = readSrc(
      "src/features/attention/domain/attention-navigation.ts",
    );
    expect(navigation).toMatch(/ATTENTION_NAV_VISIBLE\s*=\s*false/);
  });
});
