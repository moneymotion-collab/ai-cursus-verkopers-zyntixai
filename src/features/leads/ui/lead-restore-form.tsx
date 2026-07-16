"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { restoreLeadAction } from "@/features/leads/actions/lead-actions";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import {
  interpretLeadFormMutationResult,
  leadFormIsLocked,
  leadMutationRefreshRequired,
  type LeadFormUiState,
} from "@/features/leads/ui/lead-form-state";
import { buildLeadDetailHref } from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";
import {
  LeadLifecycleFormShell,
  LeadLifecycleSummary,
} from "@/features/leads/ui/lead-lifecycle-confirmation";
import formStyles from "./lead-form.module.css";
import lifecycleStyles from "./lead-lifecycle.module.css";

type LeadRestoreFormProps = {
  organizationId: string;
  lead: LeadDetailReadModel;
  listState: LeadListUrlState;
  backHref: string;
};

export function LeadRestoreForm({
  organizationId,
  lead,
  listState,
  backHref,
}: LeadRestoreFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<LeadFormUiState>({ kind: "idle" });

  const locked = leadFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await restoreLeadAction({
      organizationId,
      leadId: lead.id,
    });

    const next = interpretLeadFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (leadMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildLeadDetailHref(next.leadId, listState));
      return;
    }

    pendingRef.current = false;
  }

  const reloadLeadId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.leadId ?? lead.id
      : lead.id;

  return (
    <LeadLifecycleFormShell
      heading="Restore lead"
      description="Restoring makes this lead active again without changing status, pipeline stage, or conversion links."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Restoring…" : undefined}
    >
      <LeadLifecycleSummary lead={lead} />

      <section className={lifecycleStyles.summary} aria-labelledby="restore-explanation-title">
        <h2 id="restore-explanation-title">What restore preserves</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>Lead status remains {lead.statusLabel}.</li>
          <li>Pipeline stage remains {lead.stage.name}.</li>
          <li>Conversion relationships are unchanged.</li>
          <li>Related customers and tasks are not restored or changed.</li>
        </ul>
      </section>

      <form
        className={formStyles.leadForm}
        method="post"
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
              <a href={buildLeadDetailHref(reloadLeadId, listState)}>Open restored lead</a>
            </p>
          </div>
        ) : null}

        <div className={formStyles.actions}>
          <button type="submit" className={formStyles.submitButton} disabled={locked || isPending}>
            {isPending ? "Restoring…" : "Restore lead"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to lead
          </a>
        </div>
      </form>
    </LeadLifecycleFormShell>
  );
}
