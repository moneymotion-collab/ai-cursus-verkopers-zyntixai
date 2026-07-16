"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadProfileAction } from "@/features/leads/actions/lead-actions";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadOwnerFormOptions } from "@/features/leads/ui/load-lead-workflow-page";
import { LEAD_OWNER_UNASSIGNED_VALUE } from "@/features/leads/ui/lead-list-search-params";
import {
  fieldErrorMessage,
  interpretLeadFormMutationResult,
  leadFormIsLocked,
  leadMutationRefreshRequired,
  type LeadFormUiState,
} from "@/features/leads/ui/lead-form-state";
import { buildLeadDetailHref } from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";
import styles from "./lead-form.module.css";

type LeadEditFormProps = {
  organizationId: string;
  lead: LeadDetailReadModel;
  listState: LeadListUrlState;
  ownerOptions: LeadOwnerFormOptions;
  cancelHref: string;
};

function resolveOwnerMemberId(value: string): string | null {
  if (!value || value === LEAD_OWNER_UNASSIGNED_VALUE) {
    return null;
  }
  return value;
}

function initialOwnerValue(lead: LeadDetailReadModel): string {
  return lead.ownerMemberId ?? LEAD_OWNER_UNASSIGNED_VALUE;
}

export function LeadEditForm({
  organizationId,
  lead,
  listState,
  ownerOptions,
  cancelHref,
}: LeadEditFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<LeadFormUiState>({ kind: "idle" });
  const [displayName, setDisplayName] = useState(lead.displayName);
  const [firstName, setFirstName] = useState(lead.firstName ?? "");
  const [lastName, setLastName] = useState(lead.lastName ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [ownerMemberId, setOwnerMemberId] = useState(initialOwnerValue(lead));
  const [sourceType, setSourceType] = useState(lead.sourceType);
  const [sourceDetail, setSourceDetail] = useState(lead.sourceDetail ?? "");
  const [pursuitLabel, setPursuitLabel] = useState(lead.pursuitLabel ?? "");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = leadFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await updateLeadProfileAction({
      organizationId,
      leadId: lead.id,
      displayName: displayName.trim(),
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      ownerMemberId: resolveOwnerMemberId(ownerMemberId),
      sourceType: sourceType.trim() || "manual",
      sourceDetail: sourceDetail.trim() || null,
      pursuitLabel: pursuitLabel.trim() || null,
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
    <form
      className={styles.leadForm}
      method="post"
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to lead
      </a>
      <h1>Edit lead</h1>

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind === "field_error" && uiState.message ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind === "reload_required" ? (
        <div className={styles.formNotice} role="status">
          <p>{uiState.message}</p>
          <p>
            <a href={buildLeadDetailHref(reloadLeadId, listState)}>Open saved lead</a>
          </p>
        </div>
      ) : null}

      {ownerOptions.loadError ? (
        <div className={styles.formNotice} role="status">
          <p>{ownerOptions.loadError}</p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="edit-lead-identity-title">
        <h2 id="edit-lead-identity-title">Lead identity</h2>

        <div className={styles.field}>
          <label htmlFor="edit-lead-display-name">Display name (required)</label>
          <input
            id="edit-lead-display-name"
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "displayName"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "displayName")
                ? "edit-lead-display-name-error"
                : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "displayName") ? (
            <p id="edit-lead-display-name-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "displayName")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-lead-first-name">First name</label>
          <input
            id="edit-lead-first-name"
            name="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-lead-last-name">Last name</label>
          <input
            id="edit-lead-last-name"
            name="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-lead-email">Email</label>
          <input
            id="edit-lead-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "email"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "email") ? "edit-lead-email-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "email") ? (
            <p id="edit-lead-email-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "email")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-lead-phone">Phone</label>
          <input
            id="edit-lead-phone"
            name="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-lead-owner">Owner</label>
          <select
            id="edit-lead-owner"
            name="ownerMemberId"
            value={ownerMemberId}
            onChange={(event) => setOwnerMemberId(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "ownerMemberId"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "ownerMemberId")
                ? "edit-lead-owner-error"
                : undefined
            }
            disabled={locked}
          >
            <option value={LEAD_OWNER_UNASSIGNED_VALUE}>Unassigned</option>
            {ownerOptions.members.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </select>
          {fieldErrorMessage(fieldErrors, "ownerMemberId") ? (
            <p id="edit-lead-owner-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "ownerMemberId")}
            </p>
          ) : null}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="edit-lead-source-title">
        <h2 id="edit-lead-source-title">Source and pursuit</h2>

        <div className={styles.field}>
          <label htmlFor="edit-lead-source-type">Source type (required)</label>
          <input
            id="edit-lead-source-type"
            name="sourceType"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "sourceType"))}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-lead-source-detail">Source detail</label>
          <input
            id="edit-lead-source-detail"
            name="sourceDetail"
            value={sourceDetail}
            onChange={(event) => setSourceDetail(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-lead-pursuit-label">Pursuit label</label>
          <input
            id="edit-lead-pursuit-label"
            name="pursuitLabel"
            value={pursuitLabel}
            onChange={(event) => setPursuitLabel(event.target.value)}
            disabled={locked}
          />
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
          {isPending ? "Saving lead…" : "Save lead"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
