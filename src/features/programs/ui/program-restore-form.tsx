"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { restoreProgramAction } from "@/features/programs/actions/program-actions";
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

type ProgramRestoreFormProps = {
  organizationId: string;
  program: ProgramDetailReadModel;
  listState: ProgramListUrlState;
  backHref: string;
};

export function ProgramRestoreForm({
  organizationId,
  program,
  listState,
  backHref,
}: ProgramRestoreFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<ProgramFormUiState>({ kind: "idle" });

  const locked = programFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await restoreProgramAction({
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
      heading="Restore program"
      description="Restoring makes this program visible again according to normal role and access rules."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Restoring…" : undefined}
    >
      <ProgramLifecycleSummary program={program} />

      <section className={lifecycleStyles.summary} aria-labelledby="restore-explanation-title">
        <h2 id="restore-explanation-title">What restoring means</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>The lifecycle status remains {program.statusLabel}.</li>
          <li>Staff and viewers can see the program again when their role allows it.</li>
          <li>No lifecycle status change occurs during restore.</li>
        </ul>
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
              <a href={buildProgramDetailHref(reloadProgramId, listState)}>Open restored program</a>
            </p>
          </div>
        ) : null}

        <div className={formStyles.actions}>
          <button type="submit" className={formStyles.submitButton} disabled={locked || isPending}>
            {isPending ? "Restoring…" : "Restore program"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to program
          </a>
        </div>
      </form>
    </ProgramLifecycleFormShell>
  );
}
