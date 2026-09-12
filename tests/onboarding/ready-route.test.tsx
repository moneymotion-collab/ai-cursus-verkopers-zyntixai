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
const snapshotMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const completeActionMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));
vi.mock("@/features/onboarding/server/read-onboarding-context", () => ({
  resolveOnboardingOrganizationId: actorMock,
}));
vi.mock("@/features/onboarding/server/resolve-onboarding-lifecycle", () => ({
  resolveOrganizationOnboardingLifecycle: lifecycleMock,
}));
vi.mock("@/features/onboarding/server/onboarding-ready", () => ({
  loadOnboardingReadySnapshot: snapshotMock,
  listOrganizationOnboardingInvitationResults: vi.fn(),
  completeReadyOnboarding: vi.fn(),
}));
vi.mock("@/features/onboarding/actions/onboarding-actions", () => ({
  completeV2OnboardingAction: completeActionMock,
}));

import ReadyOnboardingPage from "@/app/onboarding/ready/page";
import {
  READY_ONBOARDING_PATH,
  buildReadyOnboardingPath,
} from "@/features/onboarding/domain/onboarding-routes";

const pageSource = readFileSync(
  join(process.cwd(), "src/app/onboarding/ready/page.tsx"),
  "utf8",
);
const componentSource = readFileSync(
  join(process.cwd(), "src/features/onboarding/ui/onboarding-ready.tsx"),
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

function readySnapshot(
  overrides: Record<string, unknown> = {},
) {
  return {
    organizationId: ORG,
    workspaceName: "Northwind",
    operatingModelLabel: "Agency & Business Services",
    runStatus: "ready_for_cutover",
    readyForCutoverAt: "2026-09-11T12:00:00.000Z",
    runCompletedAt: null,
    organizationCompletedAt: null,
    results: [],
    ...overrides,
  };
}

async function renderPage() {
  const page = await ReadyOnboardingPage({
    searchParams: Promise.resolve({ org: ORG }),
  });
  return renderToStaticMarkup(page);
}

describe("V2 Ready onboarding route", () => {
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
      kind: "v2_ready",
      logicalStage: "ready",
      setupReadyAt: "2026-09-10T12:00:00.000Z",
    });
    snapshotMock.mockResolvedValue({
      ok: true,
      snapshot: readySnapshot(),
    });
  });

  it("defines the canonical Ready destination", () => {
    expect(READY_ONBOARDING_PATH).toBe("/onboarding/ready");
    expect(buildReadyOnboardingPath(ORG)).toBe(
      `/onboarding/ready?org=${ORG}`,
    );
  });

  it("renders Ready only from a database-proven ready_for_cutover snapshot", async () => {
    const html = await renderPage();
    expect(html).toContain("Ready to enter ZyntixAI");
    expect(html).toContain("Enter ZyntixAI");
    expect(html).toContain("Northwind");
    expect(html).toContain("Agency &amp; Business Services");
    expect(html).toContain("Ready");
    expect(html).toContain("does not confirm email delivery");
    expect(html).not.toContain("invitation was sent");
    expect(snapshotMock).toHaveBeenCalledWith(client, ORG);
    expect(completeActionMock).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("redirects anonymous users to login with the allowlisted onboarding return path", async () => {
    actorMock.mockResolvedValue({ ok: false, code: "not_authenticated" });
    await expect(renderPage()).rejects.toThrow(
      `REDIRECT:/login?next=${encodeURIComponent(`/onboarding?org=${ORG}`)}`,
    );
    expect(lifecycleMock).not.toHaveBeenCalled();
  });

  it("fails closed for a foreign organization before loading Ready state", async () => {
    actorMock.mockResolvedValue({
      ok: false,
      code: "organization_not_found",
    });
    const html = await renderPage();
    expect(html).toContain("Organization unavailable");
    expect(snapshotMock).not.toHaveBeenCalled();
  });

  it("sends a configured owner back to Team instead of completing", async () => {
    lifecycle({
      kind: "v2_configured",
      logicalStage: "workspace",
      packKey: "foundation.service",
      setupReadyEligible: true,
    });
    await expect(renderPage()).rejects.toThrow(
      `REDIRECT:/onboarding/team?org=${ORG}`,
    );
    expect(snapshotMock).not.toHaveBeenCalled();
  });

  it("sends an earlier Creating run back to Creating", async () => {
    snapshotMock.mockResolvedValue({
      ok: true,
      snapshot: readySnapshot({ runStatus: "invite_partial" }),
    });
    await expect(renderPage()).rejects.toThrow(
      `REDIRECT:/onboarding/creating?org=${ORG}`,
    );
  });

  it.each([
    [
      "v2_core_incomplete",
      { kind: "v2_core_incomplete", logicalStage: "you_and_company" },
      `/onboarding?org=${ORG}`,
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
    expect(snapshotMock).not.toHaveBeenCalled();
  });

  it("does not leak Ready state to a non-Owner member", async () => {
    lifecycle(
      {
        kind: "v2_ready",
        logicalStage: "ready",
        setupReadyAt: "2026-09-10T12:00:00.000Z",
      },
      "admin",
    );
    await expect(renderPage()).rejects.toThrow(`REDIRECT:/onboarding?org=${ORG}`);
    expect(snapshotMock).not.toHaveBeenCalled();
  });

  it("reconstructs completed onboarding with an explicit product-entry control", async () => {
    lifecycle({
      kind: "v2_completed",
      logicalStage: "completed",
      setupReadyAt: "2026-09-10T12:00:00.000Z",
      completedAt: "2026-09-10T12:05:00.000Z",
    });
    snapshotMock.mockResolvedValue({
      ok: true,
      snapshot: readySnapshot({
        runStatus: "completed",
        runCompletedAt: "2026-09-10T12:05:00.000Z",
        organizationCompletedAt: "2026-09-10T12:05:00.000Z",
      }),
    });
    const html = await renderPage();
    expect(html).toContain("Setup is complete");
    expect(html).not.toContain("Enter ZyntixAI");
    expect(html).toContain("Open ZyntixAI");
    expect(completeActionMock).not.toHaveBeenCalled();
  });

  it("does not complete from render, refresh reconstruction, or listing", async () => {
    await renderPage();
    expect(completeActionMock).not.toHaveBeenCalled();
    expect(pageSource).not.toContain("completeReadyOnboarding(");
    expect(pageSource).not.toContain("completeV2OnboardingAction");
    expect(componentSource).toContain("completeV2OnboardingAction");
    expect(componentSource).not.toContain("useEffect");
    expect(componentSource).not.toContain("create_organization_invitation");
    expect(componentSource).not.toContain('router.push("/home');
  });
});
