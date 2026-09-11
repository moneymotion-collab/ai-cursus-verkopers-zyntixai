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
vi.mock("@/features/onboarding/server/onboarding-invite-execution", () => ({
  loadOnboardingCreatingSnapshot: snapshotMock,
}));
vi.mock(
  "@/features/onboarding/actions/onboarding-invite-execution-actions",
  () => ({
    executeOnboardingInviteIntentAction: vi.fn(),
    reconcileOnboardingInviteIntentAction: vi.fn(),
    listFrozenOnboardingTeamInviteIntentsAction: vi.fn(),
    recoverOnboardingCreatingStateAction: vi.fn(),
  }),
);

import CreatingOnboardingPage from "@/app/onboarding/creating/page";
import {
  CREATING_ONBOARDING_PATH,
  buildCreatingOnboardingPath,
} from "@/features/onboarding/domain/onboarding-routes";

const pageSource = readFileSync(
  join(process.cwd(), "src/app/onboarding/creating/page.tsx"),
  "utf8",
);
const componentSource = readFileSync(
  join(process.cwd(), "src/features/onboarding/ui/onboarding-creating.tsx"),
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
  const page = await CreatingOnboardingPage({
    searchParams: Promise.resolve({ org: ORG }),
  });
  return renderToStaticMarkup(page);
}

describe("V2 Creating onboarding route", () => {
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
      intents: [],
      outcomes: [],
      runStatus: "ready_for_cutover",
    });
  });

  it("defines the canonical Creating destination", () => {
    expect(CREATING_ONBOARDING_PATH).toBe("/onboarding/creating");
    expect(buildCreatingOnboardingPath(ORG)).toBe(
      `/onboarding/creating?org=${ORG}`,
    );
  });

  it("renders Creating only for V2 Setup Ready owners", async () => {
    const html = await renderPage();
    expect(html).toContain("Create invitations");
    expect(html).toContain("No teammates were prepared to invite.");
    expect(html).not.toContain("Enter ZyntixAI");
    expect(html).not.toContain("Setup complete");
    expect(snapshotMock).toHaveBeenCalledWith(client, ORG);
  });

  it("redirects anonymous users to login with the allowlisted onboarding return path", async () => {
    actorMock.mockResolvedValue({ ok: false, code: "not_authenticated" });
    await expect(renderPage()).rejects.toThrow(
      `REDIRECT:/login?next=${encodeURIComponent(`/onboarding?org=${ORG}`)}`,
    );
    expect(lifecycleMock).not.toHaveBeenCalled();
  });

  it("fails closed for a foreign organization before loading Creating state", async () => {
    actorMock.mockResolvedValue({
      ok: false,
      code: "organization_not_found",
    });
    const html = await renderPage();
    expect(html).toContain("Organization unavailable");
    expect(snapshotMock).not.toHaveBeenCalled();
  });

  it("sends a configured owner back to Team instead of executing invitations", async () => {
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

  it.each([
    [
      "v2_core_incomplete",
      { kind: "v2_core_incomplete", logicalStage: "you_and_company" },
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
    expect(snapshotMock).not.toHaveBeenCalled();
  });

  it("does not leak Creating state to a non-Owner member", async () => {
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

  it("loads only the governed snapshot while rendering", async () => {
    await renderPage();
    expect(client.from).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
    expect(snapshotMock).toHaveBeenCalledTimes(1);
    for (const forbidden of [
      "completeV2OnboardingAction",
      "create_organization_invitation",
      "list_organization_onboarding_invitation_results",
    ]) {
      expect(pageSource).not.toContain(forbidden);
      expect(componentSource).not.toContain(forbidden);
    }
  });
});
