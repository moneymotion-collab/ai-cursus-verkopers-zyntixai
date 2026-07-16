import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FORM_FILES = [
  "lead-create-form.tsx",
  "lead-edit-form.tsx",
  "lead-stage-form.tsx",
  "lead-status-form.tsx",
  "lead-convert-form.tsx",
  "lead-archive-form.tsx",
  "lead-restore-form.tsx",
];

describe("leads mutation form contract", () => {
  for (const fileName of FORM_FILES) {
    it(`${fileName} uses pendingRef, aria-busy and server actions only`, () => {
      const source = readFileSync(
        join(process.cwd(), "src/features/leads/ui", fileName),
        "utf8",
      );

      expect(source).toContain('"use client"');
      expect(source).toContain("pendingRef");
      expect(source).toContain("aria-busy={isPending}");
      expect(source).toMatch(/disabled=\{locked \|\| isPending\}/);
      expect(source).not.toMatch(/@\/lib\/supabase\/client/);
      expect(source).not.toMatch(/lead-mutations/);
      expect(source).not.toMatch(/\.rpc\(/);
    });
  }
});
