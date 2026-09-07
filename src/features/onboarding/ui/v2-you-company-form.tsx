"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField, FormMessage } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { saveV2CoreDraftAction } from "@/features/onboarding/actions/onboarding-actions";
import {
  firstInvalidV2CoreField,
  validateV2CoreForm,
  type V2CoreFieldErrors,
  type V2CoreFormValues,
} from "@/features/onboarding/domain/v2-core-form";
import {
  TEAM_SIZE_BANDS,
  TEAM_SIZE_BAND_LABELS,
  type TeamSizeBand,
} from "@/features/onboarding/domain/onboarding-options";
import { buildOperatingModelOnboardingPath } from "@/features/onboarding/domain/operating-model";
import type { OnboardingWriteResult } from "@/features/onboarding/domain/onboarding-types";
import {
  LatestIntentAutosave,
  type AutosaveStatus,
} from "@/features/onboarding/ui/latest-intent-autosave";
import { OnboardingShell } from "./onboarding-shell";
import styles from "./v2-you-company-form.module.css";

type V2YouCompanyFormProps = {
  organizationId: string;
  initialValues: V2CoreFormValues;
};

const AUTOSAVE_DELAY_MS = 600;
const SAVING_FEEDBACK_DELAY_MS = 400;

function authoritativeCoreMatches(
  result: Extract<OnboardingWriteResult, { ok: true }>,
  expected: V2CoreFormValues,
): boolean {
  return (
    result.context.displayName === expected.displayName.trim() &&
    result.context.organizationName === expected.organizationName.trim() &&
    result.context.teamSizeBand === expected.teamSizeBand
  );
}

export function V2YouCompanyForm({
  organizationId,
  initialValues,
}: V2YouCompanyFormProps) {
  const router = useRouter();
  const formId = useId();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<V2CoreFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<
    AutosaveStatus<OnboardingWriteResult>
  >({ phase: "idle", revision: 0 });
  const continuingRef = useRef(false);
  const fieldRefs = {
    displayName: useRef<HTMLInputElement>(null),
    organizationName: useRef<HTMLInputElement>(null),
    teamSizeBand: useRef<HTMLSelectElement>(null),
  };
  const queueRef = useRef<
    LatestIntentAutosave<V2CoreFormValues, OnboardingWriteResult> | undefined
  >(undefined);

  if (!queueRef.current) {
    queueRef.current = new LatestIntentAutosave(
      initialValues,
      async (snapshot) =>
        saveV2CoreDraftAction({ organizationId, ...snapshot }),
      (result) => result.ok,
      setAutosaveStatus,
      AUTOSAVE_DELAY_MS,
      SAVING_FEEDBACK_DELAY_MS,
    );
  }

  useEffect(
    () => () => {
      queueRef.current?.dispose();
    },
    [],
  );

  function updateField<Key extends keyof V2CoreFormValues>(
    key: Key,
    value: V2CoreFormValues[Key],
  ) {
    const next = { ...values, [key]: value };
    setValues(next);
    setFieldErrors({});
    setSubmitError(null);
    const validation = validateV2CoreForm(organizationId, next);
    queueRef.current?.update(next, validation.success);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (continuingRef.current) {
      return;
    }

    queueRef.current?.cancelScheduled();
    const validation = validateV2CoreForm(organizationId, values);
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setSubmitError("Please correct the highlighted fields.");
      const firstInvalid = firstInvalidV2CoreField(validation.fieldErrors);
      if (firstInvalid) {
        fieldRefs[firstInvalid].current?.focus();
      }
      return;
    }

    continuingRef.current = true;
    setIsContinuing(true);
    setFieldErrors({});
    setSubmitError(null);

    const outcome = await queueRef.current!.flush();
    if (
      outcome.kind === "saved" &&
      outcome.result.ok &&
      authoritativeCoreMatches(outcome.result, validation.input)
    ) {
      router.replace(buildOperatingModelOnboardingPath(organizationId));
      router.refresh();
      return;
    }

    const result =
      outcome.kind === "failed" ? outcome.result : undefined;
    setSubmitError(
      result && !result.ok
        ? result.message
        : "We could not save these details. Check your connection and try again.",
    );
    if (result && !result.ok && result.fieldErrors) {
      setFieldErrors(result.fieldErrors);
    }
    continuingRef.current = false;
    setIsContinuing(false);
  }

  const backgroundError =
    autosaveStatus.phase === "error"
      ? autosaveStatus.result && !autosaveStatus.result.ok
        ? autosaveStatus.result.message
        : "We could not save your latest changes. They are still available here."
      : null;

  return (
    <OnboardingShell currentStep="you-company" headingId="onboarding-title">
      <Surface className={styles.surface}>
        <form
          className={styles.form}
          method="post"
          onSubmit={handleSubmit}
          aria-busy={
            isContinuing || autosaveStatus.phase === "saving"
          }
          noValidate
        >
          <header className={styles.header}>
            <h1 id="onboarding-title" tabIndex={-1}>
              Set up your workspace
            </h1>
            <p>
              We’ll configure ZyntixAI around the way your business operates.
              Start with a few basics about you and your company.
            </p>
          </header>

          {submitError ? (
            <div className={styles.formError} role="alert">
              <p>{submitError}</p>
            </div>
          ) : null}

          <div className={styles.fields}>
            <FormField
              id={`${formId}-displayName`}
              label="Name"
              error={fieldErrors.displayName?.[0]}
            >
              <Input
                ref={fieldRefs.displayName}
                name="displayName"
                type="text"
                autoComplete="name"
                required
                maxLength={80}
                value={values.displayName}
                disabled={isContinuing}
                onChange={(event) =>
                  updateField("displayName", event.target.value)
                }
              />
            </FormField>

            <FormField
              id={`${formId}-organizationName`}
              label="Company name"
              error={fieldErrors.organizationName?.[0]}
            >
              <Input
                ref={fieldRefs.organizationName}
                name="organizationName"
                type="text"
                autoComplete="organization"
                required
                minLength={2}
                maxLength={100}
                value={values.organizationName}
                disabled={isContinuing}
                onChange={(event) =>
                  updateField("organizationName", event.target.value)
                }
              />
            </FormField>

            <FormField
              id={`${formId}-teamSizeBand`}
              label="Team size"
              error={fieldErrors.teamSizeBand?.[0]}
            >
              <Select
                ref={fieldRefs.teamSizeBand}
                name="teamSizeBand"
                required
                value={values.teamSizeBand}
                disabled={isContinuing}
                onChange={(event) =>
                  updateField(
                    "teamSizeBand",
                    event.target.value as TeamSizeBand | "",
                  )
                }
              >
                <option value="">Select team size</option>
                {TEAM_SIZE_BANDS.map((value) => (
                  <option key={value} value={value}>
                    {TEAM_SIZE_BAND_LABELS[value]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div
            className={styles.saveStatus}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {autosaveStatus.phase === "saving" ? (
              <span>Saving…</span>
            ) : backgroundError ? (
              <FormMessage tone="error">{backgroundError}</FormMessage>
            ) : null}
          </div>

          <div className={styles.actions}>
            <Button
              type="submit"
              size="action"
              disabled={isContinuing}
            >
              {isContinuing ? "Saving…" : "Continue"}
            </Button>
          </div>
        </form>
      </Surface>
    </OnboardingShell>
  );
}
