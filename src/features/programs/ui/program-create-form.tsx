"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createProgramAction } from "@/features/programs/actions/program-actions";
import { PROGRAM_DELIVERY_MODE_METADATA } from "@/features/programs/domain/delivery-mode";
import type { ProgramDeliveryMode } from "@/features/programs/domain/types";
import {
  fieldErrorMessage,
  interpretProgramFormMutationResult,
  programFormIsLocked,
  programMutationRefreshRequired,
  type ProgramFormUiState,
} from "@/features/programs/ui/program-form-state";
import { buildProgramDetailHref } from "@/features/programs/ui/program-navigation";
import type { ProgramListUrlState } from "@/features/programs/ui/program-list-search-params";
import styles from "./program-form.module.css";

type ProgramCreateFormProps = {
  organizationId: string;
  listState: ProgramListUrlState;
  cancelHref: string;
};

const DEFAULT_DELIVERY_MODE: ProgramDeliveryMode = "self_paced";

export function ProgramCreateForm({
  organizationId,
  listState,
  cancelHref,
}: ProgramCreateFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<ProgramFormUiState>({ kind: "idle" });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<ProgramDeliveryMode>(DEFAULT_DELIVERY_MODE);

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = programFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await createProgramAction({
      organizationId,
      name: name.trim(),
      deliveryMode,
      description: description.trim() || null,
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

  const committedProgramId =
    uiState.kind === "reload_required" && uiState.committed ? uiState.programId : undefined;

  return (
    <form
      className={styles.programForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to programs
      </a>
      <h1>Create program</h1>
      <p className={styles.helpText}>
        Programs define how you deliver coaching or learning. New programs start as draft.
        Enrollment management follows in a later phase.
      </p>

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
          {committedProgramId ? (
            <p>
              <a href={buildProgramDetailHref(committedProgramId, listState)}>Open saved program</a>
            </p>
          ) : null}
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="create-program-details-title">
        <h2 id="create-program-details-title">Program details</h2>

        <div className={styles.field}>
          <label htmlFor="create-program-name">Program name (required)</label>
          <input
            id="create-program-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={200}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "name"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "name") ? "create-program-name-error" : "create-program-name-help"
            }
            disabled={locked}
          />
          <p id="create-program-name-help" className={styles.helpText}>
            Use a clear name your team will recognize.
          </p>
          {fieldErrorMessage(fieldErrors, "name") ? (
            <p id="create-program-name-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "name")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-program-delivery">Delivery mode (required)</label>
          <select
            id="create-program-delivery"
            name="deliveryMode"
            value={deliveryMode}
            onChange={(event) => setDeliveryMode(event.target.value as ProgramDeliveryMode)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "deliveryMode"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "deliveryMode")
                ? "create-program-delivery-error"
                : "create-program-delivery-help"
            }
            disabled={locked}
          >
            {PROGRAM_DELIVERY_MODE_METADATA.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
          <p id="create-program-delivery-help" className={styles.helpText}>
            How this program is primarily delivered.
          </p>
          {fieldErrorMessage(fieldErrors, "deliveryMode") ? (
            <p id="create-program-delivery-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "deliveryMode")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-program-description">Description (optional)</label>
          <textarea
            id="create-program-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={4000}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "description"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "description")
                ? "create-program-description-error"
                : "create-program-description-help"
            }
            disabled={locked}
          />
          <p id="create-program-description-help" className={styles.helpText}>
            Optional context for your team. Not shown as marketing copy.
          </p>
          {fieldErrorMessage(fieldErrors, "description") ? (
            <p id="create-program-description-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "description")}
            </p>
          ) : null}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
          {isPending ? "Creating…" : "Create program"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
