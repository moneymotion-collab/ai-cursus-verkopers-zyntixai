import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { AppShell } from "@/components/app-shell";
import type {
  FieldPageContext,
  SiteRecord,
  WorkOrderRecord,
} from "@/features/field-operations/domain/types";
import {
  DispatchView,
  SiteDetail,
  SitesList,
  WorkOrderDetail,
} from "@/features/field-operations/ui/views";
import { ProjectDetail } from "@/features/projects/ui/project-views";
import type { ProjectRecord } from "@/features/projects/domain/types";
import {
  FIELD_MODULE_NAV_VISIBILITY,
  FIELD_PRODUCT_TERMINOLOGY,
  SERVICE_MODULE_NAV_VISIBILITY,
  SERVICE_PRODUCT_TERMINOLOGY,
} from "../features/product-access/module-access-fixtures";

const ORG = "11111111-1111-4111-8111-111111111111";
const PROJECT = "22222222-2222-4222-8222-222222222222";
const SITE = "33333333-3333-4333-8333-333333333333";
const WORK_ORDER = "44444444-4444-4444-8444-444444444444";

const context: FieldPageContext = {
  organizationId: ORG,
  organizationName: "Field Ops",
  organizationOptions: [{ organizationId: ORG, role: "admin", displayName: "Field Ops" }],
  role: "admin",
  terminology: FIELD_PRODUCT_TERMINOLOGY,
  moduleAccess: {
    resolution: "resolved",
    navVisibility: FIELD_MODULE_NAV_VISIBILITY,
    relevantCapabilities: [],
    terminology: FIELD_PRODUCT_TERMINOLOGY,
  },
  moduleId: "sites",
};

const site: SiteRecord = {
  id: SITE,
  organizationId: ORG,
  customerId: "55555555-5555-4555-8555-555555555555",
  customerLabel: "Acme",
  projectId: PROJECT,
  projectLabel: "Boiler installation",
  name: "Warehouse North",
  addressLine1: "Market Street 4",
  addressLine2: null,
  postalCode: "1000 AA",
  city: "Amsterdam",
  country: "Netherlands",
  operationalNote: "Use loading entrance.",
  archivedAt: null,
  createdAt: "2026-09-05T08:00:00Z",
  updatedAt: "2026-09-05T08:00:00Z",
};

const workOrder: WorkOrderRecord = {
  id: WORK_ORDER,
  organizationId: ORG,
  projectId: PROJECT,
  projectLabel: "Boiler installation",
  customerId: site.customerId,
  customerLabel: "Acme",
  siteId: SITE,
  siteLabel: "Warehouse North",
  siteAddress: "Market Street 4, 1000 AA Amsterdam",
  title: "Install control panel",
  instructions: "Check isolation first.",
  technicianMemberId: null,
  technicianLabel: null,
  scheduledFor: "2020-01-01T09:00:00Z",
  status: "scheduled",
  completedAt: null,
  createdAt: "2026-09-05T08:00:00Z",
  updatedAt: "2026-09-05T08:00:00Z",
};

const project: ProjectRecord = {
  id: PROJECT,
  organizationId: ORG,
  customerId: site.customerId,
  customerLabel: "Acme",
  name: "Boiler installation",
  summary: null,
  status: "active",
  ownerMemberId: null,
  ownerLabel: null,
  plannedStart: "2026-09-05",
  plannedEnd: "2026-09-10",
  archivedAt: null,
  createdAt: "2026-09-05T08:00:00Z",
  updatedAt: "2026-09-05T08:00:00Z",
};

describe("TG3 Field Operations workflow UI", () => {
  it("shows Field-only Sites, Work orders, and Dispatch navigation with Job terminology", () => {
    const html = renderToStaticMarkup(
      <AppShell
        moduleNavVisibility={FIELD_MODULE_NAV_VISIBILITY}
        terminology={FIELD_PRODUCT_TERMINOLOGY}
        selectedOrganizationId={ORG}
      ><p>Field</p></AppShell>,
    );
    expect(html).toContain(">Jobs<");
    expect(html).toContain(">Sites<");
    expect(html).toContain(">Work orders<");
    expect(html).toContain(">Dispatch<");
    expect(html).toContain("/sites?org=");
    expect(html).toContain("/work-orders?org=");
  });

  it("keeps all Field-only navigation hidden for Service", () => {
    const html = renderToStaticMarkup(
      <AppShell moduleNavVisibility={SERVICE_MODULE_NAV_VISIBILITY} terminology={SERVICE_PRODUCT_TERMINOLOGY}>
        <p>Service</p>
      </AppShell>,
    );
    expect(html).toContain(">Projects<");
    expect(html).not.toContain(">Sites<");
    expect(html).not.toContain(">Work orders<");
    expect(html).not.toContain(">Dispatch<");
  });

  it("renders Customer → Job → Site context and a prefilled New work order link", () => {
    const listHtml = renderToStaticMarkup(<SitesList context={context} sites={[site]} />);
    const detailHtml = renderToStaticMarkup(
      <SiteDetail context={context} site={site} workOrders={[workOrder]} warning={null} />,
    );
    expect(listHtml).toContain("Boiler installation");
    expect(detailHtml).toContain("Acme");
    expect(detailHtml).toContain("Market Street 4");
    expect(detailHtml).toContain(`/work-orders/new?org=${ORG}&amp;siteId=${SITE}`);
    expect(detailHtml).toContain("Install control panel");
  });

  it("shows assignment, schedule, execution status, and completion visibility", () => {
    const scheduled = renderToStaticMarkup(<WorkOrderDetail context={{ ...context, moduleId: "workOrders" }} workOrder={workOrder} />);
    const completed = renderToStaticMarkup(
      <WorkOrderDetail
        context={{ ...context, moduleId: "workOrders" }}
        workOrder={{ ...workOrder, status: "completed", completedAt: "2026-09-05T12:00:00Z" }}
      />,
    );
    expect(scheduled).toContain("Unassigned");
    expect(scheduled).toContain("Scheduled");
    expect(scheduled).toContain("Mark in progress");
    expect(completed).toContain("Completed");
    expect(completed).not.toContain("Not completed");
  });

  it("groups overdue, unassigned, and completed work in lightweight Dispatch", () => {
    const html = renderToStaticMarkup(
      <DispatchView
        context={{ ...context, moduleId: "dispatch" }}
        workOrders={[
          workOrder,
          { ...workOrder, id: "66666666-6666-4666-8666-666666666666", title: "Finished visit", status: "completed", completedAt: "2026-09-05T12:00:00Z" },
        ]}
      />,
    );
    expect(html).toContain("Overdue");
    expect(html).toContain("Unassigned");
    expect(html).toContain("Completed");
    expect(html).toContain("Install control panel");
    expect(html).toContain("Finished visit");
    expect(html).toContain("No routing or optimization");
  });

  it("composes Sites and Work orders only into a Field Job detail", () => {
    const fieldHtml = renderToStaticMarkup(
      <ProjectDetail
        context={{
          ...context,
          terminology: FIELD_PRODUCT_TERMINOLOGY,
        }}
        project={project}
        tasks={[]}
        tasksWarning={null}
        fieldSites={[site]}
        fieldWorkOrders={[workOrder]}
      />,
    );
    const serviceHtml = renderToStaticMarkup(
      <ProjectDetail
        context={{
          ...context,
          terminology: SERVICE_PRODUCT_TERMINOLOGY,
          moduleAccess: {
            resolution: "resolved",
            navVisibility: SERVICE_MODULE_NAV_VISIBILITY,
            relevantCapabilities: [],
            terminology: SERVICE_PRODUCT_TERMINOLOGY,
          },
        }}
        project={project}
        tasks={[]}
        tasksWarning={null}
        fieldSites={[site]}
        fieldWorkOrders={[workOrder]}
      />,
    );
    expect(fieldHtml).toContain("Warehouse North");
    expect(fieldHtml).toContain("Work orders");
    expect(serviceHtml).not.toContain("Warehouse North");
    expect(serviceHtml).not.toContain("Work orders");
  });
});
