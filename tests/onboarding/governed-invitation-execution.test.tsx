import React, { type ReactElement, type ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MATERIAL_SEQUENCE_STOP_INVITATION_RESULT_CODES,
  ONBOARDING_INVITATION_RESULT_CODES,
  TERMINAL_INVITATION_RESULT_CODES,
  creatingRunStatusMessage,
  executeOnboardingInviteIntentInputSchema,
  executeOnboardingInviteIntentRpcSchema,
  isMaterialSequenceStopInvitationResultCode,
  isRetryableInvitationResultCode,
  isTerminalInvitationResultCode,
  nextExecutableIntentId,
  onboardingInvitationResultMessage,
  onboardingInviteExecutionMessage,
  resolvedOutcomeCount,
  toOnboardingInviteIntentOutcome,
  type OnboardingInviteExecutionResult,
  type OnboardingInviteIntentOutcome,
} from "@/features/onboarding/domain/onboarding-invite-execution";
import type { TeamInviteIntent } from "@/features/onboarding/domain/team-invite-intents";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "33333333-3333-4333-8333-333333333333";
const INTENT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INTENT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const INTENT_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const hookRuntime = vi.hoisted(() => {
  type HookSlot =
    | { kind: "state"; value: unknown }
    | { kind: "ref"; value: { current: unknown } }
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
    useRef(initialValue: unknown) {
      const index = cursor++;
      if (!slots[index]) {
        slots[index] = { kind: "ref", value: { current: initialValue } };
      }
      return (slots[index] as Extract<HookSlot, { kind: "ref" }>).value;
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
        slots[index] = { kind: "id", value: `p1b-test-${index}` };
      }
      return (slots[index] as Extract<HookSlot, { kind: "id" }>).value;
    },
  };
});

const createServerClientMock = vi.hoisted(() => vi.fn());
const resolveOrganizationMock = vi.hoisted(() => vi.fn());
const executeActionMock = vi.hoisted(() => vi.fn());
const reconcileActionMock = vi.hoisted(() => vi.fn());
const realActions = vi.hoisted(() => ({
  current: null as null | typeof import(
    "@/features/onboarding/actions/onboarding-invite-execution-actions"
  ),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: hookRuntime.useState,
    useRef: hookRuntime.useRef,
    useEffect: hookRuntime.useEffect,
    useId: hookRuntime.useId,
  };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));
vi.mock("@/features/onboarding/server/read-onboarding-context", () => ({
  resolveOnboardingOrganizationId: resolveOrganizationMock,
}));
vi.mock(
  "@/features/onboarding/actions/onboarding-invite-execution-actions",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("@/features/onboarding/actions/onboarding-invite-execution-actions")
    >();
    realActions.current = actual;
    return {
      ...actual,
      executeOnboardingInviteIntentAction: executeActionMock,
      reconcileOnboardingInviteIntentAction: reconcileActionMock,
    };
  },
);

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  executeOnboardingInviteIntentAction,
  listFrozenOnboardingTeamInviteIntentsAction,
  reconcileOnboardingInviteIntentAction,
} from "@/features/onboarding/actions/onboarding-invite-execution-actions";
import {
  executeOrganizationOnboardingInviteIntent,
  listOrganizationOnboardingFrozenTeamInviteIntents,
  loadOnboardingCreatingSnapshot,
  reconcileOrganizationOnboardingInviteIntent,
} from "@/features/onboarding/server/onboarding-invite-execution";
import { OnboardingShell } from "@/features/onboarding/ui/onboarding-shell";
import {
  CreatingStatusCopy,
  OnboardingCreating,
  mergeOutcome,
  outcomesByIntentId,
  resolveCreatingSurfaceState,
  runInvitationExecutionSequence,
} from "@/features/onboarding/ui/onboarding-creating";

const ROOT = join(__dirname, "..", "..");
const domainSource = readFileSync(
  join(ROOT, "src/features/onboarding/domain/onboarding-invite-execution.ts"),
  "utf8",
);
const serverSource = readFileSync(
  join(ROOT, "src/features/onboarding/server/onboarding-invite-execution.ts"),
  "utf8",
);
const actionSource = readFileSync(
  join(
    ROOT,
    "src/features/onboarding/actions/onboarding-invite-execution-actions.ts",
  ),
  "utf8",
);
const componentSource = readFileSync(
  join(ROOT, "src/features/onboarding/ui/onboarding-creating.tsx"),
  "utf8",
);
const cssSource = readFileSync(
  join(ROOT, "src/features/onboarding/ui/onboarding-creating.module.css"),
  "utf8",
);
const pageSource = readFileSync(
  join(ROOT, "src/app/onboarding/creating/page.tsx"),
  "utf8",
);
const mapperSource = domainSource.slice(
  domainSource.indexOf("export function toOnboardingInviteIntentOutcome"),
  domainSource.indexOf("export function isRetryableInvitationResultCode"),
);

function frozenIntent(
  id: string,
  email = "teammate@example.test",
  role: TeamInviteIntent["role"] = "admin",
): TeamInviteIntent {
  return {
    id,
    organizationId: ORG,
    emailNormalized: email,
    role,
    revision: 1,
    createdAt: "2026-09-10T12:00:00.000Z",
    updatedAt: "2026-09-10T12:00:00.000Z",
  };
}

function resultRow(
  intentId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    organization_id: ORG,
    intent_id: intentId,
    email_normalized: "teammate@example.test",
    target_role: "admin",
    invitation_id: null,
    result_code: "not_attempted",
    evidence_kind: "none",
    attempt_count: 0,
    last_attempt_at: null,
    idempotency_key: `onboarding-invite/${ORG}/${intentId}`,
    created_at: "2026-09-10T12:00:00.000Z",
    updated_at: "2026-09-10T12:00:00.000Z",
    ...overrides,
  };
}

function executePayload(
  intentId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    ok: true,
    code: "OK",
    fresh_create: false,
    result: resultRow(intentId),
    run_status: "setup_ready",
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

function outcome(
  intentId: string,
  resultCode: OnboardingInviteIntentOutcome["resultCode"] = "not_attempted",
): OnboardingInviteIntentOutcome {
  return {
    intentId,
    emailNormalized: "teammate@example.test",
    targetRole: "admin",
    resultCode,
    evidenceKind:
      resultCode === "success"
        ? "created_invitation"
        : resultCode === "already_member"
          ? "active_membership"
          : "none",
    runStatus: "inviting",
  };
}

function creatingProps(
  intents: TeamInviteIntent[] = [frozenIntent(INTENT_A)],
  outcomes: OnboardingInviteIntentOutcome[] = [],
) {
  return {
    organizationId: ORG,
    initialIntents: intents,
    initialOutcomes: outcomes,
    initialRunStatus: "setup_ready" as const,
  };
}

function renderCreating(
  props: ReturnType<typeof creatingProps>,
): ReactElement {
  let tree: ReactElement | null = null;
  for (let pass = 0; pass < 12; pass += 1) {
    hookRuntime.beginRender();
    tree = OnboardingCreating(props) as ReactElement;
    if (!hookRuntime.finishRender()) {
      return tree;
    }
  }
  throw new Error("OnboardingCreating hook harness did not settle");
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
    throw new Error("Expected Creating element was not rendered");
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

function clickableLabels(tree: ReactElement): string[] {
  return collectElements(tree)
    .filter((element) => {
      const props = element.props as {
        onClick?: unknown;
        href?: unknown;
      };
      return (
        typeof props.onClick === "function" || typeof props.href === "string"
      );
    })
    .map((element) => elementText(element).trim())
    .sort();
}

async function clickAsync(element: ReactElement) {
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

const FORBIDDEN_READY_MARKERS = [
  "Enter ZyntixAI",
  "Setup complete",
  "Workspace complete",
  "Enter product",
  "ready_for_cutover",
  "/home",
];

describe("ENG-ONB-1H-P1-B governed invitation execution", () => {
  beforeEach(() => {
    hookRuntime.reset();
    vi.clearAllMocks();
    resolveOrganizationMock.mockResolvedValue(ownerActor());
    executeActionMock.mockImplementation((input: unknown) =>
      realActions.current!.executeOnboardingInviteIntentAction(input),
    );
    reconcileActionMock.mockImplementation((input: unknown) =>
      realActions.current!.reconcileOnboardingInviteIntentAction(input),
    );
  });

  describe("payload parsing and closed vocabulary", () => {
    it("renders a distinct non-misleading message for every result_code", () => {
      const messages = ONBOARDING_INVITATION_RESULT_CODES.map((code) =>
        onboardingInvitationResultMessage(code),
      );
      expect(new Set(messages).size).toBe(
        ONBOARDING_INVITATION_RESULT_CODES.length,
      );
      expect(messages.join("\n")).not.toMatch(/delivered|sent email|token/i);
      expect(onboardingInvitationResultMessage("success")).toContain(
        "invitation was created",
      );
      expect(
        onboardingInvitationResultMessage("already_member"),
      ).toContain("already a member");
      expect(
        onboardingInvitationResultMessage("invitation_proof_lost"),
      ).toContain("no longer current");
      expect(
        onboardingInvitationResultMessage(
          "existing_membership_requires_admin_action",
        ),
      ).toContain("needs an owner to review");
    });

    it("rejects extra client-supplied authoritative fields", () => {
      expect(
        executeOnboardingInviteIntentInputSchema.safeParse({
          organizationId: ORG,
          intentId: INTENT_A,
          result_code: "success",
        }).success,
      ).toBe(false);
      expect(
        executeOnboardingInviteIntentInputSchema.safeParse({
          organizationId: ORG,
          intentId: INTENT_A,
          evidence_kind: "created_invitation",
        }).success,
      ).toBe(false);
      expect(
        executeOnboardingInviteIntentInputSchema.safeParse({
          organizationId: ORG,
          intentId: INTENT_A,
          invitation_id: INTENT_B,
        }).success,
      ).toBe(false);
      expect(
        executeOnboardingInviteIntentInputSchema.safeParse({
          organizationId: ORG,
          intentId: INTENT_A,
          idempotency_key: "forged",
        }).success,
      ).toBe(false);
    });

    it("discards plaintext tokens and idempotency keys from a successful execute payload", () => {
      const parsed = executeOnboardingInviteIntentRpcSchema.safeParse(
        executePayload(INTENT_A, {
          fresh_create: true,
          expires_at: "2026-09-17T12:00:00.000Z",
          raw_token: "ffffffffffffffffffffffffffffffff",
          result: resultRow(INTENT_A, {
            result_code: "success",
            evidence_kind: "created_invitation",
            invitation_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            attempt_count: 1,
            last_attempt_at: "2026-09-10T12:01:00.000Z",
          }),
          run_status: "inviting",
        }),
      );
      expect(parsed.success).toBe(true);
      if (!parsed.success || !parsed.data.ok) {
        return;
      }
      const mapped = toOnboardingInviteIntentOutcome(parsed.data);
      expect(Object.keys(mapped).sort()).toEqual([
        "emailNormalized",
        "evidenceKind",
        "intentId",
        "resultCode",
        "runStatus",
        "targetRole",
      ]);
      expect(mapped).not.toHaveProperty("rawToken");
      expect(mapped).not.toHaveProperty("raw_token");
      expect(mapped).not.toHaveProperty("invitationId");
      expect(mapped).not.toHaveProperty("idempotencyKey");
      expect(JSON.stringify(mapped)).not.toContain("ffff");
      expect(JSON.stringify(mapped)).not.toContain("onboarding-invite/");
    });

    it("fails closed on a malformed execute payload", () => {
      expect(
        executeOnboardingInviteIntentRpcSchema.safeParse({
          ok: true,
          code: "OK",
          result: { intent_id: INTENT_A },
        }).success,
      ).toBe(false);
    });
  });

  describe("server-only execution", () => {
    it("passes only server-derived organization id and the frozen intent id", async () => {
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const { client, rpc } = supabaseWithRpc({
        data: executePayload(INTENT_A, {
          result: resultRow(INTENT_A, {
            result_code: "success",
            evidence_kind: "created_invitation",
            invitation_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            attempt_count: 1,
            last_attempt_at: "2026-09-10T12:01:00.000Z",
          }),
          run_status: "inviting",
        }),
      });

      const result = await executeOrganizationOnboardingInviteIntent(
        client as never,
        OTHER_ORG,
        INTENT_A,
      );

      expect(resolveOrganizationMock).toHaveBeenCalledWith(
        client,
        OTHER_ORG,
      );
      expect(rpc).toHaveBeenCalledTimes(1);
      expect(rpc).toHaveBeenCalledWith(
        "execute_organization_onboarding_invite_intent",
        {
          p_organization_id: ORG,
          p_intent_id: INTENT_A,
        },
      );
      expect(result).toMatchObject({
        ok: true,
        outcome: {
          intentId: INTENT_A,
          resultCode: "success",
        },
      });
      expect(JSON.stringify(result)).not.toContain("raw_token");
      expect(JSON.stringify(result)).not.toContain("ffff");
    });

    it("refuses a non-Owner member before reaching the database", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ...ownerActor(),
        role: "admin",
      });
      const { client, rpc } = supabaseWithRpc({ data: executePayload(INTENT_A) });
      const result = await executeOrganizationOnboardingInviteIntent(
        client as never,
        ORG,
        INTENT_A,
      );
      expect(result).toMatchObject({ ok: false, code: "NOT_AUTHORIZED" });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("maps an unauthenticated caller without leaking database detail", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: false,
        code: "not_authenticated",
      });
      const { client, rpc } = supabaseWithRpc({
        error: { message: "permission denied for function" },
      });
      const result = await executeOrganizationOnboardingInviteIntent(
        client as never,
        ORG,
        INTENT_A,
      );
      expect(result).toEqual({
        ok: false,
        code: "NOT_AUTHENTICATED",
        message: onboardingInviteExecutionMessage("NOT_AUTHENTICATED"),
      });
      expect(rpc).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toContain("permission denied");
    });

    it("refuses a foreign organization before the execute RPC", async () => {
      resolveOrganizationMock.mockResolvedValue({
        ok: false,
        code: "organization_not_found",
      });
      const { client, rpc } = supabaseWithRpc({ data: executePayload(INTENT_A) });
      const result = await executeOrganizationOnboardingInviteIntent(
        client as never,
        OTHER_ORG,
        INTENT_A,
      );
      expect(result).toMatchObject({ ok: false, code: "NOT_AUTHORIZED" });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("surfaces INTENT_NOT_FOUND for a foreign intent without leaking internals", async () => {
      const { client, rpc } = supabaseWithRpc({
        data: { ok: false, code: "INTENT_NOT_FOUND" },
      });
      const result = await executeOrganizationOnboardingInviteIntent(
        client as never,
        ORG,
        INTENT_B,
      );
      expect(rpc).toHaveBeenCalledWith(
        "execute_organization_onboarding_invite_intent",
        {
          p_organization_id: ORG,
          p_intent_id: INTENT_B,
        },
      );
      expect(result).toEqual({
        ok: false,
        code: "INTENT_NOT_FOUND",
        message: onboardingInviteExecutionMessage("INTENT_NOT_FOUND"),
      });
    });

    it("lists frozen intents through the governed read RPC only", async () => {
      const { client, rpc } = supabaseWithRpc({
        data: {
          ok: true,
          code: "OK",
          organization_id: ORG,
          intents: [
            {
              id: INTENT_A,
              organization_id: ORG,
              email_normalized: "admin@example.test",
              role: "admin",
              revision: 1,
              created_at: "2026-09-10T12:00:00.000Z",
              updated_at: "2026-09-10T12:00:00.000Z",
            },
          ],
        },
      });
      const result = await listOrganizationOnboardingFrozenTeamInviteIntents(
        client as never,
        ORG,
      );
      expect(rpc).toHaveBeenCalledWith(
        "list_organization_onboarding_frozen_team_invite_intents",
        { p_organization_id: ORG },
      );
      expect(result).toMatchObject({
        ok: true,
        intents: [{ id: INTENT_A, emailNormalized: "admin@example.test" }],
      });
    });

    it("reconciles without an invitation-creating RPC", async () => {
      const { client, rpc } = supabaseWithRpc({
        data: {
          ok: true,
          code: "OK",
          result: resultRow(INTENT_A, {
            result_code: "invitation_proof_lost",
            evidence_kind: "historical_invitation",
            invitation_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            attempt_count: 1,
            last_attempt_at: "2026-09-10T12:01:00.000Z",
          }),
          run_status: "invite_partial",
        },
      });
      const result = await reconcileOrganizationOnboardingInviteIntent(
        client as never,
        ORG,
        INTENT_A,
      );
      expect(rpc).toHaveBeenCalledTimes(1);
      expect(rpc.mock.calls[0]?.[0]).toBe(
        "reconcile_organization_onboarding_invite_intent",
      );
      expect(rpc.mock.calls[0]?.[0]).not.toBe(
        "execute_organization_onboarding_invite_intent",
      );
      expect(result).toMatchObject({
        ok: true,
        outcome: { resultCode: "invitation_proof_lost" },
      });
    });

    it("maps transport failure without database internals", async () => {
      const { client } = supabaseWithRpc({
        error: { message: "relation does not exist" },
      });
      const result = await executeOrganizationOnboardingInviteIntent(
        client as never,
        ORG,
        INTENT_A,
      );
      expect(result).toEqual({
        ok: false,
        code: "TRANSPORT_ERROR",
        message: onboardingInviteExecutionMessage("TRANSPORT_ERROR"),
      });
      expect(JSON.stringify(result)).not.toContain("relation does not exist");
    });
  });

  describe("server actions", () => {
    it("rejects malformed execute input before creating a server client", async () => {
      const result = await executeOnboardingInviteIntentAction({
        organizationId: ORG,
        intentId: INTENT_A,
        result_code: "success",
      });
      expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      expect(createServerClientMock).not.toHaveBeenCalled();
    });

    it("rejects extra fields on the frozen-intent list action", async () => {
      const result = await listFrozenOnboardingTeamInviteIntentsAction({
        organizationId: ORG,
        invitation_id: INTENT_A,
      });
      expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      expect(createServerClientMock).not.toHaveBeenCalled();
    });

    it("rejects extra fields on reconcile", async () => {
      const result = await reconcileOnboardingInviteIntentAction({
        organizationId: ORG,
        intentId: INTENT_A,
        idempotency_key: "forged",
      });
      expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      expect(createServerClientMock).not.toHaveBeenCalled();
    });
  });

  describe("execution ordering", () => {
    it("executes frozen intents in snapshot order and stops after failure", async () => {
      const intents = [
        frozenIntent(INTENT_A, "one@example.test"),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
        frozenIntent(INTENT_C, "three@example.test", "viewer"),
      ];
      const seen: string[] = [];
      const execute = vi.fn(async (input: { intentId: string }) => {
        seen.push(input.intentId);
        if (input.intentId === INTENT_B) {
          return {
            ok: false,
            code: "TRANSPORT_ERROR",
            message: onboardingInviteExecutionMessage("TRANSPORT_ERROR"),
          } satisfies OnboardingInviteExecutionResult;
        }
        return {
          ok: true,
          outcome: outcome(input.intentId, "success"),
        } satisfies OnboardingInviteExecutionResult;
      });

      const collected: OnboardingInviteIntentOutcome[] = [];
      const failures: string[] = [];
      const status = await runInvitationExecutionSequence({
        organizationId: ORG,
        intents,
        outcomes: [],
        execute: execute as never,
        shouldAbort: () => false,
        onOutcome: (item) => collected.push(item),
        onFailure: (message) => failures.push(message),
      });

      expect(status).toBe("stopped");
      expect(seen).toEqual([INTENT_A, INTENT_B]);
      expect(collected).toHaveLength(1);
      expect(failures).toEqual([
        onboardingInviteExecutionMessage("TRANSPORT_ERROR"),
      ]);
    });

    it("skips already-terminal intents, including a refused frozen intent", async () => {
      const intents = [
        frozenIntent(INTENT_A),
        frozenIntent(INTENT_B),
        frozenIntent(INTENT_C),
      ];
      const execute = vi.fn(async (input: { intentId: string }) => ({
        ok: true as const,
        outcome: outcome(input.intentId, "success"),
      }));
      await runInvitationExecutionSequence({
        organizationId: ORG,
        intents,
        outcomes: [
          outcome(INTENT_A, "success"),
          outcome(INTENT_B, "invalid_input"),
        ],
        execute: execute as never,
        shouldAbort: () => false,
        onOutcome: () => undefined,
        onFailure: () => undefined,
      });
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute).toHaveBeenCalledWith({
        organizationId: ORG,
        intentId: INTENT_C,
      });
    });

    it("does not continue when stopped is set", () => {
      expect(
        nextExecutableIntentId(
          [frozenIntent(INTENT_A), frozenIntent(INTENT_B)],
          outcomesByIntentId([]),
          true,
        ),
      ).toBeNull();
    });

    it("classifies SQL retryable and historical codes as sequence stops, not terminal skips", () => {
      expect([...TERMINAL_INVITATION_RESULT_CODES]).toEqual([
        "success",
        "invite_already_pending",
        "already_member",
        "existing_membership_requires_admin_action",
        "invalid_input",
      ]);
      expect([...MATERIAL_SEQUENCE_STOP_INVITATION_RESULT_CODES]).toEqual([
        "invitation_proof_lost",
        "forbidden",
        "rate_limited",
        "unexpected",
        "transport_error",
      ]);
      expect(TERMINAL_INVITATION_RESULT_CODES).not.toContain("forbidden");
      expect(isTerminalInvitationResultCode("forbidden")).toBe(false);
      expect(isRetryableInvitationResultCode("forbidden")).toBe(true);
      expect(isMaterialSequenceStopInvitationResultCode("forbidden")).toBe(
        true,
      );
      expect(isRetryableInvitationResultCode("not_attempted")).toBe(true);
      expect(
        isMaterialSequenceStopInvitationResultCode("not_attempted"),
      ).toBe(false);
    });

    it("does not skip forbidden as a proven terminal result", () => {
      expect(
        nextExecutableIntentId(
          [frozenIntent(INTENT_A), frozenIntent(INTENT_B)],
          outcomesByIntentId([outcome(INTENT_A, "forbidden")]),
          false,
        ),
      ).toBe(INTENT_A);
    });
  });

  describe("user-controlled retry after material stop", () => {
    const MATERIAL_STOP_CODES = [
      "rate_limited",
      "invitation_proof_lost",
      "unexpected",
      "transport_error",
      "forbidden",
    ] as const;

    it.each([...MATERIAL_STOP_CODES])(
      "executes a %s result once and does not continue or reselect the same intent",
      async (resultCode) => {
        const intents = [
          frozenIntent(INTENT_A, "one@example.test"),
          frozenIntent(INTENT_B, "two@example.test", "staff"),
          frozenIntent(INTENT_C, "three@example.test", "viewer"),
        ];
        const execute = vi.fn(async (input: { intentId: string }) => {
          expect(execute.mock.calls.length).toBeLessThanOrEqual(1);
          return {
            ok: true as const,
            outcome: outcome(input.intentId, resultCode),
          };
        });
        const collected: OnboardingInviteIntentOutcome[] = [];
        const status = await runInvitationExecutionSequence({
          organizationId: ORG,
          intents,
          outcomes: [],
          execute: execute as never,
          shouldAbort: () => false,
          onOutcome: (item) => collected.push(item),
          onFailure: () => {
            throw new Error("material stop must not be treated as ok:false");
          },
        });

        expect(status).toBe("stopped");
        expect(execute).toHaveBeenCalledTimes(1);
        expect(execute).toHaveBeenCalledWith({
          organizationId: ORG,
          intentId: INTENT_A,
        });
        expect(collected).toEqual([outcome(INTENT_A, resultCode)]);
        expect(
          nextExecutableIntentId(
            intents,
            outcomesByIntentId(collected),
            false,
          ),
        ).toBe(INTENT_A);
      },
    );

    it("stops on forbidden and does not skip to a later intent", async () => {
      const intents = [
        frozenIntent(INTENT_A, "one@example.test"),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
      ];
      const execute = vi.fn(async (input: { intentId: string }) => ({
        ok: true as const,
        outcome: outcome(input.intentId, "forbidden"),
      }));
      const collected: OnboardingInviteIntentOutcome[] = [];
      const status = await runInvitationExecutionSequence({
        organizationId: ORG,
        intents,
        outcomes: [],
        execute: execute as never,
        shouldAbort: () => false,
        onOutcome: (item) => collected.push(item),
        onFailure: () => undefined,
      });

      expect(status).toBe("stopped");
      expect(execute).toHaveBeenCalledTimes(1);
      expect(execute.mock.calls.map((call) => call[0].intentId)).toEqual([
        INTENT_A,
      ]);
      expect(collected.map((item) => item.resultCode)).toEqual(["forbidden"]);
    });

    it("does not automatically execute again after a retryable stop until a new user activation", async () => {
      const intents = [
        frozenIntent(INTENT_A),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
      ];
      const execute = vi.fn(async (input: { intentId: string }) => ({
        ok: true as const,
        outcome: outcome(input.intentId, "rate_limited"),
      }));

      const first = await runInvitationExecutionSequence({
        organizationId: ORG,
        intents,
        outcomes: [],
        execute: execute as never,
        shouldAbort: () => false,
        onOutcome: () => undefined,
        onFailure: () => undefined,
      });
      expect(first).toBe("stopped");
      expect(execute).toHaveBeenCalledTimes(1);

      const second = await runInvitationExecutionSequence({
        organizationId: ORG,
        intents,
        outcomes: [outcome(INTENT_A, "rate_limited")],
        execute: execute as never,
        shouldAbort: () => false,
        onOutcome: () => undefined,
        onFailure: () => undefined,
      });
      expect(second).toBe("stopped");
      expect(execute).toHaveBeenCalledTimes(2);
      expect(execute.mock.calls.map((call) => call[0].intentId)).toEqual([
        INTENT_A,
        INTENT_A,
      ]);
    });

    it("preserves an earlier terminal success and does not execute a later intent after a material stop", async () => {
      const intents = [
        frozenIntent(INTENT_A, "one@example.test"),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
        frozenIntent(INTENT_C, "three@example.test", "viewer"),
      ];
      const execute = vi.fn(async (input: { intentId: string }) => ({
        ok: true as const,
        outcome: outcome(
          input.intentId,
          input.intentId === INTENT_A ? "success" : "rate_limited",
        ),
      }));
      const collected: OnboardingInviteIntentOutcome[] = [];
      const status = await runInvitationExecutionSequence({
        organizationId: ORG,
        intents,
        outcomes: [],
        execute: execute as never,
        shouldAbort: () => false,
        onOutcome: (item) => collected.push(item),
        onFailure: () => undefined,
      });

      expect(status).toBe("stopped");
      expect(execute).toHaveBeenCalledTimes(2);
      expect(execute.mock.calls.map((call) => call[0].intentId)).toEqual([
        INTENT_A,
        INTENT_B,
      ]);
      expect(collected.map((item) => item.resultCode)).toEqual([
        "success",
        "rate_limited",
      ]);
      expect(
        nextExecutableIntentId(
          intents,
          outcomesByIntentId(collected),
          false,
        ),
      ).toBe(INTENT_B);
    });

    it("fails if retryable success continues, the same intent executes twice, or forbidden is treated as terminal", async () => {
      const intents = [
        frozenIntent(INTENT_A),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
      ];
      const execute = vi.fn(async (input: { intentId: string }) => {
        if (execute.mock.calls.length > 1) {
          throw new Error(
            `automatic retry loop selected ${input.intentId} after a retryable result`,
          );
        }
        return {
          ok: true as const,
          outcome: outcome(input.intentId, "rate_limited"),
        };
      });
      await expect(
        runInvitationExecutionSequence({
          organizationId: ORG,
          intents,
          outcomes: [],
          execute: execute as never,
          shouldAbort: () => false,
          onOutcome: () => undefined,
          onFailure: () => undefined,
        }),
      ).resolves.toBe("stopped");
      expect(execute).toHaveBeenCalledTimes(1);

      expect(isTerminalInvitationResultCode("forbidden")).toBe(false);
      expect(
        nextExecutableIntentId(
          intents,
          outcomesByIntentId([outcome(INTENT_A, "forbidden")]),
          false,
        ),
      ).toBe(INTENT_A);
      const terminalBlock = domainSource.slice(
        domainSource.indexOf("export const TERMINAL_INVITATION_RESULT_CODES"),
        domainSource.indexOf(
          "export const MATERIAL_SEQUENCE_STOP_INVITATION_RESULT_CODES",
        ),
      );
      expect(terminalBlock).toContain("invalid_input");
      expect(terminalBlock).not.toContain("forbidden");
    });

    it("clears busy state and exposes Retry after a rate_limited Creating activation", async () => {
      executeActionMock.mockResolvedValue({
        ok: true,
        outcome: {
          ...outcome(INTENT_A, "rate_limited"),
          emailNormalized: "one@example.test",
          evidenceKind: "rate_limited",
          runStatus: "invite_partial",
        },
      });
      const props = creatingProps(
        [
          frozenIntent(INTENT_A, "one@example.test"),
          frozenIntent(INTENT_B, "two@example.test", "staff"),
        ],
        [],
      );
      let tree = renderCreating(props);
      await clickAsync(findClickable(tree, "Create invitations"));
      await settlePendingWork();
      tree = renderCreating(props);
      const html = renderToStaticMarkup(tree);

      expect(executeActionMock).toHaveBeenCalledTimes(1);
      expect(executeActionMock).toHaveBeenCalledWith({
        organizationId: ORG,
        intentId: INTENT_A,
      });
      expect(html).toContain("Invitation creation is temporarily limited.");
      expect(html).toContain("This teammate has not been invited yet.");
      expect(html).toContain("Some invitations need attention");
      expect(html).not.toContain("Creating invitations");
      expect(html).not.toContain("Enter ZyntixAI");
      expect(html).not.toContain("100%");
      expect(clickableLabels(tree).join(" ")).toContain("Retry");
      expect(clickableLabels(tree).join(" ")).toContain("Refresh status");
      expect(
        (findClickable(tree, "Retry").props as { disabled?: boolean })
          .disabled,
      ).toBe(false);
    });

    it("requires a new Retry gesture after rate_limited and executes that retry at most once", async () => {
      executeActionMock.mockImplementation(
        async (input: { intentId: string }) => ({
          ok: true,
          outcome: {
            ...outcome(input.intentId, "rate_limited"),
            emailNormalized: "one@example.test",
            evidenceKind: "rate_limited",
            runStatus: "invite_partial",
          },
        }),
      );
      const props = creatingProps([
        frozenIntent(INTENT_A, "one@example.test"),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
      ]);
      let tree = renderCreating(props);
      await clickAsync(findClickable(tree, "Create invitations"));
      await settlePendingWork();
      expect(executeActionMock).toHaveBeenCalledTimes(1);

      tree = renderCreating(props);
      await clickAsync(findClickable(tree, "Retry"));
      await settlePendingWork();
      tree = renderCreating(props);

      expect(executeActionMock).toHaveBeenCalledTimes(2);
      expect(
        executeActionMock.mock.calls.map(
          (call) => (call[0] as { intentId: string }).intentId,
        ),
      ).toEqual([INTENT_A, INTENT_A]);
      expect(renderToStaticMarkup(tree)).toContain(
        "Invitation creation is temporarily limited.",
      );
      expect(renderToStaticMarkup(tree)).not.toContain("Creating invitations");
    });

    it("presents a safe non-leaking recovery message for forbidden and keeps Retry reachable", async () => {
      executeActionMock.mockResolvedValue({
        ok: true,
        outcome: {
          ...outcome(INTENT_A, "forbidden"),
          emailNormalized: "one@example.test",
          runStatus: "invite_partial",
        },
      });
      const props = creatingProps([
        frozenIntent(INTENT_A, "one@example.test"),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
      ]);
      let tree = renderCreating(props);
      await clickAsync(findClickable(tree, "Create invitations"));
      await settlePendingWork();
      tree = renderCreating(props);
      const html = renderToStaticMarkup(tree);

      expect(executeActionMock).toHaveBeenCalledTimes(1);
      expect(html).toContain(
        "You no longer have permission to invite this teammate.",
      );
      expect(html).not.toContain("permission denied");
      expect(html).not.toContain("P0001");
      expect(html).not.toContain("raw_token");
      expect(html).toContain("This teammate has not been invited yet.");
      expect(clickableLabels(tree).join(" ")).toContain("Retry");
      expect(html).not.toContain("Enter ZyntixAI");
    });

    it("keeps the earlier success visible after a later rate_limited stop", async () => {
      executeActionMock.mockImplementation(
        async (input: { intentId: string }) => ({
          ok: true,
          outcome: {
            ...outcome(
              input.intentId,
              input.intentId === INTENT_A ? "success" : "rate_limited",
            ),
            emailNormalized:
              input.intentId === INTENT_A
                ? "one@example.test"
                : "two@example.test",
            evidenceKind:
              input.intentId === INTENT_A
                ? "created_invitation"
                : "rate_limited",
            runStatus:
              input.intentId === INTENT_A ? "inviting" : "invite_partial",
          },
        }),
      );
      const props = creatingProps([
        frozenIntent(INTENT_A, "one@example.test"),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
        frozenIntent(INTENT_C, "three@example.test", "viewer"),
      ]);
      let tree = renderCreating(props);
      await clickAsync(findClickable(tree, "Create invitations"));
      await settlePendingWork();
      tree = renderCreating(props);
      const html = renderToStaticMarkup(tree);

      expect(executeActionMock).toHaveBeenCalledTimes(2);
      expect(
        executeActionMock.mock.calls.map(
          (call) => (call[0] as { intentId: string }).intentId,
        ),
      ).toEqual([INTENT_A, INTENT_B]);
      expect(html).toContain("An invitation was created for this teammate.");
      expect(html).toContain("Invitation creation is temporarily limited.");
      expect(html).toContain("This teammate has not been invited yet.");
      expect(html).not.toContain("Creating invitations");
      expect(clickableLabels(tree).join(" ")).toContain("Retry");
    });
  });

  describe("Creating-state rendering", () => {
    it("shows an honest not-started surface without Ready or cutover copy", () => {
      const html = renderToStaticMarkup(
        <CreatingStatusCopy
          state="not_started"
          runStatus="setup_ready"
          resolvedCount={0}
          totalCount={2}
        />,
      );
      expect(html).toContain("Invitations not created yet");
      expect(html).not.toContain("100%");
      for (const forbidden of FORBIDDEN_READY_MARKERS) {
        expect(html).not.toContain(forbidden);
      }
    });

    it("states mixed partial outcomes in plain language", () => {
      const html = renderToStaticMarkup(
        renderCreating(
          creatingProps(
            [
              frozenIntent(INTENT_A, "one@example.test"),
              frozenIntent(INTENT_B, "two@example.test", "staff"),
            ],
            [
              {
                ...outcome(INTENT_A, "success"),
                emailNormalized: "one@example.test",
                evidenceKind: "created_invitation",
              },
              {
                ...outcome(
                  INTENT_B,
                  "existing_membership_requires_admin_action",
                ),
                emailNormalized: "two@example.test",
                targetRole: "staff",
                evidenceKind: "membership_collision",
                runStatus: "invite_partial",
              },
            ],
          ),
        ),
      );
      expect(html).toContain("one@example.test");
      expect(html).toContain("two@example.test");
      expect(html).toContain("An invitation was created for this teammate.");
      expect(html).toContain(
        "This person has an existing membership that needs an owner to review.",
      );
      expect(html).not.toContain("delivered");
      expect(html).not.toContain("Enter ZyntixAI");
    });

    it("presents invitation_proof_lost as non-terminal and retryable", () => {
      const tree = renderCreating(
        creatingProps(
          [frozenIntent(INTENT_A)],
          [
            {
              ...outcome(INTENT_A, "invitation_proof_lost"),
              evidenceKind: "historical_invitation",
              runStatus: "invite_partial",
            },
          ],
        ),
      );
      const html = renderToStaticMarkup(tree);
      expect(html).toContain("no longer current");
      expect(clickableLabels(tree).join(" ")).toContain("Retry");
      expect(isRetryableInvitationResultCode("invitation_proof_lost")).toBe(
        true,
      );
      expect(isTerminalInvitationResultCode("invitation_proof_lost")).toBe(
        false,
      );
    });

    it("renders the zero-intent empty state without claiming product entry", () => {
      const html = renderToStaticMarkup(
        renderCreating(creatingProps([], [])),
      );
      expect(html).toContain("No teammates were prepared to invite.");
      expect(html).toContain("The next setup step is not available yet.");
      expect(html).not.toContain("Enter ZyntixAI");
      expect(html).not.toContain("Setup complete");
    });

    it("uses semantic tokens rather than a hard-coded brand accent", () => {
      expect(cssSource).toContain("var(--text-color");
      expect(cssSource).not.toContain("33438F");
      expect(cssSource).not.toContain("Inter");
    });
  });

  describe("component-local single-flight", () => {
    it("admits exactly one execute while the first is pending", async () => {
      const pending = deferred<OnboardingInviteExecutionResult>();
      executeActionMock.mockReturnValue(pending.promise);
      const props = creatingProps([
        frozenIntent(INTENT_A),
        frozenIntent(INTENT_B, "two@example.test", "staff"),
      ]);
      let tree = renderCreating(props);
      const first = clickAsync(findClickable(tree, "Create invitations"));
      await settlePendingWork();
      expect(executeActionMock).toHaveBeenCalledTimes(1);

      tree = renderCreating(props);
      const pendingControl = findClickable(tree, "Creating invitations…");
      expect((pendingControl.props as { disabled?: boolean }).disabled).toBe(
        true,
      );
      await clickAsync(pendingControl);
      await settlePendingWork();
      expect(executeActionMock).toHaveBeenCalledTimes(1);

      pending.resolve({
        ok: true,
        outcome: outcome(INTENT_A, "success"),
      });
      await first;
    });
  });

  describe("P1-C and P1-D exclusions", () => {
    const p1bSources = [
      domainSource,
      serverSource,
      actionSource,
      componentSource,
      pageSource,
    ];

    it.each([
      [
        "invitation result listing",
        "list_organization_onboarding_invitation_results",
      ],
      ["authoritative completion", "complete_organization_v2_onboarding"],
      ["completion action", "completeV2OnboardingAction"],
      ["invitation creation RPC", "create_organization_invitation"],
      ["invitation resend", "resend_organization_invitation"],
      ["invitation acceptance", "accept_organization_invitation"],
      ["delivery orchestration", "orchestrateInvitationDelivery"],
    ])("introduces no %s call site", (_name, symbol) => {
      for (const source of p1bSources) {
        expect(source).not.toContain(symbol);
      }
    });

    it("does not render Ready or product cutover on the Creating surface", () => {
      expect(componentSource).not.toContain("Enter ZyntixAI");
      expect(componentSource).not.toContain('currentStep="ready"');
      expect(componentSource).not.toContain("buildProductDestination");
      expect(pageSource).not.toContain("completeV2OnboardingAction");
    });

    it("adds no application lock, queue, retry loop or service-role client", () => {
      for (const source of [serverSource, componentSource, actionSource]) {
        expect(source).not.toContain("setInterval");
        expect(source).not.toContain("advisory");
        expect(source).not.toMatch(/while\s*\(true\)/);
        expect(source).not.toContain("setTimeout");
        expect(source).not.toContain("backoff");
        expect(source).not.toContain("SERVICE_ROLE");
        expect(source).not.toContain("createSupabaseServiceRoleClient");
        expect(source).not.toContain("as any");
      }
      expect(componentSource).toContain("attemptedThisActivation");
      expect(componentSource).toContain(
        "isMaterialSequenceStopInvitationResultCode",
      );
    });

    it("does not write attempt timestamps or reconstruct token hashes", () => {
      expect(serverSource).not.toContain("attempt_count");
      expect(serverSource).not.toContain("last_attempt_at");
      expect(mapperSource).not.toContain("raw_token");
      expect(mapperSource).not.toContain("idempotency_key");
      expect(mapperSource).not.toContain("invitation_id");
    });
  });

  describe("V1 and NULL compatibility", () => {
    it("emits one identical execute call shape regardless of flow version", async () => {
      const observed: unknown[][] = [];
      for (const payload of [
        executePayload(INTENT_A, {
          result: resultRow(INTENT_A, {
            result_code: "success",
            evidence_kind: "created_invitation",
            invitation_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            attempt_count: 1,
            last_attempt_at: "2026-09-10T12:01:00.000Z",
          }),
        }),
        { ok: false, code: "INVALID_LIFECYCLE" },
        { ok: false, code: "INVALID_LIFECYCLE" },
      ]) {
        resolveOrganizationMock.mockResolvedValue(ownerActor());
        const { client, rpc } = supabaseWithRpc({ data: payload });
        await executeOrganizationOnboardingInviteIntent(
          client as never,
          ORG,
          INTENT_A,
        );
        observed.push(rpc.mock.calls[0] as unknown[]);
      }
      expect(observed[1]).toEqual(observed[0]);
      expect(observed[2]).toEqual(observed[0]);
    });
  });

  describe("registration and provisioning non-interference", () => {
    it("does not import registration or provisioning paths", () => {
      for (const source of [
        domainSource,
        serverSource,
        actionSource,
        componentSource,
        pageSource,
      ]) {
        expect(source).not.toContain("complete_owner_self_registration");
        expect(source).not.toContain("/register");
        expect(source).not.toContain("assign_organization_operating_model");
      }
    });
  });

  describe("snapshot recovery", () => {
    it("reconciles each frozen intent and does not list invitation results", async () => {
      const rpc = vi.fn(async (name: string, args: { p_intent_id?: string }) => {
        if (name === "list_organization_onboarding_frozen_team_invite_intents") {
          return {
            data: {
              ok: true,
              code: "OK",
              organization_id: ORG,
              intents: [
                {
                  id: INTENT_A,
                  organization_id: ORG,
                  email_normalized: "one@example.test",
                  role: "admin",
                  revision: 1,
                  created_at: "2026-09-10T12:00:00.000Z",
                  updated_at: "2026-09-10T12:00:00.000Z",
                },
                {
                  id: INTENT_B,
                  organization_id: ORG,
                  email_normalized: "two@example.test",
                  role: "staff",
                  revision: 1,
                  created_at: "2026-09-10T12:01:00.000Z",
                  updated_at: "2026-09-10T12:01:00.000Z",
                },
              ],
            },
            error: null,
          };
        }
        return {
          data: {
            ok: true,
            code: "OK",
            result: resultRow(args.p_intent_id ?? INTENT_A, {
              intent_id: args.p_intent_id,
              email_normalized:
                args.p_intent_id === INTENT_B
                  ? "two@example.test"
                  : "one@example.test",
              target_role: args.p_intent_id === INTENT_B ? "staff" : "admin",
              result_code:
                args.p_intent_id === INTENT_B
                  ? "already_member"
                  : "not_attempted",
              evidence_kind:
                args.p_intent_id === INTENT_B ? "active_membership" : "none",
              attempt_count: args.p_intent_id === INTENT_B ? 1 : 0,
              last_attempt_at:
                args.p_intent_id === INTENT_B
                  ? "2026-09-10T12:02:00.000Z"
                  : null,
            }),
            run_status:
              args.p_intent_id === INTENT_B ? "invite_partial" : "setup_ready",
          },
          error: null,
        };
      });
      resolveOrganizationMock.mockResolvedValue(ownerActor());
      const result = await loadOnboardingCreatingSnapshot(
        { rpc, from: vi.fn() } as never,
        ORG,
      );
      expect(rpc.mock.calls.map((call) => call[0])).toEqual([
        "list_organization_onboarding_frozen_team_invite_intents",
        "reconcile_organization_onboarding_invite_intent",
        "reconcile_organization_onboarding_invite_intent",
      ]);
      expect(rpc.mock.calls.map((call) => call[0])).not.toContain(
        "list_organization_onboarding_invitation_results",
      );
      expect(result).toMatchObject({
        ok: true,
        intents: [{ id: INTENT_A }, { id: INTENT_B }],
        outcomes: [
          { intentId: INTENT_A, resultCode: "not_attempted" },
          { intentId: INTENT_B, resultCode: "already_member" },
        ],
      });
    });
  });

  describe("helpers", () => {
    it("counts only genuinely resolved outcomes", () => {
      expect(
        resolvedOutcomeCount([
          "not_attempted",
          "success",
          "already_member",
        ]),
      ).toBe(2);
      expect(
        resolveCreatingSurfaceState(
          [frozenIntent(INTENT_A)],
          [outcome(INTENT_A, "success")],
          false,
          false,
        ),
      ).toBe("awaiting_next_step");
      expect(creatingRunStatusMessage("ready_for_cutover")).toContain(
        "next setup step is not available yet",
      );
      expect(creatingRunStatusMessage("ready_for_cutover")).not.toContain(
        "Enter ZyntixAI",
      );
      const merged = mergeOutcome(
        [outcome(INTENT_A, "not_attempted")],
        outcome(INTENT_A, "success"),
      );
      expect(merged).toHaveLength(1);
      expect(merged[0]?.resultCode).toBe("success");
    });
  });

  describe("accessibility contracts", () => {
    it("uses semantic headings, real buttons, live status and alert errors", () => {
      expect(componentSource).toContain("<h1");
      expect(componentSource).toContain("<h2");
      expect(componentSource).toContain('role="status"');
      expect(componentSource).toContain('aria-live="polite"');
      expect(componentSource).toContain('role="alert"');
      expect(componentSource).toContain("Create invitations");
      expect(cssSource).toContain("@media (max-width: 767px)");
      expect(cssSource).toContain("@media (min-width: 768px)");
      expect(cssSource).toContain("prefers-reduced-motion");
      const html = renderToStaticMarkup(
        renderCreating(creatingProps([frozenIntent(INTENT_A)])),
      );
      expect(html).toContain("<h1");
      expect(html).toContain("<button");
      expect(html).toContain('role="status"');
      expect(OnboardingShell).toEqual(expect.any(Function));
      expect(Surface).toEqual(expect.any(Function));
      expect(Button).toBeTruthy();
    });
  });
});
