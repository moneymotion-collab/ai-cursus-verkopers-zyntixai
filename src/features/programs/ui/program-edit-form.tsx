"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProgramAction } from "@/features/programs/actions/program-actions";
import { PROGRAM_DELIVERY_MODE_METADATA } from "@/features/programs/domain/delivery-mode";
import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";
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

type ProgramEditFormProps = {
  organizationId: string;
  program: ProgramDetailReadModel;
  listState: ProgramListUrlState;
  cancelHref: string;
};

export function ProgramEditForm({
  organizationId,
  program,
  listState,
  cancelHref,
}: ProgramEditFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<ProgramFormUiState>({ kind: "idle" });
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? "");
  const [deliveryMode, setDeliveryMode] = useState<ProgramDeliveryMode>(program.deliveryMode);

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

    const result = await updateProgramAction({
      organizationId,
      programId: program.id,
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

  const reloadProgramId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.programId ?? program.id
      : program.id;

  return (
    <form
      className={styles.programForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to program
      </a>
      <h1>Edit program</h1>
      <p className={styles.helpText}>
        Update the program name, delivery mode, or description. Lifecycle status and archive state
        use separate actions.
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
          <p>
            <a href={buildProgramDetailHref(reloadProgramId, listState)}>Open saved program</a>
          </p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="edit-program-details-title">
        <h2 id="edit-program-details-title">Program details</h2>

        <div className={styles.field}>
          <label htmlFor="edit-program-name">Program name (required)</label>
          <input
            id="edit-program-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={200}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "name"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "name") ? "edit-program-name-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "name") ? (
            <p id="edit-program-name-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "name")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-program-delivery">Delivery mode (required)</label>
          <select
            id="edit-program-delivery"
            name="deliveryMode"
            value={deliveryMode}
            onChange={(event) => setDeliveryMode(event.target.value as ProgramDeliveryMode)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "deliveryMode"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "deliveryMode")
                ? "edit-program-delivery-error"
                : undefined
            }
            disabled={locked}
          >
            {PROGRAM_DELIVERY_MODE_METADATA.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
          {fieldErrorMessage(fieldErrors, "deliveryMode") ? (
            <p id="edit-program-delivery-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "deliveryMode")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-program-description">Description (optional)</label>
          <textarea
            id="edit-program-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={4000}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "description"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "description")
                ? "edit-program-description-error"
                : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "description") ? (
            <p id="edit-program-description-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "description")}
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
