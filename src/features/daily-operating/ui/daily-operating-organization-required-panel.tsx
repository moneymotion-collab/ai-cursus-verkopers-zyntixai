import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import { buildDailyOperatingHomePath } from "@/features/daily-operating/domain/compose-daily-operating-brief";
import styles from "./daily-operating-brief.module.css";

type DailyOperatingOrganizationRequiredPanelProps = {
  organizations: OrganizationOption[];
};

export function DailyOperatingOrganizationRequiredPanel({
  organizations,
}: DailyOperatingOrganizationRequiredPanelProps) {
  return (
    <section
      className={styles.orgRequired}
      aria-labelledby="daily-operating-org-required-title"
    >
      <h1 id="daily-operating-org-required-title">
        Organization selection required
      </h1>
      <p>Select an organization to view today’s operating brief.</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a href={buildDailyOperatingHomePath(organization.organizationId)}>
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
