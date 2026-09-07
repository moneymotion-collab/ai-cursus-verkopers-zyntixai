import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG = "11111111-1111-4111-8111-111111111111";
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);
const actorMock = vi.hoisted(() => vi.fn());
const lifecycleMock = vi.hoisted(() => vi.fn());
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

import TeamOnboardingPage from "@/app/onboarding/team/page";
import {
  buildTeamOnboardingPath,
  buildWorkspaceConfirmationOnboardingPath,
  TEAM_ONBOARDING_PATH,
  WORKSPACE_CONFIRMATION_ONBOARDING_PATH,
} from "@/features/onboarding/domain/onboarding-routes";
import { TeamFoundation } from "@/features/onboarding/ui/team-foundation";

const pageSource = readFileSync(
  join(process.cwd(), "src/app/onboarding/team/page.tsx"),
  "utf8",
);
const componentSource = readFileSync(
  join(process.cwd(), "src/features/onboarding/ui/team-foundation.tsx"),
  "utf8",
);
const cssSource = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/team-foundation.module.css",
  ),
  "utf8",
);

const client = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
};

function lifecycle(state: Record<string, unknown>, role = "owner") {
  lifecycleMock.mockResolvedValue({
    ok: true,
    organizationId: ORG,
    membershipRole: role,
    state,
  });
}

async function renderPage() {
  const page = await TeamOnboardingPage({
    searchParams: Promise.resolve({ org: ORG }),
  });
  return renderToStaticMarkup(page);
}

describe("V2 Team onboarding foundation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue(client);
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
  });

  it("defines one canonical Team destination and a non-implemented Workspace contract", () => {
    expect(TEAM_ONBOARDING_PATH).toBe("/onboarding/team");
    expect(buildTeamOnboardingPath(ORG)).toBe(
      `/onboarding/team?org=${ORG}`,
    );
    expect(WORKSPACE_CONFIRMATION_ONBOARDING_PATH).toBe(
      "/onboarding/workspace-confirmation",
    );
    expect(buildWorkspaceConfirmationOnboardingPath(ORG)).toBe(
      `/onboarding/workspace-confirmation?org=${ORG}`,
    );
  });

  it("renders the real read-only Team page only for V2 configured owners", async () => {
    const html = await renderPage();

    expect(html).toContain("Bring your team with you");
    expect(html).toContain(
      "Your workspace already includes its owner. Adding teammates is optional.",
    );
    expect(html).toContain("Current team");
    expect(html).toContain("Workspace owner");
    expect(html).toContain("Already included");
    expect(html).toContain("Owner");
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Step 4 of 5: Team");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("Admin");
    expect(html).not.toContain("Staff");
    expect(html).not.toContain("Viewer");
  });

  it("redirects anonymous users to login with the exact Team return path", async () => {
    actorMock.mockResolvedValue({ ok: false, code: "not_authenticated" });

    await expect(renderPage()).rejects.toThrow(
      `REDIRECT:/login?next=${encodeURIComponent(`/onboarding/team?org=${ORG}`)}`,
    );
    expect(lifecycleMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "v2_core_incomplete",
      { kind: "v2_core_incomplete", logicalStage: "you_and_company" },
      `/onboarding?org=${ORG}`,
    ],
    [
      "v2_context_required",
      { kind: "v2_context_required", logicalStage: "operating_model" },
      `/onboarding/operating-model?org=${ORG}`,
    ],
    [
      "v2_ready",
      {
        kind: "v2_ready",
        logicalStage: "ready",
        setupReadyAt: "2026-09-07T12:00:00.000Z",
      },
      `/onboarding?org=${ORG}`,
    ],
    [
      "v2_completed",
      {
        kind: "v2_completed",
        logicalStage: "completed",
        setupReadyAt: "2026-09-07T12:00:00.000Z",
        completedAt: "2026-09-07T12:01:00.000Z",
      },
      `/home?org=${ORG}`,
    ],
    [
      "legacy incomplete",
      { kind: "legacy", logicalStage: "legacy", completed: false },
      `/onboarding?org=${ORG}`,
    ],
    [
      "grandfathered",
      { kind: "grandfathered", logicalStage: "completed" },
      `/home?org=${ORG}`,
    ],
  ])("fails closed for %s lifecycle state", async (_name, state, target) => {
    lifecycle(state);
    await expect(renderPage()).rejects.toThrow(`REDIRECT:${target}`);
  });

  it("performs no write or invitation operation while rendering", async () => {
    await renderPage();

    expect(client.from).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
    for (const forbidden of [
      "assignOperatingModelAction",
      "createInvitation",
      "markV2OnboardingSetupReadyAction",
      "completeV2OnboardingAction",
      "applyOrganizationOnboarding",
    ]) {
      expect(pageSource).not.toContain(forbidden);
      expect(componentSource).not.toContain(forbidden);
    }
  });

  it("uses the established progress, responsive, and semantic contracts", () => {
    const html = renderToStaticMarkup(
      <TeamFoundation membershipRole="owner" />,
    );

    expect(html).toContain("<main");
    expect(html).toContain("<h1");
    expect(html).toContain("<section");
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(componentSource).toContain('currentStep="team"');
    expect(cssSource).toContain("@media (max-width: 767px)");
    expect(cssSource).toContain("@media (min-width: 768px)");
    expect(cssSource).not.toContain("overflow-x");
    expect(cssSource).not.toContain("transform: scale");
  });
});
