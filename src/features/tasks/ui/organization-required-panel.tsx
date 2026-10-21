import { buildTaskListQueryString } from "@/features/tasks/ui/task-list-search-params";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import styles from "./task-detail.module.css";

type OrganizationRequiredPanelProps = {
  organizations: OrganizationOption[];
  targetPath: string;
  title?: string;
  description?: string;
};

export function OrganizationRequiredPanel({
  organizations,
  targetPath,
  title = "Organization selection required",
  description = "Select an organization to continue.",
}: OrganizationRequiredPanelProps) {
  return (
    <section className={styles.statePanel} aria-labelledby="org-required-title">
      <h1 id="org-required-title">{title}</h1>
      <p>{description}</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a
              href={`${targetPath}${buildTaskListQueryString({
                org: organization.organizationId,
                status: "open",
                archived: false,
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
