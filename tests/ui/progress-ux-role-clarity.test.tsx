import React from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProgressCorrectForm } from "@/features/progress/ui/progress-correct-form";
import { ProgressRecordForm } from "@/features/progress/ui/progress-record-form";
import { ProgressVoidForm } from "@/features/progress/ui/progress-void-form";
import { resolveProgressListEmptyState } from "@/features/progress/ui/progress-list-empty-state";
import { canShowRecordProgressWorkflow } from "@/features/progress/ui/progress-workflow-visibility";
import {
  ENROLLMENT_ID,
  ORG_ID,
  PROGRESS_FACT_ID,
  sampleProgressDetailViewModel,
} from "../helpers/progress-test-fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/progress/actions/progress-actions", () => ({
  correctProgressFactAction: vi.fn(),
  recordProgressFactAction: vi.fn(),
  voidProgressFactAction: vi.fn(),
}));

const listBase = {
  org: ORG_ID,
  includeVoided: false,
  sort: "occurred_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("B1.6.5 Progress UX, empty states, and role clarity", () => {
  describe("D1 — Correct predecessor void explanation", () => {
    it("explains soft-void lineage and rejects unchanged/overwrite/delete claims", () => {
      const html = renderToStaticMarkup(
        <ProgressCorrectForm
          organizationId={ORG_ID}
          data={sampleProgressDetailViewModel}
          backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
        />,
      );

      expect(html).toContain("adds a new progress record");
      expect(html).toContain("marks the original as void");
      expect(html).toContain("stays visible in history");
      expect(html).toContain("not a silent overwrite");
      expect(html).not.toContain("kept unchanged");
      expect(html).not.toContain("unchanged for history");
      expect(html).not.toContain("permanently delete");
      expect(html).not.toContain("hard delete");
      expect(html).not.toContain("p_corrected_from_fact_id");
      expect(html).not.toContain("RPC");
    });
  });

  describe("A1 — field error associations in Record and Correct sources", () => {
    it("pairs every aria-invalid Progress Record field with aria-describedby and a unique error id", () => {
      const source = readSource("src/features/progress/ui/progress-record-form.tsx");
      const fields = [
        "record-progress-enrollment",
        "record-progress-fact-type",
        "record-progress-occurred-at",
        "record-progress-title",
        "record-progress-numeric-unit",
        "record-progress-idempotency-key",
      ];

      for (const fieldId of fields) {
        expect(source).toContain(`id="${fieldId}"`);
        expect(source).toContain(`${fieldId}-error`);
        expect(source).toMatch(
          new RegExp(
            `id="${fieldId}"[\\s\\S]{0,500}?aria-describedby=\\{[\\s\\S]{0,200}?${fieldId}-error`,
          ),
        );
      }

      expect(source.match(/id="record-progress-enrollment-error"/g)?.length).toBe(1);
      expect(source.match(/id="record-progress-fact-type-error"/g)?.length).toBe(1);
      expect(source.match(/id="record-progress-occurred-at-error"/g)?.length).toBe(1);
      expect(source.match(/id="record-progress-title-error"/g)?.length).toBe(1);
      expect(source.match(/id="record-progress-numeric-unit-error"/g)?.length).toBe(1);
      expect(source.match(/id="record-progress-idempotency-key-error"/g)?.length).toBe(1);
      expect(source).not.toContain("aria-errormessage");
    });

    it("pairs every aria-invalid Progress Correct field with aria-describedby and a unique error id", () => {
      const source = readSource("src/features/progress/ui/progress-correct-form.tsx");
      const fields = [
        "correct-progress-fact-type",
        "correct-progress-occurred-at",
        "correct-progress-numeric-unit",
      ];

      for (const fieldId of fields) {
        expect(source).toContain(`id="${fieldId}"`);
        expect(source).toContain(`${fieldId}-error`);
        expect(source).toMatch(
          new RegExp(
            `id="${fieldId}"[\\s\\S]{0,500}?aria-describedby=\\{[\\s\\S]{0,200}?${fieldId}-error`,
          ),
        );
      }

      expect(source.match(/id="correct-progress-fact-type-error"/g)?.length).toBe(1);
      expect(source.match(/id="correct-progress-occurred-at-error"/g)?.length).toBe(1);
      expect(source.match(/id="correct-progress-numeric-unit-error"/g)?.length).toBe(1);
      expect(source).not.toContain("aria-errormessage");
    });

    it("keeps Void reason field error association", () => {
      const source = readSource("src/features/progress/ui/progress-void-form.tsx");
      expect(source).toMatch(
        /id="void-progress-reason"[\s\S]{0,400}?aria-describedby=\{[\s\S]{0,120}?void-progress-reason-error/,
      );
      expect(source.match(/id="void-progress-reason-error"/g)?.length).toBe(1);
    });
  });

  describe("C2 — empty / no-results / voided-empty", () => {
    it("keeps EMPTY distinct from NO RESULTS and VOIDED EMPTY", () => {
      const empty = resolveProgressListEmptyState(listBase);
      const noResults = resolveProgressListEmptyState({ ...listBase, q: "missing" });
      const programFilter = resolveProgressListEmptyState({
        ...listBase,
        programId: "22222222-2222-4222-8222-222222222222",
      });
      const enrollmentFilter = resolveProgressListEmptyState({
        ...listBase,
        enrollmentId: ENROLLMENT_ID,
      });
      const voidedEmpty = resolveProgressListEmptyState({ ...listBase, includeVoided: true });

      expect(empty.title).toBe("No progress records yet");
      expect(empty.description).toContain("appear here");
      expect(empty.clearHref).toBeUndefined();

      expect(noResults.title).toBe("No progress records match these filters");
      expect(noResults.description).toContain("may still exist");
      expect(noResults.clearHref).toContain("/progress");
      expect(noResults.clearHref).not.toContain("q=");

      expect(programFilter.title).toBe("No progress records match these filters");
      expect(programFilter.clearHref).toBeDefined();
      expect(enrollmentFilter.title).toBe("No progress records match these filters");

      expect(voidedEmpty.title).toBe("No voided progress records");
      expect(voidedEmpty.description).toContain("not deleted");
      expect(voidedEmpty.title).not.toBe(empty.title);
      expect(voidedEmpty.title).not.toBe(noResults.title);
    });
  });

  describe("P3 — mutation UX copy", () => {
    it("clarifies Record adds a new fact without changing earlier records", () => {
      const html = renderToStaticMarkup(
        <ProgressRecordForm
          organizationId={ORG_ID}
          enrollmentOptions={[{ value: ENROLLMENT_ID, label: "Acme · Growth (Active)" }]}
          backHref={`/progress?org=${ORG_ID}`}
        />,
      );
      expect(html).toContain("Adds a new progress record");
      expect(html).toContain("Earlier records are not changed");
      expect(html).toContain("Cancel");
      expect(html).not.toContain("later phase");
      expect(html).not.toContain("automatically");
    });

    it("clarifies Void is soft revoke, not hard delete", () => {
      const html = renderToStaticMarkup(
        <ProgressVoidForm
          organizationId={ORG_ID}
          data={sampleProgressDetailViewModel}
          backHref={`/progress/${PROGRESS_FACT_ID}?org=${ORG_ID}`}
        />,
      );
      expect(html).toContain("not a hard delete");
      expect(html).toContain("stays in history");
      expect(html).toContain("Cancel");
      expect(html).not.toContain("permanently delete");
    });
  });

  describe("Role clarity helpers", () => {
    it("allows record workflow for owner/admin/staff and denies viewer", () => {
      expect(canShowRecordProgressWorkflow("owner")).toBe(true);
      expect(canShowRecordProgressWorkflow("admin")).toBe(true);
      expect(canShowRecordProgressWorkflow("staff")).toBe(true);
      expect(canShowRecordProgressWorkflow("viewer")).toBe(false);
    });
  });
});
