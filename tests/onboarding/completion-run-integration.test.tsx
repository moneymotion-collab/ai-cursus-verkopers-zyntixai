import React, { type ReactElement, type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  OnboardingCompletionRun,
  OnboardingCompletionRunResult,
} from "@/features/onboarding/domain/onboarding-completion-run";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "33333333-3333-4333-8333-333333333333";

// The Setup Ready affordance only exists in the component's review branch, and
// that branch is reachable exclusively by driving the client component. This
// file therefore reuses the deterministic in-file hook harness already
// established by tests/onboarding/team-foundation-component-concurrency.test.tsx
// so the P1-A assertions run against the real review branch rather than the
// initial edit branch.
const hookRuntime = vi.hoisted(() => {
  type HookSlot =
    | { kind: "state"; value: unknown }
    | { kind: "reducer"; value: unknown }
    | { kind: "ref"; value: { current: unknown } }
    | { kind: "memo"; value: unknown; dependencies: readonly unknown[] }
    | { kind: "effect"; dependencies: readonly unknown[] | undefined }
    | { kind: "id"; value: string };

  let slots: HookSlot[] = [];
  let cursor = 0;
  let dirty = false;
  let pendingEffects: Array<() => void> = [];

  function dependenciesEqual(
    left: readonly unknown[] | undefined,
    right: readonly unknown[] | undefined,
  ) {
    return (
      left !== undefined &&
      right !== undefined &&
      left.length === right.length &&
      left.every((value, index) => Object.is(value, right[index]))
    );
  }

  return {
    reset() {
      slots = [];
      cursor = 0;
      dirty = false;
      pendingEffects = [];
    },
    beginRender() {
      cursor = 0;
      dirty = false;
      pendingEffects = [];
    },
    finishRender() {
      const effects = pendingEffects;
      pendingEffects = [];
      for (const effect of effects) {
        effect();
      }
      return dirty;
    },
    useState(initialValue: unknown) {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = {
          kind: "state",
          value:
            typeof initialValue === "function"
              ? (initialValue as () => unknown)()
              : initialValue,
        };
      }
      const slot = slots[index] as Extract<HookSlot, { kind: "state" }>;
      return [
        slot.value,
        (nextValue: unknown) => {
          const next =
            typeof nextValue === "function"
              ? (nextValue as (current: unknown) => unknown)(slot.value)
              : nextValue;
          if (!Object.is(slot.value, next)) {
            slot.value = next;
            dirty = true;
          }
        },
      ];
    },
    useReducer(
      reducer: (state: unknown, action: unknown) => unknown,
      initialValue: unknown,
    ) {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = { kind: "reducer", value: initialValue };
      }
      const slot = slots[index] as Extract<HookSlot, { kind: "reducer" }>;
      return [
        slot.value,
        (action: unknown) => {
          const next = reducer(slot.value, action);
          if (!Object.is(slot.value, next)) {
            slot.value = next;
            dirty = true;
          }
        },
      ];
    },
    useRef(initialValue: unknown) {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = { kind: "ref", value: { current: initialValue } };
      }
      return (slots[index] as Extract<HookSlot, { kind: "ref" }>).value;
    },
    useCallback(callback: unknown, dependencies: readonly unknown[]) {
      const index = cursor++;
      const existing = slots[index] as
        | Extract<HookSlot, { kind: "memo" }>
        | undefined;
      if (!existing || !dependenciesEqual(existing.dependencies, dependencies)) {
        slots[index] = { kind: "memo", value: callback, dependencies };
      }
      return (slots[index] as Extract<HookSlot, { kind: "memo" }>).value;
    },
    useEffect(effect: () => void, dependencies?: readonly unknown[]) {
      const index = cursor++;
      const existing = slots[index] as
        | Extract<HookSlot, { kind: "effect" }>
        | undefined;
      if (!existing || !dependenciesEqual(existing.dependencies, dependencies)) {
        slots[index] = { kind: "effect", dependencies };
        pendingEffects.push(effect);
      }
    },
    useId() {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = { kind: "id", value: `p1a-test-${index}` };
      }
      return (slots[index] as Extract<HookSlot, { kind: "id" }>).value;
    },
  };
});

const createServerClientMock = vi.hoisted(() => vi.fn());
const resolveOrganizationMock = vi.hoisted(() => vi.fn());
const listIntentsMock = vi.hoisted(() => vi.fn());
const routerRefreshMock = vi.hoisted(() => vi.fn());
const markSetupReadyMock = vi.hoisted(() => vi.fn());
const ensureRunActionMock = vi.hoisted(() => vi.fn());
// The two P1-A server actions are spied rather than replaced: `beforeEach`
// restores the real implementations, so the server-action tests below still
// exercise production code while the component tests can substitute a
// controlled deferred.
const realActions = vi.hoisted(() => ({
  current: null as null | typeof import(
    "@/features/onboarding/actions/onboarding-actions"
  ),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: hookRuntime.useState,
    useReducer: hookRuntime.useReducer,
    useRef: hookRuntime.useRef,
    useCallback: hookRuntime.useCallback,
    useEffect: hookRuntime.useEffect,
    useId: hookRuntime.useId,
  };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefreshMock, replace: vi.fn() }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));
vi.mock("@/features/onboarding/server/read-onboarding-context", () => ({
  resolveOnboardingOrganizationId: resolveOrganizationMock,
}));
vi.mock("@/features/onboarding/actions/team-invite-intent-actions", () => ({
  createTeamInviteIntentAction: vi.fn(),
  deleteTeamInviteIntentAction: vi.fn(),
  listTeamInviteIntentsAction: listIntentsMock,
  updateTeamInviteIntentAction: vi.fn(),
}));
vi.mock(
  "@/features/onboarding/actions/onboarding-actions",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("@/features/onboarding/actions/onboarding-actions")
    >();
    realActions.current = actual;
    return {
      ...actual,
      markV2OnboardingSetupReadyAction: markSetupReadyMock,
      ensureOnboardingCompletionRunAction: ensureRunActionMock,
    };
  },
);

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { ensureOrganizationOnboardingCompletionRun } from "@/features/onboarding/server/onboarding-completion-run";
import { ensureOnboardingCompletionRunAction } from "@/features/onboarding/actions/onboarding-actions";
import { OnboardingShell } from "@/features/onboarding/ui/onboarding-shell";
import {
  runSetupReadyTransition,
  SetupReadyStatus,
  TeamFoundation,
  TeamReview,
} from "@/features/onboarding/ui/team-foundation";

const ROOT = join(__dirname, "..", "..");
const componentSource = readFileSync(
  join(ROOT, "src/features/onboarding/ui/team-foundation.tsx"),
  "utf8",
);
const serverSource = readFileSync(
  join(ROOT, "src/features/onboarding/server/onboarding-completion-run.ts"),
  "utf8",
);
const domainSource = readFileSync(
  join(ROOT, "src/features/onboarding/domain/onboarding-completion-run.ts"),
  "utf8",
);
const actionSource = readFileSync(
  join(ROOT, "src/features/onboarding/actions/onboarding-actions.ts"),
  "utf8",
);
const teamPageSource = readFileSync(
  join(ROOT, "src/app/onboarding/team/page.tsx"),
  "utf8",
);
const workspacePageSource = readFileSync(
  join(ROOT, "src/app/onboarding/workspace-confirmation/page.tsx"),
  "utf8",
);

function runPayload(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    code: "OK",
    organization_id: ORG,
    status: "setup_ready",
    started_at: "2026-09-09T12:00:00.000Z",
    ready_for_cutover_at: null,
    completed_at: null,
    last_error_code: null,
    ...overrides,
  };
}

function supabaseWithRpc(result: {
  data?: unknown;
  error?: { message: string } | null;
}) {
  const rpc = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null,
  });
  const from = vi.fn();
  return { client: { rpc, from }, rpc, from };
}

function ownerActor(organizationId = ORG) {
  return {
    ok: true,
    organizationId,
    role: "owner",
    userId: "44444444-4444-4444-8444-444444444444",
  };
}

const CONFIRMED_RUN: OnboardingCompletionRun = {
  organizationId: ORG,
  status: "setup_ready",
  startedAt: "2026-09-09T12:00:00.000Z",
  readyForCutoverAt: null,
  completedAt: null,
};

function setupReadyAccepted() {
  return {
    ok: true as const,
    organizationId: ORG,
    idempotent: false,
    recovered: false,
    state: {
      kind: "v2_ready" as const,
      logicalStage: "ready" as const,
      setupReadyAt: "2026-09-09T12:00:00.000Z",
    },
  };
}

type TeamProps = {
  membershipRole: "owner";
  organizationId: string;
  initialIntents: never[];
  backHref: string;
};

function teamProps(): TeamProps {
  return {
    membershipRole: "owner",
    organizationId: ORG,
    initialIntents: [],
    backHref: `/onboarding/workspace-confirmation?org=${ORG}`,
  };
}

function renderTeam(props: TeamProps): ReactElement {
  let tree: ReactElement | null = null;
  for (let pass = 0; pass < 10; pass += 1) {
    hookRuntime.beginRender();
    tree = TeamFoundation(props) as ReactElement;
    if (!hookRuntime.finishRender()) {
      return tree;
    }
  }
  throw new Error("TeamFoundation hook harness did not settle");
}

function collectElements(node: ReactNode, output: ReactElement[] = []) {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectElements(child, output);
    }
    return output;
  }
  if (!React.isValidElement(node)) {
    return output;
  }

  output.push(node);
  const props = node.props as { children?: ReactNode; actions?: ReactNode };
  collectElements(props.children, output);
  collectElements(props.actions, output);
  return output;
}

function elementText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(elementText).join(" ");
  }
  if (!React.isValidElement(node)) {
    return "";
  }
  return elementText((node.props as { children?: ReactNode }).children);
}

function findElement(
  tree: ReactElement,
  predicate: (element: ReactElement) => boolean,
): ReactElement {
  const found = collectElements(tree).find(predicate);
  if (!found) {
    throw new Error("Expected TeamFoundation element was not rendered");
  }
  return found;
}

function findClickable(tree: ReactElement, text: string) {
  return findElement(
    tree,
    (element) =>
      typeof (element.props as { onClick?: unknown }).onClick === "function" &&
      elementText(element).includes(text),
  );
}

function findComponent(tree: ReactElement, type: unknown) {
  return findElement(tree, (element) => element.type === type);
}

/** Every activatable control on the rendered surface, by visible label. */
function clickableLabels(tree: ReactElement): string[] {
  return collectElements(tree)
    .filter((element) => {
      const props = element.props as {
        onClick?: unknown;
        onSubmit?: unknown;
        href?: unknown;
      };
      return (
        typeof props.onClick === "function" ||
        typeof props.onSubmit === "function" ||
        typeof props.href === "string"
      );
    })
    .map((element) => elementText(element).trim())
    .sort();
}

// Identity-keyed rather than name-keyed: the inner function of a forwardRef
// component is renamed by the bundler, so only the module identity is stable.
const KNOWN_REVIEW_COMPONENTS = new Map<unknown, string>([
  [OnboardingShell, "OnboardingShell"],
  [Surface, "Surface"],
  [TeamReview, "TeamReview"],
  [SetupReadyStatus, "SetupReadyStatus"],
  [Button, "Button"],
]);

/** Every non-host component instantiated on the rendered surface. */
function componentNames(tree: ReactElement): string[] {
  const types = new Set<unknown>();
  for (const element of collectElements(tree)) {
    const type: unknown = element.type;
    if (typeof type === "function" || (typeof type === "object" && type)) {
      types.add(type);
    }
  }
  return [...types]
    .map((type) => KNOWN_REVIEW_COMPONENTS.get(type) ?? "UNEXPECTED_COMPONENT")
    .sort();
}

async function clickAsync(element: ReactElement) {
  await (element.props as { onClick: () => void | Promise<void> }).onClick();
}

/**
 * Drives the component from its edit branch into the real P1-A review branch
 * through the same Review control an Owner uses.
 */
async function reachReview(props: TeamProps): Promise<ReactElement> {
  listIntentsMock.mockResolvedValue({ ok: true, intents: [] });
  const editSurface = renderTeam(props);
  await clickAsync(findClickable(editSurface, "Review team setup"));
  return renderTeam(props);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Drains the microtask queue without introducing a timed sleep. */
function settlePendingWork() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

describe("ENG-ONB-1H-P1-A completion run integration", () => {
  beforeEach(() => {
    hookRuntime.reset();
    vi.clearAllMocks();
    const actual = realActions.current;
    if (!actual) {
      throw new Error("onboarding-actions partial mock did not initialise");
    }
    markSetupReadyMock.mockImplementation(
      actual.markV2OnboardingSetupReadyAction,
    );
    ensureRunActionMock.mockImplementation(
      actual.ensureOnboardingCompletionRunAction,
    );
  });

  describe("governed completion-run reader", () => {
    it("ensures the run with the organization identity resolved on the server", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client, rpc, from } = supabaseWithRpc({ data: runPayload() });

      // The browser-supplied identifier is deliberately a foreign organization:
      // the server must use the membership-resolved identity instead.
      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        OTHER_ORG,
      );

      expect(result).toEqual({
        ok: true,
        run: {
          organizationId: ORG,
          status: "setup_ready",
          startedAt: "2026-09-09T12:00:00.000Z",
          readyForCutoverAt: null,
          completedAt: null,
        },
      });
      expect(rpc).toHaveBeenCalledTimes(1);
      expect(rpc).toHaveBeenCalledWith(
        "ensure_organization_onboarding_completion_run",
        { p_organization_id: ORG },
      );
      expect(from).not.toHaveBeenCalled();
    });

    it("passes only p_organization_id to the governed RPC", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client, rpc } = supabaseWithRpc({ data: runPayload() });

      await ensureOrganizationOnboardingCompletionRun(client as never, ORG);

      const [, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
      expect(Object.keys(args)).toEqual(["p_organization_id"]);
    });

    it("returns the zero-intent run that the database advanced to ready_for_cutover", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client } = supabaseWithRpc({
        data: runPayload({
          status: "ready_for_cutover",
          ready_for_cutover_at: "2026-09-09T12:00:01.000Z",
        }),
      });

      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );

      expect(result).toMatchObject({
        ok: true,
        run: {
          status: "ready_for_cutover",
          readyForCutoverAt: "2026-09-09T12:00:01.000Z",
        },
      });
    });

    it("preserves started_at when the run already exists", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const started = "2026-09-09T09:00:00.000Z";
      const { client } = supabaseWithRpc({
        data: runPayload({ started_at: started, status: "inviting" }),
      });

      const first = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );
      const second = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );

      expect(first).toEqual(second);
      expect(first).toMatchObject({ ok: true, run: { startedAt: started } });
    });

    it("refuses a non-Owner member before reaching the database", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: true,
        organizationId: ORG,
        role: "admin",
        userId: "55555555-5555-4555-8555-555555555555",
      });
      const { client, rpc, from } = supabaseWithRpc({ data: runPayload() });

      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );

      expect(result).toMatchObject({ ok: false, code: "NOT_AUTHORIZED" });
      expect(rpc).not.toHaveBeenCalled();
      expect(from).not.toHaveBeenCalled();
    });

    it("refuses a foreign organization without disclosing its existence", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: false,
        code: "organization_not_found",
      });
      const { client, rpc } = supabaseWithRpc({ data: runPayload() });

      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        OTHER_ORG,
      );

      expect(result).toMatchObject({ ok: false, code: "NOT_AUTHORIZED" });
      expect(result).not.toMatchObject({ ok: true });
      expect(rpc).not.toHaveBeenCalled();
      if (!result.ok) {
        expect(result.message).not.toContain(OTHER_ORG);
      }
    });

    it("maps an unauthenticated caller without leaking database detail", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: false,
        code: "not_authenticated",
      });
      const { client } = supabaseWithRpc({ data: runPayload() });

      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );

      expect(result).toMatchObject({ ok: false, code: "NOT_AUTHENTICATED" });
    });

    it("maps a pre-Setup-Ready INVALID_LIFECYCLE refusal", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client } = supabaseWithRpc({
        data: { ok: false, code: "INVALID_LIFECYCLE" },
      });

      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );

      expect(result).toMatchObject({ ok: false, code: "INVALID_LIFECYCLE" });
    });

    it("never surfaces a raw database error message", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client } = supabaseWithRpc({
        error: {
          message:
            'permission denied for table organization_onboarding_completion_runs',
        },
      });

      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );

      expect(result).toMatchObject({ ok: false, code: "TRANSPORT_ERROR" });
      if (!result.ok) {
        expect(result.message).not.toContain("permission denied");
        expect(result.message).not.toContain("organization_onboarding");
      }
    });

    it("rejects an unrecognised payload shape rather than trusting it", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client } = supabaseWithRpc({
        data: { ok: true, code: "OK", status: "totally_new_status" },
      });

      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );

      expect(result).toMatchObject({ ok: false, code: "INVALID_RESPONSE" });
    });

    it("does not project internal diagnostic detail into the application type", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client } = supabaseWithRpc({
        data: runPayload({ last_error_code: "SOME_INTERNAL_CODE" }),
      });

      const result = await ensureOrganizationOnboardingCompletionRun(
        client as never,
        ORG,
      );

      expect(result.ok).toBe(true);
      expect(JSON.stringify(result)).not.toContain("SOME_INTERNAL_CODE");
    });
  });

  describe("ensure completion run server action", () => {
    it("rejects malformed input before creating a server client", async () => {
      const result = await ensureOnboardingCompletionRunAction({
        organizationId: "not-a-uuid",
      });

      expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      expect(createServerClientMock).not.toHaveBeenCalled();
    });

    it("rejects extra client-supplied fields rather than forwarding them", async () => {
      const result = await ensureOnboardingCompletionRunAction({
        organizationId: ORG,
        status: "ready_for_cutover",
      });

      expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      expect(createServerClientMock).not.toHaveBeenCalled();
    });

    it("resolves a governed run through the server client", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client } = supabaseWithRpc({ data: runPayload() });
      createServerClientMock.mockResolvedValue(client);

      const result = await ensureOnboardingCompletionRunAction({
        organizationId: ORG,
      });

      expect(result).toMatchObject({ ok: true });
    });
  });

  describe("Setup Ready transition ordering", () => {
    it("ensures the completion run only after durable Setup Ready succeeds", async () => {
      const order: string[] = [];
      const markSetupReady = vi.fn(async () => {
        order.push("mark");
        return { ok: true } as never;
      });
      // The annotation is the contract the component actually depends on:
      // without it TypeScript widens `ok` to `boolean` and the mock stops
      // matching the `ok: true` branch of OnboardingCompletionRunResult.
      const ensureRun = vi.fn(
        async (): Promise<OnboardingCompletionRunResult> => {
          order.push("ensure");
          return {
            ok: true,
            run: {
              organizationId: ORG,
              status: "setup_ready",
              startedAt: "2026-09-09T12:00:00.000Z",
              readyForCutoverAt: null,
              completedAt: null,
            },
          };
        },
      );

      const outcome = await runSetupReadyTransition(
        ORG,
        markSetupReady,
        ensureRun,
      );

      expect(order).toEqual(["mark", "ensure"]);
      expect(outcome).toMatchObject({ kind: "confirmed" });
      expect(markSetupReady).toHaveBeenCalledTimes(1);
      expect(markSetupReady).toHaveBeenCalledWith({ organizationId: ORG });
      expect(ensureRun).toHaveBeenCalledTimes(1);
      expect(ensureRun).toHaveBeenCalledWith({ organizationId: ORG });
    });

    it("never ensures a run when Setup Ready is refused", async () => {
      const markSetupReady = vi.fn(async () => ({
        ok: false,
        code: "unauthorized",
        message: "You do not have permission to update this setup.",
      })) as never;
      const ensureRun = vi.fn();

      const outcome = await runSetupReadyTransition(
        ORG,
        markSetupReady,
        ensureRun as never,
      );

      expect(outcome).toEqual({
        kind: "error",
        message: "You do not have permission to update this setup.",
      });
      expect(ensureRun).not.toHaveBeenCalled();
    });

    it("surfaces a recoverable message when only the ensure call fails", async () => {
      const markSetupReady = vi.fn(async () => ({ ok: true })) as never;
      const ensureRun = vi.fn(async () => ({
        ok: false,
        code: "TRANSPORT_ERROR",
        message: "We could not confirm your setup. Please try again.",
      })) as never;

      const outcome = await runSetupReadyTransition(
        ORG,
        markSetupReady,
        ensureRun,
      );

      expect(outcome).toEqual({
        kind: "error",
        message: "We could not confirm your setup. Please try again.",
      });
    });

    it("replays safely, producing one run across repeated submissions", async () => {
      const run: OnboardingCompletionRun = {
        organizationId: ORG,
        status: "setup_ready",
        startedAt: "2026-09-09T12:00:00.000Z",
        readyForCutoverAt: null,
        completedAt: null,
      };
      const markSetupReady = vi.fn(async () => ({ ok: true })) as never;
      const ensureRun = vi.fn(
        async (): Promise<OnboardingCompletionRunResult> => ({
          ok: true,
          run,
        }),
      );

      const first = await runSetupReadyTransition(
        ORG,
        markSetupReady,
        ensureRun,
      );
      const second = await runSetupReadyTransition(
        ORG,
        markSetupReady,
        ensureRun,
      );

      expect(first).toEqual(second);
      expect(first).toMatchObject({ kind: "confirmed", run });
    });
  });

  describe("Team review Setup Ready affordance", () => {
    it("states plainly that no invitation is sent by this step", () => {
      const idle = renderToStaticMarkup(
        <SetupReadyStatus state={{ kind: "idle" }} />,
      );
      const confirmed = renderToStaticMarkup(
        <SetupReadyStatus
          state={{
            kind: "confirmed",
            run: {
              organizationId: ORG,
              status: "setup_ready",
              startedAt: "2026-09-09T12:00:00.000Z",
              readyForCutoverAt: null,
              completedAt: null,
            },
          }}
        />,
      );

      expect(idle).toContain("No invitations are sent yet.");
      expect(confirmed).toContain("No invitations have been sent yet.");
      expect(confirmed).toContain("Setup confirmed");
    });

    it("announces its status accessibly", () => {
      const html = renderToStaticMarkup(
        <SetupReadyStatus state={{ kind: "idle" }} />,
      );
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
    });

    it("renders no raw authoritative run value to the user", () => {
      const html = renderToStaticMarkup(
        <SetupReadyStatus
          state={{
            kind: "confirmed",
            run: {
              organizationId: ORG,
              status: "ready_for_cutover",
              startedAt: "2026-09-09T12:00:00.000Z",
              readyForCutoverAt: "2026-09-09T12:00:01.000Z",
              completedAt: null,
            },
          }}
        />,
      );

      expect(html).not.toContain("ready_for_cutover");
      expect(html).not.toContain(ORG);
      expect(html).not.toContain("2026-09-09T12:00:00.000Z");
    });

    it("uses semantic tokens rather than a hard-coded brand accent", () => {
      const css = readFileSync(
        join(ROOT, "src/features/onboarding/ui/team-foundation.module.css"),
        "utf8",
      );
      expect(css).toContain(".setupStatus");
      expect(css).not.toContain("33438F");
      expect(css).not.toContain("Inter");
    });
  });

  // These tests drive the component into its actual review branch. The earlier
  // revision of this suite asserted the Creating/Ready/product-entry exclusions
  // against the initial edit branch, where the Setup Ready affordance does not
  // exist yet, so the exclusions were never evaluated on the surface that hosts
  // them.
  describe("real P1-A review surface", () => {
    /** Complete visible text of the review branch, including its subsurfaces. */
    function reviewSurfaceText(tree: ReactElement): string {
      return [
        elementText(tree),
        renderToStaticMarkup(findComponent(tree, TeamReview)),
        renderToStaticMarkup(findComponent(tree, SetupReadyStatus)),
      ].join("\n");
    }

    const FORBIDDEN_SURFACE_MARKERS = [
      // Creating-state surface (P1-B)
      "Creating",
      "inviting",
      "invite_partial",
      "Invitation results",
      "frozen",
      "Resend",
      "Send invites",
      "Retry",
      // Ready completion surface and product entry (P1-C)
      "ready_for_cutover",
      "Enter ZyntixAI",
      "Setup complete",
      "Workspace complete",
      "/home",
    ];

    it("reaches the review branch and exposes only the permitted Setup Ready affordance", async () => {
      const props = teamProps();
      const review = await reachReview(props);

      // Proof that the review branch — not the edit branch — is under test.
      expect(componentNames(review)).toEqual([
        "Button",
        "OnboardingShell",
        "SetupReadyStatus",
        "Surface",
        "TeamReview",
      ]);
      expect(elementText(review)).toContain("Team review");
      expect(
        (findComponent(review, SetupReadyStatus).props as {
          state: { kind: string };
        }).state,
      ).toEqual({ kind: "idle" });

      // The permitted affordance exists, and nothing else is activatable.
      expect(clickableLabels(review)).toEqual([
        "Back to edit",
        "Finish setup",
      ]);

      const surface = reviewSurfaceText(review);
      for (const forbidden of FORBIDDEN_SURFACE_MARKERS) {
        expect(surface).not.toContain(forbidden);
      }

      // No successor-phase workflow is triggered by entering review.
      expect(listIntentsMock).toHaveBeenCalledTimes(1);
      expect(listIntentsMock).toHaveBeenCalledWith({ organizationId: ORG });
      expect(markSetupReadyMock).not.toHaveBeenCalled();
      expect(ensureRunActionMock).not.toHaveBeenCalled();
    });

    it("detects a prohibited successor-phase control if one is added to the review branch", async () => {
      const review = await reachReview(teamProps());
      const permitted = clickableLabels(review);
      expect(permitted).toEqual(["Back to edit", "Finish setup"]);

      // Sensitivity proof: the exact-allowlist assertion above is not vacuous.
      // The same detector applied to a review branch that also renders a
      // Ready-state product-entry control reports the extra control.
      const widened = React.cloneElement(review, {
        actions: (
          <div>
            {(review.props as { actions: ReactNode }).actions}
            <button type="button" onClick={() => {}}>
              Enter ZyntixAI
            </button>
          </div>
        ),
      } as never);

      expect(clickableLabels(widened)).toContain("Enter ZyntixAI");
      expect(clickableLabels(widened)).not.toEqual(permitted);
    });

    // This proves component-local double-submission protection only. It does
    // not prove distributed idempotency: cross-tab, refresh and genuinely
    // concurrent activation remain database authority through
    // `ensure_organization_onboarding_completion_run`. No application lock,
    // retry loop or queue is introduced by this guard.
    it("admits exactly one server action while the first is pending, then confirms", async () => {
      const props = teamProps();
      markSetupReadyMock.mockResolvedValue(setupReadyAccepted());
      const pendingEnsure = deferred<OnboardingCompletionRunResult>();
      ensureRunActionMock.mockReturnValue(pendingEnsure.promise);

      let review = await reachReview(props);
      const firstActivation = clickAsync(findClickable(review, "Finish setup"));
      await settlePendingWork();

      expect(markSetupReadyMock).toHaveBeenCalledTimes(1);
      expect(markSetupReadyMock).toHaveBeenCalledWith({
        organizationId: ORG,
      });
      expect(ensureRunActionMock).toHaveBeenCalledTimes(1);
      expect(ensureRunActionMock).toHaveBeenCalledWith({
        organizationId: ORG,
      });

      review = renderTeam(props);
      const pendingControl = findClickable(review, "Finishing setup…");
      expect(
        (pendingControl.props as { disabled?: boolean }).disabled,
      ).toBe(true);

      // Second activation while the first action is still unresolved.
      await clickAsync(pendingControl);
      await settlePendingWork();
      expect(markSetupReadyMock).toHaveBeenCalledTimes(1);
      expect(ensureRunActionMock).toHaveBeenCalledTimes(1);

      pendingEnsure.resolve({ ok: true, run: CONFIRMED_RUN });
      await firstActivation;
      review = renderTeam(props);

      const status = findComponent(review, SetupReadyStatus);
      expect((status.props as { state: unknown }).state).toEqual({
        kind: "confirmed",
        run: CONFIRMED_RUN,
      });
      expect(renderToStaticMarkup(status)).toContain("Setup confirmed");
      expect(renderToStaticMarkup(status)).toContain(
        "No invitations have been sent yet.",
      );

      // The confirmed surface retires the action and opens no successor phase.
      expect(clickableLabels(review)).toEqual(["Back to edit"]);
      for (const forbidden of FORBIDDEN_SURFACE_MARKERS) {
        expect(reviewSurfaceText(review)).not.toContain(forbidden);
      }
      expect(markSetupReadyMock).toHaveBeenCalledTimes(1);
      expect(ensureRunActionMock).toHaveBeenCalledTimes(1);
      expect(routerRefreshMock).not.toHaveBeenCalled();
    });

    it("keeps the action available and creates no run when the ensure call fails", async () => {
      const props = teamProps();
      markSetupReadyMock.mockResolvedValue(setupReadyAccepted());
      ensureRunActionMock.mockResolvedValue({
        ok: false,
        code: "TRANSPORT_ERROR",
        message: "We could not confirm your setup. Please try again.",
      });

      let review = await reachReview(props);
      await clickAsync(findClickable(review, "Finish setup"));
      review = renderTeam(props);

      expect(elementText(review)).toContain(
        "We could not confirm your setup. Please try again.",
      );
      expect(
        (findComponent(review, SetupReadyStatus).props as {
          state: { kind: string };
        }).state,
      ).toEqual({ kind: "idle" });
      // Retry stays a deliberate user action; no automatic replay occurs.
      expect(clickableLabels(review)).toEqual([
        "Back to edit",
        "Finish setup",
      ]);
      expect(ensureRunActionMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("P1-A boundary is not widened into later slices", () => {
    const p1aSources = [
      componentSource,
      serverSource,
      domainSource,
      actionSource,
      teamPageSource,
      workspacePageSource,
    ];

    it.each([
      ["invitation execution", "execute_organization_onboarding_invite_intent"],
      ["reconciliation", "reconcile_organization_onboarding_invite_intent"],
      [
        "frozen intent listing",
        "list_organization_onboarding_frozen_team_invite_intents",
      ],
      [
        "invitation result listing",
        "list_organization_onboarding_invitation_results",
      ],
      ["authoritative completion", "complete_organization_v2_onboarding"],
      ["invitation creation", "create_organization_invitation"],
      ["invitation resend", "resend_organization_invitation"],
      ["invitation acceptance", "accept_organization_invitation"],
    ])("introduces no %s call site", (_name, symbol) => {
      for (const source of p1aSources) {
        expect(source).not.toContain(symbol);
      }
    });

    it("does not invoke the completion action from any P1-A surface", () => {
      expect(componentSource).not.toContain("completeV2OnboardingAction");
      expect(teamPageSource).not.toContain("completeV2OnboardingAction");
      expect(workspacePageSource).not.toContain("completeV2OnboardingAction");
    });

    it("does not cut over to a product route", () => {
      for (const source of [componentSource, teamPageSource]) {
        expect(source).not.toContain('router.replace("/home');
        expect(source).not.toContain('router.push("/home');
      }
      expect(componentSource).not.toContain("buildProductDestination");
    });

    it("writes no lifecycle column and touches no private completion table", () => {
      for (const source of [componentSource, serverSource, domainSource]) {
        expect(source).not.toContain("onboarding_setup_ready_at");
        expect(source).not.toContain("onboarding_completed_at");
        expect(source).not.toContain("organization_onboarding_completion_runs");
        expect(source).not.toContain(
          "organization_onboarding_invitation_results",
        );
      }
    });

    it("accepts no client-supplied authoritative value", () => {
      for (const forbidden of [
        "result_code",
        "evidence_kind",
        "invitation_id",
        "idempotency_key",
        "p_intent_id",
      ]) {
        expect(domainSource).not.toContain(`${forbidden}:`);
        expect(serverSource).not.toContain(forbidden);
      }
    });

    it("adds no application-level lock, queue or polling loop", () => {
      for (const source of [componentSource, serverSource]) {
        expect(source).not.toContain("setInterval");
        expect(source).not.toContain("advisory");
        expect(source).not.toMatch(/while\s*\(true\)/);
      }
    });

    it("uses no service-role client and no unsafe cast", () => {
      for (const source of [serverSource, domainSource, actionSource]) {
        expect(source).not.toContain("SERVICE_ROLE");
        expect(source).not.toContain("createSupabaseServiceRoleClient");
        expect(source).not.toContain("as any");
        expect(source).not.toContain(": any");
      }
    });
  });

  describe("V1 and NULL-version compatibility", () => {
    // Behavioral evidence. The strongest existing evidence lives in
    // tests/onboarding/onboarding-lifecycle.test.ts ("keeps V1 incomplete and
    // completed in the isolated legacy state"),
    // tests/onboarding/onboarding-lifecycle-server.test.ts ("keeps a NULL
    // organization grandfathered") and tests/onboarding/team-foundation-route.test.tsx,
    // whose lifecycle table redirects the `legacy` and `grandfathered` states
    // away from the Team route that hosts the Setup Ready affordance. The two
    // tests below add the missing P1-A-layer evidence: the reader emits an
    // identical governed call whatever the flow version, and the component
    // stops at the refusal.
    it("emits one identical governed call for V2, V1 and NULL organizations", async () => {
      const observedCalls: unknown[][] = [];
      const payloads = [
        runPayload(),
        { ok: false, code: "INVALID_LIFECYCLE" },
        { ok: false, code: "INVALID_LIFECYCLE" },
      ];

      for (const payload of payloads) {
        resolveOrganizationMock.mockResolvedValue(ownerActor());
        const { client, rpc } = supabaseWithRpc({ data: payload });

        const result = await ensureOrganizationOnboardingCompletionRun(
          client as never,
          ORG,
        );

        expect(rpc).toHaveBeenCalledTimes(1);
        observedCalls.push(rpc.mock.calls[0] as unknown[]);

        if (payload.ok) {
          expect(result).toMatchObject({ ok: true });
        } else {
          expect(result).toMatchObject({
            ok: false,
            code: "INVALID_LIFECYCLE",
          });
          expect(result).not.toHaveProperty("run");
        }
      }

      // Identical call shapes prove eligibility is decided by the database
      // alone: the application carries no V1 or NULL branch.
      expect(observedCalls[1]).toEqual(observedCalls[0]);
      expect(observedCalls[2]).toEqual(observedCalls[0]);
    });

    it("never ensures a run when a V1 or NULL organization refuses Setup Ready", async () => {
      const props = teamProps();
      markSetupReadyMock.mockResolvedValue({
        ok: false,
        code: "invalid_state",
        message: "This workspace is not ready to be finished yet.",
      });

      let review = await reachReview(props);
      await clickAsync(findClickable(review, "Finish setup"));
      review = renderTeam(props);

      expect(markSetupReadyMock).toHaveBeenCalledTimes(1);
      expect(ensureRunActionMock).not.toHaveBeenCalled();
      expect(
        (findComponent(review, SetupReadyStatus).props as {
          state: { kind: string };
        }).state,
      ).toEqual({ kind: "idle" });
      expect(elementText(review)).toContain(
        "This workspace is not ready to be finished yet.",
      );
    });

    it("adds no flow-version branching of its own", () => {
      for (const source of [serverSource, domainSource]) {
        expect(source).not.toContain("onboarding_flow_version");
        expect(source).not.toContain("flowVersion");
      }
    });

    it("leaves the legacy onboarding action surface untouched", () => {
      expect(actionSource).toContain("completeOnboardingAction");
      expect(actionSource).toContain("saveOnboardingDraftAction");
    });
  });
});
