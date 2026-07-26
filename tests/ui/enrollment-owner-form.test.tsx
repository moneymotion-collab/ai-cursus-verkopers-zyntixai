import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EnrollmentOwnerForm } from "@/features/enrollments/ui/enrollment-owner-form";
import { updateEnrollmentOwnerMetadataAction } from "@/features/enrollments/actions/enrollment-actions";
import { MEMBER_ID, ORG_ID, sampleEnrollmentDetail } from "../helpers/enrollment-test-fixtures";

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "enrolled_at" as const,
  direction: "desc" as const,
  page: 1,
  pageSize: 25,
};

const members = [{ value: MEMBER_ID, label: "Jordan Lee" }];

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/features/enrollments/actions/enrollment-actions", () => ({
  updateEnrollmentOwnerMetadataAction: vi.fn(),
}));

const updateOwnerActionMock = vi.mocked(updateEnrollmentOwnerMetadataAction);

describe("EnrollmentOwnerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an owner select with Unassigned and eligible members, preselecting the current owner", () => {
    const html = renderToStaticMarkup(
      <EnrollmentOwnerForm
        organizationId={ORG_ID}
        enrollment={sampleEnrollmentDetail}
        members={members}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
      />,
    );

    expect(html).toContain("Edit enrollment owner");
    expect(html).toContain("Unassigned");
    expect(html).toContain("Jordan Lee");
    expect(html).toContain('name="ownerMemberId"');
    expect(html).not.toContain('name="metadata"');
    expect(html).not.toContain("Metadata");
  });

  it("renders a members error banner when provided", () => {
    const html = renderToStaticMarkup(
      <EnrollmentOwnerForm
        organizationId={ORG_ID}
        enrollment={sampleEnrollmentDetail}
        members={[]}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
        membersError="Some organization members could not be loaded. Please try again."
      />,
    );

    expect(html).toContain("Some organization members could not be loaded");
  });

  it("does not invoke updateEnrollmentOwnerMetadataAction during static render", () => {
    renderToStaticMarkup(
      <EnrollmentOwnerForm
        organizationId={ORG_ID}
        enrollment={sampleEnrollmentDetail}
        members={members}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
      />,
    );
    expect(updateOwnerActionMock).not.toHaveBeenCalled();
  });

  it("submits only organizationId, enrollmentId, and ownerMemberId — never metadata", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/enrollments/ui/enrollment-owner-form.tsx"),
      "utf8",
    );
    const callMatch = source.match(/updateEnrollmentOwnerMetadataAction\(\{[^}]*\}\)/s);
    expect(callMatch).not.toBeNull();
    if (callMatch) {
      expect(callMatch[0]).toContain("organizationId");
      expect(callMatch[0]).toContain("enrollmentId");
      expect(callMatch[0]).toContain("ownerMemberId");
      expect(callMatch[0]).not.toContain("metadata");
    }
  });

  it("renders an Unassigned option to allow clearing the owner when the enrollment has none", () => {
    const html = renderToStaticMarkup(
      <EnrollmentOwnerForm
        organizationId={ORG_ID}
        enrollment={{ ...sampleEnrollmentDetail, ownerMemberId: null }}
        members={members}
        listState={listState}
        cancelHref={`/enrollments/${sampleEnrollmentDetail.id}`}
      />,
    );

    expect(html).toContain("Unassigned");
    expect(html).toMatch(/<option[^>]*value=""[^>]*>Unassigned<\/option>/);
  });
});
