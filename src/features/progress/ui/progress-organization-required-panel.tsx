import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import styles from "./progress-detail.module.css";

type ProgressOrganizationRequiredPanelProps = {
  organizations: OrganizationOption[];
  targetPath: string;
  title?: string;
  description?: string;
};

export function ProgressOrganizationRequiredPanel({
  organizations,
  targetPath,
  title = "Organization selection required",
  description = "Select an organization to continue.",
}: ProgressOrganizationRequiredPanelProps) {
  return (
    <section className={styles.statePanel} aria-labelledby="progress-org-required-title">
      <h1 id="progress-org-required-title">{title}</h1>
      <p>{description}</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a href={`${targetPath}?org=${encodeURIComponent(organization.organizationId)}`}>
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
