import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/features/projects/ui/project-form";
import { loadProjectEditPage } from "@/features/projects/ui/load-project-pages";
import {
  ProjectLoadFailure,
  ProjectShell,
} from "@/features/projects/ui/project-views";
import styles from "@/features/projects/ui/projects.module.css";

type ProjectEditPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectEditPage({ params, searchParams }: ProjectEditPageProps) {
  const supabase = await createSupabaseServerClient();
  const { projectId } = await params;
  const result = await loadProjectEditPage(supabase, projectId, await searchParams);

  if (
    result.kind === "auth_required" ||
    result.kind === "organization_unavailable" ||
    result.kind === "organization_required" ||
    result.kind === "forbidden" ||
    result.kind === "error"
  ) {
    return <ProjectLoadFailure result={result} targetPath={`/projects/${projectId}/edit`} />;
  }
  if (result.kind !== "ready") {
    const term = result.context.terminology.project.singular;
    return (
      <ProjectShell context={result.context} action={`/projects/${projectId}/edit`}>
        <section className={styles.statePanel}>
          <h1>Edit {term.toLowerCase()} unavailable</h1>
          <p role="alert">
            {result.kind === "unavailable"
              ? `This ${term.toLowerCase()} is unavailable or you do not have access.`
              : result.message}
          </p>
          <a href={`/projects/${projectId}?org=${encodeURIComponent(result.context.organizationId)}`}>
            Back to {term.toLowerCase()}
          </a>
        </section>
      </ProjectShell>
    );
  }
  return (
    <ProjectShell context={result.context} action={`/projects/${projectId}/edit`}>
      <ProjectForm
        organizationId={result.context.organizationId}
        options={result.options}
        terminology={result.context.terminology}
        project={result.project}
      />
    </ProjectShell>
  );
}
