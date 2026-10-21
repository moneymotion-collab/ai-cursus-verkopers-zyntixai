import { Alert } from "@/components/ui/alert";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import { resolveAttentionEmptyState } from "@/features/attention/ui/attention-empty-state";
import styles from "./attention-states.module.css";

export function AttentionAuthRequiredPanel() {
  return (
    <section className={styles.statePanel} aria-labelledby="attention-auth-required-title">
      <h1 id="attention-auth-required-title">Sign in required</h1>
      <p>Please sign in to view Attention for your organization.</p>
    </section>
  );
}

export function AttentionOrganizationUnavailablePanel({
  message = "No active organization membership is available for this account.",
}: {
  message?: string;
}) {
  return (
    <section
      className={styles.statePanel}
      aria-labelledby="attention-org-unavailable-title"
    >
      <h1 id="attention-org-unavailable-title">Organization unavailable</h1>
      <p>{message}</p>
    </section>
  );
}

export function AttentionOrganizationRequiredPanel({
  organizations,
  targetPath = ATTENTION_ROUTE,
  title = "Organization selection required",
  description = "Select an organization to continue.",
}: {
  organizations: OrganizationOption[];
  targetPath?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section
      className={styles.statePanel}
      aria-labelledby="attention-org-required-title"
    >
      <h1 id="attention-org-required-title">{title}</h1>
      <p>{description}</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a
              href={`${targetPath}?org=${encodeURIComponent(organization.organizationId)}`}
            >
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Uniform unavailable presentation.
 * Must not distinguish missing / cross-tenant / archived-not-allowed / unauthorized.
 */
export function AttentionUnavailablePanel({
  backHref = ATTENTION_ROUTE,
}: {
  backHref?: string;
}) {
  return (
    <section
      className={styles.statePanel}
      aria-labelledby="attention-unavailable-title"
    >
      <h1 id="attention-unavailable-title">Attention unavailable</h1>
      <p>
        This attention item is unavailable. It may have been removed or you may not
        have access.
      </p>
      <p>
        <a href={backHref}>Back to Attention</a>
      </p>
    </section>
  );
}

export function AttentionEmptyPanel({
  hasActiveFilters = false,
  outOfRangePage = false,
  clearHref,
}: {
  hasActiveFilters?: boolean;
  outOfRangePage?: boolean;
  clearHref?: string;
}) {
  const empty = resolveAttentionEmptyState({
    hasActiveFilters,
    outOfRangePage,
    clearHref,
  });
  return (
    <section className={styles.emptyPanel} aria-labelledby="attention-empty-title">
      <h2 id="attention-empty-title">{empty.title}</h2>
      <p>{empty.description}</p>
      {empty.clearHref ? (
        <p>
          <a href={empty.clearHref}>
            {outOfRangePage ? "Go to first page" : "Reset filters"}
          </a>
        </p>
      ) : null}
    </section>
  );
}

export function AttentionQueryErrorPanel({
  title = "Unable to load Attention",
  message = "An unexpected error occurred while loading Attention. Please try again.",
  retryHref,
}: {
  title?: string;
  message?: string;
  retryHref?: string;
}) {
  return (
    <section className={styles.statePanel} aria-labelledby="attention-error-title">
      <h1 id="attention-error-title">{title}</h1>
      <Alert title={title} variant="error">
        {message}
      </Alert>
      {retryHref ? (
        <p>
          <a href={retryHref}>Try again</a>
        </p>
      ) : null}
    </section>
  );
}
