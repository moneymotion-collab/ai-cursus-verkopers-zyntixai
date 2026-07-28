import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readUi(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

/** Collapse JSX/source whitespace so multi-line help copy can be asserted stably. */
function flattenSource(source: string): string {
  return source.replace(/\s+/g, " ");
}

/**
 * Narrow source assertions for B1.5.8: prove prohibited stale “future work”
 * phrases are absent from the remediation surface, while accurate deferrals remain.
 */
describe("B1.5.8 Programs and Enrollments stale-copy remediation", () => {
  const enrollmentCreate = flattenSource(
    readUi("src/features/enrollments/ui/enrollment-create-form.tsx"),
  );
  const enrollmentDetail = flattenSource(
    readUi("src/features/enrollments/ui/enrollment-detail.tsx"),
  );
  const programCreate = flattenSource(readUi("src/features/programs/ui/program-create-form.tsx"));
  const programDetail = flattenSource(readUi("src/features/programs/ui/program-detail.tsx"));

  it("Enrollment create no longer presents lifecycle or ownership as future work", () => {
    expect(enrollmentCreate).toContain("manage lifecycle status and ownership");
    expect(enrollmentCreate).not.toContain(
      "Lifecycle, owner, and metadata changes follow in a later phase",
    );
  });

  it("Enrollment create does not claim metadata editing exists, and keeps metadata deferred", () => {
    expect(enrollmentCreate).toContain("Metadata editing is not available yet");
    expect(enrollmentCreate).not.toContain('name="metadata"');
    expect(enrollmentCreate).not.toMatch(/metadata editor/i);
  });

  it("Program create no longer presents Enrollment management as future work", () => {
    expect(programCreate).toContain("enroll customers through the Enrollments workspace");
    expect(programCreate).toContain("program is active");
    expect(programCreate).not.toContain("Enrollment management follows in a later phase");
  });

  it("Program detail no longer presents Enrollment management as future work", () => {
    expect(programDetail).toContain("Enrollments are managed in the Enrollments workspace");
    expect(programDetail).not.toContain(
      "Enrollment management and progress tracking will follow in later phases",
    );
  });

  it("Program create still does not add contextual Enrollment links or CTAs (unchanged by B1.5.9)", () => {
    expect(programCreate).not.toMatch(/href=\{?["'`]\/enrollments/);
    expect(programCreate).not.toMatch(/New enrollment/i);
  });

  it("Program detail's contextual Enrollment links (B1.5.9) are gated behind an optional prop, not hardcoded", () => {
    // B1.5.9 intentionally adds an optional `enrollmentLinks` prop rendering
    // "View enrollments" / "New enrollment" — verify it stays conditional
    // rather than always-on, so ineligible/viewer contexts render nothing.
    expect(programDetail).toMatch(/enrollmentLinks/);
    expect(programDetail).toMatch(/enrollmentLinks\s*\?/);
  });

  it("Progress no longer claims deferred tracking; Progress workspace language is present", () => {
    expect(enrollmentDetail).not.toContain(
      "Progress tracking within this enrollment is deferred to a later phase.",
    );
    expect(enrollmentDetail).not.toContain("deferred to a later phase");
    expect(enrollmentDetail).toContain(
      "Progress records for this enrollment are managed in the Progress workspace.",
    );

    expect(programDetail).not.toContain("Progress tracking remains deferred to a later phase");
    expect(programDetail).not.toContain("deferred to a later phase");
    expect(programDetail).toContain(
      "Progress records for this program are managed in the Progress workspace.",
    );
  });

  it("retired/cancelled/archived terminology is not collapsed in remediation-surface help copy", () => {
    const combined = [enrollmentCreate, enrollmentDetail, programCreate, programDetail].join("\n");
    expect(combined).not.toMatch(/delete this enrollment/i);
    expect(combined).not.toMatch(/reactivate from archive/i);
  });
});
