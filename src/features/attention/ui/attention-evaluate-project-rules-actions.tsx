"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateProjectAttentionRulesAction } from "@/features/attention/actions/evaluate-project-attention-rules-action";
import { summarizeAttentionEvaluateRulesResult } from "@/features/attention/domain/evaluate-action-types";
import styles from "./attention-evaluate-rules-actions.module.css";

type AttentionEvaluateProjectRulesActionsProps = {
  organizationId: string;
  returnPath: string;
  /** When set, evaluate only this project; otherwise org-wide. */
  projectId?: string;
  heading?: string;
  description?: string;
  buttonLabel?: string;
};

type UiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string; retryable: boolean };

/**
 * Owner/Admin control to run project_overdue_active, project_task_overdue, and
 * project_no_owner evaluation on demand (TG2-AGENCY-SLICE).
 * Visibility must be gated by canEvaluateRules before rendering.
 */
export function AttentionEvaluateProjectRulesActions({
  organizationId,
  returnPath,
  projectId,
  heading = "Refresh project Attention",
  description = "Checks active projects for overdue delivery, overdue tasks, and missing owners. Creates or updates Attention when action is required; expires items once resolved. Does not create duplicates for the same project.",
  buttonLabel = "Evaluate project Attention",
}: AttentionEvaluateProjectRulesActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const pendingRef = useRef(false);

  useEffect(() => {
    if (state.kind !== "success") {
      return;
    }
    const timer = window.setTimeout(() => {
      router.refresh();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [state, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setState({ kind: "pending" });

    try {
      const result = await evaluateProjectAttentionRulesAction({
        organizationId,
        projectId: projectId ?? null,
        returnPath,
      });

      if (!result.ok) {
        setState({
          kind: "error",
          message: result.error.message,
          retryable: result.error.retryable,
        });
        return;
      }

      setState({
        kind: "success",
        message: summarizeAttentionEvaluateRulesResult(result.result),
      });
    } catch {
      setState({
        kind: "error",
        message: "Something went wrong. Please try again.",
        retryable: true,
      });
    } finally {
      pendingRef.current = false;
    }
  }

  return (
    <section className={styles.panel} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.description}>{description}</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <button
          type="submit"
          className={styles.submit}
          disabled={state.kind === "pending"}
        >
          {state.kind === "pending" ? "Evaluating…" : buttonLabel}
        </button>
      </form>
      {state.kind === "pending" ? (
        <p className={styles.pending} role="status" aria-live="polite">
          Evaluating project Attention…
        </p>
      ) : null}
      {state.kind === "success" ? (
        <div className={styles.success} role="status" aria-live="polite">
          <p>{state.message}</p>
        </div>
      ) : null}
      {state.kind === "error" ? (
        <div className={styles.error} role="alert">
          <p>{state.message}</p>
          {state.retryable ? (
            <p className={styles.retryHint}>You can try again.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
