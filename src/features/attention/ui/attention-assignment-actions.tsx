"use client";

import { useEffect, useRef, useState, type FormEvent, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { assignAttentionItemAction } from "@/features/attention/actions/lifecycle-attention-actions";
import type { AttentionAssigneeOption } from "@/features/attention/server/load-attention-assignee-options";
import {
  createPendingAttentionLifecycleActionState,
  fieldErrorMessage,
  getAttentionLifecyclePendingLabel,
  interpretAttentionLifecycleMutationResult,
  shouldDisableAttentionLifecycleSubmit,
  type AttentionLifecycleActionUiState,
} from "@/features/attention/ui/attention-lifecycle-action-state";
import styles from "./attention-lifecycle-actions.module.css";

const UNASSIGNED_VALUE = "" as const;

type AttentionAssignmentActionsProps = {
  organizationId: string;
  attentionItemId: string;
  returnPath: string;
  showAssign: boolean;
  showUnassign: boolean;
  currentAssigneeMemberId: string | null;
  assigneeOptions: AttentionAssigneeOption[];
  assigneeOptionsFailed: boolean;
};

function FeedbackRegion({
  state,
  reloadHref,
}: {
  state: AttentionLifecycleActionUiState;
  reloadHref: string;
}) {
  if (state.kind === "pending") {
    const label = getAttentionLifecyclePendingLabel(state);
    return label ? (
      <p className={styles.pendingStatus} role="status" aria-live="polite">
        {label}
      </p>
    ) : null;
  }

  if (state.kind === "success") {
    const message =
      state.action === "assign"
        ? "Attention item assigned."
        : state.action === "unassign"
          ? "Attention item unassigned."
          : "Change saved.";
    return (
      <div className={styles.formSuccess} role="status" aria-live="polite">
        <p>{message}</p>
      </div>
    );
  }

  if (state.kind === "noop_success") {
    const message =
      state.action === "assign"
        ? "This attention item is already assigned to the selected member."
        : state.action === "unassign"
          ? "This attention item is already unassigned."
          : "No changes were needed.";
    return (
      <div className={styles.formNotice} role="status" aria-live="polite">
        <p>{message}</p>
      </div>
    );
  }

  if (state.kind === "conflict") {
    return (
      <div className={styles.formNotice} role="status" aria-live="polite">
        <p>{state.message}</p>
        <p>
          <a className={styles.reloadLink} href={reloadHref}>
            Refresh detail
          </a>
        </p>
      </div>
    );
  }

  if (
    state.kind === "error" ||
    state.kind === "auth_required" ||
    state.kind === "organization_required" ||
    state.kind === "unavailable" ||
    state.kind === "permission_denied"
  ) {
    return (
      <div className={styles.formError} role="alert">
        <p>{state.message}</p>
      </div>
    );
  }

  if (state.kind === "field_error" && state.message) {
    return (
      <div className={styles.formError} role="alert">
        <p>{state.message}</p>
      </div>
    );
  }

  return null;
}

export function AttentionAssignmentActions({
  organizationId,
  attentionItemId,
  returnPath,
  showAssign,
  showUnassign,
  currentAssigneeMemberId,
  assigneeOptions,
  assigneeOptionsFailed,
}: AttentionAssignmentActionsProps) {
  const router = useRouter();
  const assignPendingRef = useRef(false);
  const unassignPendingRef = useRef(false);
  const [assignState, setAssignState] = useState<AttentionLifecycleActionUiState>({
    kind: "idle",
  });
  const [unassignState, setUnassignState] =
    useState<AttentionLifecycleActionUiState>({ kind: "idle" });
  const [selectedAssignee, setSelectedAssignee] = useState(
    currentAssigneeMemberId ?? UNASSIGNED_VALUE,
  );

  useEffect(() => {
    setSelectedAssignee(currentAssigneeMemberId ?? UNASSIGNED_VALUE);
  }, [currentAssigneeMemberId]);

  if (!showAssign && !showUnassign) {
    return null;
  }

  const assignLocked = shouldDisableAttentionLifecycleSubmit(assignState);
  const unassignLocked = shouldDisableAttentionLifecycleSubmit(unassignState);
  const anyPending = assignLocked || unassignLocked;
  const selectedUnchanged =
    (selectedAssignee || null) === (currentAssigneeMemberId ?? null) ||
    (selectedAssignee === UNASSIGNED_VALUE && currentAssigneeMemberId == null);
  const fieldErrors =
    assignState.kind === "field_error" ? assignState.fieldErrors : undefined;
  const assigneeFieldError = fieldErrorMessage(fieldErrors, "assigneeMemberId");
  const hasEligibleOptions = assigneeOptions.length > 0;
  const canSubmitAssign =
    showAssign &&
    !assigneeOptionsFailed &&
    hasEligibleOptions &&
    selectedAssignee !== UNASSIGNED_VALUE &&
    !selectedUnchanged;

  async function runAssignment(
    assigneeMemberId: string | null,
    setState: (state: AttentionLifecycleActionUiState) => void,
    pendingRef: MutableRefObject<boolean>,
  ) {
    if (pendingRef.current || anyPending) {
      return;
    }

    pendingRef.current = true;
    setState(
      createPendingAttentionLifecycleActionState(
        assigneeMemberId == null ? "unassign" : "assign",
      ),
    );

    const result = await assignAttentionItemAction({
      organizationId,
      attentionItemId,
      assigneeMemberId,
      returnPath,
    });

    const next = interpretAttentionLifecycleMutationResult(result);
    setState(next);

    if (
      next.kind === "success" ||
      next.kind === "noop_success" ||
      next.kind === "conflict"
    ) {
      router.refresh();
    }

    pendingRef.current = false;
  }

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitAssign) {
      return;
    }
    await runAssignment(selectedAssignee, setAssignState, assignPendingRef);
  }

  async function handleUnassign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!showUnassign || currentAssigneeMemberId == null) {
      return;
    }
    await runAssignment(null, setUnassignState, unassignPendingRef);
  }

  return (
    <section
      className={styles.lifecycleActions}
      aria-labelledby="attention-assignment-actions-heading"
    >
      <h2 id="attention-assignment-actions-heading">Assignment</h2>
      <p className={styles.intro}>
        Assign this attention item to an active organization member, or clear the
        current assignment.
      </p>

      {showAssign ? (
        <div className={styles.actionBlock}>
          <h3 id="attention-assign-heading">Assign</h3>
          <p className={styles.actionDescription}>
            Choose an active team member in this organization, then save.
          </p>
          <FeedbackRegion state={assignState} reloadHref={returnPath} />
          {assigneeOptionsFailed ? (
            <div className={styles.formNotice} role="status">
              <p>
                Eligible members could not be loaded. Try refreshing this page.
              </p>
            </div>
          ) : null}
          {!assigneeOptionsFailed && !hasEligibleOptions ? (
            <div className={styles.formNotice} role="status">
              <p>No active organization members are available to assign.</p>
            </div>
          ) : null}
          <form
            className={styles.actionForm}
            onSubmit={handleAssign}
            aria-busy={assignState.kind === "pending"}
            aria-labelledby="attention-assign-heading"
            noValidate
          >
            <div className={styles.field}>
              <label htmlFor="attention-assignee-select">Assignee</label>
              <select
                id="attention-assignee-select"
                name="assigneeMemberId"
                value={selectedAssignee}
                onChange={(event) => setSelectedAssignee(event.target.value)}
                disabled={anyPending || assigneeOptionsFailed || !hasEligibleOptions}
                aria-invalid={Boolean(assigneeFieldError)}
                aria-describedby={
                  assigneeFieldError ? "attention-assignee-error" : undefined
                }
              >
                <option value={UNASSIGNED_VALUE}>Unassigned</option>
                {assigneeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {assigneeFieldError ? (
                <p id="attention-assignee-error" className={styles.fieldError}>
                  {assigneeFieldError}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={anyPending || !canSubmitAssign}
            >
              {assignState.kind === "pending" ? "Assigning…" : "Save assignment"}
            </button>
          </form>
        </div>
      ) : null}

      {showUnassign ? (
        <div className={styles.actionBlock}>
          <h3 id="attention-unassign-heading">Unassign</h3>
          <p className={styles.actionDescription}>
            Clear the current assignee for this attention item.
          </p>
          <FeedbackRegion state={unassignState} reloadHref={returnPath} />
          <form
            className={styles.actionForm}
            onSubmit={handleUnassign}
            aria-busy={unassignState.kind === "pending"}
            aria-labelledby="attention-unassign-heading"
            noValidate
          >
            <button
              type="submit"
              className={styles.secondaryButton}
              disabled={anyPending}
            >
              {unassignState.kind === "pending" ? "Unassigning…" : "Unassign"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
