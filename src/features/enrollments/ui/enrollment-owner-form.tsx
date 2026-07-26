"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateEnrollmentOwnerMetadataAction } from "@/features/enrollments/actions/enrollment-actions";
import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import type { EnrollmentMemberOption } from "@/features/enrollments/server/load-enrollment-create-options";
import {
  fieldErrorMessage,
  interpretEnrollmentFormMutationResult,
  enrollmentFormIsLocked,
  enrollmentMutationRefreshRequired,
  type EnrollmentFormUiState,
} from "@/features/enrollments/ui/enrollment-form-state";
import { buildEnrollmentDetailHref } from "@/features/enrollments/ui/enrollment-navigation";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import styles from "./enrollment-form.module.css";

type EnrollmentOwnerFormProps = {
  organizationId: string;
  enrollment: EnrollmentDetailReadModel;
  members: EnrollmentMemberOption[];
  listState: EnrollmentListUrlState;
  cancelHref: string;
  membersError?: string;
};

const NO_OWNER_VALUE = "";

/**
 * Owner reassignment only — no metadata is ever sent from this form. The
 * product has no approved metadata fields, so a raw JSON editor is
 * intentionally omitted; this keeps the update payload to organizationId,
 * enrollmentId, and ownerMemberId only.
 */
export function EnrollmentOwnerForm({
  organizationId,
  enrollment,
  members,
  listState,
  cancelHref,
  membersError,
}: EnrollmentOwnerFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<EnrollmentFormUiState>({ kind: "idle" });
  const [ownerMemberId, setOwnerMemberId] = useState(enrollment.ownerMemberId ?? NO_OWNER_VALUE);

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = enrollmentFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await updateEnrollmentOwnerMetadataAction({
      organizationId,
      enrollmentId: enrollment.id,
      ownerMemberId: ownerMemberId === NO_OWNER_VALUE ? null : ownerMemberId,
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
    <form
      className={styles.enrollmentForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to enrollment
      </a>
      <h1>Edit enrollment owner</h1>
      <p className={styles.helpText}>
        Reassign the organization member responsible for this enrollment, or clear the owner.
        Lifecycle status and archive state use separate actions.
      </p>

      {membersError ? (
        <div className={styles.formError} role="alert">
          <p>{membersError}</p>
        </div>
      ) : null}

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
            <a href={buildEnrollmentDetailHref(reloadEnrollmentId, listState)}>
              Open saved enrollment
            </a>
          </p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="edit-enrollment-owner-title">
        <h2 id="edit-enrollment-owner-title">Owner</h2>

        <div className={styles.field}>
          <label htmlFor="edit-enrollment-owner">Owner</label>
          <select
            id="edit-enrollment-owner"
            name="ownerMemberId"
            value={ownerMemberId}
            onChange={(event) => setOwnerMemberId(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "ownerMemberId"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "ownerMemberId")
                ? "edit-enrollment-owner-error"
                : undefined
            }
            disabled={locked}
          >
            <option value={NO_OWNER_VALUE}>Unassigned</option>
            {members.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </select>
          {fieldErrorMessage(fieldErrors, "ownerMemberId") ? (
            <p id="edit-enrollment-owner-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "ownerMemberId")}
            </p>
          ) : null}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
          {isPending ? "Saving changes…" : "Save changes"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
