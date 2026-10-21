import { buildProgramListQueryString } from "@/features/programs/ui/program-list-search-params";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import styles from "./program-detail.module.css";

type ProgramOrganizationRequiredPanelProps = {
  organizations: OrganizationOption[];
  targetPath: string;
  title?: string;
  description?: string;
};

export function ProgramOrganizationRequiredPanel({
  organizations,
  targetPath,
  title = "Organization selection required",
  description = "Select an organization to continue.",
}: ProgramOrganizationRequiredPanelProps) {
  return (
    <section className={styles.statePanel} aria-labelledby="program-org-required-title">
      <h1 id="program-org-required-title">{title}</h1>
      <p>{description}</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a
              href={`${targetPath}${buildProgramListQueryString({
                org: organization.organizationId,
                archived: false,
                sort: "updated_at",
                direction: "desc",
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
