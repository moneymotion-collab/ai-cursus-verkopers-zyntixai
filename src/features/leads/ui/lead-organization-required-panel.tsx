import { buildLeadListQueryString } from "@/features/leads/ui/lead-list-search-params";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import styles from "./lead-detail.module.css";

type LeadOrganizationRequiredPanelProps = {
  organizations: OrganizationOption[];
  targetPath: string;
  title?: string;
  description?: string;
};

export function LeadOrganizationRequiredPanel({
  organizations,
  targetPath,
  title = "Organization selection required",
  description = "Select an organization to continue.",
}: LeadOrganizationRequiredPanelProps) {
  return (
    <section className={styles.statePanel} aria-labelledby="lead-org-required-title">
      <h1 id="lead-org-required-title">{title}</h1>
      <p>{description}</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a
              href={`${targetPath}${buildLeadListQueryString({
                org: organization.organizationId,
                archived: false,
                sort: "display_name",
                direction: "asc",
                page: 1,
                pageSize: 25,
              })}`}
            >
              {organization.displayName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
