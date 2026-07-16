"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createLeadAction } from "@/features/leads/actions/lead-actions";
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

type LeadCreateFormProps = {
  organizationId: string;
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

export function LeadCreateForm({
  organizationId,
  listState,
  ownerOptions,
  cancelHref,
}: LeadCreateFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<LeadFormUiState>({ kind: "idle" });
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerMemberId, setOwnerMemberId] = useState(LEAD_OWNER_UNASSIGNED_VALUE);
  const [sourceType, setSourceType] = useState("manual");
  const [sourceDetail, setSourceDetail] = useState("");
  const [pursuitLabel, setPursuitLabel] = useState("");

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

    const result = await createLeadAction({
      organizationId,
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

  const committedLeadId =
    uiState.kind === "reload_required" && uiState.committed ? uiState.leadId : undefined;

  return (
    <form
      className={styles.leadForm}
      method="post"
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to leads
      </a>
      <h1>Create lead</h1>

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
          {committedLeadId ? (
            <p>
              <a href={buildLeadDetailHref(committedLeadId, listState)}>Open saved lead</a>
            </p>
          ) : null}
        </div>
      ) : null}

      {ownerOptions.loadError ? (
        <div className={styles.formNotice} role="status">
          <p>{ownerOptions.loadError}</p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="create-lead-identity-title">
        <h2 id="create-lead-identity-title">Lead identity</h2>

        <div className={styles.field}>
          <label htmlFor="create-lead-display-name">Display name (required)</label>
          <input
            id="create-lead-display-name"
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "displayName"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "displayName")
                ? "create-lead-display-name-error"
                : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "displayName") ? (
            <p id="create-lead-display-name-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "displayName")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-lead-first-name">First name</label>
          <input
            id="create-lead-first-name"
            name="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="create-lead-last-name">Last name</label>
          <input
            id="create-lead-last-name"
            name="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="create-lead-email">Email</label>
          <input
            id="create-lead-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "email"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "email") ? "create-lead-email-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "email") ? (
            <p id="create-lead-email-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "email")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-lead-phone">Phone</label>
          <input
            id="create-lead-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="create-lead-owner">Owner</label>
          <select
            id="create-lead-owner"
            name="ownerMemberId"
            value={ownerMemberId}
            onChange={(event) => setOwnerMemberId(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "ownerMemberId"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "ownerMemberId") ? "create-lead-owner-error" : undefined
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
            <p id="create-lead-owner-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "ownerMemberId")}
            </p>
          ) : null}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="create-lead-source-title">
        <h2 id="create-lead-source-title">Source and pursuit</h2>

        <div className={styles.field}>
          <label htmlFor="create-lead-source-type">Source type</label>
          <input
            id="create-lead-source-type"
            name="sourceType"
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="create-lead-source-detail">Source detail</label>
          <input
            id="create-lead-source-detail"
            name="sourceDetail"
            value={sourceDetail}
            onChange={(event) => setSourceDetail(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="create-lead-pursuit">Pursuit label</label>
          <input
            id="create-lead-pursuit"
            name="pursuitLabel"
            value={pursuitLabel}
            onChange={(event) => setPursuitLabel(event.target.value)}
            disabled={locked}
          />
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
          {isPending ? "Creating lead…" : "Create lead"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
