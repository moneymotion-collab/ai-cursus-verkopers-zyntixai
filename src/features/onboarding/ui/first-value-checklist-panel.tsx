"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dismissFirstValueChecklistAction } from "@/features/onboarding/actions/onboarding-actions";
import type { FirstValueChecklistViewModel } from "@/features/onboarding/domain/first-value-checklist";
import styles from "./first-value-checklist-panel.module.css";

type FirstValueChecklistPanelProps = {
  checklist: FirstValueChecklistViewModel;
};

export function FirstValueChecklistPanel({
  checklist,
}: FirstValueChecklistPanelProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!checklist.visible) {
    return null;
  }

  async function onDismiss() {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setPending(true);
    setError(null);

    const result = await dismissFirstValueChecklistAction({
      organizationId: checklist.organizationId,
    });

    if (!result.ok) {
      setError(result.message);
      pendingRef.current = false;
      setPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <section
      className={styles.panel}
      aria-labelledby="first-value-checklist-title"
      aria-busy={pending}
    >
      <div className={styles.headerRow}>
        <div>
          <h2 id="first-value-checklist-title" className={styles.title}>
            Get your first results
          </h2>
          <p className={styles.progress}>
            {checklist.completedCount} of {checklist.totalRequired} complete
          </p>
        </div>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
          disabled={pending}
        >
          {pending ? "Dismissing…" : "Dismiss checklist"}
        </button>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <ul className={styles.list}>
        <li className={styles.item}>
          <span
            className={
              checklist.companySetupComplete ? styles.statusDone : styles.statusTodo
            }
          >
            {checklist.companySetupComplete ? "Done" : "To do"}
          </span>
          <div className={styles.itemBody}>
            <span className={styles.itemLabel}>Finish company setup</span>
            {!checklist.companySetupComplete ? (
              <a className={styles.itemLink} href={checklist.companySetupHref}>
                Continue setup
              </a>
            ) : null}
          </div>
        </li>
        <li className={styles.item}>
          <span
            className={
              checklist.firstLeadComplete ? styles.statusDone : styles.statusTodo
            }
          >
            {checklist.firstLeadComplete ? "Done" : "To do"}
          </span>
          <div className={styles.itemBody}>
            <span className={styles.itemLabel}>Add your first lead</span>
            {!checklist.firstLeadComplete ? (
              <a className={styles.itemLink} href={checklist.firstLeadHref}>
                Add your first lead
              </a>
            ) : null}
          </div>
        </li>
        <li className={styles.item}>
          <span
            className={
              checklist.firstTaskComplete ? styles.statusDone : styles.statusTodo
            }
          >
            {checklist.firstTaskComplete ? "Done" : "To do"}
          </span>
          <div className={styles.itemBody}>
            <span className={styles.itemLabel}>Create your first task</span>
            {!checklist.firstTaskComplete ? (
              <a className={styles.itemLink} href={checklist.firstTaskHref}>
                Create your first task
              </a>
            ) : null}
          </div>
        </li>
      </ul>

      <p className={styles.softLinkRow}>
        <a className={styles.softLink} href={checklist.customerSoftLinkHref}>
          Review customer workspace
        </a>
      </p>
    </section>
  );
}
