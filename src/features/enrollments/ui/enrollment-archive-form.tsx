"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveEnrollmentAction } from "@/features/enrollments/actions/enrollment-actions";
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

type EnrollmentArchiveFormProps = {
  organizationId: string;
  enrollment: EnrollmentDetailReadModel;
  listState: EnrollmentListUrlState;
  backHref: string;
};

export function EnrollmentArchiveForm({
  organizationId,
  enrollment,
  listState,
  backHref,
}: EnrollmentArchiveFormProps) {
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

    const result = await archiveEnrollmentAction({
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
      heading="Archive enrollment"
      description="Archiving hides this enrollment from staff and viewers while keeping the lifecycle status unchanged."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Archiving…" : undefined}
    >
      <EnrollmentLifecycleSummary enrollment={enrollment} />

      <section className={lifecycleStyles.summary} aria-labelledby="archive-explanation-title">
        <h2 id="archive-explanation-title">What archiving means</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>Archive is not deletion.</li>
          <li>The lifecycle status remains {enrollment.statusLabel}.</li>
          <li>Staff and viewers will no longer see this enrollment.</li>
          <li>Only completed or cancelled enrollments can be archived.</li>
          <li>Related records are not deleted.</li>
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
                Open archived enrollment
              </a>
            </p>
          </div>
        ) : null}

        <div className={formStyles.actions}>
          <button
            type="submit"
            className={`${formStyles.submitButton} ${lifecycleStyles.destructiveButton}`}
            disabled={locked || isPending}
          >
            {isPending ? "Archiving…" : "Archive enrollment"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to enrollment
          </a>
        </div>
      </form>
    </EnrollmentLifecycleFormShell>
  );
}
