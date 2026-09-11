import React, { type ReactElement, type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "33333333-3333-4333-8333-333333333333";
const INTENT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INTENT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER = "44444444-4444-4444-8444-444444444444";

const hookRuntime = vi.hoisted(() => {
  type HookSlot =
    | { kind: "state"; value: unknown }
    | { kind: "ref"; value: { current: unknown } }
    | { kind: "id"; value: string };

  let slots: HookSlot[] = [];
  let cursor = 0;
  let dirty = false;

  return {
    reset() {
      slots = [];
      cursor = 0;
      dirty = false;
    },
    beginRender() {
      cursor = 0;
      dirty = false;
    },
    finishRender() {
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
    useRef(initialValue: unknown) {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = { kind: "ref", value: { current: initialValue } };
      }
      return (slots[index] as Extract<HookSlot, { kind: "ref" }>).value;
    },
    useId() {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = { kind: "id", value: `p1c-test-${index}` };
      }
      return (slots[index] as Extract<HookSlot, { kind: "id" }>).value;
    },
  };
});

const createServerClientMock = vi.hoisted(() => vi.fn());
const resolveOrganizationMock = vi.hoisted(() => vi.fn());
const readContextMock = vi.hoisted(() => vi.fn());
const creatingSnapshotMock = vi.hoisted(() => vi.fn());
const getPrimaryActivityMock = vi.hoisted(() => vi.fn());
const completeActionMock = vi.hoisted(() => vi.fn());
const routerPushMock = vi.hoisted(() => vi.fn());
const routerRefreshMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: hookRuntime.useState,
    useRef: hookRuntime.useRef,
    useId: hookRuntime.useId,
  };
});
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    refresh: routerRefreshMock,
    replace: vi.fn(),
    push: routerPushMock,
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));
vi.mock("@/features/onboarding/server/read-onboarding-context", () => ({
  resolveOnboardingOrganizationId: resolveOrganizationMock,
  readOnboardingContext: readContextMock,
}));
vi.mock("@/features/onboarding/server/onboarding-invite-execution", () => ({
  loadOnboardingCreatingSnapshot: creatingSnapshotMock,
}));
vi.mock("@/features/org-context/server/organization-context.repository", () => ({
  OrganizationContextRepository: class {
    getPrimaryBusinessActivity = getPrimaryActivityMock;
  },
}));
vi.mock("@/features/onboarding/actions/onboarding-actions", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/features/onboarding/actions/onboarding-actions")
  >();
  return {
    ...actual,
    completeV2OnboardingAction: completeActionMock,
  };
});

import { completeV2OnboardingAction } from "@/features/onboarding/actions/onboarding-actions";
import {
  canOfferExplicitCompletion,
  completeReadyOnboardingInputSchema,
  completionRefusalCodeForSnapshot,
  hasStaleInvitationEvidence,
  invitationEvidenceLabel,
  invitationResultLabel,
  isDatabaseProvenReadyRunStatus,
  listOnboardingInvitationResultsRpcSchema,
  mapCompleteRpcFailureCode,
  READY_INVITATION_RESULT_KEYS,
  READY_OPERATING_MODEL_FALLBACK_LABEL,
  readyOperatingModelPresentationLabel,
  shouldEnterReadySurface,
  toReadyInvitationResult,
  type OnboardingReadySnapshot,
  type ReadyInvitationResult,
} from "@/features/onboarding/domain/onboarding-ready";
import {
  completeReadyOnboarding,
  listOrganizationOnboardingInvitationResults,
  loadOnboardingReadySnapshot,
} from "@/features/onboarding/server/onboarding-ready";
import {
  OnboardingReady,
  requestExplicitCompletion,
} from "@/features/onboarding/ui/onboarding-ready";

const ROOT = join(__dirname, "..", "..");
const domainSource = readFileSync(
  join(ROOT, "src/features/onboarding/domain/onboarding-ready.ts"),
  "utf8",
);
const serverSource = readFileSync(
  join(ROOT, "src/features/onboarding/server/onboarding-ready.ts"),
  "utf8",
);
const actionSource = readFileSync(
  join(ROOT, "src/features/onboarding/actions/onboarding-actions.ts"),
  "utf8",
);
const componentSource = readFileSync(
  join(ROOT, "src/features/onboarding/ui/onboarding-ready.tsx"),
  "utf8",
);
const pageSource = readFileSync(
  join(ROOT, "src/app/onboarding/ready/page.tsx"),
  "utf8",
);
const creatingPageSource = readFileSync(
  join(ROOT, "src/app/onboarding/creating/page.tsx"),
  "utf8",
);
const enforcementSource = readFileSync(
  join(ROOT, "src/features/onboarding/server/enforce-product-onboarding.ts"),
  "utf8",
);
const mapperSource = domainSource.slice(
  domainSource.indexOf("export function toReadyInvitationResult"),
  domainSource.indexOf("export function isDatabaseProvenReadyRunStatus"),
);

function resultRow(
  intentId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    organization_id: ORG,
    intent_id: intentId,
    email_normalized: "teammate@example.test",
    target_role: "admin" as const,
    invitation_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    result_code: "success",
    evidence_kind: "created_invitation",
    attempt_count: 1,
    last_attempt_at: "2026-09-11T12:00:00.000Z",
    idempotency_key: `onboarding-invite/${ORG}/${intentId}`,
    created_at: "2026-09-11T12:00:00.000Z",
    updated_at: "2026-09-11T12:00:00.000Z",
    ...overrides,
  };
}

function listingPayload(results: ReturnType<typeof resultRow>[]) {
  return {
    ok: true,
    code: "OK",
    organization_id: ORG,
    results,
  };
}

function ensurePayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    ok: true,
    code: "OK",
    organization_id: ORG,
    status: "ready_for_cutover",
    started_at: "2026-09-11T11:00:00.000Z",
    ready_for_cutover_at: "2026-09-11T12:00:00.000Z",
    completed_at: null,
    last_error_code: null,
    ...overrides,
  };
}

function completePayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    ok: true,
    idempotent: false,
    state: "completed",
    organization_id: ORG,
    onboarding_setup_ready_at: "2026-09-11T11:00:00.000Z",
    onboarding_completed_at: "2026-09-11T12:10:00.000Z",
    ...overrides,
  };
}

function ownerActor(organizationId = ORG) {
  return {
    ok: true,
    organizationId,
    role: "owner",
    userId: USER,
  };
}

function supabaseWithRpc(
  handler: (name: string, args: Record<string, unknown>) => {
    data?: unknown;
    error?: { message: string } | null;
  },
) {
  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) =>
    handler(name, args),
  );
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({
      data: { display_name: "Foreign Org Coaching" },
      error: null,
    })),
  };
  const from = vi.fn(() => query);
  return { client: { rpc, from }, rpc, from, query };
}

function readySnapshot(
  overrides: Partial<OnboardingReadySnapshot> = {},
): OnboardingReadySnapshot {
  return {
    organizationId: ORG,
    workspaceName: "Northwind",
    operatingModelLabel: "Agency & Business Services",
    runStatus: "ready_for_cutover",
    readyForCutoverAt: "2026-09-11T12:00:00.000Z",
    runCompletedAt: null,
    organizationCompletedAt: null,
    results: [
      {
        intentId: INTENT_A,
        emailNormalized: "teammate@example.test",
        targetRole: "admin",
        resultCode: "success",
        evidenceKind: "created_invitation",
      },
    ],
    ...overrides,
  };
}

function stubSnapshotDependencies() {
  creatingSnapshotMock.mockResolvedValue({
    ok: true,
    intents: [],
    outcomes: [],
    runStatus: "ready_for_cutover",
  });
  readContextMock.mockResolvedValue({
    ok: true,
    context: {
      organizationName: "Northwind",
      onboardingCompletedAt: null,
    },
  });
  getPrimaryActivityMock.mockResolvedValue({
    ok: true,
    value: {
      organizationId: ORG,
      displayName: "Agency & Business Services",
    },
  });
}

function renderReady(snapshot: OnboardingReadySnapshot): ReactElement {
  let tree: ReactElement | null = null;
  for (let pass = 0; pass < 12; pass += 1) {
    hookRuntime.beginRender();
    tree = OnboardingReady({ snapshot }) as ReactElement;
    if (!hookRuntime.finishRender()) {
      return tree;
    }
  }
  throw new Error("OnboardingReady hook harness did not settle");
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

function elementText(element: ReactElement): string {
  const props = element.props as { children?: ReactNode };
  if (typeof props.children === "string") {
    return props.children;
  }
  if (Array.isArray(props.children)) {
    return props.children
      .map((child) =>
        typeof child === "string"
          ? child
          : React.isValidElement(child)
            ? elementText(child)
            : "",
      )
      .join("");
  }
  if (React.isValidElement(props.children)) {
    return elementText(props.children);
  }
  return "";
}

function findClickable(tree: ReactElement, text: string) {
  return collectElements(tree).find(
    (element) =>
      typeof (element.props as { onClick?: unknown }).onClick === "function" &&
      elementText(element).includes(text),
  );
}

function clickableLabels(tree: ReactElement): string[] {
  return collectElements(tree)
    .filter(
      (element) =>
        typeof (element.props as { onClick?: unknown }).onClick === "function",
    )
    .map((element) => elementText(element).trim());
}

async function clickAsync(element: ReactElement | undefined) {
  if (!element) {
    throw new Error("missing clickable");
  }
  await (element.props as { onClick: () => void | Promise<void> }).onClick();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function settlePendingWork() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("ENG-ONB-1H-P1-C ready reconstruction and explicit completion", () => {
  beforeEach(() => {
    hookRuntime.reset();
    vi.clearAllMocks();
    resolveOrganizationMock.mockResolvedValue(ownerActor());
    stubSnapshotDependencies();
    completeActionMock.mockResolvedValue({
      ok: false,
      code: "TRANSPORT_ERROR",
      message: "not stubbed",
    });
  });

  describe("governed listing parser", () => {
    it("strips invitation ids, tokens, and idempotency keys from listing rows", () => {
      const mapped = toReadyInvitationResult(
        resultRow(INTENT_A) as Parameters<typeof toReadyInvitationResult>[0],
      );
      expect(Object.keys(mapped).sort()).toEqual(
        [...READY_INVITATION_RESULT_KEYS].sort(),
      );
      expect(mapped).not.toHaveProperty("invitation_id");
      expect(mapped).not.toHaveProperty("idempotency_key");
      expect(mapped).not.toHaveProperty("raw_token");
      expect(mapperSource).toContain("void row.invitation_id");
      expect(mapperSource).toContain("void row.idempotency_key");
    });

    it("rejects malformed listing payloads", () => {
      expect(
        listOnboardingInvitationResultsRpcSchema.safeParse({
          ok: true,
          code: "OK",
          organization_id: ORG,
          results: [{ ...resultRow(INTENT_A), extra: true }],
        }).success,
      ).toBe(false);
      expect(
        listOnboardingInvitationResultsRpcSchema.safeParse("ready").success,
      ).toBe(false);
    });

    it("does not infer Ready from row count", () => {
      expect(isDatabaseProvenReadyRunStatus("setup_ready")).toBe(false);
      expect(
        isDatabaseProvenReadyRunStatus("ready_for_cutover"),
      ).toBe(true);
      expect(
        canOfferExplicitCompletion({
          runStatus: "invite_partial",
          organizationCompletedAt: null,
          results: [
            {
              intentId: INTENT_A,
              emailNormalized: "one@example.test",
              targetRole: "admin",
              resultCode: "success",
              evidenceKind: "created_invitation",
            },
            {
              intentId: INTENT_B,
              emailNormalized: "two@example.test",
              targetRole: "staff",
              resultCode: "already_member",
              evidenceKind: "active_membership",
            },
          ],
        }),
      ).toBe(false);
    });

    it("treats historical invitation proof as stale, not Ready", () => {
      const stale: ReadyInvitationResult = {
        intentId: INTENT_A,
        emailNormalized: "stale@example.test",
        targetRole: "admin",
        resultCode: "invitation_proof_lost",
        evidenceKind: "historical_invitation",
      };
      expect(hasStaleInvitationEvidence([stale])).toBe(true);
      expect(
        canOfferExplicitCompletion({
          runStatus: "ready_for_cutover",
          organizationCompletedAt: null,
          results: [stale],
        }),
      ).toBe(false);
      expect(
        completionRefusalCodeForSnapshot(
          readySnapshot({ results: [stale] }),
        ),
      ).toBe("STALE_EVIDENCE");
    });
  });

  describe("listing and snapshot authority", () => {
    it("rejects unauthenticated listing before calling the RPC", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: false,
        code: "not_authenticated",
      });
      const { client, rpc } = supabaseWithRpc(() => ({ data: null }));
      await expect(
        listOrganizationOnboardingInvitationResults(client as never, ORG),
      ).resolves.toMatchObject({ ok: false, code: "NOT_AUTHENTICATED" });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("rejects a non-Owner before listing results", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: true,
        organizationId: ORG,
        role: "admin",
        userId: USER,
      });
      const { client, rpc } = supabaseWithRpc(() => ({ data: null }));
      await expect(
        listOrganizationOnboardingInvitationResults(client as never, ORG),
      ).resolves.toMatchObject({ ok: false, code: "NOT_AUTHORIZED" });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("rejects a foreign organization using server-derived membership", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: false,
        code: "organization_not_found",
      });
      const { client, rpc } = supabaseWithRpc(() => ({ data: null }));
      await expect(
        listOrganizationOnboardingInvitationResults(client as never, OTHER_ORG),
      ).resolves.toMatchObject({ ok: false, code: "NOT_AUTHORIZED" });
      expect(rpc).not.toHaveBeenCalled();
      expect(resolveOrganizationMock).toHaveBeenCalledWith(client, OTHER_ORG);
    });

    it("calls only the governed listing RPC with the server-derived organization id", async () => {
      const { client, rpc, from } = supabaseWithRpc((name, args) => {
        expect(name).toBe("list_organization_onboarding_invitation_results");
        return { data: listingPayload([resultRow(INTENT_A)]) };
      });
      const result = await listOrganizationOnboardingInvitationResults(
        client as never,
        ORG,
      );
      expect(result).toMatchObject({ ok: true, organizationId: ORG });
      expect(rpc).toHaveBeenCalledWith(
        "list_organization_onboarding_invitation_results",
        { p_organization_id: ORG },
      );
      expect(from).not.toHaveBeenCalled();
      if (result.ok) {
        expect(result.results[0]).not.toHaveProperty("idempotency_key");
        expect(result.results[0]).not.toHaveProperty("invitationId");
      }
    });

    it("fails closed on malformed listing output", async () => {
      const { client } = supabaseWithRpc(() => ({
        data: { ok: true, results: "all-done" },
      }));
      await expect(
        listOrganizationOnboardingInvitationResults(client as never, ORG),
      ).resolves.toMatchObject({ ok: false, code: "INVALID_RESPONSE" });
    });

    it("reconstructs Ready from listing plus current-evidence reconciliation, not Creating client state", async () => {
      const { client, rpc, from } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return {
            data: listingPayload([
              resultRow(INTENT_A, {
                result_code: "already_member",
                evidence_kind: "active_membership",
              }),
              resultRow(INTENT_B, {
                email_normalized: "collision@example.test",
                target_role: "staff",
                result_code: "existing_membership_requires_admin_action",
                evidence_kind: "membership_collision",
              }),
            ]),
          };
        }
        if (name === "ensure_organization_onboarding_completion_run") {
          return { data: ensurePayload() };
        }
        throw new Error(`unexpected rpc ${name}`);
      });
      const result = await loadOnboardingReadySnapshot(client as never, ORG);
      expect(creatingSnapshotMock).toHaveBeenCalledWith(client, ORG);
      expect(result).toMatchObject({
        ok: true,
        snapshot: {
          workspaceName: "Northwind",
          operatingModelLabel: "Agency & Business Services",
          runStatus: "ready_for_cutover",
        },
      });
      expect(from).not.toHaveBeenCalled();
      expect(rpc.mock.calls.map((call) => call[0])).toEqual([
        "list_organization_onboarding_invitation_results",
        "ensure_organization_onboarding_completion_run",
      ]);
      if (result.ok) {
        expect(result.snapshot.results.map((item) => item.resultCode)).toEqual([
          "already_member",
          "existing_membership_requires_admin_action",
        ]);
      }
    });

    it("does not render Ready from partial Creating state", async () => {
      const { client } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        return { data: ensurePayload({ status: "invite_partial" }) };
      });
      const result = await loadOnboardingReadySnapshot(client as never, ORG);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(
          isDatabaseProvenReadyRunStatus(result.snapshot.runStatus),
        ).toBe(false);
        expect(shouldEnterReadySurface(result.snapshot.runStatus)).toBe(false);
      }
    });

    it("derives the operating-model label from the canonical org-context repository, not a table read", async () => {
      const { client, from } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        return { data: ensurePayload() };
      });
      const result = await loadOnboardingReadySnapshot(client as never, ORG);
      expect(result).toMatchObject({
        ok: true,
        snapshot: { operatingModelLabel: "Agency & Business Services" },
      });
      expect(from).not.toHaveBeenCalled();
      expect(getPrimaryActivityMock).toHaveBeenCalledWith(ORG);
    });

    it("does not leak a foreign organization activity label into Ready presentation", async () => {
      const { client, from } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        return { data: ensurePayload() };
      });
      getPrimaryActivityMock.mockResolvedValue({
        ok: true,
        value: {
          organizationId: OTHER_ORG,
          displayName: "Foreign Org Coaching",
        },
      });
      const result = await loadOnboardingReadySnapshot(client as never, ORG);
      expect(from).not.toHaveBeenCalled();
      expect(getPrimaryActivityMock).toHaveBeenCalledWith(ORG);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.snapshot.operatingModelLabel).toBe(
          READY_OPERATING_MODEL_FALLBACK_LABEL,
        );
        expect(result.snapshot.operatingModelLabel).not.toBe(
          "Foreign Org Coaching",
        );
        expect(result.snapshot.organizationId).toBe(ORG);
      }
    });

    it("uses the membership-derived organization for presentation, not a forged org query", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor(ORG));
      const { client, rpc } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        return { data: ensurePayload() };
      });
      const result = await loadOnboardingReadySnapshot(
        client as never,
        OTHER_ORG,
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.snapshot.organizationId).toBe(ORG);
        expect(result.snapshot.operatingModelLabel).toBe(
          "Agency & Business Services",
        );
      }
      expect(resolveOrganizationMock).toHaveBeenCalledWith(client, OTHER_ORG);
      expect(creatingSnapshotMock).toHaveBeenCalledWith(client, ORG);
      expect(readContextMock).toHaveBeenCalledWith(client, ORG);
      expect(getPrimaryActivityMock).toHaveBeenCalledWith(ORG);
      expect(getPrimaryActivityMock).not.toHaveBeenCalledWith(OTHER_ORG);
      expect(rpc).toHaveBeenCalledWith(
        "list_organization_onboarding_invitation_results",
        { p_organization_id: ORG },
      );
    });

    it("does not load Ready snapshot or presentation context for a non-Owner", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: true,
        organizationId: ORG,
        role: "admin",
        userId: USER,
      });
      const { client, rpc, from } = supabaseWithRpc(() => ({ data: null }));
      await expect(
        loadOnboardingReadySnapshot(client as never, ORG),
      ).resolves.toMatchObject({ ok: false, code: "NOT_AUTHORIZED" });
      expect(rpc).not.toHaveBeenCalled();
      expect(from).not.toHaveBeenCalled();
      expect(creatingSnapshotMock).not.toHaveBeenCalled();
      expect(readContextMock).not.toHaveBeenCalled();
      expect(getPrimaryActivityMock).not.toHaveBeenCalled();
    });

    it("does not treat missing presentation context as Ready authority", async () => {
      getPrimaryActivityMock.mockResolvedValue({ ok: false });
      const { client, from } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        return { data: ensurePayload({ status: "invite_partial" }) };
      });
      const result = await loadOnboardingReadySnapshot(client as never, ORG);
      expect(from).not.toHaveBeenCalled();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.snapshot.operatingModelLabel).toBe(
          READY_OPERATING_MODEL_FALLBACK_LABEL,
        );
        expect(
          isDatabaseProvenReadyRunStatus(result.snapshot.runStatus),
        ).toBe(false);
        expect(
          completionRefusalCodeForSnapshot(result.snapshot),
        ).toBe("NOT_READY");
      }
    });

    it("keeps a missing operating-model label presentation-only when the run is Ready", async () => {
      getPrimaryActivityMock.mockResolvedValue({ ok: true, value: null });
      const { client } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        return { data: ensurePayload() };
      });
      const result = await loadOnboardingReadySnapshot(client as never, ORG);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.snapshot.operatingModelLabel).toBe(
          READY_OPERATING_MODEL_FALLBACK_LABEL,
        );
        expect(completionRefusalCodeForSnapshot(result.snapshot)).toBeNull();
        expect(
          canOfferExplicitCompletion({
            runStatus: result.snapshot.runStatus,
            organizationCompletedAt: result.snapshot.organizationCompletedAt,
            results: result.snapshot.results,
          }),
        ).toBe(true);
      }
    });

    it("maps known pack keys to product-facing operating-model titles", () => {
      expect(
        readyOperatingModelPresentationLabel("niche.online-course-business"),
      ).toBe("Courses & Coaching");
      expect(readyOperatingModelPresentationLabel("foundation.service")).toBe(
        "Agency & Business Services",
      );
      expect(
        readyOperatingModelPresentationLabel("foundation.field-operations"),
      ).toBe("Construction & Field Operations");
      expect(
        readyOperatingModelPresentationLabel("foundation.product-operations"),
      ).toBe("Product Operations");
      expect(readyOperatingModelPresentationLabel(null)).toBe(
        READY_OPERATING_MODEL_FALLBACK_LABEL,
      );
    });
  });

  describe("explicit completion action", () => {
    it("rejects extra client-supplied outcome fields at the action boundary", () => {
      expect(
        completeReadyOnboardingInputSchema.safeParse({
          organizationId: ORG,
          result_code: "success",
        }).success,
      ).toBe(false);
      expect(
        completeReadyOnboardingInputSchema.safeParse({
          organizationId: ORG,
          evidence_kind: "created_invitation",
        }).success,
      ).toBe(false);
    });

    it("does not call complete unless the reconstructed run is ready_for_cutover", async () => {
      const { client, rpc } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        if (name === "complete_organization_v2_onboarding") {
          throw new Error("complete must not run");
        }
        return { data: ensurePayload({ status: "invite_partial" }) };
      });
      await expect(
        completeReadyOnboarding(client as never, ORG),
      ).resolves.toMatchObject({ ok: false, code: "NOT_READY" });
      expect(rpc).not.toHaveBeenCalledWith(
        "complete_organization_v2_onboarding",
        expect.anything(),
      );
    });

    it("refuses stale historical proof before invoking completion", async () => {
      const { client, rpc } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return {
            data: listingPayload([
              resultRow(INTENT_A, {
                result_code: "invitation_proof_lost",
                evidence_kind: "historical_invitation",
              }),
            ]),
          };
        }
        return { data: ensurePayload() };
      });
      await expect(
        completeReadyOnboarding(client as never, ORG),
      ).resolves.toMatchObject({ ok: false, code: "STALE_EVIDENCE" });
      expect(rpc).not.toHaveBeenCalledWith(
        "complete_organization_v2_onboarding",
        expect.anything(),
      );
    });

    it("invokes exactly complete_organization_v2_onboarding after an explicit Ready reconstruction", async () => {
      let listedCompleted = false;
      const { client, rpc } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        if (name === "ensure_organization_onboarding_completion_run") {
          return { data: ensurePayload() };
        }
        if (name === "complete_organization_v2_onboarding") {
          listedCompleted = true;
          return { data: completePayload() };
        }
        throw new Error(`unexpected rpc ${name}`);
      });
      readContextMock.mockImplementation(async () => ({
        ok: true,
        context: {
          organizationName: "Northwind",
          onboardingCompletedAt: listedCompleted
            ? "2026-09-11T12:10:00.000Z"
            : null,
        },
      }));
      const result = await completeReadyOnboarding(client as never, ORG);
      expect(result).toMatchObject({
        ok: true,
        idempotent: false,
        completedAt: "2026-09-11T12:10:00.000Z",
      });
      expect(rpc).toHaveBeenCalledWith(
        "complete_organization_v2_onboarding",
        { p_organization_id: ORG },
      );
      expect(
        rpc.mock.calls.filter(
          (call) => call[0] === "complete_organization_v2_onboarding",
        ),
      ).toHaveLength(1);
    });

    it("returns the already-completed idempotent response without a second transition", async () => {
      readContextMock.mockResolvedValue({
        ok: true,
        context: {
          organizationName: "Northwind",
          onboardingCompletedAt: "2026-09-11T12:10:00.000Z",
        },
      });
      const { client, rpc } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        if (name === "ensure_organization_onboarding_completion_run") {
          return { data: ensurePayload() };
        }
        return { data: completePayload({ idempotent: true }) };
      });
      const result = await completeReadyOnboarding(client as never, ORG);
      expect(result).toMatchObject({ ok: true, idempotent: true });
      expect(rpc).toHaveBeenCalledWith(
        "complete_organization_v2_onboarding",
        { p_organization_id: ORG },
      );
    });

    it("reconstructs non-Ready authority when completion is rejected after a downgrade race", async () => {
      // UI/application mapping only. This mocked NOT_READY payload is not
      // evidence that PostgreSQL itself generated the refusal. The live RPC
      // matrix in tests/security/onboarding-completion-ready-gate-live-verification.sql
      // proves the database NOT_READY refusal.
      let completeAttempted = false;
      const { client, rpc } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return {
            data: listingPayload([
              resultRow(INTENT_A, completeAttempted
                ? {
                    result_code: "invitation_proof_lost",
                    evidence_kind: "historical_invitation",
                  }
                : {}),
            ]),
          };
        }
        if (name === "ensure_organization_onboarding_completion_run") {
          return {
            data: ensurePayload(
              completeAttempted ? { status: "invite_partial" } : {},
            ),
          };
        }
        if (name === "complete_organization_v2_onboarding") {
          completeAttempted = true;
          return { data: { ok: false, code: "NOT_READY" } };
        }
        throw new Error(`unexpected rpc ${name}`);
      });
      await expect(
        completeReadyOnboarding(client as never, ORG),
      ).resolves.toMatchObject({ ok: false, code: "STALE_EVIDENCE" });
    });

    it("maps transport failure without leaking SQL details", async () => {
      const { client } = supabaseWithRpc((name) => {
        if (name === "list_organization_onboarding_invitation_results") {
          return { data: listingPayload([resultRow(INTENT_A)]) };
        }
        if (name === "ensure_organization_onboarding_completion_run") {
          return { data: ensurePayload() };
        }
        return { error: { message: "P0001 organization_onboarding" } };
      });
      const result = await completeReadyOnboarding(client as never, ORG);
      expect(result).toMatchObject({ ok: false, code: "TRANSPORT_ERROR" });
      if (!result.ok) {
        expect(result.message).not.toContain("P0001");
        expect(result.message).not.toContain("organization_onboarding");
      }
    });

    it("maps unexpected complete RPC codes into the closed vocabulary", () => {
      expect(mapCompleteRpcFailureCode("NOT_AUTHORIZED")).toBe("NOT_AUTHORIZED");
      expect(mapCompleteRpcFailureCode("SETUP_NOT_READY")).toBe("NOT_READY");
      expect(mapCompleteRpcFailureCode("NOT_READY")).toBe("NOT_READY");
      expect(mapCompleteRpcFailureCode("SQLSTATE")).toBe("INVALID_RESPONSE");
    });
  });

  describe("Ready surface", () => {
    it("shows truthful invitation created copy without claiming delivery", () => {
      const html = renderToStaticMarkup(renderReady(readySnapshot()));
      expect(html).toContain("Ready to enter ZyntixAI");
      expect(html).toContain("Invitation created");
      expect(html).toContain("An invitation was created for this teammate.");
      expect(html).toContain("Current invitation record");
      expect(html).toContain("does not confirm email delivery");
      expect(html).not.toContain("invitation was sent");
      expect(html).not.toContain("100% complete");
      expect(html).not.toContain("created_invitation");
      expect(completeActionMock).not.toHaveBeenCalled();
    });

    it("labels membership, collision, invalid, and unresolved evidence distinctly", () => {
      const html = renderToStaticMarkup(
        renderReady(
          readySnapshot({
            results: [
              {
                intentId: INTENT_A,
                emailNormalized: "member@example.test",
                targetRole: "admin",
                resultCode: "already_member",
                evidenceKind: "active_membership",
              },
              {
                intentId: INTENT_B,
                emailNormalized: "collision@example.test",
                targetRole: "staff",
                resultCode: "existing_membership_requires_admin_action",
                evidenceKind: "membership_collision",
              },
            ],
          }),
        ),
      );
      expect(html).toContain("Already a member");
      expect(html).toContain("Needs owner review");
      expect(html).toContain("Active workspace membership");
      expect(html).toContain("Existing membership needs review");
      expect(invitationResultLabel("invalid_input")).toBe("Cannot invite");
      expect(invitationEvidenceLabel("frozen_intent_invalid")).toBe(
        "Saved teammate setup is invalid",
      );
      expect(invitationResultLabel("not_attempted")).toBe("Not started");
    });

    it("does not offer Enter ZyntixAI when the organization is already completed", () => {
      const tree = renderReady(
        readySnapshot({
          organizationCompletedAt: "2026-09-11T12:10:00.000Z",
        }),
      );
      const html = renderToStaticMarkup(tree);
      expect(html).toContain("Setup is complete");
      expect(clickableLabels(tree)).not.toContain("Enter ZyntixAI");
      expect(html).not.toContain("/home");
    });

    it("issues at most one completion request for a rapid double-click", async () => {
      const pending = deferred<
        Awaited<ReturnType<typeof completeV2OnboardingAction>>
      >();
      completeActionMock.mockReturnValue(pending.promise);
      const props = readySnapshot();
      let tree = renderReady(props);
      const first = findClickable(tree, "Enter ZyntixAI");
      const firstClick = clickAsync(first);
      tree = renderReady(props);
      const second = findClickable(tree, "Finishing setup");
      await clickAsync(second);
      pending.resolve({
        ok: true,
        organizationId: ORG,
        idempotent: false,
        completedAt: "2026-09-11T12:10:00.000Z",
        snapshot: readySnapshot({
          organizationCompletedAt: "2026-09-11T12:10:00.000Z",
        }),
      });
      await firstClick;
      await settlePendingWork();
      expect(completeActionMock).toHaveBeenCalledTimes(1);
      expect(completeActionMock).toHaveBeenCalledWith({ organizationId: ORG });
    });

    it("restores a usable control after failure and requires a new click to retry", async () => {
      completeActionMock
        .mockResolvedValueOnce({
          ok: false,
          code: "TRANSPORT_ERROR",
          message: "We could not confirm this setup. Please try again.",
        })
        .mockResolvedValueOnce({
          ok: true,
          organizationId: ORG,
          idempotent: false,
          completedAt: "2026-09-11T12:10:00.000Z",
          snapshot: readySnapshot({
            organizationCompletedAt: "2026-09-11T12:10:00.000Z",
          }),
        });
      const props = readySnapshot();
      let tree = renderReady(props);
      await clickAsync(findClickable(tree, "Enter ZyntixAI"));
      await settlePendingWork();
      tree = renderReady(props);
      const html = renderToStaticMarkup(tree);
      expect(html).toContain("We could not confirm this setup. Please try again.");
      expect(clickableLabels(tree)).toContain("Enter ZyntixAI");
      expect(completeActionMock).toHaveBeenCalledTimes(1);
      await clickAsync(findClickable(tree, "Enter ZyntixAI"));
      await settlePendingWork();
      expect(completeActionMock).toHaveBeenCalledTimes(2);
    });

    it("removes Ready completion after a not-Ready downgrade without retrying", async () => {
      completeActionMock.mockResolvedValue({
        ok: false,
        code: "STALE_EVIDENCE",
        message:
          "Current invitation proof is no longer valid. Review invitations before finishing setup.",
      });
      const props = readySnapshot();
      const tree = renderReady(props);
      await clickAsync(findClickable(tree, "Enter ZyntixAI"));
      await settlePendingWork();
      expect(routerPushMock).toHaveBeenCalledWith(
        `/onboarding/creating?org=${ORG}`,
      );
      expect(completeActionMock).toHaveBeenCalledTimes(1);
    });

    it("marks completed UI only after the database-confirmed action returns", async () => {
      const pending = deferred<
        Awaited<ReturnType<typeof completeV2OnboardingAction>>
      >();
      completeActionMock.mockReturnValue(pending.promise);
      const props = readySnapshot();
      let tree = renderReady(props);
      const click = clickAsync(findClickable(tree, "Enter ZyntixAI"));
      tree = renderReady(props);
      expect(renderToStaticMarkup(tree)).toContain("Finishing setup");
      expect(renderToStaticMarkup(tree)).not.toContain("Setup is complete");
      pending.resolve({
        ok: true,
        organizationId: ORG,
        idempotent: false,
        completedAt: "2026-09-11T12:10:00.000Z",
        snapshot: readySnapshot({
          organizationCompletedAt: "2026-09-11T12:10:00.000Z",
        }),
      });
      await click;
      await settlePendingWork();
      tree = renderReady(props);
      expect(renderToStaticMarkup(tree)).toContain("Setup is complete");
      expect(routerRefreshMock).toHaveBeenCalled();
    });

    it("keeps Enter ZyntixAI keyboard-operable and busy/disabled while in flight", () => {
      const tree = renderReady(readySnapshot());
      const button = findClickable(tree, "Enter ZyntixAI");
      expect(button).toBeDefined();
      expect((button?.props as { type?: string }).type).toBe("button");
      expect((button?.props as { disabled?: boolean }).disabled).toBe(false);
    });
  });

  describe("P1-C boundary", () => {
    it("does not add P1-D product admission or workspace entry", () => {
      expect(componentSource).not.toContain("buildProductDestination");
      expect(componentSource).not.toContain("redirectIfOrganizationOnboardingIncomplete");
      expect(pageSource).not.toContain("router.push(\"/home");
      expect(enforcementSource).not.toContain("/onboarding/ready");
      expect(enforcementSource).not.toContain("/onboarding/creating");
    });

    it("does not complete from page load, listing, or reconciliation", () => {
      expect(pageSource).not.toContain("completeV2OnboardingAction");
      expect(pageSource).not.toContain("complete_organization_v2_onboarding");
      expect(serverSource).toContain("loadOnboardingCreatingSnapshot");
      expect(serverSource).toContain(
        "list_organization_onboarding_invitation_results",
      );
      expect(serverSource).not.toContain("create_organization_invitation");
      expect(serverSource).not.toContain("execute_organization_onboarding_invite_intent");
      expect(componentSource).not.toContain("useEffect");
      expect(componentSource).not.toContain("setInterval");
    });

    it("does not write governed tables or use a service-role client", () => {
      expect(serverSource).not.toMatch(
        /\.from\(["']organization_onboarding_invitation_results["']/,
      );
      expect(serverSource).not.toMatch(/\.from\(["']organization_invitations["']/);
      expect(serverSource).not.toMatch(
        /\.from\(["']organization_onboarding_completion_runs["']/,
      );
      expect(serverSource).not.toContain("organization_business_activities");
      expect(serverSource).not.toMatch(
        /\.from\(["']organization_business_activities["']\)/,
      );
      expect(serverSource).toContain("OrganizationContextRepository");
      expect(serverSource).toContain("getPrimaryBusinessActivity");
      expect(serverSource).not.toContain("resolveOperatingModelSetupStatus");
      expect(serverSource).not.toContain("createOrgContextQueryClient");
      expect(serverSource).not.toContain("createControlPlaneReaders");
      expect(serverSource).not.toContain("SERVICE_ROLE");
      expect(serverSource).not.toContain("createSupabaseServiceRoleClient");
      expect(actionSource).toContain("completeReadyOnboarding");
      expect(actionSource).not.toContain("createSupabaseServiceRoleClient");
    });

    it("does not widen registration, auth, provisioning, or social publishing", () => {
      expect(serverSource).not.toContain("complete_owner_self_registration");
      expect(componentSource).not.toContain("operator_allow_social");
      expect(creatingPageSource).toContain("buildReadyOnboardingPath");
      expect(requestExplicitCompletion).toBeTypeOf("function");
    });
  });
});
