import React, { type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TeamInviteIntent } from "@/features/onboarding/domain/team-invite-intents";

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
        slots[index] = {
          kind: "ref",
          value: { current: initialValue },
        };
      }
      return (slots[index] as Extract<HookSlot, { kind: "ref" }>).value;
    },
    useCallback(callback: unknown, dependencies: readonly unknown[]) {
      const index = cursor++;
      const existing = slots[index] as
        | Extract<HookSlot, { kind: "memo" }>
        | undefined;
      if (!existing || !dependenciesEqual(existing.dependencies, dependencies)) {
        slots[index] = {
          kind: "memo",
          value: callback,
          dependencies,
        };
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
        slots[index] = { kind: "id", value: `team-test-${index}` };
      }
      return (slots[index] as Extract<HookSlot, { kind: "id" }>).value;
    },
  };
});

const routerRefreshMock = vi.hoisted(() => vi.fn());
const createActionMock = vi.hoisted(() => vi.fn());
const deleteActionMock = vi.hoisted(() => vi.fn());
const listActionMock = vi.hoisted(() => vi.fn());
const updateActionMock = vi.hoisted(() => vi.fn());

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/features/onboarding/actions/team-invite-intent-actions", () => ({
  createTeamInviteIntentAction: createActionMock,
  deleteTeamInviteIntentAction: deleteActionMock,
  listTeamInviteIntentsAction: listActionMock,
  updateTeamInviteIntentAction: updateActionMock,
}));

import {
  TeamFoundation,
  TeamReview,
} from "@/features/onboarding/ui/team-foundation";

const ORG = "11111111-1111-4111-8111-111111111111";
const A_ID = "22222222-2222-4222-8222-222222222222";
const B_ID = "33333333-3333-4333-8333-333333333333";

function intent(
  id: string,
  email: string,
  role: "admin" | "staff" | "viewer",
  revision: number,
): TeamInviteIntent {
  return {
    id,
    organizationId: ORG,
    emailNormalized: email,
    role,
    revision,
    createdAt: "2026-09-08T00:00:00Z",
    updatedAt: `2026-09-08T00:0${revision}:00Z`,
  };
}

type TeamProps = {
  membershipRole: "owner";
  organizationId: string;
  initialIntents: TeamInviteIntent[];
  backHref: string;
};

function renderTeam(props: TeamProps): ReactElement {
  let tree: ReactElement | null = null;
  for (let pass = 0; pass < 10; pass += 1) {
    hookRuntime.beginRender();
    tree = TeamFoundation(props);
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
  const props = node.props as {
    children?: ReactNode;
    actions?: ReactNode;
  };
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

function findByAriaLabel(tree: ReactElement, label: string) {
  return findElement(
    tree,
    (element) =>
      (element.props as { "aria-label"?: string })["aria-label"] === label,
  );
}

function findEditForm(tree: ReactElement, email: string) {
  return findByAriaLabel(tree, `Edit ${email}`);
}

function editFields(form: ReactElement) {
  const descendants = collectElements(form);
  return {
    input: descendants.find((element) => element.type === "input")!,
    select: descendants.find((element) => element.type === "select")!,
  };
}

function addForm(tree: ReactElement) {
  return findElement(
    tree,
    (element) =>
      element.type === "form" &&
      !(element.props as { "aria-label"?: string })["aria-label"],
  );
}

function formFields(form: ReactElement) {
  const descendants = collectElements(form);
  return {
    input: descendants.find((element) => element.type === "input")!,
    select: descendants.find((element) => element.type === "select")!,
  };
}

async function submit(form: ReactElement) {
  await (
    form.props as {
      onSubmit: (event: { preventDefault(): void }) => Promise<void>;
    }
  ).onSubmit({ preventDefault() {} });
}

function click(element: ReactElement) {
  (element.props as { onClick: () => void }).onClick();
}

async function clickAsync(element: ReactElement) {
  await (
    element.props as { onClick: () => void | Promise<void> }
  ).onClick();
}

function change(element: ReactElement, value: string) {
  (
    element.props as {
      onChange: (event: { target: { value: string } }) => void;
    }
  ).onChange({ target: { value } });
}

function defaultProps(initialIntents: TeamInviteIntent[]): TeamProps {
  return {
    membershipRole: "owner",
    organizationId: ORG,
    initialIntents,
    backHref: `/onboarding/workspace-confirmation?org=${ORG}`,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function findClickable(tree: ReactElement, text: string) {
  return findElement(
    tree,
    (element) =>
      typeof (element.props as { onClick?: unknown }).onClick ===
        "function" && elementText(element).includes(text),
  );
}

function strongCount(tree: ReactElement, text: string) {
  return collectElements(tree).filter(
    (element) =>
      element.type === "strong" && elementText(element) === text,
  ).length;
}

function alertText(tree: ReactElement) {
  const alert = collectElements(tree).find(
    (element) => (element.props as { role?: string }).role === "alert",
  );
  return alert ? elementText(alert) : "";
}

function reviewIntents(tree: ReactElement) {
  const review = collectElements(tree).find(
    (element) => element.type === TeamReview,
  );
  return ((review?.props as { intents?: TeamInviteIntent[] } | undefined)
    ?.intents ?? []) as TeamInviteIntent[];
}

describe("TeamFoundation component concurrency reconciliation", () => {
  beforeEach(() => {
    hookRuntime.reset();
    vi.clearAllMocks();
  });

  it("runs the stale-update flow through the component and requires explicit re-edit", async () => {
    const original = intent(
      A_ID,
      "original@example.test",
      "staff",
      7,
    );
    const serverNew = intent(
      A_ID,
      "server-new@example.test",
      "admin",
      8,
    );
    updateActionMock
      .mockResolvedValueOnce({
        ok: false,
        code: "STALE_REVISION",
        message: "This teammate was updated elsewhere.",
      })
      .mockResolvedValueOnce({ ok: true, intent: { ...serverNew, revision: 9 } });
    listActionMock.mockResolvedValue({
      ok: true,
      intents: [serverNew],
    });

    const props = defaultProps([original]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit original@example.test"));
    tree = renderTeam(props);
    let form = findEditForm(tree, "original@example.test");
    let fields = editFields(form);
    change(fields.input, "stale-local@example.test");
    change(fields.select, "viewer");
    tree = renderTeam(props);

    await submit(findEditForm(tree, "original@example.test"));
    tree = renderTeam(props);

    expect(updateActionMock).toHaveBeenCalledTimes(1);
    expect(listActionMock).toHaveBeenCalledTimes(1);
    expect(elementText(tree)).toContain("server-new@example.test");
    expect(elementText(tree)).toContain("Admin");
    expect(elementText(tree)).toContain(
      "This teammate was updated elsewhere. We’ve loaded the latest details. Review them before editing again.",
    );
    expect(
      collectElements(tree).some(
        (element) =>
          element.type === "input" &&
          (element.props as { value?: string }).value ===
            "stale-local@example.test",
      ),
    ).toBe(false);
    expect(
      collectElements(tree).some(
        (element) =>
          (element.props as { "aria-label"?: string })["aria-label"]?.startsWith(
            "Save changes",
          ),
      ),
    ).toBe(false);

    click(findByAriaLabel(tree, "Edit server-new@example.test"));
    tree = renderTeam(props);
    form = findEditForm(tree, "server-new@example.test");
    fields = editFields(form);
    expect((fields.input.props as { value: string }).value).toBe(
      "server-new@example.test",
    );
    expect((fields.select.props as { value: string }).value).toBe("admin");

    await submit(form);
    expect(updateActionMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        intentId: A_ID,
        expectedRevision: 8,
        email: "server-new@example.test",
        role: "admin",
      }),
    );
  });

  it("preserves a valid edit across a successful create and same-revision authority refresh", async () => {
    const original = intent(
      A_ID,
      "original@example.test",
      "staff",
      7,
    );
    const created = intent(B_ID, "created@example.test", "viewer", 1);
    createActionMock.mockResolvedValue({ ok: true, intent: created });
    listActionMock.mockResolvedValue({
      ok: true,
      intents: [original, created],
    });

    let props = defaultProps([original]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit original@example.test"));
    tree = renderTeam(props);
    change(
      editFields(findEditForm(tree, "original@example.test")).input,
      "unsaved-local@example.test",
    );
    tree = renderTeam(props);

    const createForm = addForm(tree);
    const createFields = formFields(createForm);
    change(createFields.input, "created@example.test");
    change(createFields.select, "viewer");
    tree = renderTeam(props);
    await submit(addForm(tree));
    tree = renderTeam(props);
    expect(createActionMock).toHaveBeenCalledTimes(1);
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);

    props = defaultProps([original, created]);
    tree = renderTeam(props);
    const preservedForm = findEditForm(tree, "original@example.test");
    const preserved = editFields(preservedForm);
    expect((preserved.input.props as { value: string }).value).toBe(
      "unsaved-local@example.test",
    );
    expect(elementText(tree)).not.toContain("updated elsewhere");

    updateActionMock.mockResolvedValue({
      ok: true,
      intent: {
        ...original,
        emailNormalized: "unsaved-local@example.test",
        revision: 8,
      },
    });
    await submit(preservedForm);
    expect(updateActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intentId: A_ID,
        expectedRevision: 7,
        email: "unsaved-local@example.test",
      }),
    );
  });

  it("invalidates an edit when a cross-row create refresh carries a newer revision", async () => {
    const original = intent(
      A_ID,
      "original@example.test",
      "staff",
      7,
    );
    const created = intent(B_ID, "created@example.test", "viewer", 1);
    const serverNew = intent(
      A_ID,
      "server-new@example.test",
      "admin",
      8,
    );
    createActionMock.mockResolvedValue({ ok: true, intent: created });
    listActionMock.mockResolvedValue({
      ok: true,
      intents: [original, created],
    });

    let props = defaultProps([original]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit original@example.test"));
    tree = renderTeam(props);
    change(
      editFields(findEditForm(tree, "original@example.test")).input,
      "stale-local@example.test",
    );
    tree = renderTeam(props);
    const createFields = formFields(addForm(tree));
    change(createFields.input, "created@example.test");
    change(createFields.select, "viewer");
    tree = renderTeam(props);
    await submit(addForm(tree));
    renderTeam(props);

    props = defaultProps([serverNew, created]);
    tree = renderTeam(props);
    expect(elementText(tree)).toContain("server-new@example.test");
    expect(elementText(tree)).toContain("Admin");
    expect(elementText(tree)).toContain("updated elsewhere");
    expect(
      collectElements(tree).some(
        (element) => element.type === "form" && elementText(element).includes("Save"),
      ),
    ).toBe(false);
  });

  it("routes normal cross-row delete refresh through the same invalidation policy", async () => {
    const original = intent(
      A_ID,
      "original@example.test",
      "staff",
      7,
    );
    const other = intent(B_ID, "other@example.test", "viewer", 2);
    const serverNew = intent(
      A_ID,
      "server-new@example.test",
      "admin",
      8,
    );
    deleteActionMock.mockResolvedValue({
      ok: true,
      intentId: B_ID,
      deletedRevision: 2,
    });
    listActionMock.mockResolvedValue({
      ok: true,
      intents: [original],
    });

    let props = defaultProps([original, other]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit original@example.test"));
    tree = renderTeam(props);
    change(
      editFields(findEditForm(tree, "original@example.test")).input,
      "stale-local@example.test",
    );
    tree = renderTeam(props);
    await clickAsync(findByAriaLabel(tree, "Remove other@example.test"));
    tree = renderTeam(props);
    expect(deleteActionMock).toHaveBeenCalledTimes(1);
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);

    props = defaultProps([serverNew]);
    tree = renderTeam(props);
    expect(elementText(tree)).toContain("server-new@example.test");
    expect(elementText(tree)).toContain("updated elsewhere");
    expect(
      collectElements(tree).some((element) => element.type === "form"),
    ).toBe(true);
    expect(
      collectElements(tree).some(
        (element) =>
          (element.props as { "aria-label"?: string })["aria-label"] ===
          "Edit original@example.test",
      ),
    ).toBe(false);
  });

  it("closes an editor when the edited row disappears from authoritative props", () => {
    const original = intent(
      A_ID,
      "original@example.test",
      "staff",
      7,
    );
    let props = defaultProps([original]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit original@example.test"));
    tree = renderTeam(props);
    change(
      editFields(findEditForm(tree, "original@example.test")).input,
      "unsaved-local@example.test",
    );
    renderTeam(props);

    props = defaultProps([]);
    tree = renderTeam(props);
    expect(elementText(tree)).toContain(
      "This teammate is no longer in the current team setup. We’ve loaded the latest version.",
    );
    expect(elementText(tree)).toContain(
      "No teammates are currently configured to be invited.",
    );
    expect(
      collectElements(tree).some(
        (element) =>
          (element.props as { "aria-label"?: string })["aria-label"]?.startsWith(
            "Save changes",
          ),
      ),
    ).toBe(false);
  });

  it("accepts refreshed authority normally when no editor is active", () => {
    const original = intent(
      A_ID,
      "original@example.test",
      "staff",
      7,
    );
    const serverNew = intent(
      A_ID,
      "server-new@example.test",
      "admin",
      8,
    );
    let props = defaultProps([original]);
    renderTeam(props);

    props = defaultProps([serverNew]);
    const tree = renderTeam(props);
    expect(elementText(tree)).toContain("server-new@example.test");
    expect(elementText(tree)).toContain("Admin");
    expect(elementText(tree)).not.toContain("updated elsewhere");
  });

  it("preserves same-revision editor A when a stale DELETE for B is reconciled", async () => {
    const rowA = intent(A_ID, "a@example.test", "staff", 7);
    const rowB = intent(B_ID, "b@example.test", "viewer", 2);
    const latestB = intent(B_ID, "b@example.test", "admin", 3);
    const deleteWait = deferred<{
      ok: false;
      code: "STALE_REVISION";
      message: string;
    }>();
    const listWait = deferred<{
      ok: true;
      intents: TeamInviteIntent[];
    }>();
    deleteActionMock.mockReturnValueOnce(deleteWait.promise);
    listActionMock.mockReturnValueOnce(listWait.promise);

    const props = defaultProps([rowA, rowB]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit a@example.test"));
    tree = renderTeam(props);
    change(
      editFields(findEditForm(tree, "a@example.test")).input,
      "local-a@example.test",
    );
    tree = renderTeam(props);

    const removePromise = clickAsync(
      findByAriaLabel(tree, "Remove b@example.test"),
    );
    deleteWait.resolve({
      ok: false,
      code: "STALE_REVISION",
      message:
        "This teammate was updated elsewhere. Review the latest details before saving again.",
    });
    await Promise.resolve();
    listWait.resolve({ ok: true, intents: [rowA, latestB] });
    await removePromise;
    tree = renderTeam(props);

    expect(deleteActionMock).toHaveBeenCalledTimes(1);
    expect(listActionMock).toHaveBeenCalledTimes(1);
    const form = findEditForm(tree, "a@example.test");
    expect((editFields(form).input.props as { value: string }).value).toBe(
      "local-a@example.test",
    );
    expect(
      (
        findByAriaLabel(tree, "Save changes for a@example.test").props as {
          disabled?: boolean;
        }
      ).disabled,
    ).toBeFalsy();
    expect(alertText(tree)).not.toContain("updated elsewhere");

    updateActionMock.mockResolvedValue({
      ok: true,
      intent: {
        ...rowA,
        emailNormalized: "local-a@example.test",
        revision: 8,
      },
    });
    listActionMock.mockResolvedValue({
      ok: true,
      intents: [
        {
          ...rowA,
          emailNormalized: "local-a@example.test",
          revision: 8,
        },
        latestB,
      ],
    });
    await submit(form);
    expect(updateActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intentId: A_ID,
        expectedRevision: 7,
        email: "local-a@example.test",
      }),
    );
    expect(deleteActionMock).toHaveBeenCalledTimes(1);
  });

  it("closes editor A when a stale DELETE for B returns A at a newer revision", async () => {
    const rowA = intent(A_ID, "a@example.test", "staff", 7);
    const rowB = intent(B_ID, "b@example.test", "viewer", 2);
    const advancedA = intent(A_ID, "server-a@example.test", "admin", 8);
    const latestB = intent(B_ID, "b@example.test", "admin", 3);
    const deleteWait = deferred<{
      ok: false;
      code: "STALE_REVISION";
      message: string;
    }>();
    const listWait = deferred<{
      ok: true;
      intents: TeamInviteIntent[];
    }>();
    deleteActionMock.mockReturnValueOnce(deleteWait.promise);
    listActionMock.mockReturnValueOnce(listWait.promise);

    const props = defaultProps([rowA, rowB]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit a@example.test"));
    tree = renderTeam(props);
    change(
      editFields(findEditForm(tree, "a@example.test")).input,
      "local-a@example.test",
    );
    tree = renderTeam(props);

    const removePromise = clickAsync(
      findByAriaLabel(tree, "Remove b@example.test"),
    );
    deleteWait.resolve({
      ok: false,
      code: "STALE_REVISION",
      message:
        "This teammate was updated elsewhere. Review the latest details before saving again.",
    });
    await Promise.resolve();
    listWait.resolve({ ok: true, intents: [advancedA, latestB] });
    await removePromise;
    tree = renderTeam(props);

    expect(elementText(tree)).toContain("server-a@example.test");
    expect(elementText(tree)).toContain("Admin");
    expect(alertText(tree)).toContain("updated elsewhere");
    expect(alertText(tree)).toContain("Review them before editing again.");
    expect(
      collectElements(tree).some(
        (element) =>
          (element.props as { "aria-label"?: string })["aria-label"]?.startsWith(
            "Save changes",
          ),
      ),
    ).toBe(false);
    expect(deleteActionMock).toHaveBeenCalledTimes(1);
  });

  it("keeps removal-specific copy when a stale DELETE for B finds A gone", async () => {
    const rowA = intent(A_ID, "a@example.test", "staff", 7);
    const rowB = intent(B_ID, "b@example.test", "viewer", 2);
    const latestB = intent(B_ID, "b@example.test", "admin", 3);
    const deleteWait = deferred<{
      ok: false;
      code: "STALE_REVISION";
      message: string;
    }>();
    const listWait = deferred<{
      ok: true;
      intents: TeamInviteIntent[];
    }>();
    deleteActionMock.mockReturnValueOnce(deleteWait.promise);
    listActionMock.mockReturnValueOnce(listWait.promise);

    const props = defaultProps([rowA, rowB]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit a@example.test"));
    tree = renderTeam(props);
    change(
      editFields(findEditForm(tree, "a@example.test")).input,
      "local-a@example.test",
    );
    tree = renderTeam(props);

    const removePromise = clickAsync(
      findByAriaLabel(tree, "Remove b@example.test"),
    );
    deleteWait.resolve({
      ok: false,
      code: "STALE_REVISION",
      message:
        "This teammate was updated elsewhere. Review the latest details before saving again.",
    });
    await Promise.resolve();
    listWait.resolve({ ok: true, intents: [latestB] });
    await removePromise;
    tree = renderTeam(props);

    expect(alertText(tree)).toBe(
      "This teammate is no longer in the current team setup. We’ve loaded the latest version.",
    );
    expect(alertText(tree)).toContain("no longer");
    expect(alertText(tree)).not.toContain("changed while you were editing");
    expect(alertText(tree)).not.toContain("updated elsewhere");
    expect(alertText(tree)).not.toContain(
      "Review them before editing again.",
    );
    expect(elementText(tree)).not.toContain("a@example.test");
    expect(
      collectElements(tree).some(
        (element) =>
          (element.props as { role?: string }).role === "alert",
      ),
    ).toBe(true);
    expect(
      collectElements(tree).some(
        (element) =>
          (element.props as { "aria-label"?: string })["aria-label"]?.startsWith(
            "Save changes",
          ),
      ),
    ).toBe(false);
    expect(deleteActionMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a delayed CREATE completion that would duplicate an accepted row", async () => {
    const createdN1 = intent(B_ID, "created-old@example.test", "viewer", 1);
    const createdN2 = intent(B_ID, "created-new@example.test", "admin", 2);
    const additional = intent(
      "44444444-4444-4444-8444-444444444444",
      "additional-newer@example.test",
      "staff",
      3,
    );
    const createWait = deferred<{
      ok: true;
      intent: TeamInviteIntent;
    }>();
    createActionMock.mockReturnValueOnce(createWait.promise);
    listActionMock.mockResolvedValue({ ok: true, intents: [createdN1] });

    let props = defaultProps([]);
    let tree = renderTeam(props);
    const fields = formFields(addForm(tree));
    change(fields.input, "created-new@example.test");
    change(fields.select, "viewer");
    tree = renderTeam(props);

    const createPromise = submit(addForm(tree));
    expect(createActionMock).toHaveBeenCalledTimes(1);
    expect(createActionMock).toHaveBeenCalledWith({
      organizationId: ORG,
      email: "created-new@example.test",
      role: "viewer",
    });

    props = defaultProps([createdN2, additional]);
    tree = renderTeam(props);
    expect(strongCount(tree, "created-new@example.test")).toBe(1);
    expect(strongCount(tree, "additional-newer@example.test")).toBe(1);
    expect(elementText(tree)).toContain("Admin");
    expect(elementText(tree)).toContain("Staff");

    createWait.resolve({ ok: true, intent: createdN1 });
    await createPromise;
    tree = renderTeam(props);
    expect(listActionMock).toHaveBeenCalledTimes(1);
    expect(strongCount(tree, "created-new@example.test")).toBe(1);
    expect(strongCount(tree, "additional-newer@example.test")).toBe(1);
    expect(elementText(tree)).toContain("Admin");
    expect(elementText(tree)).toContain("Staff");
    expect(elementText(tree)).not.toContain("created-old@example.test");
    expect(createActionMock).toHaveBeenCalledTimes(1);
    expect(elementText(tree)).not.toContain("invitation sent");
    expect(elementText(tree)).not.toContain("now a member");
  });

  it("rejects a delayed UPDATE revision N+1 after N+2 was accepted", async () => {
    const original = intent(A_ID, "a@example.test", "staff", 7);
    const revisionN1 = intent(A_ID, "n1@example.test", "viewer", 8);
    const revisionN2 = intent(A_ID, "n2@example.test", "admin", 9);
    const updateWait = deferred<{
      ok: true;
      intent: TeamInviteIntent;
    }>();
    updateActionMock.mockReturnValueOnce(updateWait.promise);
    listActionMock.mockResolvedValue({ ok: true, intents: [revisionN1] });

    let props = defaultProps([original]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit a@example.test"));
    tree = renderTeam(props);

    const updatePromise = submit(findEditForm(tree, "a@example.test"));
    expect(updateActionMock).toHaveBeenCalledTimes(1);
    expect(updateActionMock).toHaveBeenCalledWith({
      organizationId: ORG,
      intentId: A_ID,
      expectedRevision: 7,
      email: "a@example.test",
      role: "staff",
    });
    props = defaultProps([revisionN2]);
    tree = renderTeam(props);
    expect(elementText(tree)).toContain("n2@example.test");
    expect(elementText(tree)).toContain("Admin");
    expect(
      collectElements(tree).some(
        (element) =>
          (element.props as { "aria-label"?: string })["aria-label"]?.startsWith(
            "Save changes",
          ),
      ),
    ).toBe(false);

    updateWait.resolve({ ok: true, intent: revisionN1 });
    await updatePromise;
    tree = renderTeam(props);
    expect(listActionMock).toHaveBeenCalledTimes(1);
    expect(updateActionMock).toHaveBeenCalledTimes(1);
    expect(elementText(tree)).toContain("n2@example.test");
    expect(elementText(tree)).toContain("Admin");
    expect(elementText(tree)).not.toContain("n1@example.test");
    expect(
      collectElements(tree).some(
        (element) =>
          (element.props as { "aria-label"?: string })["aria-label"]?.startsWith(
            "Save changes",
          ),
      ),
    ).toBe(false);
  });

  it("rejects a successful DELETE's older LIST after newer authority was accepted", async () => {
    const rowA = intent(A_ID, "a-old@example.test", "staff", 1);
    const rowB = intent(B_ID, "b@example.test", "viewer", 2);
    const newerA = intent(A_ID, "a-new@example.test", "admin", 3);
    const additional = intent(
      "44444444-4444-4444-8444-444444444444",
      "additional-newer@example.test",
      "staff",
      4,
    );
    const deleteWait = deferred<{
      ok: true;
      intentId: string;
      deletedRevision: number;
    }>();
    const listWait = deferred<{
      ok: true;
      intents: TeamInviteIntent[];
    }>();
    deleteActionMock.mockReturnValueOnce(deleteWait.promise);
    listActionMock.mockReturnValueOnce(listWait.promise);

    let props = defaultProps([rowA, rowB]);
    let tree = renderTeam(props);
    const deletePromise = clickAsync(
      findByAriaLabel(tree, "Remove b@example.test"),
    );
    expect(deleteActionMock).toHaveBeenCalledTimes(1);
    expect(deleteActionMock).toHaveBeenCalledWith({
      organizationId: ORG,
      intentId: B_ID,
      expectedRevision: 2,
    });

    props = defaultProps([newerA, additional]);
    tree = renderTeam(props);
    expect(strongCount(tree, "a-new@example.test")).toBe(1);
    expect(strongCount(tree, "additional-newer@example.test")).toBe(1);
    expect(elementText(tree)).toContain("Admin");
    expect(elementText(tree)).toContain("Staff");

    deleteWait.resolve({
      ok: true,
      intentId: B_ID,
      deletedRevision: 2,
    });
    await Promise.resolve();
    expect(listActionMock).toHaveBeenCalledTimes(1);
    listWait.resolve({ ok: true, intents: [rowA] });
    await deletePromise;
    tree = renderTeam(props);

    expect(deleteActionMock).toHaveBeenCalledTimes(1);
    expect(listActionMock).toHaveBeenCalledTimes(1);
    expect(strongCount(tree, "a-new@example.test")).toBe(1);
    expect(strongCount(tree, "additional-newer@example.test")).toBe(1);
    expect(elementText(tree)).toContain("Admin");
    expect(elementText(tree)).toContain("Staff");
    expect(elementText(tree)).not.toContain("a-old@example.test");
    expect(elementText(tree)).not.toContain("b@example.test");
  });

  it("prevents overlapping mutations and only the owner clears pending authority", async () => {
    const rowA = intent(A_ID, "a@example.test", "staff", 7);
    const rowB = intent(B_ID, "b@example.test", "viewer", 2);
    const created = intent(
      "44444444-4444-4444-8444-444444444444",
      "created@example.test",
      "viewer",
      1,
    );
    const createWait = deferred<{
      ok: true;
      intent: TeamInviteIntent;
    }>();
    const deleteWait = deferred<{
      ok: true;
      intentId: string;
      deletedRevision: number;
    }>();
    createActionMock.mockReturnValueOnce(createWait.promise);
    listActionMock.mockResolvedValue({
      ok: true,
      intents: [rowA, rowB, created],
    });

    const props = defaultProps([rowA, rowB]);
    let tree = renderTeam(props);
    click(findByAriaLabel(tree, "Edit a@example.test"));
    tree = renderTeam(props);
    const createFields = formFields(addForm(tree));
    change(createFields.input, "created@example.test");
    change(createFields.select, "viewer");
    tree = renderTeam(props);

    const createPromise = submit(addForm(tree));
    tree = renderTeam(props);
    await submit(addForm(tree));
    await submit(findEditForm(tree, "a@example.test"));
    await clickAsync(findByAriaLabel(tree, "Remove b@example.test"));
    await clickAsync(findClickable(tree, "Review team setup"));

    expect(createActionMock).toHaveBeenCalledTimes(1);
    expect(updateActionMock).not.toHaveBeenCalled();
    expect(deleteActionMock).not.toHaveBeenCalled();
    expect(listActionMock).not.toHaveBeenCalled();

    createWait.resolve({ ok: true, intent: created });
    await createPromise;
    tree = renderTeam(props);
    expect(
      (
        findByAriaLabel(tree, "Remove b@example.test").props as {
          disabled?: boolean;
        }
      ).disabled,
    ).toBeFalsy();

    deleteActionMock.mockReturnValueOnce(deleteWait.promise);
    listActionMock.mockResolvedValue({ ok: true, intents: [rowA, created] });
    const deletePromise = clickAsync(
      findByAriaLabel(tree, "Remove b@example.test"),
    );
    tree = renderTeam(props);
    expect(elementText(tree)).toContain("Removing…");
    const retryCreate = formFields(addForm(tree));
    change(retryCreate.input, "other@example.test");
    change(retryCreate.select, "staff");
    tree = renderTeam(props);
    await submit(addForm(tree));
    expect(createActionMock).toHaveBeenCalledTimes(1);
    expect(deleteActionMock).toHaveBeenCalledTimes(1);

    deleteWait.resolve({
      ok: true,
      intentId: B_ID,
      deletedRevision: 2,
    });
    await deletePromise;
    tree = renderTeam(props);
    expect(elementText(tree)).not.toContain("Removing…");
    expect(deleteActionMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an older LIST after a newer LIST was already accepted", async () => {
    const older = intent(A_ID, "older@example.test", "staff", 1);
    const newer = intent(A_ID, "newer@example.test", "admin", 2);
    const firstList = deferred<{
      ok: true;
      intents: TeamInviteIntent[];
    }>();
    const secondList = deferred<{
      ok: true;
      intents: TeamInviteIntent[];
    }>();
    listActionMock
      .mockReturnValueOnce(firstList.promise)
      .mockReturnValueOnce(secondList.promise);

    const props = defaultProps([]);
    let tree = renderTeam(props);
    const review = findClickable(tree, "Review team setup");
    const firstReview = clickAsync(review);
    const secondReview = clickAsync(review);

    secondList.resolve({ ok: true, intents: [newer] });
    await secondReview;
    tree = renderTeam(props);
    expect(reviewIntents(tree).map((item) => item.emailNormalized)).toEqual([
      "newer@example.test",
    ]);
    expect(reviewIntents(tree).map((item) => item.revision)).toEqual([2]);

    firstList.resolve({ ok: true, intents: [older] });
    await firstReview;
    tree = renderTeam(props);
    expect(reviewIntents(tree).map((item) => item.emailNormalized)).toEqual([
      "newer@example.test",
    ]);
    expect(reviewIntents(tree).map((item) => item.revision)).toEqual([2]);
    expect(
      reviewIntents(tree).some(
        (item) => item.emailNormalized === "older@example.test",
      ),
    ).toBe(false);
  });

  it("accepts the same authoritative snapshot repeatedly without duplicating rows or resetting the editor", () => {
    const row = intent(A_ID, "a@example.test", "staff", 7);
    let tree = renderTeam(defaultProps([row]));
    click(findByAriaLabel(tree, "Edit a@example.test"));
    tree = renderTeam(defaultProps([row]));
    change(
      editFields(findEditForm(tree, "a@example.test")).input,
      "local-a@example.test",
    );
    tree = renderTeam(defaultProps([row]));
    tree = renderTeam(defaultProps([row]));
    tree = renderTeam(defaultProps([row]));

    expect(strongCount(tree, "a@example.test")).toBe(0);
    expect(
      (
        editFields(findEditForm(tree, "a@example.test")).input.props as {
          value: string;
        }
      ).value,
    ).toBe("local-a@example.test");
    expect(alertText(tree)).toBe("");
    expect(elementText(tree)).not.toContain("updated elsewhere");
    expect(elementText(tree)).not.toContain(
      "This teammate changed while you were editing.",
    );
  });
});
