import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerArchiveForm } from "@/features/customers/ui/customer-archive-form";
import { CustomerRestoreForm } from "@/features/customers/ui/customer-restore-form";
import { archivedCustomerDetail, sampleCustomerDetail } from "../helpers/customer-mutation-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const listState = {
  org: sampleCustomerDetail.organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("CustomerArchiveForm", () => {
  it("states archive is not deletion and preserves lifecycle status", () => {
    const html = renderToStaticMarkup(
      <CustomerArchiveForm
        organizationId={sampleCustomerDetail.organizationId}
        customer={sampleCustomerDetail}
        listState={listState}
        backHref={`/customers/${sampleCustomerDetail.id}`}
      />,
    );
    expect(html).toContain("Archive customer");
    expect(html).toContain("Archive is not deletion");
    expect(html).toContain("lifecycle status remains Active");
    expect(html).not.toContain("status history");
  });
});

describe("CustomerRestoreForm", () => {
  it("requires archived customer and preserves lifecycle status", () => {
    const html = renderToStaticMarkup(
      <CustomerRestoreForm
        organizationId={archivedCustomerDetail.organizationId}
        customer={archivedCustomerDetail}
        listState={listState}
        backHref={`/customers/${archivedCustomerDetail.id}`}
      />,
    );
    expect(html).toContain("Restore customer");
    expect(html).toContain("lifecycle status remains Active");
    expect(html).toContain("Restore customer");
  });
});
