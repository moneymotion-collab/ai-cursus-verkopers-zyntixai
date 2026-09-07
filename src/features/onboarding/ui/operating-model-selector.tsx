"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { assignOperatingModelAction } from "@/features/onboarding/actions/onboarding-actions";
import {
  OPERATING_MODEL_OPTIONS,
  operatingModelOption,
  type OperatingModelId,
} from "@/features/onboarding/domain/operating-model";
import {
  buildOnboardingPath,
  buildProductDestination,
} from "@/features/onboarding/domain/onboarding-steps";
import { buildWorkspaceConfirmationOnboardingPath } from "@/features/onboarding/domain/onboarding-routes";
import { OnboardingShell } from "./onboarding-shell";
import { OperatingModelSubmission } from "./operating-model-submission";
import styles from "./operating-model-selector.module.css";

export function OperatingModelSelector({
  organizationId,
  initialSelection = null,
  confirmedSelection,
  flow = "v2",
}: {
  organizationId: string;
  initialSelection?: OperatingModelId | null;
  confirmedSelection?: OperatingModelId;
  flow?: "legacy" | "v2";
}) {
  const router = useRouter();
  const submissionRef = useRef(new OperatingModelSubmission());
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] =
    useState<OperatingModelId | null>(
      confirmedSelection ?? initialSelection,
    );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionRef.current.isActive) {
      return;
    }
    if (!selected) {
      setError("Choose the operating model that best fits your business.");
      queueMicrotask(() => errorRef.current?.focus());
      return;
    }
    if (confirmedSelection) {
      router.replace(
        buildWorkspaceConfirmationOnboardingPath(organizationId),
      );
      router.refresh();
      return;
    }

    setPending(true);
    setError(null);
    const outcome = await submissionRef.current.submit(selected, (model) =>
      assignOperatingModelAction({
        organizationId,
        operatingModel: model,
      }),
    );

    if (outcome.kind === "confirmed") {
      const destination =
        flow === "legacy" && outcome.model !== "course_seller"
          ? buildProductDestination(organizationId)
          : flow === "legacy"
            ? buildOnboardingPath(organizationId)
            : buildWorkspaceConfirmationOnboardingPath(organizationId);
      router.replace(destination);
      router.refresh();
      return;
    }

    setPending(false);
    if (outcome.kind === "busy") {
      return;
    }
    const permissionLost =
      outcome.kind === "failed" &&
      (outcome.result?.code === "not_authenticated" ||
        outcome.result?.code === "not_authorized");
    setError(
      permissionLost
        ? "You no longer have permission to complete this action."
        : outcome.kind === "failed" && outcome.result
          ? outcome.result.message
          : "We could not confirm the operating model. Please try again.",
    );
    queueMicrotask(() => errorRef.current?.focus());
  }

  const selectedOption = selected ? operatingModelOption(selected) : null;

  return (
    <OnboardingShell currentStep="business" headingId="operating-model-title">
      <Surface className={styles.surface}>
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          aria-busy={pending}
          noValidate
        >
          <header className={styles.header}>
            <h1 id="operating-model-title" tabIndex={-1}>
              How does your business operate?
            </h1>
            <p>Choose the option that best matches how your company works.</p>
          </header>

          {error ? (
            <div
              ref={errorRef}
              className={styles.error}
              role="alert"
              tabIndex={-1}
            >
              {error}
            </div>
          ) : null}

          <fieldset
            className={styles.options}
            disabled={pending || Boolean(confirmedSelection)}
          >
            <legend className={styles.srOnly}>Choose an operating model</legend>
            {OPERATING_MODEL_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={
                  selected === option.id
                    ? `${styles.option} ${styles.optionSelected}`
                    : styles.option
                }
              >
                <input
                  type="radio"
                  name="operatingModel"
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => {
                    if (submissionRef.current.isActive) {
                      return;
                    }
                    setSelected(option.id);
                    setError(null);
                  }}
                />
                <span className={styles.optionCopy}>
                  <strong>{option.title}</strong>
                  <span>{option.description}</span>
                </span>
                <span className={styles.selectedIndicator} aria-hidden="true">
                  Selected
                </span>
              </label>
            ))}
          </fieldset>

          <div className={styles.footer}>
            <Button
              type="submit"
              size="action"
              disabled={pending || !selected}
              aria-disabled={pending || !selected}
              aria-busy={pending}
            >
              {pending ? (
                "Confirming…"
              ) : selectedOption ? (
                <>
                  <span className={styles.desktopCta}>
                    Continue with {selectedOption.title}
                  </span>
                  <span className={styles.mobileCta}>Continue</span>
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </Surface>
    </OnboardingShell>
  );
}
