import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  loadCustomerArchivePage,
  loadCustomerRestorePage,
  loadCustomerStatusPage,
} from "@/features/customers/ui/load-customer-lifecycle-workflow-page";
import { getCustomerById } from "@/features/customers/server/customer-read-queries";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import { buildOperatingModelProductModuleAccess } from "@/features/product-access/domain/operating-model-module-access";
import type { OperatingModelId } from "@/features/onboarding/domain/operating-model";
import type { CustomerRole } from "@/features/customers/domain/types";
import { archivedCustomerDetail, sampleCustomerDetail } from "../helpers/customer-mutation-mocks";
import { CUSTOMER_ID, ORG_ID } from "../helpers/customer-read-query-mocks";

vi.mock("@/features/customers/server/resolve-customer-page-organization", () => ({
  resolveCustomerPageOrganization: vi.fn(),
}));

vi.mock("@/features/customers/server/customer-read-queries", () => ({
  getCustomerById: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveCustomerPageOrganization);
const getCustomerByIdMock = vi.mocked(getCustomerById);

function createSupabase() {
  return {} as SupabaseClient<Database>;
}

function readyOrg(
  role: CustomerRole = "owner",
  model: OperatingModelId = "course_seller",
) {
  return {
    kind: "ready" as const,
    organizationId: ORG_ID,
    organizationName: "Org Alpha",
    organizationOptions: [{ organizationId: ORG_ID, role, displayName: "Org Alpha" }],
    role,
    timezone: "UTC",
    isMultiOrganization: false,
    moduleAccess: buildOperatingModelProductModuleAccess(model),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue(readyOrg("owner"));
  getCustomerByIdMock.mockResolvedValue({ ok: true, data: sampleCustomerDetail });
});

describe("customer lifecycle workflow loader permission gate", () => {
  it("does not query the record for an invalid identifier", async () => {
    const result = await loadCustomerArchivePage(createSupabase(), "not-a-uuid", {
      org: ORG_ID,
    });
    expect(result.kind).toBe("invalid_customer");
    expect(pageOrgMock).not.toHaveBeenCalled();
    expect(getCustomerByIdMock).not.toHaveBeenCalled();
  });

  it("keeps viewer off archive, restore, and status confirmation", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));

    const archive = await loadCustomerArchivePage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(archive.kind).toBe("action_unavailable");
    expect(archive).not.toHaveProperty("customer");

    const status = await loadCustomerStatusPage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(status.kind).toBe("action_unavailable");
    expect(status).not.toHaveProperty("customer");
    expect(status).not.toHaveProperty("allowedTargets");

    getCustomerByIdMock.mockResolvedValueOnce({ ok: true, data: archivedCustomerDetail });
    const restore = await loadCustomerRestorePage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(restore.kind).toBe("customer_unavailable");
    expect(restore).not.toHaveProperty("customer");
  });

  it("keeps owner archive, admin restore, and staff status available", async () => {
    const archive = await loadCustomerArchivePage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(archive.kind).toBe("ready");
    if (archive.kind === "ready") {
      expect(archive.customer.id).toBe(CUSTOMER_ID);
    }

    pageOrgMock.mockResolvedValue(readyOrg("admin"));
    getCustomerByIdMock.mockResolvedValueOnce({ ok: true, data: archivedCustomerDetail });
    const restore = await loadCustomerRestorePage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(restore.kind).toBe("ready");

    pageOrgMock.mockResolvedValue(readyOrg("staff"));
    getCustomerByIdMock.mockResolvedValueOnce({ ok: true, data: sampleCustomerDetail });
    const status = await loadCustomerStatusPage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(status.kind).toBe("ready");
    if (status.kind === "ready") {
      expect(status.allowedTargets?.length).toBeGreaterThan(0);
    }
  });

  it("does not let Agency terminology change viewer or staff permission results", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer", "service"));
    const viewerArchive = await loadCustomerArchivePage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(viewerArchive.kind).toBe("action_unavailable");
    if (viewerArchive.kind === "action_unavailable") {
      expect(viewerArchive.message).toContain("client");
      expect(viewerArchive.message).not.toContain("customer");
    }

    pageOrgMock.mockResolvedValue(readyOrg("staff", "service"));
    const staffArchive = await loadCustomerArchivePage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(staffArchive.kind).toBe("action_unavailable");

    pageOrgMock.mockResolvedValue(readyOrg("staff", "service"));
    const staffStatus = await loadCustomerStatusPage(createSupabase(), CUSTOMER_ID, {
      org: ORG_ID,
    });
    expect(staffStatus.kind).toBe("ready");
  });

  it("returns auth_required without loading the record", async () => {
    pageOrgMock.mockResolvedValue({ kind: "auth_required" });
    const result = await loadCustomerStatusPage(createSupabase(), CUSTOMER_ID, {});
    expect(result.kind).toBe("auth_required");
    expect(getCustomerByIdMock).not.toHaveBeenCalled();
  });
});
