import { describe, expect, it } from "vitest";
import {
  buildAttentionLifecycleDetailPath,
  listAttentionLifecycleRevalidationPaths,
  resolveAttentionLifecycleReturnPath,
} from "@/features/attention/ui/attention-lifecycle-return";
import {
  attentionLifecycleActionStateExposesRawErrors,
  createPendingAttentionLifecycleActionState,
  fieldErrorMessage,
  getAttentionLifecyclePendingLabel,
  interpretAttentionLifecycleMutationResult,
  shouldDisableAttentionLifecycleSubmit,
} from "@/features/attention/ui/attention-lifecycle-action-state";
import {
  ATTENTION_ITEM_ID,
  ORG_ID,
} from "../helpers/attention-test-fixtures";

describe("attention lifecycle return helpers", () => {
  it("keeps Attention detail/list returns and rejects external paths", () => {
    const detail = `/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`;
    expect(
      resolveAttentionLifecycleReturnPath(detail, ATTENTION_ITEM_ID, ORG_ID),
    ).toBe(detail);

    expect(
      resolveAttentionLifecycleReturnPath(
        "/attention?status=open",
        ATTENTION_ITEM_ID,
        ORG_ID,
      ),
    ).toBe("/attention?status=open");

    expect(
      resolveAttentionLifecycleReturnPath(
        "https://evil.example/phish",
        ATTENTION_ITEM_ID,
        ORG_ID,
      ),
    ).toBe(`/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`);

    expect(
      resolveAttentionLifecycleReturnPath(
        "//evil.example",
        ATTENTION_ITEM_ID,
        ORG_ID,
      ),
    ).toBe(`/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`);

    expect(
      resolveAttentionLifecycleReturnPath("/tasks", ATTENTION_ITEM_ID, ORG_ID),
    ).toBe(`/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`);
  });

  it("lists focused revalidation paths", () => {
    expect(buildAttentionLifecycleDetailPath(ATTENTION_ITEM_ID)).toBe(
      `/attention/${ATTENTION_ITEM_ID}`,
    );
    expect(listAttentionLifecycleRevalidationPaths(ATTENTION_ITEM_ID)).toEqual([
      "/attention",
      `/attention/${ATTENTION_ITEM_ID}`,
    ]);
  });
});

describe("attention lifecycle action presentation state", () => {
  it("supports pending duplicate-submit lock and labels", () => {
    const pending = createPendingAttentionLifecycleActionState("acknowledge");
    expect(shouldDisableAttentionLifecycleSubmit(pending)).toBe(true);
    expect(getAttentionLifecyclePendingLabel(pending)).toBe("Acknowledging…");
    expect(shouldDisableAttentionLifecycleSubmit({ kind: "idle" })).toBe(false);
  });

  it("maps success, noop, field, permission, unavailable, and conflict results", () => {
    expect(
      interpretAttentionLifecycleMutationResult({
        ok: true,
        action: "acknowledge",
        attentionItemId: ATTENTION_ITEM_ID,
        outcome: "applied",
        committed: true,
        refreshRequired: false,
        returnPath: `/attention/${ATTENTION_ITEM_ID}`,
      }),
    ).toMatchObject({ kind: "success", outcome: "applied" });

    expect(
      interpretAttentionLifecycleMutationResult({
        ok: true,
        action: "assign",
        attentionItemId: ATTENTION_ITEM_ID,
        outcome: "noop",
        committed: true,
        refreshRequired: false,
        returnPath: `/attention/${ATTENTION_ITEM_ID}`,
      }),
    ).toMatchObject({ kind: "noop_success" });

    const field = interpretAttentionLifecycleMutationResult({
      ok: false,
      action: "resolve",
      committed: false,
      returnPath: "/attention",
      error: {
        code: "INVALID_INPUT",
        message: "A resolution reason is required.",
        retryable: false,
        category: "validation",
        fieldErrors: { resolutionReason: "A resolution reason is required." },
      },
    });
    expect(field.kind).toBe("field_error");
    if (field.kind === "field_error") {
      expect(fieldErrorMessage(field.fieldErrors, "resolutionReason")).toContain(
        "resolution reason",
      );
    }

    expect(
      interpretAttentionLifecycleMutationResult({
        ok: false,
        action: "acknowledge",
        committed: false,
        returnPath: "/attention",
        error: {
          code: "AUTH_REQUIRED",
          message: "Please sign in to continue.",
          retryable: false,
          category: "auth",
        },
      }).kind,
    ).toBe("auth_required");

    expect(
      interpretAttentionLifecycleMutationResult({
        ok: false,
        action: "acknowledge",
        committed: false,
        returnPath: "/attention",
        error: {
          code: "ORG_CONTEXT_MISSING",
          message: "Organization not found or access denied.",
          retryable: false,
          category: "not_found",
        },
      }).kind,
    ).toBe("organization_required");

    expect(
      interpretAttentionLifecycleMutationResult({
        ok: false,
        action: "acknowledge",
        committed: false,
        returnPath: "/attention",
        error: {
          code: "ATTENTION_ITEM_UNAVAILABLE",
          message: "Attention item not found or access denied.",
          retryable: false,
          category: "not_found",
        },
      }).kind,
    ).toBe("unavailable");

    expect(
      interpretAttentionLifecycleMutationResult({
        ok: false,
        action: "archive",
        committed: false,
        returnPath: "/attention",
        error: {
          code: "INSUFFICIENT_ROLE",
          message: "You don't have permission for this action.",
          retryable: false,
          category: "permission",
        },
      }).kind,
    ).toBe("permission_denied");

    const conflict = interpretAttentionLifecycleMutationResult({
      ok: false,
      action: "acknowledge",
      committed: false,
      returnPath: "/attention",
      error: {
        code: "INVALID_STATE",
        message: "This attention status change is not allowed.",
        retryable: false,
        category: "conflict",
        refreshRequired: true,
      },
    });
    expect(conflict).toMatchObject({
      kind: "conflict",
      refreshRequired: true,
    });

    const serverError = interpretAttentionLifecycleMutationResult({
      ok: false,
      action: "acknowledge",
      committed: false,
      returnPath: "/attention",
      error: {
        code: "UNEXPECTED_ERROR",
        message: "Something went wrong. Please try again.",
        retryable: true,
        category: "server",
      },
    });
    expect(serverError).toMatchObject({ kind: "error", retryable: true });
    expect(attentionLifecycleActionStateExposesRawErrors(serverError)).toBe(
      false,
    );
  });

  it("maps invalid assignment targets to field errors", () => {
    const state = interpretAttentionLifecycleMutationResult({
      ok: false,
      action: "assign",
      committed: false,
      returnPath: "/attention",
      error: {
        code: "INVALID_INPUT",
        message: "Select a valid organization member.",
        retryable: false,
        category: "validation",
      },
    });
    expect(state.kind).toBe("field_error");
    if (state.kind === "field_error") {
      expect(fieldErrorMessage(state.fieldErrors, "assigneeMemberId")).toContain(
        "organization member",
      );
    }
  });

  it("maps resolve and dismiss reason validation to field errors", () => {
    const resolveState = interpretAttentionLifecycleMutationResult({
      ok: false,
      action: "resolve",
      committed: false,
      returnPath: "/attention",
      error: {
        code: "INVALID_INPUT",
        message: "Please correct the highlighted fields and try again.",
        retryable: false,
        category: "validation",
        fieldErrors: { resolutionReason: "Required" },
      },
    });
    expect(resolveState.kind).toBe("field_error");
    if (resolveState.kind === "field_error") {
      expect(fieldErrorMessage(resolveState.fieldErrors, "resolutionReason")).toBeTruthy();
    }

    const dismissState = interpretAttentionLifecycleMutationResult({
      ok: false,
      action: "dismiss",
      committed: false,
      returnPath: "/attention",
      error: {
        code: "INVALID_INPUT",
        message: "Please correct the highlighted fields and try again.",
        retryable: false,
        category: "validation",
        fieldErrors: { dismissalReason: "Required" },
      },
    });
    expect(dismissState.kind).toBe("field_error");
    if (dismissState.kind === "field_error") {
      expect(fieldErrorMessage(dismissState.fieldErrors, "dismissalReason")).toBeTruthy();
    }
  });
});
