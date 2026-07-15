import { buildCustomerListQueryString } from "@/features/customers/ui/customer-list-search-params";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import styles from "./customer-detail.module.css";

type CustomerOrganizationRequiredPanelProps = {
  organizations: OrganizationOption[];
  targetPath: string;
  title?: string;
  description?: string;
};

export function CustomerOrganizationRequiredPanel({
  organizations,
  targetPath,
  title = "Organization selection required",
  description = "Select an organization to continue.",
}: CustomerOrganizationRequiredPanelProps) {
  return (
    <section className={styles.statePanel} aria-labelledby="customer-org-required-title">
      <h1 id="customer-org-required-title">{title}</h1>
      <p>{description}</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a
              href={`${targetPath}${buildCustomerListQueryString({
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
