"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { assignOperatingModelAction } from "@/features/onboarding/actions/onboarding-actions";
import {
  OPERATING_MODEL_OPTIONS,
  type OperatingModelId,
} from "@/features/onboarding/domain/operating-model";
import {
  buildOnboardingPath,
  buildProductDestination,
} from "@/features/onboarding/domain/onboarding-steps";
import styles from "./operating-model-selector.module.css";

export function OperatingModelSelector({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<OperatingModelId | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }
    if (!selected) {
      setError("Choose the operating model that best fits your business.");
      queueMicrotask(() => errorRef.current?.focus());
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setError(null);
    const result = await assignOperatingModelAction({
      organizationId,
      operatingModel: selected,
    });

    if (!result.ok) {
      pendingRef.current = false;
      setPending(false);
      setError(result.message);
      queueMicrotask(() => errorRef.current?.focus());
      return;
    }

    const destination =
      selected === "course_seller"
        ? buildOnboardingPath(organizationId)
        : buildProductDestination(organizationId);
    router.replace(destination);
    router.refresh();
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-busy={pending}
      noValidate
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Workspace setup</p>
        <h1 id="operating-model-title">How does your business operate?</h1>
        <p>
          Choose the model that best describes your primary business. This
          configures the workspace language and available areas.
        </p>
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

      <fieldset className={styles.options} disabled={pending}>
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
                setSelected(option.id);
                setError(null);
              }}
            />
            <span className={styles.optionCopy}>
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className={styles.footer}>
        <p>
          Your organization can’t switch operating models casually after this
          choice.
        </p>
        <button type="submit" disabled={pending || !selected}>
          {pending ? "Configuring workspace…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
