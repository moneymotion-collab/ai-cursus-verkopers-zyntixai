"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveLeadAction } from "@/features/leads/actions/lead-actions";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadRole } from "@/features/leads/domain/types";
import {
  interpretLeadFormMutationResult,
  leadFormIsLocked,
  leadMutationRefreshRequired,
  type LeadFormUiState,
} from "@/features/leads/ui/lead-form-state";
import { buildLeadArchiveSuccessHref } from "@/features/leads/ui/lead-archive-navigation";
import { buildLeadDetailHref } from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";
import {
  LeadLifecycleFormShell,
  LeadLifecycleSummary,
} from "@/features/leads/ui/lead-lifecycle-confirmation";
import formStyles from "./lead-form.module.css";
import lifecycleStyles from "./lead-lifecycle.module.css";

type LeadArchiveFormProps = {
  organizationId: string;
  lead: LeadDetailReadModel;
  role: LeadRole;
  listState: LeadListUrlState;
  backHref: string;
};

export function LeadArchiveForm({
  organizationId,
  lead,
  role,
  listState,
  backHref,
}: LeadArchiveFormProps) {
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

    const result = await archiveLeadAction({
      organizationId,
      leadId: lead.id,
    });

    const next = interpretLeadFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (leadMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildLeadArchiveSuccessHref(next.leadId, listState, role));
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
      heading="Archive lead"
      description="Archiving limits visibility according to role while preserving lead status and related records."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Archiving…" : undefined}
    >
      <LeadLifecycleSummary lead={lead} />

      <section className={lifecycleStyles.summary} aria-labelledby="archive-explanation-title">
        <h2 id="archive-explanation-title">What archiving means</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>Archive is not deletion.</li>
          <li>Lead status remains {lead.statusLabel}.</li>
          <li>Pipeline stage remains {lead.stage.name}.</li>
          <li>Staff and viewers will no longer see this lead unless policy allows.</li>
          <li>Related customers and tasks are not automatically archived.</li>
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
              <a href={buildLeadDetailHref(reloadLeadId, listState)}>Open archived lead</a>
            </p>
          </div>
        ) : null}

        <div className={formStyles.actions}>
          <button
            type="submit"
            className={`${formStyles.submitButton} ${lifecycleStyles.destructiveButton}`}
            disabled={locked || isPending}
          >
            {isPending ? "Archiving…" : "Archive lead"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to lead
          </a>
        </div>
      </form>
    </LeadLifecycleFormShell>
  );
}
