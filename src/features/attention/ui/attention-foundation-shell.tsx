import type { AttentionShellPageSuccess } from "@/features/attention/ui/load-attention-shell-page";
import { canShowAttentionLifecycleActions } from "@/features/attention/ui/attention-workflow-visibility";
import styles from "./attention-states.module.css";

/**
 * Minimal Attention page shell for B1.7.5-A.
 * Explicitly not a complete list/detail workspace (B1.7.5-B / D).
 */
export function AttentionFoundationShell({
  page,
}: {
  page: AttentionShellPageSuccess;
}) {
  const showLifecycleActions = canShowAttentionLifecycleActions();

  return (
    <section
      className={styles.shellPanel}
      aria-labelledby="attention-foundation-title"
    >
      <h1 id="attention-foundation-title">Attention</h1>
      <p>
        Attention presentation foundation is ready for {page.organizationName}. The
        full list and detail workspace arrives in later B1.7.5 subphases.
      </p>
      <p className={styles.shellMeta}>
        Times will use {page.timeZone}. Archived items remain{" "}
        {page.capabilities.canViewArchivedItems
          ? "visible to your role when requested"
          : "hidden for your role"}
        .
      </p>
      {showLifecycleActions ? (
        <p>Lifecycle actions must never render in B1.7.5-A.</p>
      ) : null}
    </section>
  );
}
