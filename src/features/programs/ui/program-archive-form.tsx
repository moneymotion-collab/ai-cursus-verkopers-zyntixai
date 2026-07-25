"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveProgramAction } from "@/features/programs/actions/program-actions";
import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";
import {
  interpretProgramFormMutationResult,
  programFormIsLocked,
  programMutationRefreshRequired,
  type ProgramFormUiState,
} from "@/features/programs/ui/program-form-state";
import {
  ProgramLifecycleFormShell,
  ProgramLifecycleSummary,
} from "@/features/programs/ui/program-lifecycle-confirmation";
import { buildProgramDetailHref } from "@/features/programs/ui/program-navigation";
import type { ProgramListUrlState } from "@/features/programs/ui/program-list-search-params";
import formStyles from "./program-form.module.css";
import lifecycleStyles from "./program-lifecycle.module.css";

type ProgramArchiveFormProps = {
  organizationId: string;
  program: ProgramDetailReadModel;
  listState: ProgramListUrlState;
  backHref: string;
};

export function ProgramArchiveForm({
  organizationId,
  program,
  listState,
  backHref,
}: ProgramArchiveFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<ProgramFormUiState>({ kind: "idle" });

  const locked = programFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";
  const hasOpenEnrollments = program.openEnrollmentCount > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await archiveProgramAction({
      organizationId,
      programId: program.id,
    });

    const next = interpretProgramFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (programMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildProgramDetailHref(next.programId, listState));
      return;
    }

    pendingRef.current = false;
  }

  const reloadProgramId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.programId ?? program.id
      : program.id;

  return (
    <ProgramLifecycleFormShell
      heading="Archive program"
      description="Archiving hides this program from staff and viewers while keeping the lifecycle status unchanged."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Archiving…" : undefined}
    >
      <ProgramLifecycleSummary program={program} />

      <section className={lifecycleStyles.summary} aria-labelledby="archive-explanation-title">
        <h2 id="archive-explanation-title">What archiving means</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>Archive is not deletion.</li>
          <li>The lifecycle status remains {program.statusLabel}.</li>
          <li>Staff and viewers will no longer see this program.</li>
          <li>Programs with open enrollments cannot be archived.</li>
          <li>Related records are not deleted.</li>
        </ul>
        {hasOpenEnrollments ? (
          <p className={formStyles.helpText} role="status">
            This program currently has {program.openEnrollmentCount} open enrollment
            {program.openEnrollmentCount === 1 ? "" : "s"}. Resolve open enrollments before
            archiving.
          </p>
        ) : null}
      </section>

      <form
        className={formStyles.programForm}
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
              <a href={buildProgramDetailHref(reloadProgramId, listState)}>Open archived program</a>
            </p>
          </div>
        ) : null}

        <div className={formStyles.actions}>
          <button
            type="submit"
            className={`${formStyles.submitButton} ${lifecycleStyles.destructiveButton}`}
            disabled={locked || isPending}
          >
            {isPending ? "Archiving…" : "Archive program"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to program
          </a>
        </div>
      </form>
    </ProgramLifecycleFormShell>
  );
}
