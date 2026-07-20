"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeOnboardingAction,
  saveOnboardingDraftAction,
} from "@/features/onboarding/actions/onboarding-actions";
import type { OnboardingContext } from "@/features/onboarding/domain/onboarding-types";
import {
  ONBOARDING_STEPS,
  buildCompletePayload,
  buildDraftPayload,
  buildProductDestination,
  firstInvalidField,
  formValuesFromContext,
  optionGroups,
  parseOnboardingStep,
  resolveInitialOnboardingStep,
  reviewLabels,
  validateOnboardingStep,
  type OnboardingFormValues,
  type OnboardingStepNumber,
} from "@/features/onboarding/domain/onboarding-steps";
import styles from "./onboarding-wizard.module.css";

type OnboardingWizardProps = {
  context: OnboardingContext;
  initialStep?: number;
};

type WizardUiState =
  | { kind: "idle" }
  | { kind: "pending"; action: "draft" | "complete" }
  | {
      kind: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

const options = optionGroups();

export function OnboardingWizard({ context, initialStep }: OnboardingWizardProps) {
  const router = useRouter();
  const formId = useId();
  const pendingRef = useRef(false);
  const [values, setValues] = useState<OnboardingFormValues>(() =>
    formValuesFromContext(context),
  );
  const [step, setStep] = useState<OnboardingStepNumber>(() =>
    initialStep
      ? parseOnboardingStep(initialStep)
      : resolveInitialOnboardingStep(formValuesFromContext(context)),
  );
  const [uiState, setUiState] = useState<WizardUiState>({ kind: "idle" });
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  const isPending = uiState.kind === "pending";
  const fieldErrors = uiState.kind === "error" ? uiState.fieldErrors : undefined;
  const formError = uiState.kind === "error" ? uiState.message : undefined;
  const stepMeta = ONBOARDING_STEPS[step - 1]!;
  const review = reviewLabels(values);

  useEffect(() => {
    if (uiState.kind !== "error") {
      return;
    }
    const target = firstInvalidField(uiState.fieldErrors ?? {});
    if (target) {
      const element = document.getElementById(`${formId}-${target}`);
      element?.focus();
      return;
    }
    errorSummaryRef.current?.focus();
  }, [uiState, formId]);

  function updateField<K extends keyof OnboardingFormValues>(
    key: K,
    value: OnboardingFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function saveCurrentStepAndContinue() {
    if (pendingRef.current) {
      return;
    }

    const localErrors = validateOnboardingStep(step, values);
    if (Object.keys(localErrors).length > 0) {
      setUiState({
        kind: "error",
        message: "Please correct the highlighted fields.",
        fieldErrors: localErrors,
      });
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending", action: "draft" });

    const result = await saveOnboardingDraftAction(
      buildDraftPayload(context.organizationId, step, values),
    );

    if (!result.ok) {
      setUiState({
        kind: "error",
        message: result.message,
        fieldErrors: result.fieldErrors,
      });
      pendingRef.current = false;
      return;
    }

    setValues(formValuesFromContext(result.context));
    setUiState({ kind: "idle" });
    pendingRef.current = false;

    if (step < 3) {
      setStep((step + 1) as OnboardingStepNumber);
      return;
    }
  }

  async function completeSetup() {
    if (pendingRef.current) {
      return;
    }

    const localErrors = validateOnboardingStep(3, values);
    if (Object.keys(localErrors).length > 0) {
      setUiState({
        kind: "error",
        message: "Please correct the highlighted fields.",
        fieldErrors: localErrors,
      });
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending", action: "complete" });

    const result = await completeOnboardingAction(
      buildCompletePayload(context.organizationId, values),
    );

    if (!result.ok) {
      setUiState({
        kind: "error",
        message: result.message,
        fieldErrors: result.fieldErrors,
      });
      pendingRef.current = false;
      return;
    }

    router.replace(buildProductDestination(result.context.organizationId));
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 3) {
      await completeSetup();
      return;
    }
    await saveCurrentStepAndContinue();
  }

  function handleBack() {
    if (isPending || step === 1) {
      return;
    }
    setUiState({ kind: "idle" });
    setStep((step - 1) as OnboardingStepNumber);
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors?.[name]?.[0];
  }

  return (
    <form
      className={styles.form}
      method="post"
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <div className={styles.header}>
        <p className={styles.progress} aria-current="step">
          {stepMeta.progressLabel}
        </p>
        <ol className={styles.progressTrack} aria-label="Onboarding progress">
          {ONBOARDING_STEPS.map((item) => (
            <li
              key={item.step}
              className={
                item.step < step
                  ? styles.progressDone
                  : item.step === step
                    ? styles.progressCurrent
                    : styles.progressTodo
              }
              aria-current={item.step === step ? "step" : undefined}
            >
              <span className={styles.srOnly}>{item.progressLabel}</span>
              <span aria-hidden="true">{item.step}</span>
            </li>
          ))}
        </ol>
        <h1 id="onboarding-title">{stepMeta.title}</h1>
        <p className={styles.subtitle}>{stepMeta.supportingCopy}</p>
      </div>

      {formError ? (
        <div
          ref={errorSummaryRef}
          className={styles.formError}
          role="alert"
          tabIndex={-1}
        >
          <p>{formError}</p>
        </div>
      ) : null}

      {step === 1 ? (
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor={`${formId}-displayName`}>Your name</label>
            <input
              id={`${formId}-displayName`}
              name="displayName"
              type="text"
              autoComplete="name"
              value={values.displayName}
              disabled={isPending}
              aria-invalid={Boolean(fieldError("displayName"))}
              aria-describedby={
                fieldError("displayName")
                  ? `${formId}-displayName-error`
                  : `${formId}-displayName-help`
              }
              onChange={(event) => updateField("displayName", event.target.value)}
            />
            <p id={`${formId}-displayName-help`} className={styles.help}>
              Shown in your workspace and activity.
            </p>
            {fieldError("displayName") ? (
              <p id={`${formId}-displayName-error`} className={styles.fieldError}>
                {fieldError("displayName")}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor={`${formId}-organizationName`}>Company name</label>
            <input
              id={`${formId}-organizationName`}
              name="organizationName"
              type="text"
              autoComplete="organization"
              value={values.organizationName}
              disabled={isPending}
              aria-invalid={Boolean(fieldError("organizationName"))}
              aria-describedby={
                fieldError("organizationName")
                  ? `${formId}-organizationName-error`
                  : `${formId}-organizationName-help`
              }
              onChange={(event) =>
                updateField("organizationName", event.target.value)
              }
            />
            <p id={`${formId}-organizationName-help`} className={styles.help}>
              The organization name used across ZyntixAI.
            </p>
            {fieldError("organizationName") ? (
              <p
                id={`${formId}-organizationName-error`}
                className={styles.fieldError}
              >
                {fieldError("organizationName")}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor={`${formId}-businessType`}>Business type</label>
            <select
              id={`${formId}-businessType`}
              name="businessType"
              value={values.businessType}
              disabled={isPending}
              aria-invalid={Boolean(fieldError("businessType"))}
              aria-describedby={
                fieldError("businessType")
                  ? `${formId}-businessType-error`
                  : undefined
              }
              onChange={(event) =>
                updateField(
                  "businessType",
                  event.target.value as OnboardingFormValues["businessType"],
                )
              }
            >
              <option value="">Select a business type</option>
              {options.businessTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError("businessType") ? (
              <p id={`${formId}-businessType-error`} className={styles.fieldError}>
                {fieldError("businessType")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor={`${formId}-primaryOffering`}>Main offer</label>
            <select
              id={`${formId}-primaryOffering`}
              name="primaryOffering"
              value={values.primaryOffering}
              disabled={isPending}
              aria-invalid={Boolean(fieldError("primaryOffering"))}
              aria-describedby={
                fieldError("primaryOffering")
                  ? `${formId}-primaryOffering-error`
                  : undefined
              }
              onChange={(event) =>
                updateField(
                  "primaryOffering",
                  event.target.value as OnboardingFormValues["primaryOffering"],
                )
              }
            >
              <option value="">Select your main offer</option>
              {options.primaryOfferings.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError("primaryOffering") ? (
              <p
                id={`${formId}-primaryOffering-error`}
                className={styles.fieldError}
              >
                {fieldError("primaryOffering")}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor={`${formId}-primaryAudience`}>Primary audience</label>
            <select
              id={`${formId}-primaryAudience`}
              name="primaryAudience"
              value={values.primaryAudience}
              disabled={isPending}
              aria-invalid={Boolean(fieldError("primaryAudience"))}
              aria-describedby={
                fieldError("primaryAudience")
                  ? `${formId}-primaryAudience-error`
                  : undefined
              }
              onChange={(event) =>
                updateField(
                  "primaryAudience",
                  event.target.value as OnboardingFormValues["primaryAudience"],
                )
              }
            >
              <option value="">Select your primary audience</option>
              {options.primaryAudiences.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError("primaryAudience") ? (
              <p
                id={`${formId}-primaryAudience-error`}
                className={styles.fieldError}
              >
                {fieldError("primaryAudience")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={styles.fields}>
          <div className={styles.review} aria-label="Setup summary">
            <p>
              <strong>Name:</strong> {review.displayName}
            </p>
            <p>
              <strong>Company:</strong> {review.organizationName}
            </p>
            <p>
              <strong>Business:</strong> {review.businessType}
            </p>
            <p>
              <strong>Offer:</strong> {review.primaryOffering}
            </p>
            <p>
              <strong>Audience:</strong> {review.primaryAudience}
            </p>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${formId}-primaryGoal`}>Primary goal</label>
            <select
              id={`${formId}-primaryGoal`}
              name="primaryGoal"
              value={values.primaryGoal}
              disabled={isPending}
              aria-invalid={Boolean(fieldError("primaryGoal"))}
              aria-describedby={
                fieldError("primaryGoal")
                  ? `${formId}-primaryGoal-error`
                  : undefined
              }
              onChange={(event) =>
                updateField(
                  "primaryGoal",
                  event.target.value as OnboardingFormValues["primaryGoal"],
                )
              }
            >
              <option value="">Select a goal</option>
              {options.primaryGoals.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError("primaryGoal") ? (
              <p id={`${formId}-primaryGoal-error`} className={styles.fieldError}>
                {fieldError("primaryGoal")}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor={`${formId}-teamSizeBand`}>
              Team size <span className={styles.optional}>(optional)</span>
            </label>
            <select
              id={`${formId}-teamSizeBand`}
              name="teamSizeBand"
              value={values.teamSizeBand}
              disabled={isPending}
              onChange={(event) =>
                updateField(
                  "teamSizeBand",
                  event.target.value as OnboardingFormValues["teamSizeBand"],
                )
              }
            >
              <option value="">Prefer not to say</option>
              {options.teamSizeBands.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <div className={styles.actions}>
        {step > 1 ? (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleBack}
            disabled={isPending}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className={styles.submit} disabled={isPending}>
          {isPending
            ? uiState.kind === "pending" && uiState.action === "complete"
              ? "Completing setup…"
              : "Saving…"
            : step === 3
              ? "Complete setup"
              : "Save and continue"}
        </button>
      </div>
    </form>
  );
}
