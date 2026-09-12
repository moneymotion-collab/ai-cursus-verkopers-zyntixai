import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PRODUCT_MODULE_DEFINITIONS } from "@/features/product-access/domain/module-registry";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";

const ORG = "11111111-1111-4111-8111-111111111111";
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);
const actorMock = vi.hoisted(() => vi.fn());
const lifecycleMock = vi.hoisted(() => vi.fn());
const loadAccessMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));
vi.mock("@/features/onboarding/server/read-onboarding-context", () => ({
  resolveOnboardingOrganizationId: actorMock,
}));
vi.mock("@/features/onboarding/server/resolve-onboarding-lifecycle", () => ({
  resolveOrganizationOnboardingLifecycle: lifecycleMock,
}));
vi.mock(
  "@/features/product-access/server/load-product-module-access",
  () => ({ loadProductModuleAccess: loadAccessMock }),
);

import WorkspaceConfirmationOnboardingPage from "@/app/onboarding/workspace-confirmation/page";
import {
  buildTeamOnboardingPath,
  buildWorkspaceConfirmationOnboardingPath,
} from "@/features/onboarding/domain/onboarding-routes";
import {
  resolveWorkspacePresentation,
  type WorkspacePresentation,
} from "@/features/onboarding/domain/workspace-presentation";
import { WorkflowPreview } from "@/features/onboarding/ui/workflow-preview";
import { WorkspaceConfirmation } from "@/features/onboarding/ui/workspace-confirmation";
import { WorkspacePreview } from "@/features/onboarding/ui/workspace-preview";

const pageSource = readFileSync(
  join(process.cwd(), "src/app/onboarding/workspace-confirmation/page.tsx"),
  "utf8",
);
const confirmationSource = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/workspace-confirmation.tsx",
  ),
  "utf8",
);
const previewSource = readFileSync(
  join(process.cwd(), "src/features/onboarding/ui/workspace-preview.tsx"),
  "utf8",
);
const confirmationCss = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/workspace-confirmation.module.css",
  ),
  "utf8",
);
const previewCss = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/workspace-preview.module.css",
  ),
  "utf8",
);
const workflowCss = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/workflow-preview.module.css",
  ),
  "utf8",
);
const shellCss = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/onboarding-shell.module.css",
  ),
  "utf8",
);

const allVisibleAccess: ProductModuleAccessState = {
  resolution: "resolved",
  navVisibility: Object.fromEntries(
    PRODUCT_MODULE_DEFINITIONS.map((module) => [module.id, true]),
  ) as ProductModuleAccessState["navVisibility"],
  relevantCapabilities: [],
  terminology: DEFAULT_PRODUCT_TERMINOLOGY,
};

const expected = {
  "niche.online-course-business": {
    label: "Courses & Coaching",
    modules: [
      "Home",
      "Customers",
      "Programs",
      "Enrollments",
      "Progress",
      "Tasks",
      "Attention",
    ],
    workflow: [
      "Customer",
      "Program",
      "Enrollment",
      "Progress",
      "Attention",
      "Complete",
    ],
  },
  "foundation.service": {
    label: "Agency & Business Services",
    modules: ["Home", "Leads", "Clients", "Projects", "Tasks", "Attention"],
    workflow: [
      "Lead",
      "Client",
      "Project",
      "Tasks / assignment",
      "Delivery status",
      "Attention",
      "Completion",
    ],
  },
  "foundation.field-operations": {
    label: "Construction & Field Operations",
    modules: [
      "Home",
      "Customers",
      "Jobs",
      "Sites",
      "Work Orders",
      "Dispatch",
      "Tasks",
      "Attention",
    ],
    workflow: [
      "Customer",
      "Job",
      "Site",
      "Work Order",
      "Technician / lightweight Dispatch",
      "Execution",
      "Completion",
      "Attention",
    ],
  },
  "foundation.product-operations": {
    label: "Product Operations",
    modules: [
      "Home",
      "Customers",
      "Products",
      "Orders",
      "Inventory",
      "Fulfillment",
      "Attention",
    ],
    workflow: [
      "Product",
      "Order",
      "Inventory impact",
      "Fulfillment",
      "Completion",
      "Attention",
    ],
  },
} as const;

function presentation(packKey = "foundation.service"): WorkspacePresentation {
  const result = resolveWorkspacePresentation(packKey, allVisibleAccess);
  if (!result) {
    throw new Error(`Expected presentation for ${packKey}`);
  }
  return result;
}

function lifecycle(
  state: Record<string, unknown>,
  membershipRole = "owner",
) {
  lifecycleMock.mockResolvedValue({
    ok: true,
    organizationId: ORG,
    membershipRole,
    state,
  });
}

async function renderPage() {
  const page = await WorkspaceConfirmationOnboardingPage({
    searchParams: Promise.resolve({ org: ORG }),
  });
  return renderToStaticMarkup(page);
}

describe("Workspace Confirmation projection authority", () => {
  it.each(Object.entries(expected))(
    "projects the exact model, modules, and workflow for %s",
    (packKey, contract) => {
      const result = presentation(packKey);
      expect(result.operatingModelLabel).toBe(contract.label);
      expect(result.modules.map((module) => module.label)).toEqual(
        contract.modules,
      );
      expect(result.workflow).toEqual(contract.workflow);
    },
  );

  it("supports both governed Course Seller context keys", () => {
    const current = presentation("niche.online-course-business");
    const historical = presentation("foundation.knowledge");
    expect(historical).toEqual(current);
    expect(current.operatingModelLabel).toBe("Courses & Coaching");
  });

  it("fails closed for unknown, unresolved, or capability-inconsistent context", () => {
    expect(
      resolveWorkspacePresentation("foundation.unknown", allVisibleAccess),
    ).toBeNull();
    expect(
      resolveWorkspacePresentation("foundation.service", {
        ...allVisibleAccess,
        resolution: "unresolved",
        relevantCapabilities: null,
      }),
    ).toBeNull();
    expect(
      resolveWorkspacePresentation("foundation.service", {
        ...allVisibleAccess,
        navVisibility: {
          ...allVisibleAccess.navVisibility,
          projects: false,
        },
      }),
    ).toBeNull();
  });

  it("never projects Projects or Project for Product Operations", () => {
    const product = presentation("foundation.product-operations");
    expect(product.modules.map((module) => module.label)).not.toContain(
      "Projects",
    );
    expect(product.workflow).not.toContain("Project");
  });
});

describe("Workspace Confirmation route and components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: vi.fn() },
      from: vi.fn(),
      rpc: vi.fn(),
    });
    actorMock.mockResolvedValue({
      ok: true,
      organizationId: ORG,
      role: "owner",
      userId: "22222222-2222-4222-8222-222222222222",
    });
    lifecycle({
      kind: "v2_configured",
      logicalStage: "workspace",
      packKey: "foundation.service",
      setupReadyEligible: true,
    });
    loadAccessMock.mockResolvedValue(allVisibleAccess);
  });

  it("renders the authenticated server-authoritative Workspace page", async () => {
    const html = await renderPage();
    expect(html).toContain("Your workspace is taking shape");
    expect(html).toContain("Agency &amp; Business Services");
    expect(html).toContain("Configured modules");
    expect(html).toContain("Representative workflow");
    expect(html).toContain("Step 3 of 5: Workspace");
    expect(html).toContain(`href="/onboarding/operating-model?org=${ORG}"`);
    expect(html).toContain(`href="${buildTeamOnboardingPath(ORG)}"`);
    expect(loadAccessMock).toHaveBeenCalledWith(ORG, expect.anything());
  });

  it("redirects anonymous users to login with the exact safe return path", async () => {
    actorMock.mockResolvedValue({ ok: false, code: "not_authenticated" });
    await expect(renderPage()).rejects.toThrow(
      `REDIRECT:/login?next=${encodeURIComponent(
        buildWorkspaceConfirmationOnboardingPath(ORG),
      )}`,
    );
    expect(lifecycleMock).not.toHaveBeenCalled();
  });

  it.each([
    ["organization_ambiguous", "Choose an organization"],
    ["membership_required", "Organization setup required"],
    ["organization_not_found", "Organization unavailable"],
  ])("fails closed for %s organization resolution", async (code, title) => {
    actorMock.mockResolvedValue({ ok: false, code });
    expect(await renderPage()).toContain(title);
    expect(lifecycleMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      { kind: "v2_core_incomplete", logicalStage: "you_and_company" },
      `/onboarding?org=${ORG}`,
    ],
    [
      { kind: "v2_context_required", logicalStage: "operating_model" },
      `/onboarding/operating-model?org=${ORG}`,
    ],
    [
      {
        kind: "v2_ready",
        logicalStage: "ready",
        setupReadyAt: "2026-09-07T12:00:00.000Z",
      },
      `/onboarding/creating?org=${ORG}`,
    ],
    [
      {
        kind: "v2_completed",
        logicalStage: "completed",
        setupReadyAt: "2026-09-07T12:00:00.000Z",
        completedAt: "2026-09-07T12:01:00.000Z",
      },
      `/home?org=${ORG}`,
    ],
    [
      { kind: "legacy", logicalStage: "legacy", completed: false },
      `/onboarding?org=${ORG}`,
    ],
    [
      { kind: "grandfathered", logicalStage: "completed" },
      `/home?org=${ORG}`,
    ],
  ])("guards non-configured lifecycle state", async (state, target) => {
    lifecycle(state);
    await expect(renderPage()).rejects.toThrow(`REDIRECT:${target}`);
    expect(loadAccessMock).not.toHaveBeenCalled();
  });

  it("fails closed when authoritative context projection is unsupported", async () => {
    lifecycle({
      kind: "v2_configured",
      logicalStage: "workspace",
      packKey: "foundation.unknown",
      setupReadyEligible: true,
    });
    const html = await renderPage();
    expect(html).toContain("Workspace configuration needs attention");
    expect(html).not.toContain("Courses &amp; Coaching");
  });

  it("renders a static preview and ordered workflow without fake controls", () => {
    const service = presentation();
    const workspaceHtml = renderToStaticMarkup(
      <WorkspacePreview presentation={service} />,
    );
    const workflowHtml = renderToStaticMarkup(
      <WorkflowPreview steps={service.workflow} />,
    );
    expect(workspaceHtml).toContain("<ul");
    expect(workspaceHtml).not.toContain("<nav");
    expect(workspaceHtml).not.toContain("<a ");
    expect(workspaceHtml).not.toContain("<button");
    expect(workflowHtml).toContain("<ol");
    expect(workflowHtml.indexOf("Lead")).toBeLessThan(
      workflowHtml.indexOf("Client"),
    );
    expect(previewSource).not.toContain("href=");
  });

  it("uses one H1, semantic lists, native links, and visible focus authority", () => {
    const html = renderToStaticMarkup(
      <WorkspaceConfirmation
        presentation={presentation()}
        backHref={`/onboarding/operating-model?org=${ORG}`}
        continueHref={buildTeamOnboardingPath(ORG)}
      />,
    );
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("<ul");
    expect(html).toContain("<ol");
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(confirmationCss).toContain(":focus-visible");
    expect(confirmationSource).toContain('currentStep="workspace"');
  });

  it("preserves frozen responsive boundaries without page overflow", () => {
    expect(shellCss).toContain("@media (min-width: 1152px)");
    expect(shellCss).toContain("grid-template-columns: 35rem 30rem");
    expect(shellCss).toContain("column-gap: 4rem");
    expect(previewCss).toContain("@media (max-width: 767px)");
    expect(previewCss).toContain("display: none");
    expect(workflowCss).toContain("@media (min-width: 768px)");
    for (const css of [confirmationCss, previewCss, workflowCss]) {
      expect(css).not.toContain("overflow-x");
      expect(css).not.toContain("transform: scale");
    }
  });

  it("contains no onboarding or domain mutation integration", () => {
    for (const source of [pageSource, confirmationSource, previewSource]) {
      for (const forbidden of [
        "assignOperatingModelAction",
        "updateV2OnboardingCore",
        "markV2OnboardingSetupReadyAction",
        "completeV2OnboardingAction",
        "createInvitation",
        "membershipMutation",
      ]) {
        expect(source).not.toContain(forbidden);
      }
    }
  });
});
