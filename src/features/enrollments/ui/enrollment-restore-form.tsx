"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { restoreEnrollmentAction } from "@/features/enrollments/actions/enrollment-actions";
import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import {
  interpretEnrollmentFormMutationResult,
  enrollmentFormIsLocked,
  enrollmentMutationRefreshRequired,
  type EnrollmentFormUiState,
} from "@/features/enrollments/ui/enrollment-form-state";
import {
  EnrollmentLifecycleFormShell,
  EnrollmentLifecycleSummary,
} from "@/features/enrollments/ui/enrollment-lifecycle-confirmation";
import { buildEnrollmentDetailHref } from "@/features/enrollments/ui/enrollment-navigation";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import formStyles from "./enrollment-form.module.css";
import lifecycleStyles from "./enrollment-lifecycle.module.css";

type EnrollmentRestoreFormProps = {
  organizationId: string;
  enrollment: EnrollmentDetailReadModel;
  listState: EnrollmentListUrlState;
  backHref: string;
};

export function EnrollmentRestoreForm({
  organizationId,
  enrollment,
  listState,
  backHref,
}: EnrollmentRestoreFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<EnrollmentFormUiState>({ kind: "idle" });

  const locked = enrollmentFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await restoreEnrollmentAction({
      organizationId,
      enrollmentId: enrollment.id,
    });

    const next = interpretEnrollmentFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (enrollmentMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildEnrollmentDetailHref(next.enrollmentId, listState));
      return;
    }

    pendingRef.current = false;
  }

  const reloadEnrollmentId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.enrollmentId ?? enrollment.id
      : enrollment.id;

  return (
    <EnrollmentLifecycleFormShell
      heading="Restore enrollment"
      description="Restoring makes this enrollment visible again according to normal role and access rules."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Restoring…" : undefined}
    >
      <EnrollmentLifecycleSummary enrollment={enrollment} />

      <section className={lifecycleStyles.summary} aria-labelledby="restore-explanation-title">
        <h2 id="restore-explanation-title">What restoring means</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>The lifecycle status remains {enrollment.statusLabel}.</li>
          <li>Staff and viewers can see the enrollment again when their role allows it.</li>
          <li>No lifecycle status change occurs during restore.</li>
        </ul>
      </section>

      <form
        className={formStyles.enrollmentForm}
        onSubmit={handleSubmit}
        aria-busy={isPending}
        noValidate
      >
        {uiState.kind === "error" ? (
          <div className={formStyles.formError} role="alert">
            <p>{uiState.message}</p>
          </div>
        ) : null}

        {uiState.kind === "reload_required" ? (
          <div className={formStyles.formNotice} role="status">
            <p>{uiState.message}</p>
            <p>
              <a href={buildEnrollmentDetailHref(reloadEnrollmentId, listState)}>
                Open restored enrollment
              </a>
            </p>
          </div>
        ) : null}

        <div className={formStyles.actions}>
          <button type="submit" className={formStyles.submitButton} disabled={locked || isPending}>
            {isPending ? "Restoring…" : "Restore enrollment"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to enrollment
          </a>
        </div>
      </form>
    </EnrollmentLifecycleFormShell>
  );
}
