import { Badge } from "@/components/ui/badge";
import type { ProjectRecord, ProjectStatus } from "@/features/projects/domain/types";
import { projectStatusLabel } from "@/features/projects/domain/types";
import { buildProjectDetailHref } from "@/features/projects/domain/projects-navigation";
import styles from "./customer-projects.module.css";

export type CustomerProjectLinks = {
  createProjectHref?: string;
};

type CustomerProjectsSectionProps = {
  projects: ProjectRecord[];
  projectsState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  organizationId: string;
  reloadHref?: string;
  projectLinks?: CustomerProjectLinks;
  projectTermPlural?: string;
};

function statusVariant(
  status: ProjectStatus,
): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") return "success";
  if (status === "on_hold") return "warning";
  if (status === "completed") return "info";
  if (status === "cancelled") return "danger";
  return "neutral";
}

function ProjectLinksNav({ projectLinks }: { projectLinks?: CustomerProjectLinks }) {
  if (!projectLinks?.createProjectHref) {
    return null;
  }
  return (
    <nav className={styles.projectLinks} aria-label="Project actions">
      <a href={projectLinks.createProjectHref}>New project</a>
    </nav>
  );
}

export function CustomerProjectsSection({
  projects,
  projectsState,
  organizationId,
  reloadHref,
  projectLinks,
  projectTermPlural = "Projects",
}: CustomerProjectsSectionProps) {
  if (projectsState.kind === "hidden") {
    return null;
  }

  if (projectsState.kind === "error") {
    return (
      <section className={styles.section} aria-labelledby="customer-projects-title">
        <h2 id="customer-projects-title">{projectTermPlural}</h2>
        <ProjectLinksNav projectLinks={projectLinks} />
        <div className={styles.error} role="alert">
          <p>{projectsState.message}</p>
          {reloadHref ? (
            <p>
              <a href={reloadHref}>Reload page</a>
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  if (projectsState.kind === "empty" || projects.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="customer-projects-title">
        <h2 id="customer-projects-title">{projectTermPlural}</h2>
        <ProjectLinksNav projectLinks={projectLinks} />
        <p className={styles.empty}>No {projectTermPlural.toLowerCase()} are linked to this customer yet.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="customer-projects-title">
      <h2 id="customer-projects-title">{projectTermPlural}</h2>
      <ProjectLinksNav projectLinks={projectLinks} />
      <ul className={styles.list}>
        {projects.map((project) => (
          <li key={project.id} className={styles.item}>
            <div>
              <p className={styles.name}>
                <a href={buildProjectDetailHref(project.id, organizationId)}>{project.name}</a>
              </p>
              <p className={styles.meta}>Owner: {project.ownerLabel ?? "Unassigned"}</p>
            </div>
            <Badge variant={statusVariant(project.status)}>{projectStatusLabel(project.status)}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
