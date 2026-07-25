import { buildEnrollmentListQueryString } from "@/features/enrollments/ui/enrollment-list-search-params";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import styles from "./enrollment-detail.module.css";

type EnrollmentOrganizationRequiredPanelProps = {
  organizations: OrganizationOption[];
  targetPath: string;
  title?: string;
  description?: string;
};

export function EnrollmentOrganizationRequiredPanel({
  organizations,
  targetPath,
  title = "Organization selection required",
  description = "Select an organization to continue.",
}: EnrollmentOrganizationRequiredPanelProps) {
  return (
    <section className={styles.statePanel} aria-labelledby="enrollment-org-required-title">
      <h1 id="enrollment-org-required-title">{title}</h1>
      <p>{description}</p>
      <ul className={styles.orgList}>
        {organizations.map((organization) => (
          <li key={organization.organizationId}>
            <a
              href={`${targetPath}${buildEnrollmentListQueryString({
                org: organization.organizationId,
                archived: false,
                sort: "enrolled_at",
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
