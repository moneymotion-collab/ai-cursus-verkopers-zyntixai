import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerCreateForm } from "@/features/customers/ui/customer-create-form";
import { CustomerArchiveForm } from "@/features/customers/ui/customer-archive-form";
import { sampleCustomerDetail } from "../helpers/customer-mutation-mocks";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("customer workflow accessibility", () => {
  it("renders page headings and associated field labels on create form", () => {
    const html = renderToStaticMarkup(
      <CustomerCreateForm
        organizationId="11111111-1111-4111-8111-111111111111"
        listState={{ archived: false, sort: "display_name", direction: "asc", page: 1, pageSize: 25 }}
        ownerOptions={{ members: [], capped: false }}
        cancelHref="/customers"
      />,
    );
    expect(html).toContain("<h1");
    expect(html).toContain("Create customer");
    expect(html).toContain('for="create-display-name"');
    expect(html).toContain("required");
  });

  it("uses descriptive archive confirmation copy", () => {
    const html = renderToStaticMarkup(
      <CustomerArchiveForm
        organizationId={sampleCustomerDetail.organizationId}
        customer={sampleCustomerDetail}
        listState={{ org: sampleCustomerDetail.organizationId, archived: false, sort: "display_name", direction: "asc", page: 1, pageSize: 25 }}
        backHref="/customers"
      />,
    );
    expect(html).toContain("Archive customer");
    expect(html).toContain("What archiving means");
  });

  it("includes focus-visible styles in workflow CSS modules", () => {
    const formCss = readFileSync(
      join(process.cwd(), "src/features/customers/ui/customer-form.module.css"),
      "utf8",
    );
    const lifecycleCss = readFileSync(
      join(process.cwd(), "src/features/customers/ui/customer-lifecycle.module.css"),
      "utf8",
    );
    expect(formCss).toContain(":focus-visible");
    expect(lifecycleCss).toContain(":focus-visible");
  });
});
