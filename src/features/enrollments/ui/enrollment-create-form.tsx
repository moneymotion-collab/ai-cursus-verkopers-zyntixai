"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createEnrollmentAction } from "@/features/enrollments/actions/enrollment-actions";
import { ENROLLMENT_INITIAL_STATUSES, getEnrollmentStatusLabel } from "@/features/enrollments/domain/status";
import type { EnrollmentInitialStatus } from "@/features/enrollments/domain/types";
import type {
  EnrollmentCustomerOption,
  EnrollmentMemberOption,
  EnrollmentProgramOption,
} from "@/features/enrollments/server/load-enrollment-create-options";
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

type EnrollmentCreateFormProps = {
  organizationId: string;
  listState: EnrollmentListUrlState;
  cancelHref: string;
  customers: EnrollmentCustomerOption[];
  programs: EnrollmentProgramOption[];
  members: EnrollmentMemberOption[];
  optionsError?: string;
};

const DEFAULT_INITIAL_STATUS: EnrollmentInitialStatus = "pending";
const NO_OWNER_VALUE = "";

export function EnrollmentCreateForm({
  organizationId,
  listState,
  cancelHref,
  customers,
  programs,
  members,
  optionsError,
}: EnrollmentCreateFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<EnrollmentFormUiState>({ kind: "idle" });
  const [customerId, setCustomerId] = useState("");
  const [programId, setProgramId] = useState("");
  const [initialStatus, setInitialStatus] = useState<EnrollmentInitialStatus>(
    DEFAULT_INITIAL_STATUS,
  );
  const [ownerMemberId, setOwnerMemberId] = useState(NO_OWNER_VALUE);

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = enrollmentFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  const hasCustomers = customers.length > 0;
  const hasPrograms = programs.length > 0;
  const canSubmit = hasCustomers && hasPrograms;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked || !canSubmit) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await createEnrollmentAction({
      organizationId,
      customerId,
      programId,
      initialStatus,
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

  const committedEnrollmentId =
    uiState.kind === "reload_required" && uiState.committed ? uiState.enrollmentId : undefined;

  return (
    <form
      className={styles.enrollmentForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to enrollments
      </a>
      <h1>Create enrollment</h1>
      <p className={styles.helpText}>
        Enroll an eligible customer into an active program. After creation, authorized users can
        manage lifecycle status and ownership from the enrollment detail. Metadata editing is not
        available yet.
      </p>

      {optionsError ? (
        <div className={styles.formError} role="alert">
          <p>{optionsError}</p>
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
          {committedEnrollmentId ? (
            <p>
              <a href={buildEnrollmentDetailHref(committedEnrollmentId, listState)}>
                Open saved enrollment
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="create-enrollment-details-title">
        <h2 id="create-enrollment-details-title">Enrollment details</h2>

        <div className={styles.field}>
          <label htmlFor="create-enrollment-customer">Customer (required)</label>
          {hasCustomers ? (
            <select
              id="create-enrollment-customer"
              name="customerId"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              required
              aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "customerId"))}
              aria-describedby={
                fieldErrorMessage(fieldErrors, "customerId")
                  ? "create-enrollment-customer-error"
                  : undefined
              }
              disabled={locked}
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers.map((customer) => (
                <option key={customer.value} value={customer.value}>
                  {customer.label}
                </option>
              ))}
            </select>
          ) : (
            <p className={styles.helpText}>
              No eligible customers are available. Customers must be active or onboarding to
              receive a new enrollment.
            </p>
          )}
          {fieldErrorMessage(fieldErrors, "customerId") ? (
            <p id="create-enrollment-customer-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "customerId")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-enrollment-program">Program (required)</label>
          {hasPrograms ? (
            <select
              id="create-enrollment-program"
              name="programId"
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
              required
              aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "programId"))}
              aria-describedby={
                fieldErrorMessage(fieldErrors, "programId")
                  ? "create-enrollment-program-error"
                  : undefined
              }
              disabled={locked}
            >
              <option value="" disabled>
                Select a program
              </option>
              {programs.map((program) => (
                <option key={program.value} value={program.value}>
                  {program.label}
                </option>
              ))}
            </select>
          ) : (
            <p className={styles.helpText}>
              No eligible programs are available. Programs must be active to receive a new
              enrollment.
            </p>
          )}
          {fieldErrorMessage(fieldErrors, "programId") ? (
            <p id="create-enrollment-program-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "programId")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-enrollment-status">Initial status (required)</label>
          <select
            id="create-enrollment-status"
            name="initialStatus"
            value={initialStatus}
            onChange={(event) =>
              setInitialStatus(event.target.value as EnrollmentInitialStatus)
            }
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "initialStatus"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "initialStatus")
                ? "create-enrollment-status-error"
                : undefined
            }
            disabled={locked}
          >
            {ENROLLMENT_INITIAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getEnrollmentStatusLabel(status)}
              </option>
            ))}
          </select>
          {fieldErrorMessage(fieldErrors, "initialStatus") ? (
            <p id="create-enrollment-status-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "initialStatus")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-enrollment-owner">Owner (optional)</label>
          <select
            id="create-enrollment-owner"
            name="ownerMemberId"
            value={ownerMemberId}
            onChange={(event) => setOwnerMemberId(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "ownerMemberId"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "ownerMemberId")
                ? "create-enrollment-owner-error"
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
            <p id="create-enrollment-owner-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "ownerMemberId")}
            </p>
          ) : null}
        </div>
      </section>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={locked || isPending || !canSubmit}
        >
          {isPending ? "Creating…" : "Create enrollment"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
