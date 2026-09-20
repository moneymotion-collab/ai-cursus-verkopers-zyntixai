import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomerArchiveForm } from "@/features/customers/ui/customer-archive-form";
import { CustomerRestoreForm } from "@/features/customers/ui/customer-restore-form";
import { CustomerStatusForm } from "@/features/customers/ui/customer-status-form";
import { CustomerUnavailableDetail } from "@/features/customers/ui/customer-detail";
import { CustomerLifecycleSummary } from "@/features/customers/ui/customer-lifecycle-confirmation";
import { getStatusTransitionEffectExplanation } from "@/features/customers/ui/customer-status-transition-copy";
import { getAllowedCustomerStatusTransitions } from "@/features/customers/domain/status";
import {
  DEFAULT_PRODUCT_TERMINOLOGY,
} from "@/features/product-access/domain/terminology";
import {
  buildOperatingModelProductModuleAccess,
  terminologyForOperatingModel,
} from "@/features/product-access/domain/operating-model-module-access";
import type { OperatingModelId } from "@/features/onboarding/domain/operating-model";
import { archivedCustomerDetail, sampleCustomerDetail } from "../helpers/customer-mutation-mocks";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import type { CustomerStatus } from "@/features/customers/domain/types";

const archiveLoaderMock = vi.hoisted(() => vi.fn());
const restoreLoaderMock = vi.hoisted(() => vi.fn());
const statusLoaderMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({})),
}));

vi.mock("@/features/customers/ui/load-customer-lifecycle-workflow-page", () => ({
  loadCustomerArchivePage: archiveLoaderMock,
  loadCustomerRestorePage: restoreLoaderMock,
  loadCustomerStatusPage: statusLoaderMock,
}));

import CustomerArchivePage from "@/app/(authenticated)/customers/[customerId]/archive/page";
import CustomerRestorePage from "@/app/(authenticated)/customers/[customerId]/restore/page";
import CustomerStatusPage from "@/app/(authenticated)/customers/[customerId]/status/page";
import CustomerArchiveLoading from "@/app/(authenticated)/customers/[customerId]/archive/loading";
import CustomerRestoreLoading from "@/app/(authenticated)/customers/[customerId]/restore/loading";
import CustomerStatusLoading from "@/app/(authenticated)/customers/[customerId]/status/loading";
import CustomerDetailError from "@/app/(authenticated)/customers/[customerId]/error";

const listState = {
  org: sampleCustomerDetail.organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

const agencyTerminology = terminologyForOperatingModel("service");
const courseSellerTerminology = terminologyForOperatingModel("course_seller");
const fieldTerminology = terminologyForOperatingModel("field_operations");
const productTerminology = terminologyForOperatingModel("product_operations");

const archivePageSource = readFileSync(
  join(process.cwd(), "src/app/(authenticated)/customers/[customerId]/archive/page.tsx"),
  "utf8",
);
const restorePageSource = readFileSync(
  join(process.cwd(), "src/app/(authenticated)/customers/[customerId]/restore/page.tsx"),
  "utf8",
);
const statusPageSource = readFileSync(
  join(process.cwd(), "src/app/(authenticated)/customers/[customerId]/status/page.tsx"),
  "utf8",
);

function pageParams() {
  return {
    params: Promise.resolve({ customerId: sampleCustomerDetail.id }),
    searchParams: Promise.resolve({ org: sampleCustomerDetail.organizationId }),
  };
}

function readyResult(model: OperatingModelId, customer: CustomerDetailReadModel = sampleCustomerDetail) {
  const moduleAccess = buildOperatingModelProductModuleAccess(model);
  return {
    kind: "ready" as const,
    customer,
    organizationId: customer.organizationId,
    organizationOptions: [
      { organizationId: customer.organizationId, role: "owner" as const, displayName: "Org Alpha" },
    ],
    role: "owner" as const,
    timeZone: "UTC",
    listState,
    backHref: `/customers/${customer.id}`,
    moduleAccess,
    allowedTargets: getAllowedCustomerStatusTransitions(customer.status),
  };
}

async function renderArchivePage() {
  return renderToStaticMarkup(await CustomerArchivePage(pageParams()));
}

async function renderRestorePage() {
  return renderToStaticMarkup(await CustomerRestorePage(pageParams()));
}

async function renderStatusPage() {
  return renderToStaticMarkup(await CustomerStatusPage(pageParams()));
}

function renderStatusForm(
  terminology: ReturnType<typeof terminologyForOperatingModel>,
  allowedTargets: CustomerStatus[],
  customer: CustomerDetailReadModel = sampleCustomerDetail,
) {
  return renderToStaticMarkup(
    <CustomerStatusForm
      organizationId={customer.organizationId}
      customer={customer}
      allowedTargets={allowedTargets}
      listState={listState}
      cancelHref={`/customers/${customer.id}`}
      terminology={terminology}
    />,
  );
}

beforeEach(() => {
  archiveLoaderMock.mockReset();
  restoreLoaderMock.mockReset();
  statusLoaderMock.mockReset();
});

describe("CB-VIS-1-R2 production lifecycle callers keep terminology", () => {
  it("threads moduleAccess.terminology through archive, restore, and status pages", () => {
    for (const source of [archivePageSource, restorePageSource, statusPageSource]) {
      expect(source).toContain("terminology={result.moduleAccess.terminology}");
      expect((source.match(/terminology=\{result\.moduleAccess\.terminology\}/g) ?? []).length).toBeGreaterThanOrEqual(2);
      expect(source).toContain("lifecycleAuthRequiredCopy");
      expect(source).toContain("unresolved");
    }
  });

  it("renders Agency Client confirmation from the archive, restore, and status pages", async () => {
    expect(agencyTerminology.customer.singular).toBe("Client");
    expect(agencyTerminology).not.toEqual(DEFAULT_PRODUCT_TERMINOLOGY);

    archiveLoaderMock.mockResolvedValue(readyResult("service"));
    restoreLoaderMock.mockResolvedValue(readyResult("service", archivedCustomerDetail));
    statusLoaderMock.mockResolvedValue(readyResult("service"));

    const archiveHtml = await renderArchivePage();
    const restoreHtml = await renderRestorePage();
    const statusHtml = await renderStatusPage();

    expect(archiveHtml).toContain("Archive client");
    expect(archiveHtml).toContain("Client summary");
    expect(archiveHtml).toContain("Back to client");
    expect(archiveHtml).not.toContain("Archive customer");
    expect(archiveHtml).not.toContain("Customer summary");

    expect(restoreHtml).toContain("Restore client");
    expect(restoreHtml).toContain("Client summary");
    expect(restoreHtml).not.toContain("Restore customer");

    expect(statusHtml).toContain("Change client status");
    expect(statusHtml).toContain("Current client status:");
    expect(statusHtml).not.toContain("Change customer status");
  });

  it("renders Course Seller Customer confirmation from the production pages", async () => {
    expect(courseSellerTerminology.customer.singular).toBe("Customer");
    expect(courseSellerTerminology.project.singular).toBe("Project");

    archiveLoaderMock.mockResolvedValue(readyResult("course_seller"));
    restoreLoaderMock.mockResolvedValue(readyResult("course_seller", archivedCustomerDetail));
    statusLoaderMock.mockResolvedValue(readyResult("course_seller"));

    const archiveHtml = await renderArchivePage();
    const restoreHtml = await renderRestorePage();
    const statusHtml = await renderStatusPage();

    expect(archiveHtml).toContain("Archive customer");
    expect(archiveHtml).toContain("Customer summary");
    expect(archiveHtml).not.toContain("Archive client");
    expect(restoreHtml).toContain("Restore customer");
    expect(restoreHtml).not.toContain("Restore client");
    expect(statusHtml).toContain("Change customer status");
    expect(statusHtml).not.toContain("Change client status");
  });

  it("renders Field Customer archive and restore from field_operations terminology", async () => {
    expect(fieldTerminology.customer.singular).toBe("Customer");
    expect(fieldTerminology.project.singular).toBe("Job");
    expect(DEFAULT_PRODUCT_TERMINOLOGY.project.singular).toBe("Project");

    archiveLoaderMock.mockResolvedValue(readyResult("field_operations"));
    restoreLoaderMock.mockResolvedValue(readyResult("field_operations", archivedCustomerDetail));

    const archiveHtml = await renderArchivePage();
    const restoreHtml = await renderRestorePage();

    expect(archiveHtml).toContain("Archive customer");
    expect(archiveHtml).toContain("Customer summary");
    expect(archiveHtml).not.toContain("Archive client");
    expect(restoreHtml).toContain("Restore customer");
    expect(restoreHtml).not.toContain("Client summary");
  });

  it("renders Product-context Customer wording from product_operations terminology", () => {
    expect(productTerminology.product.singular).toBe("Product");
    expect(productTerminology.customer.singular).toBe("Customer");
    expect(agencyTerminology.customer.singular).toBe("Client");

    const html = renderToStaticMarkup(
      <CustomerArchiveForm
        organizationId={sampleCustomerDetail.organizationId}
        customer={sampleCustomerDetail}
        listState={listState}
        backHref={`/customers/${sampleCustomerDetail.id}`}
        terminology={productTerminology}
      />,
    );
    const summaryHtml = renderToStaticMarkup(
      <CustomerLifecycleSummary customer={sampleCustomerDetail} terminology={productTerminology} />,
    );

    expect(html).toContain("Archive customer");
    expect(html).toContain("Customer summary");
    expect(html).not.toContain("Archive client");
    expect(summaryHtml).toContain("Customer summary");
    expect(summaryHtml).not.toContain("Client summary");
  });
});

describe("CB-VIS-1-R2 lifecycle fail-closed copy", () => {
  it("uses record wording when authentication or organization cannot be resolved", async () => {
    archiveLoaderMock.mockResolvedValue({ kind: "auth_required" });
    restoreLoaderMock.mockResolvedValue({ kind: "organization_required", organizations: [] });
    statusLoaderMock.mockResolvedValue({ kind: "auth_required" });

    const archiveHtml = await renderArchivePage();
    const restoreHtml = await renderRestorePage();
    const statusHtml = await renderStatusPage();

    expect(archiveHtml).toContain("Please sign in to archive this record.");
    expect(archiveHtml).not.toContain("Please sign in to archive customers.");
    expect(restoreHtml).toContain("Select an organization before restoring this record.");
    expect(restoreHtml).not.toContain("restoring this customer");
    expect(statusHtml).toContain("Please sign in to change the status of this record.");
    expect(statusHtml).not.toContain("change customer status");
  });

  it("uses Record unavailable when the identifier is invalid before organization resolution", async () => {
    archiveLoaderMock.mockResolvedValue({ kind: "invalid_customer" });
    const html = await renderArchivePage();
    expect(html).toContain("Record unavailable");
    expect(html).toContain("This record is unavailable");
    expect(html).toContain("Back to records");
    expect(html).not.toContain("Customer unavailable");
    expect(html).not.toContain("Client unavailable");
  });

  it("uses governed terminology on Agency action-unavailable and unavailable-detail branches", async () => {
    archiveLoaderMock.mockResolvedValue({
      kind: "action_unavailable",
      message: "This client cannot be archived in its current state.",
      backHref: `/customers/${sampleCustomerDetail.id}`,
      terminology: agencyTerminology,
    });
    restoreLoaderMock.mockResolvedValue({
      kind: "customer_unavailable",
      listState,
      terminology: agencyTerminology,
    });

    const archiveHtml = await renderArchivePage();
    const restoreHtml = await renderRestorePage();

    expect(archiveHtml).toContain("Archive client unavailable");
    expect(archiveHtml).toContain("This client cannot be archived in its current state.");
    expect(archiveHtml).toContain("Back to client");
    expect(archiveHtml).not.toContain("What archiving means");
    expect(archiveHtml).not.toContain("Archive is not deletion");
    expect(restoreHtml).toContain("Client unavailable");
    expect(restoreHtml).not.toContain("Restore client");
    expect(restoreHtml).not.toContain("What restoring means");
  });

  it("CustomerUnavailableDetail unresolved mode does not claim Customer", () => {
    const html = renderToStaticMarkup(
      <CustomerUnavailableDetail backHref="/customers" unresolved />,
    );
    expect(html).toContain("Record unavailable");
    expect(html).not.toContain("Customer unavailable");
  });
});

describe("CB-VIS-1-R2 status-effect terminology", () => {
  it("uses Client in Agency Completed, Cancelled, and Churned effect copy", () => {
    expect(getStatusTransitionEffectExplanation("active", "completed", agencyTerminology)).toBe(
      "Moving to Completed marks the client lifecycle as finished while keeping their record available.",
    );
    expect(getStatusTransitionEffectExplanation("active", "cancelled", agencyTerminology)).toBe(
      "Moving to Cancelled records that the client engagement ended by cancellation.",
    );
    expect(getStatusTransitionEffectExplanation("active", "churned", agencyTerminology)).toBe(
      "Moving to Churned records that the client has left the service.",
    );
    expect(getStatusTransitionEffectExplanation("completed", "active", agencyTerminology)).toBe(
      "Returning to Active or Onboarding re-opens the client for normal engagement workflows.",
    );

    const completedHtml = renderStatusForm(agencyTerminology, ["completed"]);
    const cancelledHtml = renderStatusForm(agencyTerminology, ["cancelled"]);
    const churnedHtml = renderStatusForm(agencyTerminology, ["churned"]);

    expect(completedHtml).toContain("marks the client lifecycle as finished");
    expect(completedHtml).not.toContain("marks the customer lifecycle");
    expect(cancelledHtml).toContain("the client engagement ended by cancellation");
    expect(cancelledHtml).not.toContain("the customer engagement");
    expect(churnedHtml).toContain("the client has left the service");
    expect(churnedHtml).not.toContain("the customer has left");
  });

  it("uses Field Customer wording in a non-Agency effect explanation", () => {
    expect(fieldTerminology.project.singular).toBe("Job");
    const explanation = getStatusTransitionEffectExplanation(
      "active",
      "completed",
      fieldTerminology,
    );
    expect(explanation).toContain("the customer lifecycle");
    expect(explanation).not.toContain("the client lifecycle");

    const html = renderStatusForm(fieldTerminology, ["completed"]);
    expect(html).toContain("marks the customer lifecycle as finished");
    expect(html).not.toContain("marks the client lifecycle");
  });
});

describe("CB-VIS-1-R2 lifecycle page gating for unauthorized roles", () => {
  it("does not render archive, restore, or status confirmation for viewer loader denials", async () => {
    archiveLoaderMock.mockResolvedValue({
      kind: "action_unavailable",
      message: "This customer cannot be archived in its current state.",
      backHref: `/customers/${sampleCustomerDetail.id}`,
      terminology: courseSellerTerminology,
    });
    restoreLoaderMock.mockResolvedValue({
      kind: "customer_unavailable",
      listState,
      terminology: courseSellerTerminology,
    });
    statusLoaderMock.mockResolvedValue({
      kind: "action_unavailable",
      message: "This customer status cannot be changed in its current state.",
      backHref: `/customers/${sampleCustomerDetail.id}`,
      terminology: courseSellerTerminology,
    });

    const archiveHtml = await renderArchivePage();
    const restoreHtml = await renderRestorePage();
    const statusHtml = await renderStatusPage();

    expect(archiveHtml).toContain("Archive customer unavailable");
    expect(archiveHtml).not.toContain("What archiving means");
    expect(archiveHtml).not.toContain("Archive is not deletion");
    expect(restoreHtml).toContain("Customer unavailable");
    expect(restoreHtml).not.toContain("What restoring means");
    expect(restoreHtml).not.toContain("No customer status change occurs during restore");
    expect(statusHtml).toContain("Change status unavailable");
    expect(statusHtml).not.toContain("New customer status");
    expect(statusHtml).not.toContain('name="toStatus"');
  });

  it("still renders owner archive confirmation when the loader returns ready", async () => {
    archiveLoaderMock.mockResolvedValue(readyResult("course_seller"));
    const html = await renderArchivePage();
    expect(html).toContain("What archiving means");
    expect(html).toContain("Archive customer");
  });
});

describe("CB-VIS-1-R2-C2 lifecycle loading and unexpected-error copy", () => {
  function assertNoVisibleCustomerOrClient(html: string) {
    expect(html).not.toContain("Customer");
    expect(html).not.toContain("customer");
    expect(html).not.toContain("Client");
    expect(html).not.toContain("client");
  }

  it("renders archive, restore, and status loading with neutral record headings", () => {
    const archiveHtml = renderToStaticMarkup(<CustomerArchiveLoading />);
    const restoreHtml = renderToStaticMarkup(<CustomerRestoreLoading />);
    const statusHtml = renderToStaticMarkup(<CustomerStatusLoading />);

    expect(archiveHtml).toContain("Archive record");
    expect(archiveHtml).toContain("Loading archive form…");
    expect(archiveHtml).toContain('aria-busy="true"');
    expect(archiveHtml).toContain('aria-live="polite"');
    expect(archiveHtml).not.toContain("Archive customer");
    assertNoVisibleCustomerOrClient(archiveHtml);

    expect(restoreHtml).toContain("Restore record");
    expect(restoreHtml).toContain("Loading restore form…");
    expect(restoreHtml).toContain('aria-busy="true"');
    expect(restoreHtml).toContain('aria-live="polite"');
    expect(restoreHtml).not.toContain("Restore customer");
    assertNoVisibleCustomerOrClient(restoreHtml);

    expect(statusHtml).toContain("Change record status");
    expect(statusHtml).toContain("Loading status form…");
    expect(statusHtml).toContain('aria-busy="true"');
    expect(statusHtml).toContain('aria-live="polite"');
    expect(statusHtml).not.toContain("Change customer status");
    assertNoVisibleCustomerOrClient(statusHtml);
  });

  it("renders the shared unexpected-error boundary with record wording and retry", () => {
    const html = renderToStaticMarkup(
      <CustomerDetailError error={Object.assign(new Error("secret-internal"), { digest: "abc" })} reset={() => undefined} />,
    );

    expect(html).toContain("Something went wrong");
    expect(html).toContain("Unable to display this record");
    expect(html).toContain("An unexpected error occurred while loading this record. Please try again.");
    expect(html).toContain("Try again");
    expect(html).toContain('type="button"');
    expect(html).not.toContain("customer details");
    expect(html).not.toContain("this customer");
    expect(html).not.toContain("secret-internal");
    expect(html).not.toContain("abc");
    assertNoVisibleCustomerOrClient(html);
  });

  it("keeps Agency Client and Course Seller Customer on ready lifecycle pages", async () => {
    archiveLoaderMock.mockResolvedValue(readyResult("service"));
    restoreLoaderMock.mockResolvedValue(readyResult("service", archivedCustomerDetail));
    statusLoaderMock.mockResolvedValue(readyResult("service"));

    expect(await renderArchivePage()).toContain("Archive client");
    expect(await renderRestorePage()).toContain("Restore client");
    expect(await renderStatusPage()).toContain("Change client status");

    archiveLoaderMock.mockResolvedValue(readyResult("course_seller"));
    restoreLoaderMock.mockResolvedValue(readyResult("course_seller", archivedCustomerDetail));
    statusLoaderMock.mockResolvedValue(readyResult("course_seller"));

    expect(await renderArchivePage()).toContain("Archive customer");
    expect(await renderRestorePage()).toContain("Restore customer");
    expect(await renderStatusPage()).toContain("Change customer status");
  });
});
